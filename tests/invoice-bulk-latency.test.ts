import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { useRealtimeBulkProcessing } from "../lib/bulk-invoices/processing-mode";
import { measureInvoiceStage } from "../lib/invoice-intelligence/timing";

function load(path: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports: Record<string, any> = {};
  new Function("require", "exports", ...Object.keys(globals), js)((name: string) => {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  }, exports, ...Object.values(globals));
  return exports;
}

test("small packages use real-time and bulk remains configurable, including batch-only rollback", () => {
  const saved = process.env.MISTRAL_BULK_REALTIME_MAX_PAGES;
  try {
    delete process.env.MISTRAL_BULK_REALTIME_MAX_PAGES;
    for (const count of [1, 25, 32, 50]) assert.equal(useRealtimeBulkProcessing(count), true);
    for (const count of [0, -1, 51, 500, NaN]) assert.equal(useRealtimeBulkProcessing(count), false);
    process.env.MISTRAL_BULK_REALTIME_MAX_PAGES = "0";
    assert.equal(useRealtimeBulkProcessing(1), false);
    process.env.MISTRAL_BULK_REALTIME_MAX_PAGES = "invalid";
    assert.equal(useRealtimeBulkProcessing(32), true);
  } finally {
    if (saved === undefined) delete process.env.MISTRAL_BULK_REALTIME_MAX_PAGES;
    else process.env.MISTRAL_BULK_REALTIME_MAX_PAGES = saved;
  }
});

function ocrRoute(job: Record<string, any>, overrides: Record<string, unknown> = {}) {
  const calls: string[] = [], inserts: number[] = [];
  const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.join("?");
    if (query.startsWith("SELECT")) return [job];
    if (query.includes('INSERT INTO "bulkInvoicePages"')) inserts.push(values[1]);
    if (query.includes('"ocrNextPage"=')) job.ocrNextPage = values[0];
    return [];
  };
  const mod = load("app/api/internal/bulk/ocr/route.ts", {
    "next/server": { NextResponse: Response },
    zod: { z: { object: () => ({ parse: (x: unknown) => x }), number: () => ({ int() { return this; }, positive() { return this; }, min() { return this; }, max() { return this; } }), string: () => ({ url() { return this; } }) } },
    "@/lib/bulk-invoices/config": { verifyBulkInternalSecret: () => true, BULK_OCR_BATCH_PAGES: 25 },
    "@/lib/bulk-invoices/processing-mode": { useRealtimeBulkProcessing: (count: number) => count <= 50 },
    "@/lib/invoice-intelligence/timing": { measureInvoiceStage },
    "@/lib/invoice-intelligence/quota": { OcrCommercialQuotaError: class extends Error {} },
    "@/lib/bulk-invoices/service": {
      bulkSql: () => sql,
      ocrBulkPages: async (args: any) => {
        calls.push("realtime");
        return { pages: Array.from({ length: Math.min(25, args.pageCount - args.startPage) }, (_, i) => ({ pageNumber: args.startPage + i, markdown: "text", confidence: 0.99 })) };
      },
      createMistralOcrBatch: async () => { calls.push("submit"); return { batchId: "batch-1", startPage: 0, pageCount: 25, createdAt: new Date(), status: "QUEUED" }; },
      pollMistralOcrBatch: async () => { calls.push("poll"); return { status: "RUNNING", pages: [] }; },
      releaseMistralOcrBatchReservation: async () => {},
      ...overrides,
    },
  });
  const invoke = () => mod.POST(new Request("https://app.example/ocr", { method: "POST", body: JSON.stringify({ jobId: 1, documentUrl: "https://storage.example/original.pdf", startPage: job.ocrNextPage ?? 0, batchPages: 25 }) }));
  return { invoke, calls, inserts };
}

test("32-page upload advances through original-PDF ranges without submitting batch jobs", async () => {
  const route = ocrRoute({ clerkUserId: "test", stage: "ocr", pageCount: 32, ocrNextPage: 0 });
  const first = await (await route.invoke()).json();
  assert.equal(first.nextPage, 25);
  assert.equal(first.done, false);
  const second = await (await route.invoke()).json();
  assert.equal(second.nextPage, 32);
  assert.equal(second.done, true);
  assert.deepEqual(route.calls, ["realtime", "realtime"]);
  assert.deepEqual(route.inserts, Array.from({ length: 32 }, (_, i) => i));
});

