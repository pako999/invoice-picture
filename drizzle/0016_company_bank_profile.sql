ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bankPayerName" varchar(70);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bankIban" varchar(34);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bankBic" varchar(11);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bankCity" varchar(35);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bankCountry" varchar(2);
