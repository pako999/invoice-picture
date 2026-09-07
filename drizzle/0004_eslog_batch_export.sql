CREATE TABLE IF NOT EXISTS "invoiceEslogBatches" (
  "id" serial PRIMARY KEY,
  "batchKey" varchar(64) NOT NULL UNIQUE,
  "clerkUserId" varchar(255) NOT NULL,
  "companyId" integer NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "recipientEmail" varchar(320) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'collecting',
  "sourceCount" integer NOT NULL DEFAULT 0,
  "totalInvoices" integer NOT NULL DEFAULT 0,
  "zipFilename" varchar(255),
  "zipBase64" text,
  "errorMessage" text,
  "lastActivityAt" timestamp NOT NULL DEFAULT now(),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "invoiceEslogBatches_owner_status_idx"
  ON "invoiceEslogBatches" ("clerkUserId", "companyId", "status", "lastActivityAt");

CREATE TABLE IF NOT EXISTS "invoiceEslogBatchSources" (
  "id" serial PRIMARY KEY,
  "batchId" integer NOT NULL REFERENCES "invoiceEslogBatches"("id") ON DELETE CASCADE,
  "sourceInvoiceId" integer REFERENCES "invoices"("id") ON DELETE SET NULL,
  "sourceOrder" integer NOT NULL,
  "filename" varchar(255) NOT NULL,
  "mimeType" varchar(96) NOT NULL,
  "originalBase64" text NOT NULL,
  "sha256" varchar(64) NOT NULL,
  "byteSize" integer NOT NULL,
  "pageCount" integer,
  "nextPage" integer NOT NULL DEFAULT 0,
  "partialResultsJson" text NOT NULL DEFAULT '[]',
  "status" varchar(32) NOT NULL DEFAULT 'queued',
  "errorMessage" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "invoiceEslogBatchSources_batch_order_unique" UNIQUE ("batchId", "sourceOrder")
);

CREATE INDEX IF NOT EXISTS "invoiceEslogBatchSources_status_idx"
  ON "invoiceEslogBatchSources" ("batchId", "status", "sourceOrder");
