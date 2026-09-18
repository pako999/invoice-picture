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
