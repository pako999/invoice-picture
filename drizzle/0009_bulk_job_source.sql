ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "sourceInvoiceId" integer REFERENCES "invoices"("id") ON DELETE SET NULL;

ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "recipientEmail" varchar(320);
