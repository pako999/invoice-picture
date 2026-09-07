import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/admin";
import {
  invoiceCorrections,
  invoiceDocuments,
  invoiceDuplicateRelations,
  invoiceFieldEvidence,
  invoiceProcessingAttempts,
  supplierMappings,
} from "@/lib/schema";

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getDb();
  const [documents, attempts, evidence, corrections, mappings, duplicates] = await Promise.all([
    db.select({ id: invoiceDocuments.id, status: invoiceDocuments.status, provider: invoiceDocuments.provider, cost: invoiceDocuments.processingCostMicros, started: invoiceDocuments.processingStartedAt, processed: invoiceDocuments.processedAt, created: invoiceDocuments.createdAt }).from(invoiceDocuments).orderBy(desc(invoiceDocuments.createdAt)).limit(10000),
    db.select({ provider: invoiceProcessingAttempts.provider, status: invoiceProcessingAttempts.status, durationMs: invoiceProcessingAttempts.durationMs, costMicros: invoiceProcessingAttempts.costMicros }).from(invoiceProcessingAttempts).orderBy(desc(invoiceProcessingAttempts.startedAt)).limit(20000),
    db.select({ fieldPath: invoiceFieldEvidence.fieldPath }).from(invoiceFieldEvidence).limit(30000),
    db.select({ fieldPath: invoiceCorrections.fieldPath }).from(invoiceCorrections).limit(30000),
    db.select({ supplierKey: supplierMappings.supplierKey, occurrences: supplierMappings.occurrences }).from(supplierMappings).orderBy(desc(supplierMappings.updatedAt)).limit(5000),
    db.select({ id: invoiceDuplicateRelations.id }).from(invoiceDuplicateRelations).limit(20000),
  ]);

  const processed = documents.filter((d) => ["approved", "needs_review", "failed"].includes(d.status));
  const durations = documents.flatMap((d) => d.started && d.processed ? [d.processed.getTime() - d.started.getTime()] : []);
  const costs = processed.map((d) => d.cost ?? 0).filter((n) => n > 0);
  const providerUsage = countBy(attempts.filter((a) => a.status === "succeeded"), (a) => a.provider);
  const extractedByField = countBy(evidence, (e) => e.fieldPath);
  const correctedByField = countBy(corrections, (c) => c.fieldPath);
  const fieldAccuracy = Object.entries(extractedByField).map(([field, extracted]) => {
    const corrected = correctedByField[field] ?? 0;
    return { field, extracted, corrected, observedAccuracy: extracted > 0 ? Math.max(0, 1 - corrected / extracted) : null };
  }).sort((a, b) => (a.observedAccuracy ?? 1) - (b.observedAccuracy ?? 1));
  const supplierCorrections = mappings.reduce<Record<string, number>>((acc, row) => { acc[row.supplierKey] = (acc[row.supplierKey] ?? 0) + row.occurrences; return acc; }, {});
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthly = documents.filter((d) => d.created >= monthStart);

  return NextResponse.json({
    totals: {
      documents: documents.length,
      processed: processed.length,
      autoApproved: documents.filter((d) => d.status === "approved").length,
      needsReview: documents.filter((d) => d.status === "needs_review").length,
      failed: documents.filter((d) => d.status === "failed").length,
      queued: documents.filter((d) => d.status === "queued").length,
      duplicates: duplicates.length,
      averageProcessingTimeMs: average(durations),
      averageApiCostMicros: average(costs),
      estimatedMonthlyProcessingCostMicros: monthly.reduce((sum, d) => sum + (d.cost ?? 0), 0),
    },
    providerUsage,
    fieldAccuracy: fieldAccuracy.slice(0, 30),
    correctionsBySupplier: Object.entries(supplierCorrections).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([supplier, corrections]) => ({ supplier, corrections })),
  });
}

function average(values: number[]) { return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null; }
function countBy<T>(rows: T[], key: (row: T) => string) { return rows.reduce<Record<string, number>>((acc, row) => { const k = key(row); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {}); }
