import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  bulkInvoiceGroups,
  bulkInvoiceJobs,
  invoiceAuditLogs,
  invoiceCorrections,
  invoiceDocuments,
  invoiceDuplicateRelations,
  invoiceFieldEvidence,
  invoiceProcessingJobs,
  invoiceValidationResults,
  invoices,
  supplierMappings,
} from "@/lib/schema";
import { createDocumentSignature } from "@/lib/invoice-intelligence/signing";
import { resolveManualApprovalReason } from "@/lib/invoice-intelligence/manual-approval";
import { normalizedInvoiceSchema, type NormalizedInvoice } from "@/lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "@/lib/invoice-intelligence/validation";
import { estimateSourcePages } from "@/lib/invoice-intelligence/safety";
import { enqueueExistingPdfAsBulkJob } from "@/lib/bulk-invoices/enqueue-existing-pdf";
import { BulkAdmissionError } from "@/lib/bulk-invoices/admission";
import { queueInvoiceDelivery } from "@/lib/invoice-intelligence/delivery";
import { processInvoiceDocument } from "@/lib/invoice-intelligence/processor";
import { BULK_PDF_GATEWAY_URL } from "@/lib/bulk-invoices/config";

export const maxDuration = 300;

const allowedPaths = new Set([
  "documentType", "documentLanguage", "documentStatus", "supplier.name", "supplier.address", "supplier.postalCode", "supplier.city", "supplier.countryCode",
  "supplier.vatNumber", "supplier.registrationNumber", "supplier.email", "supplier.phone", "supplier.iban", "supplier.bic",
  "buyer.name", "buyer.address", "buyer.postalCode", "buyer.city", "buyer.countryCode", "buyer.vatNumber", "buyer.registrationNumber",
  "invoiceNumber", "purchaseOrderNumber", "deliveryNoteNumber", "supplyPlace", "issueDate", "serviceDate", "dueDate", "paymentReference", "paymentTerms", "shippingMethod", "currency",
  "totals.amountBeforeDiscount", "totals.netAmount", "totals.discountAmount", "totals.vatAmount", "totals.grossAmount", "totals.amountPaid", "totals.amountDue",
]);

