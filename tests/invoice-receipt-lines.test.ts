import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { reconcileMistralInvoiceWithOcrText } from "../lib/invoice-intelligence/providers";
import { assertReceiptLineAmountsForExport, reconcileVatInclusiveReceiptLines } from "../lib/invoice-intelligence/receipt-lines";
import { generateEslog20Xml, generateUbl21Xml, buildInvoiceApiPayload } from "../lib/invoice-intelligence/delivery-format";
import { validateInvoice } from "../lib/invoice-intelligence/validation";

// The regression is the OCR layout: item name, tax code and price on separate
// lines; a two-unit item; and a VAT summary whose totals were already correct.
const printed = `Račun TEST-RECEIPT
1 KO
Akumulatorska kosiln
B*
45,99
1 KO
WC Net Energy
B
5,89
1 KO
Komplet ekspanderjev
B
6,49
2 KO a
Rokavicepoliamidne
1,29 B*
2,58
Končna vsota v EUR
60,95
VISA
60,95
Končna vsota vsebuje DDV
22,00 % DDV
B 49,96
10,99`;

function wrongReceipt() {
  const invoice = emptyInvoice();
  invoice.documentType = "receipt";
  invoice.invoiceNumber = "TEST-RECEIPT";
  invoice.issueDate = "2026-05-20";
  invoice.supplier.name = "Test supplier";
  invoice.currency = "EUR";
  Object.assign(invoice.totals, { netAmount: "49.96", vatAmount: "10.99", grossAmount: "60.95", amountPaid: "60.95", amountDue: "0" });
  invoice.vatBreakdown = [{ vatRate: "22", taxableAmount: "49.96", vatAmount: "10.99", grossAmount: "60.95" }];
  const descriptions = ["Akumulatorska kosiln", "WC Net Energy", "Komplet ekspanderjev", "Rokavice poliamidne"];
  invoice.lineItems = ["45.99", "5.89", "6.49", "2.58"].map((amount, index) => ({
    productCode: null, description: descriptions[index], quantity: index === 3 ? "2" : "1", unit: "KO",
    unitPriceBeforeDiscount: index === 3 ? "1.29" : amount, unitPriceNet: index === 3 ? "1.29" : amount,
    discountPercent: "0", discountAmount: "0", vatRate: "22", netAmount: amount,
    vatAmount: ["10.12", "1.30", "1.43", "0.57"][index], grossAmount: ["56.11", "7.19", "7.92", "3.15"][index],
  }));
  return invoice;
}

test("split-line retail receipt: printed gross prices replace double VAT, with exact summary agreement", () => {
  const invoice = reconcileMistralInvoiceWithOcrText(wrongReceipt(), printed);
  assert.deepEqual(invoice.lineItems.map(item => item.grossAmount), ["45.99", "5.89", "6.49", "2.58"]);
  assert.deepEqual(invoice.lineItems.map(item => item.netAmount), ["37.70", "4.83", "5.32", "2.11"]);
  assert.deepEqual(invoice.lineItems.map(item => item.vatAmount), ["8.29", "1.06", "1.17", "0.47"]);
  assert.equal(invoice.lineItems[3].unitPriceNet, "1.055");
  assert.ok(invoice.lineItems.every(item => item.unitPriceBeforeDiscount === null));
  assert.equal(invoice.totals.grossAmount, "60.95");
  assert.equal(invoice.totals.amountDue, "0");
  const validation = validateInvoice(invoice);
  assert.equal(validation.status, "needs_review");
  assert.equal(Object.keys(validation.differences).length, 0);
  const saved = JSON.stringify(invoice);
  reconcileMistralInvoiceWithOcrText(invoice, printed);
  assert.equal(JSON.stringify(invoice), saved);
});

test("already correct gross-only OCR can derive net and VAT without another model call", () => {
  const invoice = wrongReceipt();
  for (const item of invoice.lineItems) {
    item.grossAmount = item.netAmount;
    item.netAmount = item.vatAmount = item.unitPriceNet = item.unitPriceBeforeDiscount = null;
  }
  reconcileVatInclusiveReceiptLines(invoice, printed);
  assert.equal(invoice.lineItems[0].netAmount, "37.70");
  assert.equal(invoice.lineItems[0].grossAmount, "45.99");
});

