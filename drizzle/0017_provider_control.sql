CREATE TABLE IF NOT EXISTS "invoiceProviderSlots" (
  "slot" integer PRIMARY KEY,
  "token" text,
  "expiresAt" timestamp NOT NULL DEFAULT '1970-01-01'
);
--> statement-breakpoint
INSERT INTO "invoiceProviderSlots" ("slot") SELECT generate_series(1,10) ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "invoiceProcessingJobs" ALTER COLUMN "maxAttempts" SET DEFAULT 2;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoiceProviderUsage" (
  "id" serial PRIMARY KEY,
  "requestKey" text NOT NULL UNIQUE,
  "clerkUserId" varchar(255) NOT NULL,
  "documentId" integer REFERENCES "invoiceDocuments"("id") ON DELETE SET NULL,
  "bulkJobId" integer REFERENCES "bulkInvoiceJobs"("id") ON DELETE SET NULL,
  "operation" text NOT NULL,
  "model" text NOT NULL,
  "mode" text NOT NULL,
  "httpStatus" integer,
  "completionUnknown" boolean NOT NULL DEFAULT false,
  "usageJson" text,
  "estimatedCostMicros" integer,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoiceProviderUsage_owner_idx" ON "invoiceProviderUsage" ("clerkUserId","createdAt");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoiceOriginalDeliveryJobs" (
  "invoiceId" integer PRIMARY KEY REFERENCES "invoices"("id") ON DELETE CASCADE,
  "messageBody" text,
  "status" varchar(16) NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0,
  "availableAt" timestamp NOT NULL DEFAULT now(),
  "lockedAt" timestamp,
  "lastError" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoiceOriginalDeliveryJobs_queue_idx" ON "invoiceOriginalDeliveryJobs" ("status","availableAt");

--> statement-breakpoint
ALTER TABLE "invoiceProcessingJobs" ADD COLUMN IF NOT EXISTS "preferBatch" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "invoiceProcessingJobs" ADD COLUMN IF NOT EXISTS "batchStateJson" text;
--> statement-breakpoint
ALTER TABLE "bulkInvoiceJobs" ADD COLUMN IF NOT EXISTS "preferBatch" boolean NOT NULL DEFAULT false;
