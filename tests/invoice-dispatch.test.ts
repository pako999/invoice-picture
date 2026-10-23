import * as providerFile from "../lib/bulk-invoices/provider-file";
import * as invoiceTrace from "../lib/invoice-intelligence/trace";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadModule(path: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports: Record<string, any> = {};
  new Function("require", "exports", ...Object.keys(globals), js)((name: string) => {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  }, exports, ...Object.values(globals));
  return exports;
}

test("submission schedules only its own document after response, then stops", async () => {
  const tasks: Array<() => Promise<void>> = [], calls: unknown[] = [];
  const mod = loadModule("lib/invoice-intelligence/dispatch.ts", {
    "next/server": { after: (task: () => Promise<void>) => tasks.push(task) },
    "./processor": { runQueuedInvoiceJobs: (...args: unknown[]) => { calls.push(args); } },
    "./delivery": { runQueuedDeliveryJobs: (...args: unknown[]) => { calls.push(args); } },
  });
  mod.dispatchInvoiceProcessing(101); mod.dispatchInvoiceProcessing(202); mod.dispatchInvoiceDelivery(101);
  assert.equal(calls.length, 0);
  await Promise.all(tasks.map(task => task()));
  assert.deepEqual(calls, [[1, 101], [1, 202], [1, 101]]);
  assert.equal(tasks.length, 3); // no recurring timers / empty-queue polling
});

test("background failures are logged without breaking the accepted upload", async () => {
  const tasks: Array<() => Promise<void>> = [], errors: unknown[] = [];
  const mod = loadModule("lib/invoice-intelligence/dispatch.ts", {
    "next/server": { after: (task: () => Promise<void>) => tasks.push(task) },
    "./processor": { runQueuedInvoiceJobs: () => { throw new Error("temporary failure"); } },
  }, { console: { error: (...args: unknown[]) => errors.push(args) } });
  mod.dispatchInvoiceProcessing(101);
  await tasks[0]();
  assert.equal(errors.length, 1);
});

function worker(responses: unknown[], overrides: Record<string, unknown> = {}) {
  const calls: Array<{ path: string; body: any }> = [];
  const mod = loadModule("neon/functions/bulkpdf/index.ts", {
    "node:crypto": {},
    "../../../lib/bulk-invoices/provider-file": providerFile,
    "../../../lib/invoice-intelligence/trace": invoiceTrace,
    "@aws-sdk/client-s3": { S3Client: class {}, GetObjectCommand: class {} },
    "@aws-sdk/s3-request-presigner": { getSignedUrl: async () => "https://storage.example/test.pdf" },
    jose: { createRemoteJWKSet: () => ({}), jwtVerify: async (token: string) => {
      if (token !== "valid") throw new Error("invalid JWT");
      return { payload: { sub: "owner-a" } };
    } },
    "pdf-lib": {},
    ...overrides,
  }, {
    process: { env: { BULK_INTERNAL_SECRET: "test-only", CLERK_ISSUER: "https://clerk.example" } },
    console: { log() {}, error() {} },
    fetch: async (url: string, init: RequestInit) => {
      calls.push({ path: new URL(url).pathname, body: JSON.parse(String(init.body)) });
      if (!responses.length) throw new Error("Unexpected extra request");
      return Response.json(responses.shift());
    },
  });
  return { api: mod.default, calls };
}

test("bulk run rejects anonymous callers before any app/database access", async () => {
  const { api, calls } = worker([]);
  assert.equal((await api.fetch(new Request("https://worker/run", { method: "POST" }))).status, 401);
  assert.equal(calls.length, 0);
});

test("bulk run is scoped to verified owner and stops immediately when idle", async () => {
  const { api, calls } = worker([{ job: null }]);
  const result = await api.fetch(new Request("https://worker/run", { method: "POST", headers: { Authorization: "Bearer valid" }, body: JSON.stringify({ jobId: 9, ownerId: "attacker" }) }));
  assert.equal(result.status, 200);
  assert.deepEqual(calls, [{ path: "/api/internal/bulk/next", body: { jobId: 9, ownerId: "owner-a" } }]);
  assert.equal((await result.json()).idle, true);
});

