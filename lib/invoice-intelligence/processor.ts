import { and, asc, eq, inArray, lte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  invoiceAuditLogs,
  invoiceDocuments,
  invoiceDuplicateRelations,
  invoiceFieldEvidence,
  invoiceLineItems,
  invoiceProcessingAttempts,
  invoiceProcessingJobs,
  invoiceValidationResults,
  invoiceVatBreakdown,
  supplierMappings,
} from "@/lib/schema";
import { azureConfigured, criticalCount, readDeterministically, readWithAzure, readWithMistral } from "./providers";
import { normalizedInvoiceSchema, type NormalizedInvoice, type ReaderResult, type ValidationResult } from "./types";
import { normalizeInvoiceValues, validateInvoice } from "./validation";

const CRITICAL_FIELDS = [
  "supplier.name",
  "supplier.vatNumber",
  "invoiceNumber",
  "issueDate",
  "currency",
  "totals.netAmount",
  "totals.vatAmount",
  "totals.grossAmount",
] as const;

export async function processInvoiceDocument(documentId: number) {
  const db = getDb();
  const [document] = await db.select().from(invoiceDocuments).where(eq(invoiceDocuments.id, documentId)).limit(1);
  if (!document) throw new Error("Invoice document not found");

  await db.update(invoiceDocuments).set({ status: "processing", processingStartedAt: new Date(), updatedAt: new Date() }).where(eq(invoiceDocuments.id, documentId));

  const input = { base64: document.originalBase64, mimeType: document.mimeType, filename: document.filename };
  let result: ReaderResult | null = null;
  let validation: ValidationResult | null = null;
  let mistralError: unknown = null;

  const deterministic = await recordAttempt(documentId, "deterministic", "deterministic-v1", async () => readDeterministically(input));
  if (deterministic) {
    deterministic.invoice = await applySupplierMappings(document.clerkUserId, deterministic.invoice);
    validation = validateInvoice(deterministic.invoice);
    if (deterministic.model === "xml-parser-v1" && validation.status === "valid") result = deterministic;
  }

  if (!result) {
    try {
      result = await recordAttempt(documentId, "mistral", process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest", async () => readWithMistral(input));
      if (result) {
        result.invoice = await applySupplierMappings(document.clerkUserId, result.invoice);
        validation = validateInvoice(result.invoice);
      }
    } catch (error) {
      mistralError = error;
    }
  }

  const mistralLow = result?.provider === "mistral" && !criticalConfidencePasses(result);
  const mistralInvalid = validation?.status === "failed";
  if (azureConfigured() && (!result || mistralLow || mistralInvalid)) {
    try {
      const azure = await recordAttempt(documentId, "azure", process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-invoice", async () => readWithAzure(input));
      if (azure) {
        azure.invoice = await applySupplierMappings(document.clerkUserId, azure.invoice);
        const azureValidation = validateInvoice(azure.invoice);
        if (!result) {
          result = azure;
          validation = azureValidation;
        } else {
          const decision = compareResults(result, validation!, azure, azureValidation);
          result = decision.result;
          validation = decision.validation;
          if (decision.conflict) {
            result.invoice.warnings.push("Mistral and Azure disagree on one or more critical fields; manual review required.");
            validation = { ...validation, status: "needs_review", warnings: [...validation.warnings, "OCR providers disagree on critical fields"] };
          }
        }
      }
    } catch (error) {
      if (!result && mistralError) throw new Error(`Mistral failed: ${messageOf(mistralError)}; Azure failed: ${messageOf(error)}`);
    }
  }

  if (!result || !validation) {
    const reason = mistralError ? messageOf(mistralError) : "No invoice reader produced a usable result";
    await db.update(invoiceDocuments).set({ status: "failed", validationStatus: "failed", warningsJson: JSON.stringify([reason]), processedAt: new Date(), updatedAt: new Date() }).where(eq(invoiceDocuments.id, documentId));
    throw new Error(reason);
  }

  result.invoice = normalizeInvoiceValues(result.invoice);
  const duplicates = await detectDuplicates(documentId, document.clerkUserId, document.sha256, result.invoice);
  if (duplicates.length) validation = { ...validation, status: "needs_review", warnings: [...validation.warnings, "Possible duplicate invoice detected"] };

  const autoApprove = validation.status === "valid" && duplicates.length === 0 && requiredFieldsPresent(result.invoice) && criticalConfidencePasses(result);
  const finalStatus = autoApprove ? "approved" : "needs_review";
  result.invoice.validationStatus = autoApprove ? "valid" : "needs_review";

  await persistResult(documentId, result, validation, autoApprove);
  await db.update(invoiceDocuments).set({
    status: finalStatus,
    documentType: result.invoice.documentType,
    documentLanguage: result.invoice.documentLanguage,
    provider: result.provider,
    model: result.model,
    rawText: result.rawText,
    rawProviderResponse: JSON.stringify(result.rawResponse),
    normalizedJson: JSON.stringify(result.invoice),
    approvedJson: autoApprove ? JSON.stringify(result.invoice) : null,
    overallConfidenceBps: result.invoice.confidence.overall == null ? null : Math.round(result.invoice.confidence.overall * 10_000),
    validationStatus: autoApprove ? "valid" : "needs_review",
    warningsJson: JSON.stringify([...result.invoice.warnings, ...validation.warnings, ...validation.errors]),
    processingCostMicros: result.costMicros,
    processedAt: new Date(),
    approvedAt: autoApprove ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(invoiceDocuments.id, documentId));

  await db.insert(invoiceAuditLogs).values({
    documentId,
    clerkUserId: document.clerkUserId,
    action: autoApprove ? "auto_approved" : "sent_to_review",
    metadataJson: JSON.stringify({ provider: result.provider, model: result.model, duplicates: duplicates.length }),
  });

  return { status: finalStatus, provider: result.provider, validation, duplicates };
}

export async function runQueuedInvoiceJobs(limit = 3) {
  const db = getDb();
  const now = new Date();
  const jobs = await db.select().from(invoiceProcessingJobs)
    .where(and(inArray(invoiceProcessingJobs.status, ["queued", "failed"]), lte(invoiceProcessingJobs.availableAt, now)))
    .orderBy(asc(invoiceProcessingJobs.availableAt))
    .limit(limit);

  const results: Array<{ jobId: number; documentId: number; ok: boolean; error?: string }> = [];
  for (const job of jobs) {
    if (job.attempts >= job.maxAttempts) continue;
    const [locked] = await db.update(invoiceProcessingJobs).set({
      status: "processing",
      lockedAt: new Date(),
      attempts: job.attempts + 1,
      updatedAt: new Date(),
    }).where(and(eq(invoiceProcessingJobs.id, job.id), inArray(invoiceProcessingJobs.status, ["queued", "failed"]))).returning({ id: invoiceProcessingJobs.id });
    if (!locked) continue;

    try {
      await processInvoiceDocument(job.documentId);
      await db.update(invoiceProcessingJobs).set({ status: "completed", lastError: null, lockedAt: null, updatedAt: new Date() }).where(eq(invoiceProcessingJobs.id, job.id));
      results.push({ jobId: job.id, documentId: job.documentId, ok: true });
    } catch (error) {
      const attempt = job.attempts + 1;
      const delayMinutes = Math.min(60, 2 ** Math.min(attempt, 6));
      await db.update(invoiceProcessingJobs).set({
        status: "failed",
        lastError: messageOf(error).slice(0, 2000),
        lockedAt: null,
        availableAt: new Date(Date.now() + delayMinutes * 60_000),
        updatedAt: new Date(),
      }).where(eq(invoiceProcessingJobs.id, job.id));
      results.push({ jobId: job.id, documentId: job.documentId, ok: false, error: messageOf(error) });
    }
  }
  return results;
}

async function recordAttempt<T extends ReaderResult | null>(documentId: number, provider: "deterministic" | "mistral" | "azure", model: string, fn: () => Promise<T>): Promise<T> {
  const db = getDb();
  const started = Date.now();
  const [attempt] = await db.insert(invoiceProcessingAttempts).values({ documentId, provider, model, status: "processing" }).returning({ id: invoiceProcessingAttempts.id });
  try {
    const result = await fn();
    await db.update(invoiceProcessingAttempts).set({
      status: result ? "succeeded" : "skipped",
      durationMs: Date.now() - started,
      pagesProcessed: result?.pagesProcessed ?? null,
      costMicros: result?.costMicros ?? null,
      completedAt: new Date(),
    }).where(eq(invoiceProcessingAttempts.id, attempt.id));
    return result;
  } catch (error) {
    await db.update(invoiceProcessingAttempts).set({ status: "failed", errorMessage: messageOf(error).slice(0, 2000), durationMs: Date.now() - started, completedAt: new Date() }).where(eq(invoiceProcessingAttempts.id, attempt.id));
    throw error;
  }
}

async function persistResult(documentId: number, result: ReaderResult, validation: ValidationResult, autoApprove: boolean) {
  const db = getDb();
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.documentId, documentId));
  await db.delete(invoiceVatBreakdown).where(eq(invoiceVatBreakdown.documentId, documentId));
  await db.delete(invoiceFieldEvidence).where(eq(invoiceFieldEvidence.documentId, documentId));

  if (result.invoice.lineItems.length) await db.insert(invoiceLineItems).values(result.invoice.lineItems.map((item, i) => ({ documentId, position: i, ...item })));
  if (result.invoice.vatBreakdown.length) await db.insert(invoiceVatBreakdown).values(result.invoice.vatBreakdown.map((row, i) => ({ documentId, position: i, ...row })));
  if (result.evidence.length) await db.insert(invoiceFieldEvidence).values(result.evidence.map((e) => ({
    documentId,
    fieldPath: e.fieldPath,
    valueText: e.valueText,
    pageNumber: e.pageNumber,
    bboxJson: e.bbox == null ? null : JSON.stringify(e.bbox),
    confidenceBps: e.confidence == null ? null : Math.round(e.confidence * 10_000),
    provider: result.provider,
  })));

  await db.insert(invoiceValidationResults).values({
    documentId,
    status: autoApprove ? "valid" : validation.status === "failed" ? "needs_review" : validation.status,
    warningsJson: JSON.stringify(validation.warnings),
    errorsJson: JSON.stringify(validation.errors),
    differencesJson: JSON.stringify(validation.differences),
  });
}

async function detectDuplicates(documentId: number, clerkUserId: string, sha256: string, invoice: NormalizedInvoice) {
  const db = getDb();
  const candidates = await db.select().from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.clerkUserId, clerkUserId), ne(invoiceDocuments.id, documentId)))
    .limit(250);
  const matches: Array<{ id: number; reason: string }> = [];
  for (const candidate of candidates) {
    let reason: string | null = null;
    if (candidate.sha256 === sha256) reason = "file_checksum";
    else if (candidate.normalizedJson) {
      try {
        const other = normalizedInvoiceSchema.parse(JSON.parse(candidate.normalizedJson));
        const tuple = [invoice.supplier.vatNumber, invoice.invoiceNumber, invoice.issueDate, invoice.totals.grossAmount, invoice.currency];
        const otherTuple = [other.supplier.vatNumber, other.invoiceNumber, other.issueDate, other.totals.grossAmount, other.currency];
        if (tuple.every((v, i) => v != null && v !== "" && v === otherTuple[i])) reason = "supplier_invoice_date_total_currency";
      } catch { /* legacy/bad row: ignore */ }
    }
    if (reason) matches.push({ id: candidate.id, reason });
  }
  for (const match of matches) {
    await db.insert(invoiceDuplicateRelations).values({ documentId, duplicateOfDocumentId: match.id, reason: match.reason }).onConflictDoNothing();
  }
  return matches;
}

