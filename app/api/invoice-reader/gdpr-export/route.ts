import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  invoiceAuditLogs,
  invoiceCorrections,
  invoiceDocuments,
  invoiceDuplicateRelations,
  invoiceFieldEvidence,
  invoiceProcessingAttempts,
  invoiceValidationResults,
  supplierMappings,
} from "@/lib/schema";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const documents = await db.select({
    id: invoiceDocuments.id,
    companyId: invoiceDocuments.companyId,
    sourceInvoiceId: invoiceDocuments.sourceInvoiceId,
    filename: invoiceDocuments.filename,
    mimeType: invoiceDocuments.mimeType,
    sha256: invoiceDocuments.sha256,
    byteSize: invoiceDocuments.byteSize,
    status: invoiceDocuments.status,
    documentType: invoiceDocuments.documentType,
    documentLanguage: invoiceDocuments.documentLanguage,
    provider: invoiceDocuments.provider,
    model: invoiceDocuments.model,
    rawText: invoiceDocuments.rawText,
    normalizedJson: invoiceDocuments.normalizedJson,
    approvedJson: invoiceDocuments.approvedJson,
    overallConfidenceBps: invoiceDocuments.overallConfidenceBps,
    validationStatus: invoiceDocuments.validationStatus,
    warningsJson: invoiceDocuments.warningsJson,
    processingCostMicros: invoiceDocuments.processingCostMicros,
    createdAt: invoiceDocuments.createdAt,
    processedAt: invoiceDocuments.processedAt,
    approvedAt: invoiceDocuments.approvedAt,
    rejectedAt: invoiceDocuments.rejectedAt,
    retentionUntil: invoiceDocuments.retentionUntil,
  }).from(invoiceDocuments).where(eq(invoiceDocuments.clerkUserId, userId)).limit(5000);

  const ids = new Set(documents.map((d) => d.id));
  const [corrections, mappings, audits] = await Promise.all([
    db.select().from(invoiceCorrections).where(eq(invoiceCorrections.clerkUserId, userId)).limit(10000),
    db.select().from(supplierMappings).where(eq(supplierMappings.clerkUserId, userId)).limit(10000),
    db.select().from(invoiceAuditLogs).where(eq(invoiceAuditLogs.clerkUserId, userId)).limit(20000),
  ]);

  const histories = [] as Array<Record<string, unknown>>;
  for (const id of ids) {
    const [attempts, validations, evidence, duplicates] = await Promise.all([
      db.select().from(invoiceProcessingAttempts).where(eq(invoiceProcessingAttempts.documentId, id)).limit(100),
      db.select().from(invoiceValidationResults).where(eq(invoiceValidationResults.documentId, id)).limit(100),
      db.select().from(invoiceFieldEvidence).where(eq(invoiceFieldEvidence.documentId, id)).limit(1000),
      db.select().from(invoiceDuplicateRelations).where(eq(invoiceDuplicateRelations.documentId, id)).limit(100),
    ]);
    histories.push({ documentId: id, attempts, validations, evidence, duplicates });
  }

  await db.insert(invoiceAuditLogs).values({ clerkUserId: userId, action: "gdpr_export", metadataJson: JSON.stringify({ documents: documents.length }) });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    note: "Original binary invoice files are excluded from this JSON export for size and security. They remain individually downloadable through authenticated signed document URLs until retention/deletion.",
    documents: documents.map((d) => ({
      ...d,
      normalized: parse(d.normalizedJson),
      approved: parse(d.approvedJson),
      warnings: parse(d.warningsJson),
      normalizedJson: undefined,
      approvedJson: undefined,
      warningsJson: undefined,
    })),
    processingHistory: histories,
    corrections,
    supplierMappings: mappings,
    auditLog: audits,
  }, { headers: { "Content-Disposition": "attachment; filename=slikajracun-data-export.json", "Cache-Control": "private, no-store" } });
}

function parse(value: string | null) { if (!value) return null; try { return JSON.parse(value); } catch { return value; } }
