ALTER TABLE "bulkInvoiceJobs" ADD COLUMN IF NOT EXISTS "classifyBatchId" text;
ALTER TABLE "bulkInvoiceJobs" ADD COLUMN IF NOT EXISTS "classifyBatchStartPage" integer;
ALTER TABLE "bulkInvoiceJobs" ADD COLUMN IF NOT EXISTS "classifyBatchEndPage" integer;
ALTER TABLE "bulkInvoiceGroups" ADD COLUMN IF NOT EXISTS "extractionBatchId" text;
ALTER TABLE "bulkInvoiceGroups" ADD COLUMN IF NOT EXISTS "extractionBatchCreatedAt" timestamp;
