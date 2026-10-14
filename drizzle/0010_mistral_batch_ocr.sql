ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "ocrBatchId" text;

ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "ocrBatchStartPage" integer;

ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "ocrBatchPageCount" integer;

ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "ocrBatchCreatedAt" timestamp;
