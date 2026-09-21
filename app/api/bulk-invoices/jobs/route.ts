import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = bulkSql();
  const rows = await sql`
    SELECT j."id",j."filename",j."byteSize",j."status",j."stage",j."pageCount",j."ocrNextPage",
           j."boundaryReviewRequired",j."totalInvoices",j."processedInvoices",j."lastError",j."createdAt",j."updatedAt",j."completedAt",
           count(g."id") FILTER (WHERE g."deliveryStatus"='completed')::int AS "deliveredInvoices",
           count(g."id") FILTER (WHERE g."deliveryStatus"='failed')::int AS "failedDeliveries",
           count(g."id") FILTER (WHERE g."deliveryStatus"='pending')::int AS "pendingDeliveries",
           count(g."id") FILTER (WHERE g."deliveryStatus"='not_required')::int AS "deliveryNotRequired"
    FROM "bulkInvoiceJobs" j
    LEFT JOIN "bulkInvoiceGroups" g ON g."jobId"=j."id"
    WHERE j."clerkUserId"=${userId}
    GROUP BY j."id"
    ORDER BY j."createdAt" DESC LIMIT 100
  `;
  return NextResponse.json({ jobs: rows }, { headers: { "Cache-Control": "no-store" } });
}
