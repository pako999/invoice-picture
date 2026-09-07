import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments, type InvoiceDocument } from "@/lib/schema";
import { enqueueInvoiceDocument } from "@/lib/invoice-intelligence/queue";

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(96),
  base64: z.string().min(1).max(14 * 1024 * 1024),
  companyId: z.number().int().positive().nullable().optional(),
});

const allowedMime = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/xml", "text/xml"]);
const allowedStatuses = new Set<InvoiceDocument["status"]>(["uploaded", "queued", "processing", "needs_review", "approved", "failed"]);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested = req.nextUrl.searchParams.get("status");
  const requestedStatus = requested && allowedStatuses.has(requested as InvoiceDocument["status"])
    ? requested as InvoiceDocument["status"]
    : null;
  const db = getDb();
  const condition = requestedStatus
    ? and(eq(invoiceDocuments.clerkUserId, userId), eq(invoiceDocuments.status, requestedStatus))
    : eq(invoiceDocuments.clerkUserId, userId);

  const [rows, allRows] = await Promise.all([
    db.select({
      id: invoiceDocuments.id,
      companyId: invoiceDocuments.companyId,
      sourceInvoiceId: invoiceDocuments.sourceInvoiceId,
      filename: invoiceDocuments.filename,
      mimeType: invoiceDocuments.mimeType,
      byteSize: invoiceDocuments.byteSize,
      status: invoiceDocuments.status,
      documentType: invoiceDocuments.documentType,
      documentLanguage: invoiceDocuments.documentLanguage,
      provider: invoiceDocuments.provider,
      model: invoiceDocuments.model,
      overallConfidenceBps: invoiceDocuments.overallConfidenceBps,
      validationStatus: invoiceDocuments.validationStatus,
      warningsJson: invoiceDocuments.warningsJson,
      processingCostMicros: invoiceDocuments.processingCostMicros,
      createdAt: invoiceDocuments.createdAt,
      processedAt: invoiceDocuments.processedAt,
      approvedAt: invoiceDocuments.approvedAt,
    }).from(invoiceDocuments).where(condition).orderBy(desc(invoiceDocuments.createdAt)).limit(200),
    db.select({
      status: invoiceDocuments.status,
      cost: invoiceDocuments.processingCostMicros,
      processingStartedAt: invoiceDocuments.processingStartedAt,
      processedAt: invoiceDocuments.processedAt,
      createdAt: invoiceDocuments.createdAt,
    }).from(invoiceDocuments).where(eq(invoiceDocuments.clerkUserId, userId)).limit(1000),
  ]);

  const counts = Object.fromEntries(["uploaded", "queued", "processing", "needs_review", "approved", "failed"].map((s) => [s, allRows.filter((r) => r.status === s).length]));
  const costs = allRows.map((r) => r.cost ?? 0).filter((n) => n > 0);
  const durations = allRows.map((r) => r.processingStartedAt && r.processedAt ? r.processedAt.getTime() - r.processingStartedAt.getTime() : null).filter((n): n is number => n != null && n >= 0);
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthlyCost = allRows.filter((r) => r.createdAt >= monthStart).reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return NextResponse.json({
    documents: rows,
    stats: {
      total: allRows.length,
      ...counts,
      averageProcessingTimeMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      averageApiCostMicros: costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : null,
      estimatedMonthlyCostMicros: monthlyCost,
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = uploadSchema.parse(await req.json());
    if (!allowedMime.has(data.mimeType)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    const bytes = Buffer.from(data.base64, "base64");
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
    if (data.mimeType === "application/pdf" && bytes.subarray(0, 4).toString() !== "%PDF") return NextResponse.json({ error: "Invalid PDF" }, { status: 400 });
    const documentId = await enqueueInvoiceDocument({
      clerkUserId: userId,
      companyId: data.companyId ?? null,
      sourceInvoiceId: null,
      filename: data.filename,
      mimeType: data.mimeType,
      base64: data.base64,
    });
    if (!documentId) throw new Error("Could not create invoice document");
    await getDb().insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "uploaded_for_processing" });
    return NextResponse.json({ success: true, documentId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
