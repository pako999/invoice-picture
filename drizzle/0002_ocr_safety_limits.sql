-- Persistent OCR safety budgets. Additive only.
CREATE TABLE IF NOT EXISTS "invoiceOcrUsageBuckets" (
  "id" serial PRIMARY KEY,
  "scopeKey" varchar(320) NOT NULL,
  "bucketType" varchar(16) NOT NULL,
  "bucketStart" timestamp NOT NULL,
  "reservedPages" integer NOT NULL DEFAULT 0,
  "estimatedCostMicros" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoiceOcrUsageBuckets_unique"
  ON "invoiceOcrUsageBuckets" ("scopeKey", "bucketType", "bucketStart");

CREATE INDEX IF NOT EXISTS "invoiceOcrUsageBuckets_bucket_idx"
  ON "invoiceOcrUsageBuckets" ("bucketType", "bucketStart");
