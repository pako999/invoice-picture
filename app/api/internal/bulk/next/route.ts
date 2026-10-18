import { NextResponse } from "next/server";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const sql=bulkSql();

 // Repair recent legacy/orphan states where a group is marked extracted but its
 // invoiceDocument no longer exists. Explicit user deletions are marked
 // "deleted" and are therefore never recreated by this self-heal.
 await sql`
  WITH orphaned AS (
    UPDATE "bulkInvoiceGroups" g
    SET "status"='reprocess',"deliveryStatus"='pending',"deliveryError"=NULL,"updatedAt"=now()
    FROM "bulkInvoiceJobs" j
    WHERE g."jobId"=j."id"
      AND g."status"='extracted'
      AND g."documentId" IS NULL
      AND j."updatedAt" >= now()-interval '14 days'
    RETURNING g."jobId"
  )
  UPDATE "bulkInvoiceJobs" j
  SET "status"='processing',"stage"='extract',"completedAt"=NULL,"lockedAt"=NULL,
      "lastError"=NULL,
      "processedInvoices"=(
        SELECT count(*)::int FROM "bulkInvoiceGroups" g2
        WHERE g2."jobId"=j."id" AND g2."documentId" IS NOT NULL
      ),
      "updatedAt"=now()
  WHERE j."id" IN (SELECT DISTINCT "jobId" FROM orphaned)
 `;

 const rows=await sql`
  WITH candidate AS (
    SELECT "id" FROM "bulkInvoiceJobs"
    WHERE "status"='processing'
      AND "stage" NOT IN ('boundary_review','quota_wait','completed','failed')
      AND ("lockedAt" IS NULL OR "lockedAt" < now()-interval '15 minutes')
      AND (
        "lastError" IS NULL
        OR "lastError" NOT LIKE '[rate-limit:%'
        OR "updatedAt" <= now()-interval '2 minutes'
      )
    ORDER BY "updatedAt" ASC,"id" ASC
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE "bulkInvoiceJobs" j
  SET "lockedAt"=now(),"attempts"="attempts"+1,"updatedAt"=now()
  FROM candidate c WHERE j."id"=c."id"
  RETURNING j."id",j."clerkUserId",j."companyId",j."objectKey",j."filename",j."byteSize",
    j."status",j."stage",j."pageCount",j."ocrNextPage",j."classifyCursor",j."totalInvoices",j."processedInvoices"
 `;
 return NextResponse.json({job:rows[0]??null});
}
