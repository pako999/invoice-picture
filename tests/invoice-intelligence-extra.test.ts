import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "../lib/invoice-intelligence/validation";

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
