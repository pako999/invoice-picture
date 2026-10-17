ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "bulkGroupId" integer;

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_bulk_group_unique"
  ON "invoices" ("bulkGroupId");

ALTER TABLE "bulkInvoiceGroups"
  ADD COLUMN IF NOT EXISTS "archiveHidden" boolean NOT NULL DEFAULT false;