test("large uploads submit a batch and existing small batches are polled, never duplicated", async () => {
  const large = ocrRoute({ stage: "ocr", pageCount: 100 });
  assert.equal((await (await large.invoke()).json()).batch, true);
  assert.deepEqual(large.calls, ["submit"]);
  const existing = ocrRoute({ stage: "ocr", pageCount: 10, ocrBatchId: "existing", ocrBatchStartPage: 0, ocrBatchPageCount: 10 });
  assert.equal((await (await existing.invoke()).json()).status, "RUNNING");
  assert.deepEqual(existing.calls, ["poll"]);
});

test("provider terminal batch failures stop after three submissions instead of looping forever", async () => {
  const route = ocrRoute({ stage: "ocr", pageCount: 100, ocrBatchId: "failed", ocrBatchPageCount: 25, lastError: "[batch-failure:2] earlier failure" }, {
    pollMistralOcrBatch: async () => ({ status: "TIMEOUT_EXCEEDED", pages: [], error: "Provider expired the batch" }),
  });
  const result = await (await route.invoke()).json();
  assert.equal(result.success, false);
  assert.equal(result.retrying, false);
});

test("429 adapts to one page and releases only unprocessed reserved pages", async () => {
  const requested: number[][] = [], released: number[] = [];
  let now = 0;
  const service = load("lib/bulk-invoices/service.ts", {
    "@/lib/invoice-intelligence/extraction-prompt": {},
    "@neondatabase/serverless": {},
    "@/lib/invoice-intelligence/types": {},
    "@/lib/invoice-intelligence/validation": {},
    "@/lib/invoice-intelligence/providers": {},
    "@/lib/invoice-intelligence/timing": { measureInvoiceStage },
    "@/lib/invoice-intelligence/quota": { getOcrUsageSummary: async () => ({ dailyPageLimit: 100, dayPages: 0, remainingPages: 100 }) },
    "@/lib/invoice-intelligence/safety": {
      reserveOcrProviderBudget: async ({ pages }: any) => { assert.equal(pages, 25); return {}; },
      releaseUnusedOcrProviderBudget: async ({ pages }: any) => { released.push(pages); },
    },
  }, {
    process: { env: { MISTRAL_API_KEY: "test-only" } },
    fetch: async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      assert.equal(body.include_blocks, false);
      assert.equal(body.confidence_scores_granularity, "page");
      requested.push([...body.pages]);
      return requested.length === 1
        ? Response.json({ message: "page rate limit" }, { status: 429, headers: { "Retry-After": "2" } })
        : Response.json({ pages: [{ index: 0, markdown: "invoice", confidence_scores: { average_page_confidence_score: 0.98 } }] });
    },
    setTimeout: (callback: () => void, ms: number) => { now += ms; callback(); },
    Date: { now: () => now },
  });
  const result = await service.ocrBulkPages({ clerkUserId: "test", documentUrl: "https://storage.example/original.pdf", startPage: 0, batchPages: 25, pageCount: 32 });
  assert.deepEqual(requested.map(p => p.length), [25, 1]);
  assert.deepEqual(released, [24]);
  assert.equal(result.nextPage, 1);
  assert.equal(result.done, false);
  assert.equal(result.pages[0].confidence, 0.98);
  assert.equal(now, 2000);
});

test("structured retries share a time budget and yield before a long Retry-After", async () => {
  let now = 0, calls = 0;
  const timeouts: number[] = [], delays: number[] = [];
  const service = load("lib/bulk-invoices/service.ts", {
    "@/lib/invoice-intelligence/extraction-prompt": {}, "@neondatabase/serverless": {},
    "@/lib/invoice-intelligence/types": {}, "@/lib/invoice-intelligence/validation": {},
    "@/lib/invoice-intelligence/providers": {}, "@/lib/invoice-intelligence/quota": {},
    "@/lib/invoice-intelligence/safety": {}, "@/lib/invoice-intelligence/timing": { measureInvoiceStage },
  }, {
    process: { env: { MISTRAL_API_KEY: "test-only" } },
    Date: { now: () => now },
    AbortSignal: { timeout: (ms: number) => { timeouts.push(ms); return {}; } },
    setTimeout: (callback: () => void, ms: number) => { delays.push(ms); now += ms; callback(); },
    fetch: async () => { calls++; now += 70_000; return Response.json({ message: "unavailable" }, { status: 503, headers: { "Retry-After": "10" } }); },
  });
  // A classifier outage still gives conservative boundaries for manual review.
  const result = await service.classifyBulkPages({ pages: [{ pageNumber: 0, markdown: "Invoice 123" }] });
  assert.equal(result.length, 1);
  assert.equal(calls, 2);
  assert.deepEqual(timeouts, [90_000, 70_000]);
  assert.deepEqual(delays, [10_000]);
  assert.equal(now, 150_000);
});
