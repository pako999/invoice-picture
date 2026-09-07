-- Additive, non-destructive migration for Invoice Intelligence.
-- Existing subscriptions/userSettings/invoices/companies tables are untouched.

DO $$ BEGIN
  CREATE TYPE "invoice_processing_status" AS ENUM ('uploaded','queued','processing','needs_review','approved','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "invoice_validation_status" AS ENUM ('pending','valid','needs_review','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "invoice_ocr_provider" AS ENUM ('deterministic','mistral','azure','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "invoice_processing_job_status" AS ENUM ('queued','processing','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "invoiceDocuments" (
  "id" serial PRIMARY KEY,
  "clerkUserId" varchar(255) NOT NULL,
  "companyId" integer REFERENCES "companies"("id") ON DELETE SET NULL,
  "sourceInvoiceId" integer REFERENCES "invoices"("id") ON DELETE SET NULL,
  "filename" varchar(255) NOT NULL,
  "mimeType" varchar(96) NOT NULL,
  "originalBase64" text NOT NULL,
  "originalValueMetadataJson" text,
  "sha256" varchar(64) NOT NULL,
  "byteSize" integer NOT NULL,
  "idempotencyKey" varchar(160) NOT NULL,
  "status" "invoice_processing_status" NOT NULL DEFAULT 'uploaded',
  "documentType" varchar(32),
  "documentLanguage" varchar(24),
  "provider" "invoice_ocr_provider",
  "model" varchar(128),
  "rawText" text,
  "rawProviderResponse" text,
  "normalizedJson" text,
  "approvedJson" text,
  "overallConfidenceBps" integer,
  "validationStatus" "invoice_validation_status" NOT NULL DEFAULT 'pending',
  "warningsJson" text,
  "processingCostMicros" integer,
  "processingStartedAt" timestamp,
  "processedAt" timestamp,
  "approvedAt" timestamp,
  "rejectedAt" timestamp,
  "retentionUntil" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoiceDocuments_idempotency_unique" ON "invoiceDocuments" ("idempotencyKey");
CREATE INDEX IF NOT EXISTS "invoiceDocuments_owner_created_idx" ON "invoiceDocuments" ("clerkUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "invoiceDocuments_checksum_idx" ON "invoiceDocuments" ("clerkUserId", "sha256");
CREATE INDEX IF NOT EXISTS "invoiceDocuments_status_idx" ON "invoiceDocuments" ("status");

CREATE TABLE IF NOT EXISTS "invoiceLineItems" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "position" integer NOT NULL,
  "description" text,
  "quantity" varchar(64),
  "unit" varchar(32),
  "unitPriceNet" varchar(64),
  "discountPercent" varchar(64),
  "discountAmount" varchar(64),
  "vatRate" varchar(64),
  "netAmount" varchar(64),
  "vatAmount" varchar(64),
  "grossAmount" varchar(64)
);
CREATE INDEX IF NOT EXISTS "invoiceLineItems_document_idx" ON "invoiceLineItems" ("documentId", "position");

CREATE TABLE IF NOT EXISTS "invoiceVatBreakdown" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "position" integer NOT NULL,
  "vatRate" varchar(64),
  "taxableAmount" varchar(64),
  "vatAmount" varchar(64),
  "grossAmount" varchar(64)
);
CREATE INDEX IF NOT EXISTS "invoiceVatBreakdown_document_idx" ON "invoiceVatBreakdown" ("documentId", "position");

CREATE TABLE IF NOT EXISTS "invoiceFieldEvidence" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "fieldPath" varchar(255) NOT NULL,
  "valueText" text,
  "pageNumber" integer,
  "bboxJson" text,
  "confidenceBps" integer,
  "provider" "invoice_ocr_provider" NOT NULL
);
CREATE INDEX IF NOT EXISTS "invoiceFieldEvidence_field_idx" ON "invoiceFieldEvidence" ("documentId", "fieldPath");

CREATE TABLE IF NOT EXISTS "invoiceValidationResults" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "status" "invoice_validation_status" NOT NULL,
  "warningsJson" text NOT NULL DEFAULT '[]',
  "errorsJson" text NOT NULL DEFAULT '[]',
  "differencesJson" text NOT NULL DEFAULT '{}',
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "invoiceValidationResults_document_idx" ON "invoiceValidationResults" ("documentId", "createdAt");

CREATE TABLE IF NOT EXISTS "invoiceProcessingAttempts" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "provider" "invoice_ocr_provider" NOT NULL,
  "model" varchar(128),
  "status" varchar(32) NOT NULL,
  "errorCode" varchar(96),
  "errorMessage" text,
  "durationMs" integer,
  "pagesProcessed" integer,
  "costMicros" integer,
  "startedAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp
);
CREATE INDEX IF NOT EXISTS "invoiceProcessingAttempts_document_idx" ON "invoiceProcessingAttempts" ("documentId", "startedAt");

CREATE TABLE IF NOT EXISTS "invoiceProcessingJobs" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "status" "invoice_processing_job_status" NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0,
  "maxAttempts" integer NOT NULL DEFAULT 4,
  "availableAt" timestamp NOT NULL DEFAULT now(),
  "lockedAt" timestamp,
  "lastError" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoiceProcessingJobs_document_unique" ON "invoiceProcessingJobs" ("documentId");
CREATE INDEX IF NOT EXISTS "invoiceProcessingJobs_queue_idx" ON "invoiceProcessingJobs" ("status", "availableAt");

CREATE TABLE IF NOT EXISTS "invoiceCorrections" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "clerkUserId" varchar(255) NOT NULL,
  "fieldPath" varchar(255) NOT NULL,
  "oldValue" text,
  "newValue" text,
  "reason" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "invoiceCorrections_document_idx" ON "invoiceCorrections" ("documentId", "createdAt");

CREATE TABLE IF NOT EXISTS "supplierMappings" (
  "id" serial PRIMARY KEY,
  "clerkUserId" varchar(255) NOT NULL,
  "supplierKey" varchar(320) NOT NULL,
  "fieldPath" varchar(255) NOT NULL,
  "sourceValue" text,
  "correctedValue" text NOT NULL,
  "occurrences" integer NOT NULL DEFAULT 1,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "supplierMappings_unique" ON "supplierMappings" ("clerkUserId", "supplierKey", "fieldPath");

CREATE TABLE IF NOT EXISTS "invoiceDuplicateRelations" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "duplicateOfDocumentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "reason" varchar(128) NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoiceDuplicateRelations_unique" ON "invoiceDuplicateRelations" ("documentId", "duplicateOfDocumentId");

CREATE TABLE IF NOT EXISTS "invoiceAuditLogs" (
  "id" serial PRIMARY KEY,
  "documentId" integer REFERENCES "invoiceDocuments"("id") ON DELETE SET NULL,
  "clerkUserId" varchar(255) NOT NULL,
  "action" varchar(64) NOT NULL,
  "metadataJson" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "invoiceAuditLogs_owner_idx" ON "invoiceAuditLogs" ("clerkUserId", "createdAt");
