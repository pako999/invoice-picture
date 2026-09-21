import test from "node:test";
import assert from "node:assert/strict";
import { classifyBulkPagesDeterministically } from "../lib/bulk-invoices/service";
import { parseInvoiceTextDeterministically } from "../lib/invoice-intelligence/providers";

test("bulk boundary fallback keeps multi-page documents together and separates receipts", () => {
  const rows = classifyBulkPagesDeterministically({
    pages: [
      { pageNumber: 0, markdown: "# Invoice\nInvoice number QTJE1DQO-0006\nPage 1 of 2" },
      { pageNumber: 1, markdown: "Banking information\nPage 2 of 2" },
      { pageNumber: 2, markdown: "# Receipt\nInvoice number QTJE1DQO-0006\nReceipt number 2176-7312\nPage 1 of 1" },
    ],
  });

  assert.deepEqual(rows.map((row) => row.startsNewInvoice), [true, false, true]);
  assert.equal(rows[2].invoiceNumber, "2176-7312");
});

test("bulk boundary fallback detects changed Slovenian invoice numbers", () => {
  const rows = classifyBulkPagesDeterministically({
    previousPage: { pageNumber: 8, markdown: "Račun št.:1719-FAKT1-161\nStran: 1" },
    pages: [
      { pageNumber: 9, markdown: "Št.računa\n2613613\nStran 1 / 3" },
      { pageNumber: 10, markdown: "Št.računa 2613613\nStran 2 / 3" },
      { pageNumber: 11, markdown: "Št.računa 2613613\nStran 3 / 3" },
      { pageNumber: 12, markdown: "Račun št. CLB-S1-1002838457\nStran 1 / 2" },
    ],
  });

  assert.deepEqual(rows.map((row) => row.startsNewInvoice), [true, false, false, true]);
  assert.equal(rows[0].invoiceNumber, "2613613");
  assert.equal(rows[3].invoiceNumber, "CLB-S1-1002838457");
});

test("bulk boundary fallback recognizes continuation pages with a simple page number", () => {
  const rows = classifyBulkPagesDeterministically({
    previousPage: { pageNumber: 28, markdown: "Predračun št.:81-2026\nStran: 1" },
    pages: [{ pageNumber: 29, markdown: "Postavke in zneski\nStran:\n2" }],
  });

  assert.equal(rows[0].startsNewInvoice, false);
  assert.match(rows[0].reason, /Explicit page 2/);
});

test("deterministic OCR extraction does not confuse headings with invoice numbers", () => {
  const invoice = parseInvoiceTextDeterministically([
    "--- PAGE 1 ---",
    "# Invoice",
    "tailscale",
    "Invoice number QTJE1DQO-0006",
    "## $5.00 USD due July 1, 2026",
  ].join("\n\n"));

  assert.equal(invoice.invoiceNumber, "QTJE1DQO-0006");
  assert.equal(invoice.supplier.name, "tailscale");
  assert.equal(invoice.totals.grossAmount, "5.00");
  assert.equal(invoice.totals.amountDue, "5.00");
});
