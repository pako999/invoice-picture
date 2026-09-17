import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { generateEslog20Xml, generateUbl21Xml, isLikelyEslog20Xml, resolveXmlDelivery, validatePublicHttpsUrl } from "../lib/invoice-intelligence/delivery-format";

test("generates UBL 2.1 invoice XML from approved data", () => {
  const invoice = emptyInvoice();
  invoice.invoiceNumber = "R-2026-001";
  invoice.issueDate = "2026-09-07";
  invoice.dueDate = "2026-09-21";
  invoice.currency = "EUR";
  invoice.supplier.name = "Dobavitelj & Partner d.o.o.";
  invoice.supplier.vatNumber = "SI12345678";
  invoice.buyer.name = "Kupec d.o.o.";
  invoice.totals.netAmount = "100.00";
  invoice.totals.vatAmount = "22.00";
  invoice.totals.grossAmount = "122.00";
  invoice.totals.amountDue = "122.00";
  invoice.lineItems = [{ description: "Storitev", quantity: "1", unit: null, unitPriceNet: "100.00", discountPercent: null, discountAmount: null, vatRate: "22", netAmount: "100.00", vatAmount: "22.00", grossAmount: "122.00" }];

  const xml = generateUbl21Xml(invoice);
  assert.match(xml, /UBLVersionID>2\.1/);
  assert.match(xml, /R-2026-001/);
  assert.match(xml, /Dobavitelj &amp; Partner d\.o\.o\./);
  assert.match(xml, /TaxInclusiveAmount currencyID="EUR">122\.00/);
});

test("blocks unsafe/private API endpoints", () => {
  assert.throws(() => validatePublicHttpsUrl("http://example.com/api"), /HTTPS/);
  assert.throws(() => validatePublicHttpsUrl("https://127.0.0.1/api"), /Private network/);
  assert.throws(() => validatePublicHttpsUrl("https://10.0.0.2/api"), /Private network/);
  assert.throws(() => validatePublicHttpsUrl("https://localhost/api"), /Local/);
  assert.equal(validatePublicHttpsUrl("https://accounting.example.com/api"), "https://accounting.example.com/api");
});

test("generates eSLOG 2.0 from approved PDF/image data", () => {
  const invoice = emptyInvoice();
  invoice.invoiceNumber = "R-2026-002";
  invoice.issueDate = "2026-09-07";
  invoice.dueDate = "2026-09-21";
  invoice.currency = "EUR";
  invoice.supplier.name = "Dobavitelj d.o.o.";
  invoice.buyer.name = "Kupec d.o.o.";
  invoice.totals.netAmount = "100.00";
  invoice.totals.vatAmount = "22.00";
  invoice.totals.grossAmount = "122.00";
  invoice.totals.amountDue = "122.00";
  invoice.lineItems = [{ description: "Storitev", quantity: "1", unit: null, unitPriceNet: "100.00", discountPercent: null, discountAmount: null, vatRate: "22", netAmount: "100.00", vatAmount: "22.00", grossAmount: "122.00" }];
  invoice.vatBreakdown = [{ vatRate: "22", taxableAmount: "100.00", vatAmount: "22.00", grossAmount: "122.00" }];

  const result = resolveXmlDelivery({
    format: "eslog_2_0_original",
    invoice,
    originalBase64: Buffer.from("%PDF-1.7 fake invoice").toString("base64"),
    originalMimeType: "application/pdf",
    originalFilename: "invoice.pdf",
  });

  assert.equal(result.format, "eslog_2_0");
  assert.equal(result.fallback, false);
  assert.equal(result.requestedFormat, "eslog_2_0_original");
  assert.match(result.filename, /\.eslog\.xml$/);
  assert.match(result.xml, /xmlns="urn:eslog:2\.00"/);
  assert.match(result.xml, /<D_1004>R-2026-002<\/D_1004>/);
  assert.match(result.xml, /<D_0062>R-2026-002<\/D_0062>/);
  assert.equal(result.warning, null);
});

test("generated eSLOG escapes values and includes accounting totals", () => {
  const invoice = emptyInvoice();
  invoice.invoiceNumber = "491091473";
  invoice.issueDate = "2025-09-03";
  invoice.dueDate = "2025-09-10";
  invoice.currency = "EUR";
  invoice.supplier.name = "GENERAL & LOGISTICS d.o.o.";
  invoice.supplier.vatNumber = "SI74531891";
  invoice.supplier.iban = "SI56101000052763339";
  invoice.supplier.bic = "BAKOSI2X";
  invoice.buyer.name = "SPORT GROUP d.o.o.";
  invoice.buyer.vatNumber = "SI72133449";
  invoice.totals.netAmount = "464.80";
  invoice.totals.vatAmount = "102.26";
  invoice.totals.grossAmount = "567.06";
  invoice.totals.amountDue = "567.06";
  invoice.lineItems = [{ description: "Domači paket", quantity: "3", unit: null, unitPriceNet: "4.03", discountPercent: null, discountAmount: null, vatRate: "22", netAmount: "12.09", vatAmount: "2.66", grossAmount: "14.75" }];
  invoice.vatBreakdown = [{ vatRate: "22", taxableAmount: "464.80", vatAmount: "102.26", grossAmount: "567.06" }];

  const xml = generateEslog20Xml(invoice);
  assert.match(xml, /<D_1004>491091473<\/D_1004>/);
  assert.match(xml, /GENERAL &amp; LOGISTICS/);
  assert.match(xml, /<D_5025>9<\/D_5025><D_5004>567\.06<\/D_5004>/);
  assert.equal(isLikelyEslog20Xml(xml), true);
});

test("does not misclassify CII or generic INVOIC XML as eSLOG", () => {
  assert.equal(isLikelyEslog20Xml(`<?xml version="1.0"?><CrossIndustryInvoice><INVOIC>123</INVOIC></CrossIndustryInvoice>`), false);
  assert.equal(isLikelyEslog20Xml(`<?xml version="1.0"?><Invoice><INVOIC>123</INVOIC></Invoice>`), false);
});

test("forwards an original eSLOG 2.0 XML unchanged", () => {
  const invoice = emptyInvoice();
  const original = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:eslog:2.00" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="eSLOG20_INVOIC_v200.xsd">
  <M_INVOIC Id="data"><S_UNH><D_0065>INVOIC</D_0065></S_UNH></M_INVOIC>
</Invoice>`;
  assert.equal(isLikelyEslog20Xml(original), true);
  const result = resolveXmlDelivery({
    format: "eslog_2_0_original",
    invoice,
    originalBase64: Buffer.from(original).toString("base64"),
    originalMimeType: "application/xml",
    originalFilename: "eslog.xml",
  });
  assert.equal(result.xml, original);
  assert.equal(result.format, "eslog_2_0");
  assert.equal(result.fallback, false);
});
