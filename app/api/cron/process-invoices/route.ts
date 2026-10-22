import { NextResponse } from "next/server";
import { runQueuedInvoiceJobs } from "@/lib/invoice-intelligence/processor";
import { runQueuedDeliveryJobs } from "@/lib/invoice-intelligence/delivery";
import { bulkSql } from "@/lib/bulk-invoices/service";
import { runQueuedUploadJobs } from "@/lib/invoice-upload-queue";
import { DEFAULT_PDF_UPLOAD_JOB_BATCH_SIZE, MAX_PDF_UPLOAD_WORKER_CONCURRENCY } from "@/lib/pdf-upload-limits";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Recovery only. User submissions wake their own jobs immediately.
  const sql = bulkSql();
  const [pending] = await sql`SELECT
    EXISTS(SELECT 1 FROM "invoiceProcessingJobs" WHERE "status" IN ('queued','failed') AND "availableAt"<=now() AND "attempts"<"maxAttempts") AS ocr,
    EXISTS(SELECT 1 FROM "invoiceDeliveryJobs" WHERE "status" IN ('queued','failed') AND "availableAt"<=now() AND "attempts"<"maxAttempts") AS delivery,
    EXISTS(SELECT 1 FROM "invoiceUploadJobs" WHERE "status" IN ('queued','failed','processing') AND "availableAt"<=now() AND "attempts"<"maxAttempts") AS upload,
    EXISTS(SELECT 1 FROM "invoiceProcessingJobs" WHERE "status"='processing' AND "lockedAt"<now()-interval '10 minutes') AS stale,
    EXISTS(SELECT 1 FROM "invoiceDeliveryJobs" WHERE "status"='processing' AND "lockedAt"<now()-interval '10 minutes') AS "staleDelivery"`;
  if (!pending.ocr && !pending.delivery && !pending.upload && !pending.stale && !pending.staleDelivery) return NextResponse.json({ idle: true });
  if (pending.stale) {
    await sql`UPDATE "invoiceProcessingJobs" j SET "status"=CASE WHEN d."status" IN ('approved','needs_review') THEN 'completed'::invoice_processing_job_status ELSE 'failed'::invoice_processing_job_status END,
      "lockedAt"=NULL,"availableAt"=now(),"updatedAt"=now()
      FROM "invoiceDocuments" d WHERE j."documentId"=d."id" AND j."status"='processing' AND j."lockedAt"<now()-interval '10 minutes'`;
    await sql`UPDATE "invoiceDocuments" d SET "status"='failed',"validationStatus"='failed',"updatedAt"=now(),
      "warningsJson"='["Obdelava je bila prekinjena. Ponovno zaženite OCR."]'
      FROM "invoiceProcessingJobs" j WHERE j."documentId"=d."id" AND j."status"='failed' AND j."attempts">=j."maxAttempts" AND d."status" IN ('queued','processing')`;
  }
  if (pending.staleDelivery) {
    await sql`UPDATE "invoiceDeliveryJobs" j SET "status"='failed',"lockedAt"=NULL,"availableAt"=now(),
      "lastError"='Delivery interrupted; retrying with the same idempotency key',"updatedAt"=now()
      WHERE j."status"='processing' AND j."lockedAt"<now()-interval '10 minutes'`;
  }

  const limit = Math.max(1, Math.min(10, Number(process.env.INVOICE_CRON_BATCH_SIZE ?? 3)));
  const deliveryLimit = Math.max(1, Math.min(20, Number(process.env.INVOICE_DELIVERY_BATCH_SIZE ?? 5)));
  const uploadLimit = Math.max(1, Math.min(50, Number(process.env.INVOICE_UPLOAD_JOB_BATCH_SIZE ?? DEFAULT_PDF_UPLOAD_JOB_BATCH_SIZE)));
  const uploadConcurrency = Math.max(1, Math.min(MAX_PDF_UPLOAD_WORKER_CONCURRENCY, Number(process.env.INVOICE_UPLOAD_JOB_CONCURRENCY ?? MAX_PDF_UPLOAD_WORKER_CONCURRENCY)));
  const startedAt = Date.now();
  const uploadResults = pending.upload ? await runQueuedUploadJobs(uploadLimit, uploadConcurrency) : [];
  const results = pending.ocr || pending.stale ? await runQueuedInvoiceJobs(limit) : [];
  const deliveryResults = pending.delivery || pending.staleDelivery ? await runQueuedDeliveryJobs(deliveryLimit) : [];
  return NextResponse.json({
    uploadsProcessed: uploadResults.length,
    uploadsSucceeded: uploadResults.filter((r) => r.ok).length,
    uploadsFailed: uploadResults.filter((r) => !r.ok).length,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    deliveriesProcessed: deliveryResults.length,
    deliveriesSucceeded: deliveryResults.filter((r) => r.ok).length,
    deliveriesFailed: deliveryResults.filter((r) => !r.ok).length,
    durationMs: Date.now() - startedAt,
    uploadResults,
    results,
    deliveryResults,
  });
}

