import test from "node:test";
import assert from "node:assert/strict";
import { beginInvoiceTrace, traceInvoiceStage, traceInvoiceSync, tracedMistralFetch, tracedMistralJson } from "../lib/invoice-intelligence/trace";
import { startClientInvoiceTrace, bindClientInvoiceTrace, finishClientInvoiceTraces } from "../lib/client-invoice-trace";
import type { FlowSnapshot } from "../lib/invoice-processing-flow";

function harness(enabled: boolean) {
  const savedFlag = process.env.INVOICE_OCR_TRACE, savedInfo = console.info, savedFetch = globalThis.fetch;
  process.env.INVOICE_OCR_TRACE = enabled ? "1" : "0";
  const records: any[] = [];
  console.info = (line: string) => records.push(JSON.parse(line));
  return { records, restore() {
    if (savedFlag === undefined) delete process.env.INVOICE_OCR_TRACE;
    else process.env.INVOICE_OCR_TRACE = savedFlag;
    console.info = savedInfo; globalThis.fetch = savedFetch;
  } };
}

test("disabled tracing preserves fetch arguments, response and parse without logging or retrying", async () => {
  const h = harness(false);
  try {
    const init = { method: "POST", body: "private-document", headers: { Authorization: "Bearer private-key" }, signal: AbortSignal.timeout(5000) };
    const expected = Response.json({ pages: [1] }); let calls = 0;
    globalThis.fetch = async (url, options) => { calls++; assert.equal(url, "https://api.mistral.ai/v1/ocr"); assert.equal(options, init); return expected; };
    const response = await tracedMistralFetch("https://api.mistral.ai/v1/ocr", init, 123, { operation: "test" });
    assert.equal(response, expected);
    assert.deepEqual(await tracedMistralJson(response), { pages: [1] });
    assert.equal(calls, 1); assert.deepEqual(h.records, []);
  } finally { h.restore(); }
});

test("TTFB and total are distinct, body is consumed once, and secrets/content are absent", async () => {
  const h = harness(true);
  try {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const response = new Response(new ReadableStream<Uint8Array>({ start(c) { controller = c; } }));
    let calls = 0;
    globalThis.fetch = async () => { calls++; return response; };
    const actual = await tracedMistralFetch("https://api.mistral.ai/v1/ocr", { headers: { Authorization: "Bearer secret-value" }, body: "invoice-private-content" }, 83720, { operation: "annotated_ocr" });
    assert.deepEqual(h.records.map(r => r.stage), ["ocr_ttfb"]);
    assert.equal(response.bodyUsed, false);
    const reading = tracedMistralJson(actual);
    controller.enqueue(new TextEncoder().encode('{"pages":[]}')); controller.close();
    assert.deepEqual(await reading, { pages: [] });
    assert.deepEqual(h.records.map(r => r.stage), ["ocr_ttfb", "ocr_total"]);
    assert.equal(calls, 1); assert.equal(response.bodyUsed, true);
    for (const row of h.records) {
      assert.deepEqual(Object.keys(row).sort(), ["input_bytes", "ms", "notes", "stage"]);
      assert.equal(row.input_bytes, 83720); assert.ok(row.ms >= 0);
    }
    assert.doesNotMatch(JSON.stringify(h.records), /secret-value|invoice-private-content|Authorization/);
  } finally { h.restore(); }
});

test("network/JSON errors keep their original identity and caller handling", async () => {
  const h = harness(true);
  try {
    const expected = new Error("secret error message"); let calls = 0;
    globalThis.fetch = async () => { calls++; throw expected; };
    await assert.rejects(tracedMistralFetch("https://api.mistral.ai/v1/ocr", {}, null, { operation: "test" }), e => e === expected);
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response("invalid JSON");
    const response = await tracedMistralFetch("https://api.mistral.ai/v1/ocr", {}, 1, { operation: "test" });
    assert.deepEqual(await tracedMistralJson(response).catch(() => ({})), {});
    assert.equal(h.records.at(-1).notes.outcome, "body_error");
    assert.doesNotMatch(JSON.stringify(h.records), /secret error message/);
  } finally { h.restore(); }
});

test("stage wrappers preserve results and errors; repeated finish and failing loggers are harmless", async () => {
  const h = harness(true);
  try {
    const value = {};
    assert.equal(await traceInvoiceStage("file_read", 1, {}, async () => value), value);
    assert.equal(traceInvoiceSync("parse", 1, {}, () => value), value);
    const expected = new Error("failure");
    assert.throws(() => traceInvoiceSync("preprocess", null, {}, () => { throw expected; }), e => e === expected);
    const finish = beginInvoiceTrace("db_write", 1, {}); finish(); finish();
    assert.equal(h.records.filter(r => r.stage === "db_write").length, 1);
    console.info = () => { throw new Error("logger unavailable"); };
    assert.equal(await traceInvoiceStage("upload", 1, {}, async () => value), value);
  } finally { h.restore(); }
});

test("browser end-to-end ends once at the first observed usable result and never logs a filename", () => {
  const h = harness(false), savedFlag = process.env.NEXT_PUBLIC_INVOICE_OCR_TRACE;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  process.env.NEXT_PUBLIC_INVOICE_OCR_TRACE = "1";
  try {
    startClientInvoiceTrace("private-invoice-filename.pdf", 83720);
    bindClientInvoiceTrace("private-invoice-filename.pdf", { documentId: 231 });
    const snapshot = { invoices: [], documents: [{ id: 231, status: "processing" }], batches: [], groups: [] } as unknown as FlowSnapshot;
    finishClientInvoiceTraces(snapshot); assert.equal(h.records.length, 0);
    snapshot.documents[0].status = "needs_review";
    finishClientInvoiceTraces(snapshot); finishClientInvoiceTraces(snapshot);
    assert.equal(h.records.length, 1);
    assert.equal(h.records[0].stage, "end_to_end");
    assert.equal(h.records[0].notes.document_id, 231);
    assert.equal(h.records[0].notes.outcome, "usable_result");
    assert.doesNotMatch(JSON.stringify(h.records), /private-invoice-filename/);
    startClientInvoiceTrace("private-package.pdf", 123456);
    bindClientInvoiceTrace("private-package.pdf", { bulkJobId: 42 });
    const bulkSnapshot = { invoices: [], groups: [], batches: [{ id: 42, stage: "extract" }], documents: [
      { id: 300, bulkJobId: 42, status: "processing" },
      { id: 301, bulkJobId: 42, status: "needs_review" },
    ] } as unknown as FlowSnapshot;
    finishClientInvoiceTraces(bulkSnapshot);
    assert.equal(h.records.length, 2);
    assert.equal(h.records[1].notes.document_id, 301);
    assert.equal(h.records[1].notes.outcome, "usable_result");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
    if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_INVOICE_OCR_TRACE;
    else process.env.NEXT_PUBLIC_INVOICE_OCR_TRACE = savedFlag;
    h.restore();
  }
});
