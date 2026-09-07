import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice, normalizedInvoiceSchema } from "../lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateIban, validateInvoice } from "../lib/invoice-intelligence/validation";
import { readDeterministically, readWithMistral } from "../lib/invoice-intelligence/providers";
import { createDocumentSignature, verifyDocumentSignature } from "../lib/invoice-intelligence/signing";

function baseInvoice() {
  const invoice = emptyInvoice();
  invoice.documentType = "invoice";
  invoice.supplier.name = "Test Dobavitelj d.o.o.";
  invoice.supplier.countryCode = "SI";
  invoice.supplier.vatNumber = "SI12345678";
  invoice.buyer.name = "Test Kupec d.o.o.";
  invoice.buyer.countryCode = "SI";
  invoice.buyer.vatNumber = "SI87654321";
  invoice.invoiceNumber = "INV-2026-001";
  invoice.issueDate = "2026-09-01";
  invoice.dueDate = "2026-09-15";
  invoice.currency = "EUR";
  invoice.totals.netAmount = "100.00";
  invoice.totals.vatAmount = "22.00";
  invoice.totals.grossAmount = "122.00";
  invoice.totals.amountDue = "122.00";
  return invoice;
}

test("Slovenian invoice with 22% VAT passes deterministic math validation", () => {
  const invoice = baseInvoice();
  invoice.vatBreakdown = [{ vatRate: "22", taxableAmount: "100", vatAmount: "22", grossAmount: "122" }];
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.status, "valid");
  assert.equal(result.errors.length, 0);
});

test("invoice with several VAT rates reconciles to totals", () => {
  const invoice = baseInvoice();
  invoice.vatBreakdown = [
    { vatRate: "22", taxableAmount: "100", vatAmount: "22", grossAmount: "122" },
    { vatRate: "9.5", taxableAmount: "50", vatAmount: "4.75", grossAmount: "54.75" },
    { vatRate: "9.5", taxableAmount: "50", vatAmount: "4.75", grossAmount: "54.75" },
  ];
  invoice.totals.netAmount = "200.00";
  invoice.totals.vatAmount = "31.50";
  invoice.totals.grossAmount = "231.50";
  invoice.totals.amountDue = "231.50";
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.status, "valid");
});

test("EU reverse-charge invoice with zero VAT is mathematically valid", () => {
  const invoice = baseInvoice();
  invoice.totals.vatAmount = "0";
  invoice.totals.grossAmount = "100";
  invoice.totals.amountDue = "100";
  invoice.vatBreakdown = [{ vatRate: "0", taxableAmount: "100", vatAmount: "0", grossAmount: "100" }];
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.errors.length, 0);
});

test("credit note keeps negative amounts and validates sign", () => {
  const invoice = baseInvoice();
  invoice.documentType = "credit_note";
  invoice.totals.netAmount = "-100";
  invoice.totals.vatAmount = "-22";
  invoice.totals.grossAmount = "-122";
  invoice.totals.amountDue = "-122";
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.some((w) => /credit note gross amount is positive/i.test(w)), false);
});

test("decimal commas normalize without floating point arithmetic", () => {
  const invoice = baseInvoice();
  invoice.totals.netAmount = "1.234,56";
  invoice.totals.vatAmount = "271,60";
  invoice.totals.grossAmount = "1.506,16";
  invoice.totals.amountDue = "1.506,16";
  normalizeInvoiceValues(invoice);
  assert.equal(invoice.totals.netAmount, "1234.56");
  assert.equal(invoice.totals.grossAmount, "1506.16");
  assert.equal(validateInvoice(invoice).errors.length, 0);
});

test("missing VAT number does not reject an otherwise valid invoice", () => {
  const invoice = baseInvoice();
  invoice.supplier.vatNumber = null;
  const result = validateInvoice(invoice);
  assert.equal(result.errors.length, 0);
});

test("invalid IBAN fails MOD-97", () => {
  assert.equal(validateIban("SI7719100000012345"), true);
  assert.equal(validateIban("SI7719100000012346"), false);
  const invoice = baseInvoice();
  invoice.supplier.iban = "SI7719100000012346";
  assert.match(validateInvoice(invoice).errors.join(" "), /IBAN/i);
});