test("eSLOG and UBL retain reconciled amounts and zero balance", () => {
  const invoice = reconcileVatInclusiveReceiptLines(wrongReceipt(), printed);
  const xml = generateEslog20Xml(invoice);
  const lines = [...xml.matchAll(/<G_SG26>([\s\S]*?)<\/G_SG26>/g)].map(hit => hit[1]);
  assert.equal(lines.length, 4);
  for (const [index, amount] of ["45.99", "5.89", "6.49", "2.58"].entries()) {
    assert.ok(lines[index].includes(`<D_5025>38</D_5025><D_5004>${amount}</D_5004>`));
  }
  assert.match(xml, /<D_5025>9<\/D_5025><D_5004>0<\/D_5004>/);
  assert.match(generateUbl21Xml(invoice), /LineExtensionAmount currencyID="EUR">37\.70/);
});

test("legacy double-VAT approvals cannot silently export to eSLOG, UBL or JSON", () => {
  const invoice = wrongReceipt();
  assert.throws(() => generateEslog20Xml(invoice), /DDV/);
  assert.throws(() => generateUbl21Xml(invoice), /DDV/);
  assert.throws(() => buildInvoiceApiPayload({ documentId: 1, companyId: null, sourceInvoiceId: null, invoice, source: { filename: "test.pdf", mimeType: "application/pdf", sha256: "test", base64: null } }), /DDV/);
});

for (const [name, mutate, text] of [
  ["missing printed line price", (_invoice: ReturnType<typeof wrongReceipt>) => {}, printed.replace("45,99", "")],
  ["absent inclusive statement", (_invoice: ReturnType<typeof wrongReceipt>) => {}, printed.replace("Končna vsota vsebuje DDV", "DDV")],
  ["conflicting printed VAT summary", (_invoice: ReturnType<typeof wrongReceipt>) => {}, printed.replace("49,96", "49,95")],
  ["duplicate descriptions", (invoice: ReturnType<typeof wrongReceipt>) => { invoice.lineItems[1].description = invoice.lineItems[0].description; }, printed],
  ["discounted prices", (invoice: ReturnType<typeof wrongReceipt>) => { invoice.lineItems[0].discountPercent = "10"; }, printed],
  ["document discount", (invoice: ReturnType<typeof wrongReceipt>) => { invoice.totals.discountAmount = "10"; }, printed],
  ["mixed VAT rates", (invoice: ReturnType<typeof wrongReceipt>) => { invoice.lineItems[0].vatRate = "9.5"; }, printed],
  ["ordinary net invoice", (invoice: ReturnType<typeof wrongReceipt>) => { invoice.documentType = "invoice"; }, printed],
] as const) {
  test(`${name}: leave extraction for review without guessing`, () => {
    const invoice = wrongReceipt();
    mutate(invoice);
    const saved = JSON.stringify(invoice);
    reconcileVatInclusiveReceiptLines(invoice, text);
    assert.equal(JSON.stringify(invoice), saved);
  });
}

test("rounding disagreement preserves printed gross but never distributes a tax residual", () => {
  const invoice = wrongReceipt();
  invoice.totals.netAmount = invoice.vatBreakdown[0].taxableAmount = "49.95";
  invoice.totals.vatAmount = invoice.vatBreakdown[0].vatAmount = "11.00";
  reconcileVatInclusiveReceiptLines(invoice, printed.replace("49,96", "49,95").replace("10,99", "11,00"));
  assert.equal(invoice.lineItems[0].grossAmount, "45.99");
  assert.ok(invoice.lineItems.every(item => item.netAmount === null && item.vatAmount === null));
  assert.throws(() => assertReceiptLineAmountsForExport(invoice), /DDV/);
});

test("valid net receipt prices are unchanged", () => {
  const invoice = reconcileVatInclusiveReceiptLines(wrongReceipt(), printed);
  invoice.warnings = [];
  const saved = JSON.stringify(invoice);
  reconcileVatInclusiveReceiptLines(invoice, printed);
  assert.equal(JSON.stringify(invoice), saved);
  assert.doesNotThrow(() => assertReceiptLineAmountsForExport(invoice));
});

test("a document allowance can explain line net sums and is not the double-VAT signature", () => {
  const invoice = wrongReceipt();
  invoice.totals.discountAmount = "10.99";
  assert.doesNotThrow(() => assertReceiptLineAmountsForExport(invoice));
});
