import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "../lib/invoice-intelligence/validation";
import { parseInvoiceTextDeterministically, readDeterministically } from "../lib/invoice-intelligence/providers";

test("Slovenian OCR fallback reads a plain Datum label and infers EUR", () => {
  const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(`
    SURFSHOP Amdor d.o.o.
    ID za DDV: SI79907962
    TRR: SI56 1010 0004 6516 054
    1000 Ljubljana, Slovenija
    Račun št.: 1719-FAKT1-197
    Datum: 29.07.2026
    Skupaj: 719,39
  `));

  assert.equal(invoice.issueDate, "2026-07-29");
  assert.equal(invoice.currency, "EUR");
});

test("Slovenian OCR markdown fallback removes formatting and extracts product rows", () => {
  const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(`
**SURFSHOP**
**Amodor d.o.o.**
**ID za DDV:** SI79907962
**TRR:** SI56 1010 0004 6516 054
1000 Ljubljana, Slovenija

**Račun št.:1719-FAKT1-251**
**Datum:** 16.09.2026
**Datum valute:** 16.09.2026
**Sklic:** 2512026

| Zap. | Šifra | Opis blaga oz. opravljene storitve | Količina | EM | Cena | Rabat | Cena brez DDV | DDV | Vr. brez DDV |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1. | 1301260014 | GA TEAM CARBON SDM 32cm | 1,000 | Kos | 154,918 | 35% | 100,6967 | 22,0 | 100,70 |
| 2. | TRANSPORT | Transport | 1,000 | Kos | 34,00 | 0% | 34,00 | 22,0 | 34,00 |
  `));

  assert.equal(invoice.supplier.name, "Amodor d.o.o.");
  assert.equal(invoice.issueDate, "2026-09-16");
  assert.equal(invoice.lineItems.length, 2);
  assert.equal(invoice.lineItems[0].description, "1301260014 – GA TEAM CARBON SDM 32cm");
  assert.equal(invoice.lineItems[0].quantity, "1.000");
  assert.equal(invoice.lineItems[0].unitPriceNet, "154.918");
  assert.equal(invoice.lineItems[0].discountPercent, "35");
  assert.equal(invoice.lineItems[0].vatRate, "22.0");
  assert.equal(invoice.lineItems[0].netAmount, "100.70");
});

test("English invoice labels are not confused with logos, page markers or city names", () => {
  const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(`
--- PAGE 1 ---
# Invoice
tailscale
Invoice number  QTJE1DQO-0006
Date of issue  July 1, 2026
Date due  July 1, 2026

Tailscale US Inc.
447 Sutter St
San Francisco, California 94108
United States

$5.00 USD due July 1, 2026
  `));

  assert.equal(invoice.invoiceNumber, "QTJE1DQO-0006");
  assert.equal(invoice.issueDate, "2026-07-01");
  assert.equal(invoice.dueDate, "2026-07-01");
  assert.equal(invoice.supplier.name, "Tailscale US Inc.");
  assert.equal(invoice.supplier.vatNumber, null);
});

test("line-item percentage discount reconciles with net amount", () => {
  const invoice = emptyInvoice();
  invoice.documentType = "invoice";
  invoice.supplier.name = "Dobavitelj d.o.o.";
  invoice.invoiceNumber = "INV-DISCOUNT-1";
  invoice.issueDate = "2026-09-07";
  invoice.currency = "EUR";
  invoice.lineItems = [{
    description: "Storitev",
    quantity: "2",
    unit: "kos",
    unitPriceNet: "50",
    discountPercent: "10",
    discountAmount: "10",
    vatRate: "22",
    netAmount: "90",
    vatAmount: "19.80",
    grossAmount: "109.80",
  }];
  invoice.totals.netAmount = "90";
  invoice.totals.vatAmount = "19.80";
  invoice.totals.grossAmount = "109.80";
  invoice.totals.amountDue = "109.80";
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.some((w) => /discount/i.test(w)), false);
});

test("incorrect line-item discount is flagged for review", () => {
  const invoice = emptyInvoice();
  invoice.documentType = "invoice";
  invoice.supplier.name = "Dobavitelj d.o.o.";
  invoice.invoiceNumber = "INV-DISCOUNT-2";
  invoice.issueDate = "2026-09-07";
  invoice.currency = "EUR";
  invoice.lineItems = [{
    description: "Storitev",
    quantity: "2",
    unit: "kos",
    unitPriceNet: "50",
    discountPercent: "10",
    discountAmount: "5",
    vatRate: "22",
    netAmount: "95",
    vatAmount: "20.90",
    grossAmount: "115.90",
  }];
  invoice.totals.netAmount = "95";
  invoice.totals.vatAmount = "20.90";
  invoice.totals.grossAmount = "115.90";
  const result = validateInvoice(normalizeInvoiceValues(invoice));
  assert.equal(result.status, "needs_review");
  assert.equal(result.warnings.some((w) => /discount amount/i.test(w)), true);
});

test("Factur-X/ZUGFeRD embedded CrossIndustryInvoice XML is preferred before OCR", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument><ram:ID>FX-2026-001</ram:ID><ram:IssueDateTime><udt:DateTimeString format="102">20260907</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Factur X Supplier GmbH</ram:Name><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">DE123456789</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Test Buyer d.o.o.</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>100.00</ram:LineTotalAmount><ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="EUR">22.00</ram:TaxTotalAmount><ram:GrandTotalAmount>122.00</ram:GrandTotalAmount><ram:DuePayableAmount>122.00</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
  const compressed = deflateSync(Buffer.from(xml, "utf8"));
  const prefix = Buffer.from(`%PDF-1.7\n1 0 obj\n<< /Type /EmbeddedFile /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`, "latin1");
  const suffix = Buffer.from("\nendstream\nendobj\n/Type /Page\n%%EOF", "latin1");
  const pdf = Buffer.concat([prefix, compressed, suffix]);

  const result = await readDeterministically({ base64: pdf.toString("base64"), mimeType: "application/pdf", filename: "factur-x.pdf" });
  assert.ok(result);
  assert.equal(result?.model, "hybrid-pdf-xml-v1");
  assert.equal(result?.invoice.invoiceNumber, "FX-2026-001");
  assert.equal(result?.invoice.currency, "EUR");
  assert.equal(result?.invoice.totals.grossAmount, "122.00");
  assert.equal(result?.costMicros, 0);
});
