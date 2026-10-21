CREATE TABLE IF NOT EXISTS "workspaceMembers" (
  "id" serial PRIMARY KEY,
  "ownerId" varchar(255) NOT NULL,
  "memberId" varchar(255) NOT NULL,
  "email" varchar(320) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending','active')),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("ownerId", "memberId"),
  CHECK ("ownerId" <> "memberId")
);
CREATE INDEX IF NOT EXISTS "workspaceMembers_member_idx" ON "workspaceMembers" ("memberId", "status");

-- A consumed document remains counted after deletion from the archive.
CREATE TABLE IF NOT EXISTS "invoiceDocumentMeter" (
  "documentId" integer PRIMARY KEY,
  "clerkUserId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "invoiceDocumentMeter_owner_month_idx" ON "invoiceDocumentMeter" ("clerkUserId", "createdAt");
INSERT INTO "invoiceDocumentMeter" ("documentId","clerkUserId","createdAt") SELECT id,"clerkUserId","createdAt" FROM "invoiceDocuments" ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION meter_invoice_document() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO "invoiceDocumentMeter" ("documentId","clerkUserId","createdAt") VALUES (NEW.id,NEW."clerkUserId",NEW."createdAt") ON CONFLICT DO NOTHING;
 RETURN NEW;
END;
$$;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='meter_invoice_document_insert') THEN
  CREATE TRIGGER meter_invoice_document_insert AFTER INSERT ON "invoiceDocuments" FOR EACH ROW EXECUTE FUNCTION meter_invoice_document();
 END IF;
END; $$;
