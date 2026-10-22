import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { workspaceAuth } from "@/lib/workspace";
import { bulkSql } from "@/lib/bulk-invoices/service";
import { deliveryState, type FlowSnapshot } from "@/lib/invoice-processing-flow";

const ids = z.array(z.number().int().positive()).max(500).default([]);
const schema = z.object({ invoiceIds: ids, documentIds: ids, bulkJobIds: ids })
  .refine((input) => input.invoiceIds.length + input.documentIds.length + input.bulkJobIds.length > 0);

/** One read-only request per visible upload session; no file bytes or audit writes while polling. */
export async function POST(req: NextRequest) {
  const { userId } = await workspaceAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = schema.parse(await req.json());
    const invoiceIds = [...new Set(input.invoiceIds)], documentIds = [...new Set(input.documentIds)], batchIds = [...new Set(input.bulkJobIds)];
    const sql = bulkSql();
    const [sources, documents, batches, groups] = await Promise.all([
      invoiceIds.length ? sql`
        SELECT i."id", i."filename", i."status", i."errorMessage", i."recipientEmail",
               coalesce(s."mode", 'email_ocr') AS "mode", s."apiEndpoint", d."id" AS "documentId", d."status" AS "documentStatus"
        FROM "invoices" i
        LEFT JOIN "companyDeliverySettings" s ON s."companyId"=i."companyId" AND s."clerkUserId"=i."clerkUserId"
        LEFT JOIN LATERAL (SELECT "id", "status" FROM "invoiceDocuments"
          WHERE "sourceInvoiceId"=i."id" AND "clerkUserId"=${userId} ORDER BY "id" DESC LIMIT 1) d ON true
        WHERE i."clerkUserId"=${userId} AND i."id"=ANY(${invoiceIds}::int[])
      ` : Promise.resolve([]),
      sql`
        SELECT d."id", d."sourceInvoiceId", d."bulkJobId", d."filename", d."status", d."warningsJson",
               coalesce(b."deliveryMode", s."mode", 'email_ocr') AS "mode",
               coalesce(i."recipientEmail", b."recipientEmail", c."recipientEmail") AS "recipientEmail", s."apiEndpoint",
               i."status" AS "originalStatus", i."errorMessage", dj."status" AS "queueStatus", dj."lastError",
               dj."attempts", dj."maxAttempts", g."deliveryStatus" AS "groupDeliveryStatus", g."deliveryError",
               EXISTS(SELECT 1 FROM "invoiceAuditLogs" a WHERE a."documentId"=d."id" AND a."clerkUserId"=${userId}
                 AND a."action" IN ('structured_delivery_success','structured_zip_delivery_success')) AS "hasReceipt"
        FROM "invoiceDocuments" d
        LEFT JOIN "invoices" i ON i."id"=d."sourceInvoiceId" AND i."clerkUserId"=d."clerkUserId"
        LEFT JOIN "bulkInvoiceJobs" b ON b."id"=d."bulkJobId" AND b."clerkUserId"=d."clerkUserId"
        LEFT JOIN "bulkInvoiceGroups" g ON g."documentId"=d."id" AND g."jobId"=b."id"
        LEFT JOIN "companies" c ON c."id"=d."companyId" AND c."clerkUserId"=d."clerkUserId"
        LEFT JOIN "companyDeliverySettings" s ON s."companyId"=d."companyId" AND s."clerkUserId"=d."clerkUserId"
        LEFT JOIN "invoiceDeliveryJobs" dj ON dj."documentId"=d."id"
        WHERE d."clerkUserId"=${userId} AND (d."id"=ANY(${documentIds}::int[])
          OR d."sourceInvoiceId"=ANY(${invoiceIds}::int[]) OR d."bulkJobId"=ANY(${batchIds}::int[]))
        ORDER BY d."id"
      `,
      batchIds.length ? sql`
        SELECT b."id", b."filename", b."stage", b."deliveryMode", b."pageCount", b."ocrNextPage",
               b."totalInvoices", b."processedInvoices", b."lastError", coalesce(b."recipientEmail", c."recipientEmail", u."recipientEmail") AS "recipientEmail", s."apiEndpoint"
        FROM "bulkInvoiceJobs" b
        LEFT JOIN "companies" c ON c."id"=b."companyId" AND c."clerkUserId"=b."clerkUserId"
        LEFT JOIN "companyDeliverySettings" s ON s."companyId"=b."companyId" AND s."clerkUserId"=b."clerkUserId"
        LEFT JOIN "userSettings" u ON u."clerkUserId"=b."clerkUserId"
        WHERE b."clerkUserId"=${userId} AND b."id"=ANY(${batchIds}::int[])
      ` : Promise.resolve([]),
      batchIds.length ? sql`
        SELECT g."jobId", g."groupIndex", g."documentId", g."status", g."deliveryStatus", g."deliveryError", b."deliveryMode" AS "mode",
               coalesce(b."recipientEmail", c."recipientEmail", u."recipientEmail") AS "recipientEmail", s."apiEndpoint"
        FROM "bulkInvoiceGroups" g JOIN "bulkInvoiceJobs" b ON b."id"=g."jobId"
        LEFT JOIN "companies" c ON c."id"=b."companyId" AND c."clerkUserId"=b."clerkUserId"
        LEFT JOIN "companyDeliverySettings" s ON s."companyId"=b."companyId" AND s."clerkUserId"=b."clerkUserId"
        LEFT JOIN "userSettings" u ON u."clerkUserId"=b."clerkUserId"
        WHERE b."clerkUserId"=${userId} AND b."id"=ANY(${batchIds}::int[]) ORDER BY g."jobId", g."groupIndex"
      ` : Promise.resolve([]),
    ]);
    const snapshot: FlowSnapshot = {
      invoices: sources.map((row) => ({ id: Number(row.id), filename: row.filename, documentId: row.documentId == null ? null : Number(row.documentId), status: row.status,
        error: row.errorMessage, delivery: deliveryState({ mode: row.mode, target: target(row), documentStatus: row.documentStatus, sent: row.status === "sent", originalStatus: row.status, error: row.errorMessage }) })),
      documents: documents.map((row) => ({ id: Number(row.id), sourceInvoiceId: row.sourceInvoiceId == null ? null : Number(row.sourceInvoiceId), bulkJobId: row.bulkJobId == null ? null : Number(row.bulkJobId), filename: row.filename, status: row.status,
        error: row.status === "failed" ? firstWarning(row.warningsJson) : null,
        delivery: deliveryState({ mode: row.mode, target: target(row), documentStatus: row.status,
          sent: row.originalStatus === "sent" || row.groupDeliveryStatus === "completed" || row.hasReceipt === true,
          originalStatus: row.originalStatus, queueStatus: row.queueStatus ?? row.groupDeliveryStatus,
          attempts: row.attempts, maxAttempts: row.maxAttempts, error: row.lastError ?? row.deliveryError ?? row.errorMessage }) })),
      batches: batches.map((row) => ({ id: Number(row.id), filename: row.filename, stage: row.stage, deliveryMode: row.deliveryMode,
        target: target({ ...row, mode: row.deliveryMode }), pageCount: row.pageCount, ocrNextPage: Number(row.ocrNextPage), totalInvoices: Number(row.totalInvoices), processedInvoices: Number(row.processedInvoices), error: row.lastError })),
      groups: groups.map((row) => ({ jobId: Number(row.jobId), groupIndex: Number(row.groupIndex), documentId: row.documentId == null ? null : Number(row.documentId), status: row.status,
        delivery: deliveryState({ mode: row.mode, target: target(row), sent: row.deliveryStatus === "completed", queueStatus: row.deliveryStatus, error: row.deliveryError }) })),
    };
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid upload session" }, { status: 400 });
    console.error("invoice_processing_status_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Statusa obdelave trenutno ni mogoče preveriti. Poskusite znova." }, { status: 503 });
  }
}

function target(row: Record<string, unknown>) {
  if (row.mode !== "api_json") return typeof row.recipientEmail === "string" && row.recipientEmail ? row.recipientEmail : null;
  try { return typeof row.apiEndpoint === "string" && row.apiEndpoint ? new URL(row.apiEndpoint).origin : null; } catch { return null; }
}
function firstWarning(value: string | null) {
  try { const warnings: unknown = JSON.parse(value || "[]"); return Array.isArray(warnings) && typeof warnings[0] === "string" ? warnings[0] : null; } catch { return null; }
}
