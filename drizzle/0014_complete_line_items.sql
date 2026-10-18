ALTER TABLE "invoiceLineItems" ADD COLUMN IF NOT EXISTS "productCode" varchar(160);
ALTER TABLE "invoiceLineItems" ADD COLUMN IF NOT EXISTS "unitPriceBeforeDiscount" varchar(64);
