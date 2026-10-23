import * as documentBatch from "../lib/invoice-intelligence/document-batch";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as errors from "../lib/invoice-intelligence/provider-errors";
import * as safety from "../lib/invoice-intelligence/safety";
import { createProviderFileUrl, verifyProviderFileUrl } from "../lib/bulk-invoices/provider-file";
import { MAX_INLINE_SOURCE_BYTES, serializeInlineInvoice, inlineRequestTooLarge } from "../lib/invoice-inline-upload";
import { runUploadPool } from "../lib/upload-pool";
import { mistralOcrModel, mistralChatModel } from "../lib/invoice-intelligence/mistral-config";
import { estimateChatCost } from "../lib/invoice-intelligence/provider-usage";
import { mapOcrPages } from "../lib/bulk-invoices/service";

function load(path: string, modules: Record<string, any>, globals: Record<string, any> = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports: Record<string, any> = {};
  new Function("require", "exports", ...Object.keys(globals), js)((name: string) => {
    if (!(name in modules)) throw new Error(`Unmocked dependency: ${name}`);
    return modules[name];
  }, exports, ...Object.values(globals));
  return exports;
}

test("inline source limit fits the wire budget and oversized JSON is rejected", () => {
  const body = serializeInlineInvoice({ imageBase64: Buffer.alloc(MAX_INLINE_SOURCE_BYTES).toString("base64"), filename: "račun.pdf" });
  assert.ok(Buffer.byteLength(body) < 4_000_000);
  assert.throws(() => serializeInlineInvoice({ imageBase64: "x".repeat(4_000_000) }), /prevelika/);
  assert.equal(inlineRequestTooLarge(new Headers({ "content-length": "4500000" })), true);
});

test("upload pool bounds active admission and stops unstarted files on quota failure", async () => {
  let active = 0, peak = 0;
  const started: number[] = [], skipped: number[] = [], resolvers: Array<() => void> = [];
  const work = runUploadPool([0,1,2,3,4,5], 2, async value => {
    started.push(value); peak = Math.max(peak, ++active);
    await new Promise<void>(resolve => resolvers.push(resolve)); active--;
    return value !== 0;
  }, value => skipped.push(value));
  assert.deepEqual(started, [0,1]);
  resolvers[0](); await Promise.resolve(); await Promise.resolve();
  resolvers[1](); await work;
  assert.equal(peak, 2); assert.deepEqual(started, [0,1]); assert.deepEqual(skipped, [2,3,4,5]);
});

test("provider capability lasts the full batch window and binds key, expiry and secret", () => {
  const now = 1_800_000_000_000;
  const url = new URL(createProviderFileUrl("https://worker.example", "bulk/owner/invoice..pdf", "test-only-secret", now));
  assert.equal(verifyProviderFileUrl(url, "test-only-secret", now + 24 * 60 * 60 * 1000), "bulk/owner/invoice..pdf");
  assert.equal(verifyProviderFileUrl(url, "wrong-key", now), null);
  const modified = new URL(url); modified.searchParams.set("key", "bulk/other/invoice.pdf");
  assert.equal(verifyProviderFileUrl(modified, "test-only-secret", now), null);
  assert.equal(verifyProviderFileUrl(url, "test-only-secret", now + 25 * 60 * 60 * 1000), null);
});

test("floating OCR/chat aliases resolve to validated versioned IDs", () => {
  const before = { ocr: process.env.MISTRAL_OCR_MODEL, chat: process.env.MISTRAL_BULK_EXTRACT_MODEL };
  try {
    process.env.MISTRAL_OCR_MODEL = "mistral-ocr-latest";
    process.env.MISTRAL_BULK_EXTRACT_MODEL = "mistral-small-latest";
    assert.equal(mistralOcrModel(), "mistral-ocr-4-1");
    assert.equal(mistralChatModel("extract"), "mistral-small-2603");
  } finally {
    for (const [key, value] of [["MISTRAL_OCR_MODEL",before.ocr],["MISTRAL_BULK_EXTRACT_MODEL",before.chat]]) {
      if (value == null) delete process.env[key!]; else process.env[key!] = value;
    }
  }
});

