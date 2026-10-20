import { NextResponse } from "next/server";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const sql=bulkSql();

 // Repair recent legacy/orphan states where a group is marked extracted but its
 // invoiceDocument no longer exists. Split-only PDFs intentionally have no
 // invoiceDocument, so never reopen them. Preserve completed email deliveries
 // when repairing OCR data to avoid resending an already delivered original.
 await sql`
  WITH orphaned AS (
    UPDATE "bulkInvoiceGroups" g
    SET "status"='reprocess',
        "deliveryStatus"=CASE
          WHEN g."deliveryStatus" IN ('completed','not_required') THEN g."deliveryStatus"
          WHEN j."deliveryMode"='email_ocr' THEN 'pending'
          ELSE 'not_required'
        END,
        "deliveryError"=NULL,"updatedAt"=now()
    FROM "bulkInvoiceJobs" j
    WHERE g."jobId"=j."id"
      AND g."status"='extracted'
      AND g."documentId" IS NULL
      AND j."deliveryMode" <> 'split_pdf_email'
      AND g."archiveHidden" = false
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

 const claim=await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(hashtextextended('bulk-worker-admission',0))`,
  sql`
  WITH candidate AS (
    SELECT "id" FROM "bulkInvoiceJobs" candidate_job
    WHERE "status"='processing'
      AND "stage" NOT IN ('boundary_review','quota_wait','completed','failed')
      AND (
        "stage" <> 'queued' OR (
          (SELECT count(*) FROM "bulkInvoiceJobs" active
           WHERE active."clerkUserId"=candidate_job."clerkUserId" AND active."status"='processing'
             AND active."stage" NOT IN ('queued','boundary_review','quota_wait','completed','failed')) < 2
          AND (SELECT count(*) FROM "bulkInvoiceJobs" active
               WHERE active."status"='processing'
                 AND active."stage" NOT IN ('queued','boundary_review','quota_wait','completed','failed')) < 120
        )
      )
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
  SET "stage"=CASE WHEN j."stage"='queued' THEN 'uploaded' ELSE j."stage" END,
      "lockedAt"=now(),"attempts"="attempts"+1,"updatedAt"=now()
  FROM candidate c WHERE j."id"=c."id"
  RETURNING j."id",j."clerkUserId",j."companyId",j."objectKey",j."filename",j."byteSize",
    j."status",j."stage",j."pageCount",j."ocrNextPage",j."classifyCursor",j."totalInvoices",j."processedInvoices"
 `]);
 const rows=claim[1];
 return NextResponse.json({job:rows[0]??null});
}
