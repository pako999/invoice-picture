CREATE TABLE IF NOT EXISTS "bulkInvoiceJobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerkUserId" varchar(255) NOT NULL,
  "companyId" integer REFERENCES "companies"("id") ON DELETE SET NULL,
  "objectKey" text NOT NULL,
  "filename" varchar(255) NOT NULL,
  "byteSize" integer NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'processing',
  "stage" varchar(32) NOT NULL DEFAULT 'uploaded',
  "pageCount" integer,
  "ocrNextPage" integer NOT NULL DEFAULT 0,
  "classifyCursor" integer NOT NULL DEFAULT 0,
  "rangesJson" text,
  "boundaryReviewRequired" boolean NOT NULL DEFAULT false,
  "totalInvoices" integer NOT NULL DEFAULT 0,
  "processedInvoices" integer NOT NULL DEFAULT 0,
  "attempts" integer NOT NULL DEFAULT 0,
  "lockedAt" timestamp,
  "lastError" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "bulkInvoiceJobs_owner_object_unique"
  ON "bulkInvoiceJobs" ("clerkUserId", "objectKey");
CREATE INDEX IF NOT EXISTS "bulkInvoiceJobs_queue_idx"
  ON "bulkInvoiceJobs" ("status", "stage", "lockedAt", "updatedAt");
CREATE INDEX IF NOT EXISTS "bulkInvoiceJobs_owner_idx"
  ON "bulkInvoiceJobs" ("clerkUserId", "createdAt");

CREATE TABLE IF NOT EXISTS "bulkInvoicePages" (
  "id" serial PRIMARY KEY NOT NULL,
  "jobId" integer NOT NULL REFERENCES "bulkInvoiceJobs"("id") ON DELETE CASCADE,
  "pageNumber" integer NOT NULL,
  "markdown" text NOT NULL DEFAULT '',
  "ocrConfidenceBps" integer,
  "startsNewInvoice" boolean,
  "boundaryConfidenceBps" integer,
  "classificationJson" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "bulkInvoicePages_job_page_unique"
  ON "bulkInvoicePages" ("jobId", "pageNumber");

CREATE TABLE IF NOT EXISTS "bulkInvoiceGroups" (
  "id" serial PRIMARY KEY NOT NULL,
  "jobId" integer NOT NULL REFERENCES "bulkInvoiceJobs"("id") ON DELETE CASCADE,
  "groupIndex" integer NOT NULL,
  "startPage" integer NOT NULL,
  "endPage" integer NOT NULL,
  "objectKey" text,
  "sha256" varchar(64),
  "byteSize" integer,
  "boundaryConfidenceBps" integer,
  "needsBoundaryReview" boolean NOT NULL DEFAULT false,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "deliveryStatus" varchar(32) NOT NULL DEFAULT 'pending',
  "deliveryError" text,
  "documentId" integer REFERENCES "invoiceDocuments"("id") ON DELETE SET NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "bulkInvoiceGroups_job_group_unique"
  ON "bulkInvoiceGroups" ("jobId", "groupIndex");

ALTER TABLE "invoiceDocuments"
  ALTER COLUMN "originalBase64" DROP NOT NULL;

ALTER TABLE "invoiceDocuments"
  ADD COLUMN IF NOT EXISTS "storageObjectKey" text;
ALTER TABLE "invoiceDocuments"
  ADD COLUMN IF NOT EXISTS "bulkJobId" integer REFERENCES "bulkInvoiceJobs"("id") ON DELETE SET NULL;
ALTER TABLE "invoiceDocuments"
  ADD COLUMN IF NOT EXISTS "bulkGroupIndex" integer;
ALTER TABLE "invoiceDocuments"
  ADD COLUMN IF NOT EXISTS "sourcePageStart" integer;
ALTER TABLE "invoiceDocuments"
  ADD COLUMN IF NOT EXISTS "sourcePageEnd" integer;

CREATE INDEX IF NOT EXISTS "invoiceDocuments_bulk_job_idx"
  ON "invoiceDocuments" ("bulkJobId", "bulkGroupIndex");
