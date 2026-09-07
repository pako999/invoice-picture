import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  invoiceAuditLogs,
  invoiceCorrections,
  invoiceDocuments,
  invoiceDuplicateRelations,
  invoiceFieldEvidence,
  invoiceProcessingJobs,
  invoiceValidationResults,
  supplierMappings,
} from "@/lib/schema";
import { createDocumentSignature } from "@/lib/invoice-intelligence/signing";
import { normalizedInvoiceSchema, type NormalizedInvoice } from "@/lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "@/lib/invoice-intelligence/validation";

const allowedPaths = new Set([
  "documentType", "documentLanguage", "supplier.name", "supplier.address", "supplier.postalCode", "supplier.city", "supplier.countryCode",
  "supplier.vatNumber", "supplier.registrationNumber", "supplier.email", "supplier.phone", "supplier.iban", "supplier.bic",
  "buyer.name", "buyer.address", "buyer.postalCode", "buyer.city", "buyer.countryCode", "buyer.vatNumber", "buyer.registrationNumber",
  "invoiceNumber", "purchaseOrderNumber", "issueDate", "serviceDate", "dueDate", "paymentReference", "paymentTerms", "currency",
  "totals.netAmount", "totals.discountAmount", "totals.vatAmount", "totals.grossAmount", "totals.amountPaid", "totals.amountDue",
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

  const expires = Date.now() + 5 * 60_000;
  const signature = createDocumentSignature(documentId, userId, expires);
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "view", metadataJson: JSON.stringify({ route: "review" }) });
  return NextResponse.json({
    document: {
      ...document,
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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  const data = patchSchema.parse(await req.json());
  const db = getDb();
  const [document] = await db.select().from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.action === "reprocess") {
    await db.update(invoiceDocuments).set({ status: "queued", validationStatus: "pending", processedAt: null, approvedAt: null, updatedAt: new Date() }).where(eq(invoiceDocuments.id, documentId));
    await db.insert(invoiceProcessingJobs).values({ documentId, status: "queued", attempts: 0, availableAt: new Date(), lockedAt: null, lastError: null })
      .onConflictDoUpdate({ target: invoiceProcessingJobs.documentId, set: { status: "queued", attempts: 0, availableAt: new Date(), lockedAt: null, lastError: null, updatedAt: new Date() } });
    await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "reprocess" });
    return NextResponse.json({ success: true, status: "queued" });
  }

  if (data.action === "reject") {
    await db.update(invoiceDocuments).set({ status: "failed", validationStatus: "failed", rejectedAt: new Date(), warningsJson: JSON.stringify(["Rejected by user", data.reason].filter(Boolean)), updatedAt: new Date() }).where(eq(invoiceDocuments.id, documentId));
    await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "reject", metadataJson: JSON.stringify({ reason: data.reason ?? null }) });
    return NextResponse.json({ success: true, status: "failed" });
  }

  const current = normalizedInvoiceSchema.parse(parseJson(document.approvedJson || document.normalizedJson) ?? {});
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

  if (data.action === "approve" && validation.errors.length && !data.reason?.trim()) {
    return NextResponse.json({ error: "A reason is required to manually approve an invoice with validation errors", validation }, { status: 422 });
  }

  const approved = data.action === "approve";
  await db.update(invoiceDocuments).set({
    normalizedJson: JSON.stringify(next),
    approvedJson: approved ? JSON.stringify(next) : document.approvedJson,
    status: approved ? "approved" : "needs_review",
    validationStatus: approved ? "valid" : validation.status === "failed" ? "needs_review" : validation.status,
    warningsJson: JSON.stringify([...validation.warnings, ...validation.errors]),
    approvedAt: approved ? new Date() : document.approvedAt,
    updatedAt: new Date(),
  }).where(eq(invoiceDocuments.id, documentId));
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: approved ? "approve" : "edit", metadataJson: JSON.stringify({ reason: data.reason ?? null, changedFields: Object.keys(data.changes ?? {}) }) });
  return NextResponse.json({ success: true, status: approved ? "approved" : "needs_review", invoice: next, validation });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  const db = getDb();
  const [document] = await db.select({ id: invoiceDocuments.id }).from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "delete" });
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
