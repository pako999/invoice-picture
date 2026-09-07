import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "../lib/invoice-intelligence/validation";
import { readDeterministically } from "../lib/invoice-intelligence/providers";

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
