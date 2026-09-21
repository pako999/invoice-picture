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
           COALESCE(s."mode",'email_ocr') AS "deliveryMode",
           count(g."id") FILTER (WHERE
             (COALESCE(s."mode",'email_ocr')='email_ocr' AND g."deliveryStatus"='completed') OR
             (COALESCE(s."mode",'email_ocr') IN ('xml_email','api_json') AND dj."status"='completed')
           )::int AS "deliveredInvoices",
           count(g."id") FILTER (WHERE
             (COALESCE(s."mode",'email_ocr')='email_ocr' AND g."deliveryStatus"='failed') OR
             (COALESCE(s."mode",'email_ocr') IN ('xml_email','api_json') AND dj."status"='failed')
           )::int AS "failedDeliveries",
           count(g."id") FILTER (WHERE
             (COALESCE(s."mode",'email_ocr')='email_ocr' AND g."deliveryStatus"='pending') OR
             (COALESCE(s."mode",'email_ocr') IN ('xml_email','api_json') AND d."status"='approved' AND COALESCE(dj."status",'queued') IN ('queued','processing'))
           )::int AS "pendingDeliveries",
           count(g."id") FILTER (WHERE COALESCE(s."mode",'email_ocr') IN ('xml_email','api_json') AND d."status" IS DISTINCT FROM 'approved')::int AS "awaitingApproval"
    FROM "bulkInvoiceJobs" j
    LEFT JOIN "bulkInvoiceGroups" g ON g."jobId"=j."id"
    LEFT JOIN "invoiceDocuments" d ON d."id"=g."documentId"
    LEFT JOIN "invoiceDeliveryJobs" dj ON dj."documentId"=d."id"
    LEFT JOIN "companyDeliverySettings" s ON s."companyId"=j."companyId" AND s."clerkUserId"=j."clerkUserId"
    WHERE j."clerkUserId"=${userId}
    GROUP BY j."id",s."mode"
    ORDER BY j."createdAt" DESC LIMIT 100
  `;
  return NextResponse.json({ jobs: rows }, { headers: { "Cache-Control": "no-store" } });
}
