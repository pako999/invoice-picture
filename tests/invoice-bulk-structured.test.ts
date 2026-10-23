import test from "node:test";
import assert from "node:assert/strict";
import { extractBulkInvoice, pollMistralInvoiceExtractionBatch } from "../lib/bulk-invoices/service";
import { emptyInvoice, normalizedInvoiceSchema } from "../lib/invoice-intelligence/types";
import { estimateChatCost } from "../lib/invoice-intelligence/provider-usage";

const model = "mistral-small-2603";
const usage = { prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100 };

function invoiceContent() {
  const invoice = emptyInvoice();
  invoice.invoiceNumber = "BULK-7";
  invoice.supplier.name = "Test supplier";
  invoice.currency = "EUR";
  invoice.totals.netAmount = "49.96";
  invoice.totals.vatAmount = "10.99";
  invoice.totals.grossAmount = "60.95";
  return invoice;
}

function completion(content: unknown) {
  return { model, usage, choices: [{ message: { content: JSON.stringify(content) } }] };
}

async function withMistralMock(fetch: typeof globalThis.fetch, operation: () => Promise<void>) {
  const previousFetch = globalThis.fetch;
  const key = process.env.MISTRAL_API_KEY;
  const benchmark = process.env.INVOICE_PROVIDER_BENCHMARK;
  globalThis.fetch = fetch;
  process.env.MISTRAL_API_KEY = "test-only";
  process.env.INVOICE_PROVIDER_BENCHMARK = "1";
  try { await operation(); }
  finally {
    globalThis.fetch = previousFetch;
    if (key === undefined) delete process.env.MISTRAL_API_KEY; else process.env.MISTRAL_API_KEY = key;
    if (benchmark === undefined) delete process.env.INVOICE_PROVIDER_BENCHMARK; else process.env.INVOICE_PROVIDER_BENCHMARK = benchmark;
  }
}

function assertInvoiceResult(result: Awaited<ReturnType<typeof extractBulkInvoice>>, batch: boolean) {
  assert.equal(result.invoice.invoiceNumber, "BULK-7");
  assert.equal(result.invoice.supplier.name, "Test supplier");
  assert.equal(result.invoice.totals.netAmount, "49.96");
  assert.equal(result.invoice.totals.vatAmount, "10.99");
  assert.equal(result.invoice.totals.grossAmount, "60.95");
  assert.equal("_provider" in result.invoice, false);
  assert.doesNotThrow(() => normalizedInvoiceSchema.parse(result.invoice));
  assert.equal(result.model, model);
  assert.equal(result.costMicros, estimateChatCost(model, usage, batch));
  const raw = result.raw as Record<string, any>;
  assert.equal(raw._provider.model, model);
  assert.deepEqual(raw._provider.usage, usage);
}

test("real-time bulk extraction separates provider accounting from the strict invoice", async () => {
  let calls = 0;
  await withMistralMock(async () => { calls++; return Response.json(completion(invoiceContent())); }, async () => {
    const result = await extractBulkInvoice("", 0.9);
    assertInvoiceResult(result, false);
    assert.equal(result.invoice.confidence.overall, 0.9);
    assert.equal(calls, 1);
  });
});

for (const output of ["inline", "file"] as const) {
  test(`completed ${output} batch extraction separates metadata without resubmitting`, async () => {
    const record = { response: { status_code: 200, body: completion(invoiceContent()) } };
    const urls: string[] = [];
    await withMistralMock(async (url, init) => {
      urls.push(String(url));
      assert.equal(init?.method ?? "GET", "GET");
      if (String(url).endsWith("/content")) return new Response(JSON.stringify(record) + "\n");
      return Response.json({ status: "SUCCESS", ...(output === "inline" ? { outputs: [record] } : { output_file: "saved-result" }) });
    }, async () => {
      const state = await pollMistralInvoiceExtractionBatch({ batchId: "existing-batch", markdown: "", ocrConfidence: null });
      assert.equal(state.status, "SUCCESS");
      assert.equal(state.error, null);
      assert.ok(state.result);
      assertInvoiceResult(state.result, true);
      assert.equal(urls.length, output === "inline" ? 1 : 2);
      assert.match(urls[0], /\/batch\/jobs\/existing-batch\?inline=true$/);
    });
  });
}

for (const position of ["root", "nested"] as const) {
  test(`bulk extraction still rejects unknown ${position} invoice fields`, async () => {
    const invoice = invoiceContent();
    const invalid = position === "root" ? { ...invoice, unexpectedInvoiceField: true }
      : { ...invoice, supplier: { ...invoice.supplier, unexpectedInvoiceField: true } };
    let calls = 0;
    await withMistralMock(async () => { calls++; return Response.json(completion(invalid)); }, async () => {
      await assert.rejects(() => extractBulkInvoice("", null), /unexpectedInvoiceField/);
      assert.equal(calls, 1);
    });
  });
}
