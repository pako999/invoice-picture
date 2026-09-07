import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { generateUbl21Xml, isLikelyEslog20Xml, resolveXmlDelivery, validatePublicHttpsUrl } from "../lib/invoice-intelligence/delivery-format";

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

test("does not fake eSLOG for OCR-derived data", () => {
  const invoice = emptyInvoice();
  invoice.invoiceNumber = "1";
  invoice.currency = "EUR";
  assert.throws(() => resolveXmlDelivery({
    format: "eslog_2_0_original",
    invoice,
    originalBase64: Buffer.from("not xml").toString("base64"),
    originalMimeType: "application/pdf",
    originalFilename: "invoice.pdf",
  }), /requires an original eSLOG 2\.0 XML/);
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
});