test("retry/refund policy distinguishes rejected requests from unknown completion", () => {
  const rejected = errors.providerResponseError(new Response(null, { status: 429, headers: { "Retry-After": "12" } }), "OCR");
  assert.equal(rejected.retryAfterMs, 12_000);
  assert.equal(errors.reservationWasRejected(rejected), true);
  assert.equal(errors.mayRetryProviderError(rejected, 1), true);
  assert.equal(errors.mayRetryProviderError(rejected, 2), false);
  assert.equal(errors.mayRetryProviderError(errors.providerResponseError(new Response(null, {status:400}), "OCR"), 1), false);
  const unknown = new errors.ProviderRequestError("timeout", null, "unknown", 0, true);
  assert.equal(errors.reservationWasRejected(unknown), false);
  assert.equal(errors.mayRetryProviderError(unknown, 1), false);
  assert.equal(errors.mayRetryProviderError(errors.providerResponseError(new Response(null,{status:503}), "OCR"),1), false);
});

test("whole-PDF results preserve complete original page coverage and reject duplicate indices", () => {
  const pages=mapOcrPages([{index:26,markdown:"B"},{index:25,markdown:"A"}],25,2);
  assert.deepEqual(pages.map(page=>page.pageNumber),[25,26]);
  assert.throws(()=>mapOcrPages([{index:25},{index:25}],25,2),/invalid page indices/);
  assert.throws(()=>mapOcrPages([{index:0},{index:1}],25,2),/invalid page indices/);
});

for (const rejected of [true, false]) test(`known-page document ${rejected ? "refunds a rejection" : "retains unknown-completion reservation"}`, async () => {
  const released: number[] = [];
  const failure = new errors.ProviderRequestError("test provider error", rejected ? 429 : null, rejected ? "rejected" : "unknown");
  const document = { id:1, clerkUserId:"test-owner", originalBase64:Buffer.from("%PDF-1.4\n/Type /Page").toString("base64"), mimeType:"application/pdf", filename:"test.pdf", byteSize:30 };
  const db = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [document] }) }) }),
    update: () => ({ set: () => ({ where: async () => [] }) }),
    insert: () => ({ values: () => ({ returning: async () => [{id:1}], then: (fn: any) => Promise.resolve([]).then(fn) }) }),
  };
  const providers = { readDeterministically:async()=>null, readWithMistral:async()=>{throw failure;}, azureConfigured:()=>false };
  const mod = load("lib/invoice-intelligence/processor.ts", {
    "./document-batch": documentBatch,
    "./mistral-config": {mistralOcrModel:()=>"test-model"}, "./provider-errors":errors,
    "./provider-usage": {withProviderContext:(_value:any,run:()=>any)=>run()},
    "drizzle-orm":{eq:()=>({})}, "@/lib/db":{getDb:()=>db},
    "@/lib/schema":new Proxy({}, {get:()=>({id:1})}), "./providers":providers,
    "./safety":{...safety,reserveOcrProviderBudget:async()=>({}),releaseUnusedOcrProviderBudget:async(args:any)=>{released.push(args.pages);}},
    "./quota":{OcrCommercialQuotaError:class extends Error{}}, "./types":{}, "./validation":{}, "./delivery":{},
    "./timing":{measureInvoiceStage:(_s:any,_n:any,run:()=>any)=>run()},
    "./trace":{traceInvoiceStage:(_s:any,_b:any,_n:any,run:()=>any)=>run()},
  });
  // Constructors used by the safety-deferral catch must remain real classes.
  // quota is otherwise irrelevant to a known one-page request.
  await assert.rejects(mod.processInvoiceDocument(1), e => e === failure);
  assert.deepEqual(released, rejected ? [1] : []);
});

test("chat estimates include output tokens, batch discount, and unknown prices stay unknown", () => {
  const usage = {prompt_tokens:1000,completion_tokens:500};
  assert.equal(estimateChatCost("mistral-small-2603",usage),450);
  assert.equal(estimateChatCost("mistral-small-2603",usage,true),225);
  assert.equal(estimateChatCost("unknown-model",usage),null);
  assert.equal(estimateChatCost("mistral-small-2603",undefined),null);
});

test("transport releases its slot on an unreadable accepted response and never retries", async () => {
  let releases = 0, requests = 0;
  const mod = load("lib/invoice-intelligence/mistral-http.ts", {
    "./provider-slots":{acquireMistralSlot:async()=>async()=>{releases++;}},
    "./provider-errors":errors, "./provider-usage":{recordProviderUsage:async()=>{}},
    "./trace":{tracedMistralFetch:async()=>{requests++;return new Response("invalid JSON");},tracedMistralJson:(r:Response)=>r.json()},
  });
  await assert.rejects(mod.mistralJsonRequest("https://api.mistral.ai/v1/ocr",{},1,{}), (error:any)=>error instanceof errors.ProviderRequestError && error.acceptance === "unknown");
  assert.equal(requests,1); assert.equal(releases,1);
});

