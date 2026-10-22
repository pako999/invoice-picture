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

function worker(responses: unknown[]) {
  const calls: Array<{ path: string; body: any }> = [];
  const mod = loadModule("neon/functions/bulkpdf/index.ts", {
    "node:crypto": {},
    "@aws-sdk/client-s3": { S3Client: class {}, GetObjectCommand: class {} },
    "@aws-sdk/s3-request-presigner": { getSignedUrl: async () => "https://storage.example/test.pdf" },
    jose: { createRemoteJWKSet: () => ({}), jwtVerify: async (token: string) => {
      if (token !== "valid") throw new Error("invalid JWT");
      return { payload: { sub: "owner-a" } };
    } },
    "pdf-lib": {},
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

test("bulk run yields pending provider batch instead of busy-polling the database", async () => {
  const { api, calls } = worker([{ job: { id: 9, stage: "ocr", objectKey: "bulk/owner-a/a.pdf", ocrNextPage: 0 } }, { success: true, batch: true, pages: 0, status: "RUNNING" }]);
  const result = await api.fetch(new Request("https://worker/run", { method: "POST", headers: { Authorization: "Bearer valid" }, body: '{"jobId":9}' }));
  assert.equal((await result.json()).providerPending, true);
  assert.equal(calls.length, 2);
});