const patchSchema = z.object({
  action: z.enum(["save", "approve", "reject", "reprocess"]),
  changes: z.record(z.string(), z.string().nullable()).optional(),
  reason: z.string().max(1000).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  if (!Number.isInteger(documentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const db = getDb();
  const [document] = await db.select({
    id: invoiceDocuments.id,
    companyId: invoiceDocuments.companyId,
    sourceInvoiceId: invoiceDocuments.sourceInvoiceId,
    filename: invoiceDocuments.filename,
    mimeType: invoiceDocuments.mimeType,
    byteSize: invoiceDocuments.byteSize,
    status: invoiceDocuments.status,
    documentType: invoiceDocuments.documentType,
    provider: invoiceDocuments.provider,
    model: invoiceDocuments.model,
    rawText: invoiceDocuments.rawText,
    normalizedJson: invoiceDocuments.normalizedJson,
    approvedJson: invoiceDocuments.approvedJson,
    overallConfidenceBps: invoiceDocuments.overallConfidenceBps,
    validationStatus: invoiceDocuments.validationStatus,
    warningsJson: invoiceDocuments.warningsJson,
    originalBase64: invoiceDocuments.originalBase64,
    bulkJobId: invoiceDocuments.bulkJobId,
    processedAt: invoiceDocuments.processedAt,
    createdAt: invoiceDocuments.createdAt,
  }).from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [evidence, validations, duplicates, corrections] = await Promise.all([
    db.select().from(invoiceFieldEvidence).where(eq(invoiceFieldEvidence.documentId, documentId)),
    db.select().from(invoiceValidationResults).where(eq(invoiceValidationResults.documentId, documentId)).orderBy(desc(invoiceValidationResults.createdAt)).limit(10),
    db.select().from(invoiceDuplicateRelations).where(eq(invoiceDuplicateRelations.documentId, documentId)),
    db.select().from(invoiceCorrections).where(eq(invoiceCorrections.documentId, documentId)).orderBy(desc(invoiceCorrections.createdAt)).limit(100),
  ]);

  const estimatedPages = document.originalBase64 && document.mimeType === "application/pdf"
    ? estimateSourcePages({ base64: document.originalBase64, mimeType: document.mimeType, filename: document.filename })
    : null;
  const legacyMultiPagePdf = document.mimeType === "application/pdf"
    && document.bulkJobId == null
    && estimatedPages != null
    && estimatedPages > 1;

  const expires = Date.now() + 5 * 60_000;
  const signature = createDocumentSignature(documentId, userId, expires);
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "view", metadataJson: JSON.stringify({ route: "review" }) });
  return NextResponse.json({
    document: {
      ...document,
      legacyMultiPagePdf,
      estimatedPages,
      originalBase64: undefined,
      normalized: parseJson(document.normalizedJson),
      approved: parseJson(document.approvedJson),
      warnings: parseJson(document.warningsJson) ?? [],
      normalizedJson: undefined,
      approvedJson: undefined,
      warningsJson: undefined,
    },
    evidence: evidence.map((e) => ({ ...e, bbox: parseJson(e.bboxJson), bboxJson: undefined, confidence: e.confidenceBps == null ? null : e.confidenceBps / 10_000 })),
    validations: validations.map((v) => ({ ...v, warnings: parseJson(v.warningsJson), errors: parseJson(v.errorsJson), differences: parseJson(v.differencesJson) })),
    duplicates,
    corrections,
    fileUrl: `/api/invoice-reader/${documentId}/file?exp=${expires}&sig=${signature}`,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  const data = patchSchema.parse(await req.json());
  const db = getDb();
  const [document] = await db.select().from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.action === "reprocess") {
    const estimatedPages = document.originalBase64 && document.mimeType === "application/pdf"
      ? estimateSourcePages({ base64: document.originalBase64, mimeType: document.mimeType, filename: document.filename })
      : null;
    if (document.bulkJobId == null && document.originalBase64 && document.mimeType === "application/pdf" && estimatedPages !== 1) {
      const token = await getToken();
      if (!token) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });
      let sourceRecipientEmail: string | null = null;
      if (document.companyId == null && document.sourceInvoiceId != null) {
        const [source] = await db.select({ recipientEmail: invoices.recipientEmail }).from(invoices).where(and(
          eq(invoices.id, document.sourceInvoiceId),
          eq(invoices.clerkUserId, userId),
        )).limit(1);
        sourceRecipientEmail = source?.recipientEmail ?? null;
      }
      let bulkJobId: number;
      try {
        bulkJobId = await enqueueExistingPdfAsBulkJob({
          clerkToken: token,
          clerkUserId: userId,
          companyId: document.companyId,
          sourceInvoiceId: document.sourceInvoiceId,
          recipientEmail: sourceRecipientEmail,
          filename: document.filename,
          base64: document.originalBase64,
        });
      } catch (error) {
        if (error instanceof BulkAdmissionError) {
          return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
        }
        throw error;
      }
      if (document.sourceInvoiceId != null) {
        await db.update(invoices).set({
          status: "pending",
          errorMessage: null,
          sentAt: null,
        }).where(and(eq(invoices.id, document.sourceInvoiceId), eq(invoices.clerkUserId, userId)));
      }
      await db.insert(invoiceAuditLogs).values({
        documentId,
        clerkUserId: userId,
        action: "reprocess_as_bulk",
        metadataJson: JSON.stringify({ bulkJobId, estimatedPages }),
      });
      return NextResponse.json({ success: true, status: "bulk_queued", bulkJobId });
    }

    await db.update(invoiceDocuments).set({
      status: "queued",
      validationStatus: "pending",
      provider: null,
      model: null,
      rawText: null,
      rawProviderResponse: null,
      normalizedJson: null,
      approvedJson: null,
      overallConfidenceBps: null,
      warningsJson: null,
      processingCostMicros: null,
      processingStartedAt: null,
      processedAt: null,
      approvedAt: null,
      rejectedAt: null,
      updatedAt: new Date(),
    }).where(eq(invoiceDocuments.id, documentId));

    if (document.bulkJobId != null && document.bulkGroupIndex != null && document.storageObjectKey) {
      await db.update(bulkInvoiceGroups).set({
        status: "reprocess",
        extractionBatchId: null,
        extractionBatchCreatedAt: null,
        updatedAt: new Date(),
      }).where(and(
        eq(bulkInvoiceGroups.jobId, document.bulkJobId),
        eq(bulkInvoiceGroups.groupIndex, document.bulkGroupIndex),
      ));
      await db.update(bulkInvoiceJobs).set({
        status: "processing",
        stage: "extract",
        lockedAt: null,
        lastError: null,
        completedAt: null,
        updatedAt: new Date(),
      }).where(eq(bulkInvoiceJobs.id, document.bulkJobId));

      // Reprocessing a single bulk child must not depend only on the scheduled
      // Neon worker. Kick the exact group immediately and poll the Mistral
      // extraction batch within this request so the review screen cannot stay
      // in "queued" forever when the worker is delayed or unavailable.
      const token = await getToken();
      const internalSecret = process.env.BULK_INTERNAL_SECRET;
      if (!token) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });
      if (!internalSecret) {
        return NextResponse.json({ error: "Bulk OCR worker ni pravilno nastavljen." }, { status: 503 });
      }

      const signedResponse = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: document.storageObjectKey }),
        signal: AbortSignal.timeout(15_000),
      });
      const signedBody = await signedResponse.json().catch(() => ({})) as { url?: string; error?: string };
      if (!signedResponse.ok || !signedBody.url) {
        return NextResponse.json({ error: signedBody.error ?? "Dokumenta ni bilo mogoče pripraviti za OCR." }, { status: 502 });
      }

      const extractUrl = new URL("/api/internal/bulk/extract", req.url).toString();
      const startedAt = Date.now();
      const deadline = startedAt + 240_000;
      let lastExtractBody: Record<string, unknown> = {};

      while (Date.now() < deadline) {
        const extractResponse = await fetch(extractUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bulk-secret": internalSecret,
          },
          body: JSON.stringify({
            jobId: document.bulkJobId,
            batchSize: 1,
            documents: [{ groupIndex: document.bulkGroupIndex, documentUrl: signedBody.url }],
            forceDocumentOcr: true,
          }),
          signal: AbortSignal.timeout(180_000),
        });
        lastExtractBody = await extractResponse.json().catch(() => ({})) as Record<string, unknown>;

        if (extractResponse.ok && extractResponse.status !== 202) {
          const [fresh] = await db.select({ status: invoiceDocuments.status })
            .from(invoiceDocuments)
            .where(eq(invoiceDocuments.id, documentId))
            .limit(1);
          if (fresh && fresh.status !== "queued" && fresh.status !== "processing") {
            await db.insert(invoiceAuditLogs).values({
              documentId,
              clerkUserId: userId,
              action: "reprocess_completed_inline",
              metadataJson: JSON.stringify({ bulkJobId: document.bulkJobId, elapsedMs: Date.now() - startedAt }),
            });
            return NextResponse.json({ success: true, status: fresh.status, processedInline: true });
          }
        }

        if (!extractResponse.ok && extractResponse.status !== 429) {
          const error = typeof lastExtractBody.error === "string" ? lastExtractBody.error : "OCR ponovna obdelava ni uspela.";
          await db.update(invoiceDocuments).set({
            status: "failed",
            validationStatus: "failed",
            warningsJson: JSON.stringify([error]),
            processedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(invoiceDocuments.id, documentId));
          return NextResponse.json({ error }, { status: extractResponse.status >= 400 ? extractResponse.status : 500 });
        }

        await new Promise((resolve) => setTimeout(resolve, extractResponse.status === 429 ? 5_000 : 2_000));
      }

      // Keep the durable queue as a recovery path, but never pretend that OCR
      // is actively processing forever. The UI can show a retryable timeout.
      const timeoutMessage = "OCR obdelava traja predolgo. Poskusite ponovno; opravilo ostaja v varni čakalni vrsti.";
      await db.update(invoiceDocuments).set({
        status: "failed",
        validationStatus: "failed",
        warningsJson: JSON.stringify([timeoutMessage]),
        processedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(invoiceDocuments.id, documentId));
      await db.update(bulkInvoiceGroups).set({
        status: "reprocess",
        updatedAt: new Date(),
      }).where(and(
        eq(bulkInvoiceGroups.jobId, document.bulkJobId),
        eq(bulkInvoiceGroups.groupIndex, document.bulkGroupIndex),
      ));
      return NextResponse.json({ error: timeoutMessage, retryable: true }, { status: 504 });
    } else {
      const now = new Date();
      await db.insert(invoiceProcessingJobs).values({
        documentId,
        status: "processing",
        attempts: 1,
        availableAt: now,
        lockedAt: now,
        lastError: null,
      }).onConflictDoUpdate({
        target: invoiceProcessingJobs.documentId,
        set: {
          status: "processing",
          attempts: 1,
          availableAt: now,
          lockedAt: now,
          lastError: null,
          updatedAt: now,
        },
      });

      try {
        const processed = await processInvoiceDocument(documentId);
        await db.update(invoiceProcessingJobs).set({
          status: "completed",
          lastError: null,
          lockedAt: null,
          updatedAt: new Date(),
        }).where(eq(invoiceProcessingJobs.documentId, documentId));
        await db.insert(invoiceAuditLogs).values({
          documentId,
          clerkUserId: userId,
          action: "reprocess_completed_inline",
          metadataJson: JSON.stringify({ bulk: false, provider: processed.provider }),
        });
        return NextResponse.json({ success: true, status: processed.status, processedInline: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await db.update(invoiceProcessingJobs).set({
          status: "failed",
          lastError: message.slice(0, 2000),
          lockedAt: null,
          availableAt: new Date(Date.now() + 2 * 60_000),
          updatedAt: new Date(),
        }).where(eq(invoiceProcessingJobs.documentId, documentId));
        await db.update(invoiceDocuments).set({
          status: "failed",
          validationStatus: "failed",
          warningsJson: JSON.stringify([message]),
          processedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(invoiceDocuments.id, documentId));
        return NextResponse.json({
          error: `Ponovna OCR obdelava ni uspela: ${message}`,
          retryable: true,
        }, { status: 502 });
      }
    }
  }

  if (data.action === "reject") {
    await db.update(invoiceDocuments).set({ status: "failed", validationStatus: "failed", rejectedAt: new Date(), warningsJson: JSON.stringify(["Rejected by user", data.reason].filter(Boolean)), updatedAt: new Date() }).where(eq(invoiceDocuments.id, documentId));
    await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "reject", metadataJson: JSON.stringify({ reason: data.reason ?? null }) });
    return NextResponse.json({ success: true, status: "failed" });
  }

  // After saving edits, normalizedJson is the current draft; approvedJson still
  // contains the previously approved revision and must not replace those edits.
  const currentJson = document.status === "approved"
    ? document.approvedJson || document.normalizedJson
    : document.normalizedJson || document.approvedJson;
  const current = normalizedInvoiceSchema.parse(parseJson(currentJson) ?? {});
  const next = structuredClone(current) as NormalizedInvoice;
  for (const [path, newValue] of Object.entries(data.changes ?? {})) {
    if (!allowedPaths.has(path)) continue;
    const oldValue = getPath(current, path);
    if (String(oldValue ?? "") === String(newValue ?? "")) continue;
    setPath(next as unknown as Record<string, unknown>, path, newValue);
    await db.insert(invoiceCorrections).values({ documentId, clerkUserId: userId, fieldPath: path, oldValue: oldValue == null ? null : String(oldValue), newValue, reason: data.reason ?? null });
    const supplierKey = next.supplier.vatNumber || next.supplier.name?.toLowerCase().trim();
    if (supplierKey && newValue != null && (path.startsWith("supplier.") || ["currency", "paymentTerms"].includes(path))) {
      await db.insert(supplierMappings).values({ clerkUserId: userId, supplierKey, fieldPath: path, sourceValue: oldValue == null ? null : String(oldValue), correctedValue: newValue, occurrences: 1 })
        .onConflictDoUpdate({ target: [supplierMappings.clerkUserId, supplierMappings.supplierKey, supplierMappings.fieldPath], set: { sourceValue: oldValue == null ? null : String(oldValue), correctedValue: newValue, updatedAt: new Date() } });
    }
  }

  normalizeInvoiceValues(next);
  const validation = validateInvoice(next);
  next.validationStatus = validation.status;
  await db.insert(invoiceValidationResults).values({
    documentId,
    status: validation.status,
    warningsJson: JSON.stringify(validation.warnings),
    errorsJson: JSON.stringify(validation.errors),
    differencesJson: JSON.stringify(validation.differences),
  });

  const approved = data.action === "approve";
  const approvalReason = approved
    ? resolveManualApprovalReason(data.reason, validation.errors.length > 0)
    : data.reason?.trim() || null;
  await db.update(invoiceDocuments).set({
    normalizedJson: JSON.stringify(next),
    approvedJson: approved ? JSON.stringify(next) : document.approvedJson,
    status: approved ? "approved" : "needs_review",
    validationStatus: approved ? "valid" : validation.status === "failed" ? "needs_review" : validation.status,
    warningsJson: JSON.stringify([...validation.warnings, ...validation.errors]),
    approvedAt: approved ? new Date() : document.approvedAt,
    updatedAt: new Date(),
  }).where(eq(invoiceDocuments.id, documentId));
  if (approved) await queueInvoiceDelivery(documentId);
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: approved ? "approve" : "edit", metadataJson: JSON.stringify({ reason: approvalReason, changedFields: Object.keys(data.changes ?? {}) }) });
  return NextResponse.json({
    success: true,
    status: approved ? "approved" : "needs_review",
    invoice: next,
    validation,
    manualOverride: approved && validation.errors.length > 0,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  const db = getDb();
  const [document] = await db.select({
    id: invoiceDocuments.id,
    bulkJobId: invoiceDocuments.bulkJobId,
    bulkGroupIndex: invoiceDocuments.bulkGroupIndex,
  }).from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "delete" });
  if (document.bulkJobId != null && document.bulkGroupIndex != null) {
    await db.update(bulkInvoiceGroups).set({
      status: "deleted",
      deliveryStatus: "not_required",
      deliveryError: null,
      updatedAt: new Date(),
    }).where(and(
      eq(bulkInvoiceGroups.jobId, document.bulkJobId),
      eq(bulkInvoiceGroups.groupIndex, document.bulkGroupIndex),
    ));
  }
  await db.delete(invoiceDocuments).where(eq(invoiceDocuments.id, documentId));
  return NextResponse.json({ success: true });
}

function parseJson(value: string | null) { if (!value) return null; try { return JSON.parse(value); } catch { return null; } }
function getPath(obj: unknown, path: string): unknown { return path.split(".").reduce<unknown>((v, key) => v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined, obj); }
function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