function requiredFieldsPresent(invoice: NormalizedInvoice) {
  return criticalCount(invoice) >= 7 && Boolean(invoice.supplier.name && invoice.invoiceNumber && invoice.issueDate && invoice.currency && invoice.totals.netAmount && invoice.totals.vatAmount && invoice.totals.grossAmount);
}

function criticalConfidencePasses(result: ReaderResult) {
  if (result.provider === "deterministic" && result.model === "xml-parser-v1") return true;
  const threshold = Number(process.env.INVOICE_CONFIDENCE_THRESHOLD ?? 0.92);
  const evidence = new Map(result.evidence.map((e) => [e.fieldPath, e.confidence]));
  return CRITICAL_FIELDS.every((path) => {
    const value = getPath(result.invoice, path);
    if (value == null || value === "") return false;
    const score = evidence.get(path) ?? result.invoice.confidence.fields[path] ?? result.invoice.confidence.overall ?? 0;
    return score >= threshold;
  });
}

function compareResults(primary: ReaderResult, primaryValidation: ValidationResult, fallback: ReaderResult, fallbackValidation: ValidationResult) {
  const score = (result: ReaderResult, validation: ValidationResult) =>
    (validation.status === "valid" ? 100 : validation.status === "needs_review" ? 40 : 0) + criticalCount(result.invoice) * 4 + (criticalConfidencePasses(result) ? 20 : 0);
  const conflict = CRITICAL_FIELDS.some((path) => {
    const a = getPath(primary.invoice, path);
    const b = getPath(fallback.invoice, path);
    return a != null && b != null && String(a).trim() !== String(b).trim();
  });
  return score(fallback, fallbackValidation) > score(primary, primaryValidation)
    ? { result: fallback, validation: fallbackValidation, conflict }
    : { result: primary, validation: primaryValidation, conflict };
}

async function applySupplierMappings(clerkUserId: string, invoice: NormalizedInvoice) {
  const supplierKey = invoice.supplier.vatNumber || invoice.supplier.name?.toLowerCase().trim();
  if (!supplierKey) return invoice;
  const db = getDb();
  const mappings = await db.select().from(supplierMappings).where(and(eq(supplierMappings.clerkUserId, clerkUserId), eq(supplierMappings.supplierKey, supplierKey)));
  for (const mapping of mappings) setPath(invoice as unknown as Record<string, unknown>, mapping.fieldPath, mapping.correctedValue);
  return invoice;
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, obj);
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const next = current[keys[i]];
    if (!next || typeof next !== "object") current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : String(error); }
