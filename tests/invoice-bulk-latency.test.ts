import * as crypto from "node:crypto";
import * as providerErrors from "../lib/invoice-intelligence/provider-errors";
import * as mistralConfig from "../lib/invoice-intelligence/mistral-config";
import * as providerUsage from "../lib/invoice-intelligence/provider-usage";
import * as invoiceTrace from "../lib/invoice-intelligence/trace";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { useRealtimeBulkProcessing } from "../lib/bulk-invoices/processing-mode";
import { measureInvoiceStage } from "../lib/invoice-intelligence/timing";

function load(path: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  if (globals.fetch && modules["@/lib/invoice-intelligence/trace"]) {
    modules = { ...modules, "@/lib/invoice-intelligence/trace": load("lib/invoice-intelligence/trace.ts", {}, globals) };
  }
  if (path === "lib/bulk-invoices/failure.ts" || path === "lib/invoice-intelligence/trace.ts" || path === "lib/invoice-intelligence/mistral-http.ts") {
    // Dependencies for these isolated transport helpers are supplied explicitly.
  } else {
  const usage = { ...providerUsage, recordProviderUsage: async () => {}, withProviderContext: (_value: unknown, operation: () => unknown) => operation() };
  const tracer = globals.fetch ? load("lib/invoice-intelligence/trace.ts", {}, globals) : invoiceTrace;
  const http = path === "lib/bulk-invoices/service.ts" ? load("lib/invoice-intelligence/mistral-http.ts", {
    "./provider-usage": usage, "./provider-slots": { acquireMistralSlot: async () => async () => {} },
    "./provider-errors": providerErrors, "./trace": tracer,
  }, globals) : {};
  modules = { "node:crypto": crypto, "@/lib/invoice-intelligence/provider-errors": providerErrors,
    "@/lib/invoice-intelligence/mistral-config": mistralConfig,
    "@/lib/invoice-intelligence/provider-usage": usage,
    "@/lib/invoice-intelligence/mistral-http": http,
    "@/lib/bulk-invoices/failure": load("lib/bulk-invoices/failure.ts", { "@/lib/invoice-intelligence/provider-errors": providerErrors }),
    ...modules };
  }
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
    if (query.includes('INSERT INTO "bulkInvoicePages"')) inserts.push(...JSON.parse(values[1]).map((p:any)=>p.pageNumber));
    if (query.includes('"ocrNextPage"=')) job.ocrNextPage = values[0];
    if(query.includes('RETURNING "id"')) return [{id:1}];
    return [];
  };
  const mod = load("app/api/internal/bulk/ocr/route.ts", {
    "next/server": { NextResponse: Response },
    zod: { z: { object: () => ({ parse: (x: unknown) => x }), number: () => ({ int() { return this; }, positive() { return this; }, min() { return this; }, max() { return this; } }), string: () => ({ url() { return this; } }) } },
    "@/lib/bulk-invoices/config": { verifyBulkInternalSecret: () => true, BULK_OCR_BATCH_PAGES: 25 },
    "@/lib/bulk-invoices/processing-mode": { useRealtimeBulkProcessing: (count: number, bulk: boolean) => !bulk && count <= 50 },
    "@/lib/invoice-intelligence/timing": { measureInvoiceStage },
    "@/lib/invoice-intelligence/trace": invoiceTrace,
    "@/lib/invoice-intelligence/quota": { OcrCommercialQuotaError: class extends Error {} },
    "@/lib/bulk-invoices/service": {
      bulkSql: () => sql,
      ocrBulkPages: async (args: any) => {
        calls.push("realtime");
        return { pages: Array.from({ length: Math.min(args.batchPages, args.pageCount - args.startPage) }, (_, i) => ({ pageNumber: args.startPage + i, markdown: "text", confidence: 0.99 })) };
      },
      createMistralOcrBatch: async () => { calls.push("submit"); return { batchId: "batch-1", startPage: 0, pageCount: 25, createdAt: new Date(), status: "QUEUED" }; },
      pollMistralOcrBatch: async () => { calls.push("poll"); return { status: "RUNNING", pages: [] }; },
      releaseMistralOcrBatchReservation: async () => {},
      ...overrides,
    },
  });
  const invoke = () => mod.POST(new Request("https://app.example/ocr", { method: "POST", body: JSON.stringify({ jobId: 1, documentUrl: "https://storage.example/original.pdf", startPage: job.ocrNextPage ?? 0, batchPages: 500 }) }));
  return { invoke, calls, inserts };
}

test("32-page upload reads the original PDF once without submitting a provider batch", async () => {
  const route = ocrRoute({ clerkUserId: "test", stage: "ocr", pageCount: 32, ocrNextPage: 0 });
  const result = await (await route.invoke()).json();
  assert.equal(result.nextPage, 32);
  assert.equal(result.done, true);
  assert.deepEqual(route.calls, ["realtime"]);
  assert.deepEqual(route.inserts, Array.from({ length: 32 }, (_, i) => i));
});

test("large uploads submit a batch and existing small batches are polled, never duplicated", async () => {
  const large = ocrRoute({ stage: "ocr", pageCount: 100 });
  assert.equal((await (await large.invoke()).json()).batch, true);
  assert.deepEqual(large.calls, ["submit"]);
  const existing = ocrRoute({ stage: "ocr", pageCount: 10, ocrBatchId: "existing", ocrBatchStartPage: 0, ocrBatchPageCount: 10 });
  assert.equal((await (await existing.invoke()).json()).status, "RUNNING");
  assert.deepEqual(existing.calls, ["poll"]);
  const collection = ocrRoute({ stage:"ocr",pageCount:1,preferBatch:true });
  assert.equal((await (await collection.invoke()).json()).batch,true);
  assert.deepEqual(collection.calls,["submit"]);
});

test("terminal provider batch failure stops without submitting another paid job", async () => {
  let polls=0;
  const route = ocrRoute({ stage: "ocr", pageCount: 100, ocrBatchId: "failed", ocrBatchPageCount: 25, lastError: "[batch-failure:1] earlier failure" }, {
    pollMistralOcrBatch: async () => { polls++; return { status: "TIMEOUT_EXCEEDED", pages: [], error: "Provider expired the batch" }; },
  });
  const result = await (await route.invoke()).json();
  assert.equal(result.success, false);
  assert.equal(result.retrying, false);
  assert.equal(polls,1);
  assert.equal(route.calls.includes("submit"),false);
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
    "@/lib/invoice-intelligence/trace": invoiceTrace,
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
    "@/lib/invoice-intelligence/trace": invoiceTrace,
  }, {
    process: { env: { MISTRAL_API_KEY: "test-only" } },
    Date: { now: () => now },
    AbortSignal: { timeout: (ms: number) => { timeouts.push(ms); return {}; } },
    setTimeout: (callback: () => void, ms: number) => { delays.push(ms); now += ms; callback(); },
    fetch: async () => { calls++; now += 70_000; return Response.json({ message: "unavailable" }, { status: 429, headers: { "Retry-After": "10" } }); },
  });
  // A classifier outage still gives conservative boundaries for manual review.
  const result = await service.classifyBulkPages({ pages: [{ pageNumber: 0, markdown: "Invoice 123" }, { pageNumber: 1, markdown: "Invoice 456" }] });
  assert.equal(result.length, 2);
  assert.equal(calls, 2);
  assert.deepEqual(timeouts, [90_000, 70_000]);
  assert.deepEqual(delays, [10_000]);
  assert.equal(now, 150_000);
});
