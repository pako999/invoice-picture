import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { parseInvoiceTextDeterministically, readWithMistral, reconcileMistralInvoiceWithOcrText } from "../lib/invoice-intelligence/providers";
import { extractBulkInvoiceFromDocument } from "../lib/bulk-invoices/service";
import { normalizeInvoiceValues } from "../lib/invoice-intelligence/validation";

const table = `<table><tr><th>Opis</th><th>Količina</th><th>Cena brez DDV</th><th>DDV</th><th>Znesek DDV</th><th>Znesek z DDV</th></tr><tr><td>Storitev&nbsp;A</td><td>2</td><td>10,00</td><td>22</td><td>4,40</td><td>24,40</td></tr></table>`;

test("HTML OCR tables preserve the printed tax-inclusive line total", () => {
  const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(table));
  assert.equal(invoice.lineItems.length, 1);
  assert.equal(invoice.lineItems[0].description, "Storitev A");
  assert.equal(invoice.lineItems[0].unitPriceNet, "10.00");
  assert.equal(invoice.lineItems[0].grossAmount, "24.40");
  assert.equal(invoice.lineItems[0].vatAmount, "4.40");
});

test("VAT-inclusive unit prices are not mistaken for net prices or line totals", () => {
  const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(`| Opis | Količina | Cena z DDV | Znesek z DDV |\n| Storitev | 2 | 12,20 | 24,40 |`));
  assert.equal(invoice.lineItems[0].unitPriceNet, null);
  assert.equal(invoice.lineItems[0].unitPriceBeforeDiscount, null);
  assert.equal(invoice.lineItems[0].grossAmount, "24.40");
});

test("fallback fills missing gross amounts while retaining existing printed amounts", () => {
  const invoice = emptyInvoice();
  invoice.lineItems = parseInvoiceTextDeterministically(table).lineItems;
  invoice.lineItems[0].grossAmount = null;
  reconcileMistralInvoiceWithOcrText(invoice, table);
  assert.equal(invoice.lineItems[0].grossAmount, "24.40");
  invoice.lineItems[0].grossAmount = "24.39";
  reconcileMistralInvoiceWithOcrText(invoice, table);
  assert.equal(invoice.lineItems[0].grossAmount, "24.39");
});

test("merged HTML columns are left for structured extraction instead of shifting values", () => {
  assert.equal(parseInvoiceTextDeterministically(table.replace('<th>DDV</th>', '<th colspan="2">DDV</th>')).lineItems.length, 0);
});

test("direct and retry OCR both request HTML tables, blocks and tax-inclusive fields", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.MISTRAL_API_KEY;
  process.env.MISTRAL_API_KEY = "test-key";
  const requests: Record<string, any>[] = [];
  globalThis.fetch = async (_url, init) => {
    if (!init?.body) return new Response("%PDF-1.4\n%%EOF");
    requests.push(JSON.parse(String(init.body)));
    return Response.json({ document_annotation: JSON.stringify(emptyInvoice()), pages: [{ index: 0, markdown: "", tables: [{ content: table }] }], usage_info: { pages_processed: 1 } });
  };
  try {
    const direct = await readWithMistral({ base64: Buffer.from("%PDF-1.4\n%%EOF").toString("base64"), mimeType: "application/pdf", filename: "test.pdf" });
    const retry = await extractBulkInvoiceFromDocument("https://storage.example.com/test.pdf", null);
    assert.equal(direct.invoice.lineItems[0].grossAmount, "24.40");
    assert.equal(retry.invoice.lineItems[0].grossAmount, "24.40");
    assert.equal(requests.length, 2);
    for (const request of requests) {
      assert.equal(request.table_format, "html");
      assert.equal(request.include_blocks, true);
      // Direct OCR omits unused crops; bulk fallback keeps its existing payload.
      assert.equal(request.include_image_base64, request === requests[0] ? false : true);
      assert.match(request.document.document_url, /^data:application\/pdf;base64,/);
      assert.match(request.document_annotation_prompt, /grossAmount is the total for the entire quantity including VAT/);
    }
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.MISTRAL_API_KEY;
    else process.env.MISTRAL_API_KEY = oldKey;
  }
});

for (const label of ["Grand total", "Skupaj z DDV", "Total incl. VAT"]) {
  test(`paid invoice retains full ${label} separately from its zero balance`, () => {
    const invoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(`Amount due: 0.00 EUR\n${label}: 24.40 EUR`));
    assert.equal(invoice.totals.amountDue, "0.00");
    assert.equal(invoice.totals.grossAmount, "24.40");
  });
}

