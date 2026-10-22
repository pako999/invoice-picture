import { bulkSql } from "./service";
/** Legacy repair belongs in daily maintenance, never in every worker claim. */
export async function repairBulkOrphans() {
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

}