function batchHarness() {
  let state: string | null = null, submissions = 0, polls = 0;
  const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const query = strings.join("?");
    if (query.startsWith("SELECT")) return [{batchStateJson:state}];
    if (query.includes('"batchStateJson"=NULL')) state = null;
    else if (query.includes('"batchStateJson"=')) state = values[0];
    return [{id:1}];
  };
  let status = "QUEUED";
  const mod = load("lib/invoice-intelligence/document-batch.ts", {
    "node:crypto":{randomUUID:()=>"test-intent"}, "@neondatabase/serverless":{neon:()=>sql},
    "./mistral-http":{mistralJsonRequest:async(_url:string,init:RequestInit)=>{
      submissions++; const body=JSON.parse(String(init.body));
      assert.equal(body.endpoint,"/v1/ocr"); assert.equal(body.requests[0].body.include_blocks,true);
      return {response:Response.json({}),raw:{id:"batch-test"}};
    }},
    "./provider-errors":errors,"./provider-usage":{recordProviderUsage:async()=>{}},
    "./trace":{tracedMistralFetch:async()=>{polls++;return Response.json({status,outputs:status==="SUCCESS"?[{custom_id:"invoice-job-1",response:{status_code:200,body:{pages:[{index:0}],usage_info:{pages_processed:1}}}}]:[]});},tracedMistralJson:(r:Response)=>r.json()},
  },{process:{env:{DATABASE_URL:"mocked",MISTRAL_API_KEY:"test-only"}}});
  return {mod,setStatus:(value:string)=>{status=value;},setState:(value:string)=>{state=value;},stats:()=>({submissions,polls,state})};
}

test("document Batch submits once, persists its ID, then polls the same job", async () => {
  const h=batchHarness();
  const args={jobId:1,request:{model:"mistral-ocr-4-1",include_blocks:true},pages:1,reservation:{clerkUserId:"test",dayStart:new Date(),monthStart:new Date(),costPerPage:2500}};
  await assert.rejects(h.mod.readDocumentBatch(args),h.mod.DocumentBatchPending);
  assert.equal(JSON.parse(h.stats().state!).id,"batch-test");
  await assert.rejects(h.mod.readDocumentBatch(args),h.mod.DocumentBatchPending);
  h.setStatus("SUCCESS");
  assert.equal((await h.mod.readDocumentBatch(args)).usage_info.pages_processed,1);
  assert.equal(h.stats().submissions,1); assert.equal(h.stats().polls,2);
});

test("unknown batch submission intent never creates another paid job", async () => {
  const h=batchHarness(),reservation={clerkUserId:"test",dayStart:new Date(),monthStart:new Date(),costPerPage:2500};
  h.setState(JSON.stringify({id:"submitting:interrupted",createdAt:Date.now(),pages:1,reservation}));
  await assert.rejects(h.mod.readDocumentBatch({jobId:1,request:{},pages:1,reservation}),/unknown completion/);
  assert.equal(h.stats().submissions,0); assert.equal(h.stats().polls,0);
});

for (const failed of [false,true]) test(`original email ${failed?"surfaces provider rejection":"uses stable idempotency independently of OCR"}`, async () => {
  const writes: string[]=[], sent: any[]=[];
  const sql:any=async(strings:TemplateStringsArray)=>{
    const query=strings.join("?"); writes.push(query);
    if(query.includes('RETURNING j."invoiceId"'))return [{invoiceId:12,messageBody:"note",attempts:1}];
    if(query.startsWith('SELECT'))return [{recipientEmail:"recipient@example.test",subject:"Invoice",imageData:"dGVzdA==",filename:"test.pdf",imageMime:"application/pdf"}];
    return [];
  };
  sql.transaction=(queries:Promise<unknown>[])=>Promise.all(queries);
  const mod=load("lib/invoice-intelligence/original-delivery.ts",{
    "next/server":{},"@neondatabase/serverless":{neon:()=>sql},
    "@/lib/resend":{sendInvoiceEmail:async(value:any)=>{sent.push(value);return {error:failed?{message:"Provider rejected email"}:null};}},
  },{process:{env:{DATABASE_URL:"mocked"}}});
  const result=await mod.runOriginalInvoiceEmails(1,12);
  assert.equal(sent[0].idempotencyKey,"original-invoice/12");
  assert.equal(sent[0].messageBody,"note"); assert.equal(result[0].ok,!failed);
  assert.equal(writes.some(query=>query.includes('"status"=\'sent\'')),!failed);
});
