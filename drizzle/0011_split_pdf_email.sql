ALTER TABLE "bulkInvoiceJobs"
  ADD COLUMN IF NOT EXISTS "deliveryMode" varchar(32) NOT NULL DEFAULT 'email_ocr';
