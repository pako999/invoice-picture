CREATE TABLE IF NOT EXISTS "invoiceUploadChunks" (
  "id" serial PRIMARY KEY NOT NULL,
  "uploadId" varchar(64) NOT NULL,
  "clerkUserId" varchar(255) NOT NULL,
  "chunkIndex" integer NOT NULL,
  "totalChunks" integer NOT NULL,
  "data" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoiceUploadChunks_upload_chunk_unique"
  ON "invoiceUploadChunks" ("uploadId", "clerkUserId", "chunkIndex");

CREATE INDEX IF NOT EXISTS "invoiceUploadChunks_owner_created_idx"
  ON "invoiceUploadChunks" ("clerkUserId", "createdAt");

CREATE TABLE IF NOT EXISTS "invoiceUploadJobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "uploadId" varchar(64) NOT NULL,
  "clerkUserId" varchar(255) NOT NULL,
  "invoiceId" integer NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "filename" varchar(255) NOT NULL,
  "mimeType" varchar(96) NOT NULL,
  "subject" varchar(255) NOT NULL DEFAULT 'Račun',
  "companyId" integer,
  "messageBody" text,
  "deliveryMode" varchar(32) NOT NULL DEFAULT 'email_ocr',
  "totalChunks" integer NOT NULL,
  "byteSize" integer NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0,
  "maxAttempts" integer NOT NULL DEFAULT 5,
  "availableAt" timestamp NOT NULL DEFAULT now(),
  "lockedAt" timestamp,
  "lastError" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoiceUploadJobs_upload_unique"
  ON "invoiceUploadJobs" ("uploadId", "clerkUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "invoiceUploadJobs_invoice_unique"
  ON "invoiceUploadJobs" ("invoiceId");

CREATE INDEX IF NOT EXISTS "invoiceUploadJobs_queue_idx"
  ON "invoiceUploadJobs" ("status", "availableAt");
