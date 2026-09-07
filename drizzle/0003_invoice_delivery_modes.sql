CREATE TABLE IF NOT EXISTS "companyDeliverySettings" (
  "companyId" integer PRIMARY KEY REFERENCES "companies"("id") ON DELETE CASCADE,
  "clerkUserId" varchar(255) NOT NULL,
  "mode" varchar(32) NOT NULL DEFAULT 'email_ocr',
  "apiEndpoint" text,
  "apiTokenEncrypted" text,
  "xmlFormat" varchar(32) NOT NULL DEFAULT 'ubl_2_1',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "companyDeliverySettings_owner_idx"
  ON "companyDeliverySettings" ("clerkUserId", "companyId");

CREATE TABLE IF NOT EXISTS "invoiceDeliveryJobs" (
  "id" serial PRIMARY KEY,
  "documentId" integer NOT NULL REFERENCES "invoiceDocuments"("id") ON DELETE CASCADE,
  "status" varchar(32) NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0,
  "maxAttempts" integer NOT NULL DEFAULT 5,
  "availableAt" timestamp NOT NULL DEFAULT now(),
  "lockedAt" timestamp,
  "lastError" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoiceDeliveryJobs_document_unique"
  ON "invoiceDeliveryJobs" ("documentId");
CREATE INDEX IF NOT EXISTS "invoiceDeliveryJobs_queue_idx"
  ON "invoiceDeliveryJobs" ("status", "availableAt");