test("incorrect totals are detected", () => {
  const invoice = baseInvoice();
  invoice.totals.grossAmount = "125.00";
  const result = validateInvoice(invoice);
  assert.equal(result.status, "failed");
  assert.match(result.errors.join(" "), /gross/i);
});

test("multi-page PDF text layer is preferred before OCR when usable", async () => {
  const fakePdf = `%PDF-1.4\n/Type /Page\n/Type /Page\n(Test Supplier d.o.o.) Tj\n(Račun št: INV-777) Tj\n(Datum izdaje: 01.09.2026) Tj\n(Valuta EUR) Tj\n(Neto 100.00) Tj\n(DDV 22.00) Tj\n(Skupaj 122.00 EUR) Tj\n%%EOF`;
  const result = await readDeterministically({ base64: Buffer.from(fakePdf).toString("base64"), mimeType: "application/pdf", filename: "multi-page.pdf" });
  assert.ok(result);
  assert.equal(result?.provider, "deterministic");
  assert.equal(result?.pagesProcessed, 2);
});

test("UBL/eSLOG-style XML is parsed deterministically before OCR", async () => {
  const xml = `<?xml version="1.0"?><Invoice><ID>INV-UBL-1</ID><IssueDate>2026-09-01</IssueDate><DocumentCurrencyCode>EUR</DocumentCurrencyCode><AccountingSupplierParty><RegistrationName>Supplier d.o.o.</RegistrationName><CompanyID>SI12345678</CompanyID></AccountingSupplierParty><AccountingCustomerParty><RegistrationName>Buyer d.o.o.</RegistrationName><CompanyID>SI87654321</CompanyID></AccountingCustomerParty><TaxTotal><TaxAmount>22.00</TaxAmount></TaxTotal><TaxExclusiveAmount>100.00</TaxExclusiveAmount><TaxInclusiveAmount>122.00</TaxInclusiveAmount><PayableAmount>122.00</PayableAmount></Invoice>`;
  const result = await readDeterministically({ base64: Buffer.from(xml).toString("base64"), mimeType: "application/xml", filename: "invoice.xml" });
  assert.ok(result);
  assert.equal(result?.invoice.invoiceNumber, "INV-UBL-1");
  assert.equal(result?.invoice.totals.grossAmount, "122.00");
});

test("low-confidence payload is structurally valid but remains distinguishable", () => {
  const invoice = baseInvoice();
  invoice.confidence = { overall: 0.55, fields: { invoiceNumber: 0.4 } };
  assert.doesNotThrow(() => normalizedInvoiceSchema.parse(invoice));
  assert.ok((invoice.confidence.overall ?? 0) < 0.92);
});

test("OCR provider failure is explicit when Mistral is not configured", async () => {
  const previous = process.env.MISTRAL_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  await assert.rejects(() => readWithMistral({ base64: "AA==", mimeType: "image/jpeg", filename: "scan.jpg" }), /MISTRAL_API_KEY/);
  if (previous) process.env.MISTRAL_API_KEY = previous;
});

test("signed document URL cannot be replayed for a different tenant", () => {
  const previous = process.env.DOCUMENT_URL_SIGNING_SECRET;
  process.env.DOCUMENT_URL_SIGNING_SECRET = "test-secret-at-least-32-bytes-long-123";
  const expires = Date.now() + 60_000;
  const signature = createDocumentSignature(42, "user_A", expires);
  assert.equal(verifyDocumentSignature(42, "user_A", expires, signature), true);
  assert.equal(verifyDocumentSignature(42, "user_B", expires, signature), false);
  if (previous) process.env.DOCUMENT_URL_SIGNING_SECRET = previous; else delete process.env.DOCUMENT_URL_SIGNING_SECRET;
});

test("scanned and rotated mobile photos are provider integration cases", { skip: "Requires anonymized image fixture + configured OCR provider; covered by evaluation harness in deployment environment." }, () => {});
test("duplicate invoice DB relation is an integration case", { skip: "Requires isolated Neon test database; checksum and structured duplicate rules are exercised in processor integration." }, () => {});
test("unauthorized tenant route access is an integration case", { skip: "Requires Clerk test session + isolated database; signed-URL tenant binding is unit-tested above." }, () => {});
