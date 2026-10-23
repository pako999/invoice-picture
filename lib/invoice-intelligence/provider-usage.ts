import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

type Context = { clerkUserId: string; documentId?: number; bulkJobId?: number };
const context = new AsyncLocalStorage<Context>();
export function withProviderContext<T>(value: Context, operation: () => T): T { return context.run(value, operation); }
export function providerContext() { return context.getStore(); }

export function estimateChatCost(model: string, usage: any, batch = false): number | null {
  // Micro-USD per million tokens. Unknown model prices stay unknown.
  const input = Number(process.env.MISTRAL_CHAT_INPUT_COST_MICROS_PER_MILLION ?? (model === "mistral-small-2603" ? 150_000 : NaN));
  const output = Number(process.env.MISTRAL_CHAT_OUTPUT_COST_MICROS_PER_MILLION ?? (model === "mistral-small-2603" ? 600_000 : NaN));
  if (!usage || !Number.isFinite(input) || !Number.isFinite(output) || !Number.isFinite(usage.prompt_tokens) || !Number.isFinite(usage.completion_tokens)) return null;
  return Math.ceil((usage.prompt_tokens * input + usage.completion_tokens * output) / 1_000_000 * (batch ? 0.5 : 1));
}

export async function recordProviderUsage(args: { raw?: any; status: number | null; operation: string; model?: string; annotated?: boolean; batchId?: string; unknown?: boolean }) {
  const owner = providerContext();
  if (!owner || !process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  const raw = args.raw, usage = raw?.usage ?? raw?.usage_info ?? null;
  const model = String(raw?.model || args.model || "unknown");
  const pages = Number(raw?.usage_info?.pages_processed);
  const pageCost = args.annotated ? Number(process.env.MISTRAL_ANNOTATED_PAGE_COST_MICROS ?? 5000) : Number(process.env.MISTRAL_PLAIN_OCR_PAGE_COST_MICROS ?? 4000);
  const cost = args.unknown ? null : args.status != null && args.status >= 400 && args.status < 500 ? 0 : raw?.usage_info && Number.isFinite(pages)
    ? Math.ceil(pages * pageCost * (args.batchId ? 0.5 : 1))
    : estimateChatCost(model, usage, Boolean(args.batchId));
  // Batch polls share one accounting key: polling a result twice never doubles
  // its estimate. Store only usage counters, never document text or secrets.
  const requestKey = args.batchId ? `batch:${args.batchId}` : randomUUID();
  const counters = usage ? JSON.stringify({ prompt_tokens: usage.prompt_tokens ?? null, completion_tokens: usage.completion_tokens ?? null, total_tokens: usage.total_tokens ?? null, pages_processed: usage.pages_processed ?? null }) : null;
  await sql`INSERT INTO "invoiceProviderUsage" ("requestKey","clerkUserId","documentId","bulkJobId","operation","model","mode","httpStatus","completionUnknown","usageJson","estimatedCostMicros")
    VALUES (${requestKey},${owner.clerkUserId},${owner.documentId ?? null},${owner.bulkJobId ?? null},${args.operation},${model},${args.batchId ? "batch" : "realtime"},${args.status},${Boolean(args.unknown)},${counters},${cost})
    ON CONFLICT ("requestKey") DO UPDATE SET "completionUnknown"=false,"usageJson"=EXCLUDED."usageJson","estimatedCostMicros"=EXCLUDED."estimatedCostMicros","httpStatus"=EXCLUDED."httpStatus","model"=EXCLUDED."model"
    WHERE "invoiceProviderUsage"."completionUnknown"=true AND EXCLUDED."completionUnknown"=false`;

}
