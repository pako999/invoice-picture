import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { reconcileReceiptTotals } from "../lib/invoice-intelligence/receipt-totals";
import { reconcileMistralInvoiceWithOcrText } from "../lib/invoice-intelligence/providers";
import { validateInvoice } from "../lib/invoice-intelligence/validation";

const receipt = `RACUN:36-02-144236
1 Filet-o-Fish Vel.M. A 5.90
1 Ketchup 0.40
OLT Skupaj(z DDV) 6.30
EURO 102.00
Change 95.70
DDV% ZNESEK DDV
DDV: 9.50% 5.75 0.55
DDV Skupaj: 0.55`;
function wrong() {
  const invoice = emptyInvoice();
  invoice.documentType = "receipt";
  Object.assign(invoice.totals, { netAmount: "6.30", vatAmount: "0.60", grossAmount: "6.90", amountPaid: "6.30", amountDue: "0.60" });
  return invoice;
}
test("real cash receipt: gross is not net, tender minus change proves no debt", () => {
  const invoice = reconcileMistralInvoiceWithOcrText(wrong(), receipt);
  assert.deepEqual([invoice.totals.netAmount, invoice.totals.vatAmount, invoice.totals.grossAmount, invoice.totals.amountPaid, invoice.totals.amountDue], ["5.75", "0.55", "6.30", "6.30", "0.00"]);
  assert.equal(invoice.vatBreakdown[0].taxableAmount, "5.75");
  assert.notEqual(validateInvoice(invoice).status, "valid");
  const saved = JSON.stringify(invoice);
  reconcileReceiptTotals(invoice, receipt);
  assert.equal(JSON.stringify(invoice), saved);
});
test("comma decimals and markdown emphasis", () => {
  const invoice = reconcileReceiptTotals(wrong(), receipt.replaceAll(".", ",").replace("Skupaj(z DDV)", "**Skupaj (z DDV)**"));
  assert.equal(invoice.totals.amountDue, "0.00");
});
test("missing or inconsistent cash evidence never invents zero balance", () => {
  for (const text of [receipt.replace("Change 95.70", ""), receipt.replace("95.70", "95.00"), receipt + "\nEURO 102.00"]) {
    assert.equal(reconcileReceiptTotals(wrong(), text).totals.amountDue, null);
  }
});
test("conflicting printed VAT evidence does not override existing extraction", () => {
  const invoice = wrong();
  const saved = JSON.stringify(invoice);
  reconcileReceiptTotals(invoice, receipt.replace("5.75", "5.70"));
  assert.equal(JSON.stringify(invoice), saved);
});
test("invoices and explicit balances are not treated as cash receipts", () => {
  const invoice = wrong();
  invoice.documentType = "invoice";
  reconcileReceiptTotals(invoice, receipt);
  assert.equal(invoice.totals.grossAmount, "6.90");
  assert.equal(reconcileReceiptTotals(wrong(), receipt + "\nZa plačilo 0.60").totals.amountDue, "0.60");
});
test("multiple printed VAT rows must sum to the gross total", () => {
  const text = receipt.replace("6.30", "3.42").replace("95.70", "98.58").replace("DDV: 9.50% 5.75 0.55", "DDV: 10.00% 2.00 0.20\nDDV: 22.00% 1.00 0.22").replace("DDV Skupaj: 0.55", "DDV Skupaj: 0.42");
  assert.equal(reconcileReceiptTotals(wrong(), text).vatBreakdown.length, 2);
});
test("printed tax-inclusive line prices are retained without fabricated net tax allocation", () => {
  const invoice = wrong();
  invoice.lineItems = [{ productCode: null, description: "Ketchup", quantity: "1", unit: null, unitPriceBeforeDiscount: "0.40", unitPriceNet: "0.40", discountPercent: null, discountAmount: null, vatRate: "9.50", netAmount: "0.40", vatAmount: "0.04", grossAmount: "0.44" }];
  reconcileReceiptTotals(invoice, receipt);
  assert.equal(invoice.lineItems[0].grossAmount, "0.40");
  assert.equal(invoice.lineItems[0].netAmount, null);
  assert.equal(invoice.lineItems[0].vatAmount, null);
});