test("scheduled worker drains document batches and stops when both queues are idle", async () => {
  const { api,calls }=worker([{job:null,documentJob:{documentId:231}},{success:true,pending:true},{job:null}]);
  const response=await api.fetch(new Request("https://worker/work",{method:"POST",headers:{"x-neon-trigger-invocation-id":"test-trigger"}}));
  assert.equal(response.status,200);
  assert.deepEqual(calls.map(call=>call.path),["/api/internal/bulk/next","/api/internal/invoice-batch","/api/internal/bulk/next"]);
  assert.deepEqual(calls[1].body,{documentId:231});
});

test("bulk run yields pending provider batch instead of busy-polling the database", async () => {
  const { api, calls } = worker([{ job: { id: 9, stage: "ocr", objectKey: "bulk/owner-a/a.pdf", ocrNextPage: 0 } }, { success: true, batch: true, pages: 0, status: "RUNNING" }]);
  const result = await api.fetch(new Request("https://worker/run", { method: "POST", headers: { Authorization: "Bearer valid" }, body: '{"jobId":9}' }));
  assert.equal((await result.json()).providerPending, true);
  assert.equal(calls.length, 2);
});

test("bulk run advances completed real-time OCR immediately instead of waiting for a schedule", async () => {
  const { api, calls } = worker([
    { job: { id: 9, stage: "ocr", objectKey: "bulk/owner-a/a.pdf", ocrNextPage: 0 } },
    { success: true, batch: false, pages: 25, nextPage: 25 },
    { job: null },
  ]);
  const result = await api.fetch(new Request("https://worker/run", { method: "POST", headers: { Authorization: "Bearer valid" }, body: '{"jobId":9}' }));
  assert.equal((await result.json()).idle, true);
  assert.deepEqual(calls.map(call => call.path), ["/api/internal/bulk/next", "/api/internal/bulk/ocr", "/api/internal/bulk/next"]);
});

test("PDF counting and multiple split chunks share one original download and parse per invocation", async () => {
  let downloads = 0, parses = 0, uploads = 0;
  const ranges = Array.from({ length: 21 }, (_, i) => ({ startPage: i, endPage: i, boundaryConfidence: 1, needsBoundaryReview: false }));
  class GetObjectCommand { constructor(public input: unknown) {} }
  class PutObjectCommand { constructor(public input: unknown) {} }
  const original = { getPageCount: () => 21 };
  const job = { id: 9, clerkUserId: "owner-a", objectKey: "bulk/owner-a/a.pdf" };
  const { api } = worker([
    { job: { ...job, stage: "uploaded" } }, {},
    { job: { ...job, stage: "split" } }, { ranges }, {},
    { job: { ...job, stage: "split" } }, { ranges, existingGroupIndexes: Array.from({ length: 20 }, (_, i) => i) }, {},
    { job: null },
  ], {
    "node:crypto": { createHash: () => ({ update() { return this; }, digest: () => "test-hash" }) },
    "@aws-sdk/client-s3": { GetObjectCommand, PutObjectCommand, S3Client: class {
      async send(command: unknown) {
        if (command instanceof GetObjectCommand) { downloads++; return { Body: { transformToByteArray: async () => Buffer.from("%PDF-1.4") } }; }
        uploads++; return {};
      }
    } },
    "pdf-lib": { PDFDocument: {
      load: async () => { parses++; return original; },
      create: async () => ({ copyPages: async (_source: unknown, pages: number[]) => pages, addPage() {}, save: async () => Buffer.from("%PDF-child") }),
    } },
  });
  const response = await api.fetch(new Request("https://worker/run", { method: "POST", headers: { Authorization: "Bearer valid" }, body: '{"jobId":9}' }));
  assert.equal(response.status, 200);
  assert.equal(downloads, 1);
  assert.equal(parses, 1);
  assert.equal(uploads, 21);
});
