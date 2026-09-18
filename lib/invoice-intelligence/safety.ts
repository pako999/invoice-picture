import { neon } from "@neondatabase/serverless";
import { getOcrUsageSummary, quotaPageError, resolveOcrEntitlement, OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";

export type OcrProvider = "mistral" | "azure";
export type OcrRunBudget = { remainingPages: number };
export type OcrProviderBudgetReservation = { clerkUserId: string; dayStart: Date; monthStart: Date; costPerPage: number };

export class OcrSafetyQuotaError extends Error {
  readonly retryable = true;
  constructor(message = "Global OCR emergency safety quota reached") { super(message); this.name = "OcrSafetyQuotaError"; }
}
export class OcrRunBudgetError extends Error {
  readonly retryable = true;
  constructor(message = "OCR cron run page budget reached") { super(message); this.name = "OcrRunBudgetError"; }
}

export function getOcrSafetyConfig() {
  // Commercial plan limits decide how many pages a customer may process. This
  // is only a technical guardrail matching the largest supported bulk PDF.
  // Keep it separate from the retired 25-page cost cap so paid/admin accounts
  // can use the OCR pages they actually have available.
  const maxPagesPerDocument = envInt("INVOICE_TECHNICAL_MAX_OCR_PAGES_PER_DOCUMENT", 500, 1, 500);
  return {
    maxPagesPerDocument,
    maxPagesPerCron: Math.max(maxPagesPerDocument, envInt("INVOICE_MAX_OCR_PAGES_PER_CRON", 500, 1, 5_000)),
    maxDocumentsPerCron: envInt("INVOICE_MAX_DOCUMENTS_PER_CRON", 5, 1, 25),
    globalDailyPages: envInt("INVOICE_GLOBAL_EMERGENCY_DAILY_OCR_PAGE_LIMIT", 10_000, 1_000, 1_000_000),
    globalMonthlyPages: envInt("INVOICE_GLOBAL_EMERGENCY_MONTHLY_OCR_PAGE_LIMIT", 100_000, 10_000, 10_000_000),
  };
}

export function estimateSourcePages(input: { base64: string; mimeType: string; filename?: string }): number | null {
  const isPdf = input.mimeType === "application/pdf" || /\.pdf$/i.test(input.filename ?? "");
  if (!isPdf) return 1;
  try { const latin = Buffer.from(input.base64, "base64").toString("latin1"); const count = (latin.match(/\/Type\s*\/Page\b/g) || []).length; return count > 0 ? count : null; } catch { return null; }
}
export function isPdfInput(input: { mimeType: string; filename?: string }) { return input.mimeType === "application/pdf" || /\.pdf$/i.test(input.filename ?? ""); }
export function mistralPagesForInput(input: { base64: string; mimeType: string; filename?: string }, unknownPageLimit = 1): number[] | undefined {
  if (!isPdfInput(input)) return undefined; const cfg = getOcrSafetyConfig(); const estimated = estimateSourcePages(input); const count = Math.max(1, Math.min(estimated ?? unknownPageLimit, cfg.maxPagesPerDocument)); return Array.from({ length: count }, (_, i) => i);
}
export function providerReservationPages(input: { base64: string; mimeType: string; filename?: string }, unknownPageLimit = 1) { const cfg = getOcrSafetyConfig(); const estimated = estimateSourcePages(input); return Math.max(1, Math.min(estimated ?? unknownPageLimit, cfg.maxPagesPerDocument)); }
export function knownDocumentExceedsPageLimit(input: { base64: string; mimeType: string; filename?: string }) { const estimated = estimateSourcePages(input); return estimated != null && estimated > getOcrSafetyConfig().maxPagesPerDocument; }
export function azureAllowedForInput(input: { base64: string; mimeType: string; filename?: string }) { if (!isPdfInput(input)) return true; const estimated = estimateSourcePages(input); return estimated != null && estimated <= getOcrSafetyConfig().maxPagesPerDocument; }
export function createOcrRunBudget(): OcrRunBudget { return { remainingPages: getOcrSafetyConfig().maxPagesPerCron }; }

export async function reserveOcrProviderBudget(args: { clerkUserId: string; provider: OcrProvider; pages: number; runBudget?: OcrRunBudget }) {
  const config = getOcrSafetyConfig();
  const entitlement = await resolveOcrEntitlement(args.clerkUserId);
  const pages = Math.max(1, Math.min(Math.trunc(args.pages), config.maxPagesPerDocument));
  if (args.runBudget) { if (pages > args.runBudget.remainingPages) throw new OcrRunBudgetError(`OCR cron safety limit reached (${config.maxPagesPerCron} provider pages per run)`); args.runBudget.remainingPages -= pages; }

  const before = await getOcrUsageSummary(args.clerkUserId);
  if (before.dayPages + pages > entitlement.dailyPageLimit) throw quotaPageError(entitlement, "daily_pages");
  if (before.monthPages + pages > entitlement.monthlyPageLimit) throw quotaPageError(entitlement, "pages");

  const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set"); const sql = neon(url);
  const now = new Date(); const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const costPerPage = args.provider === "mistral" ? envInt("MISTRAL_ANNOTATED_PAGE_COST_MICROS", 5000, 0, 10_000_000) : envInt("AZURE_PAGE_COST_MICROS", 0, 0, 10_000_000);
  const estimatedCost = pages * costPerPage; const userScope = `user:${args.clerkUserId}`;

  try {
    await sql`
      WITH
      global_day AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey","bucketType","bucketStart","reservedPages","estimatedCostMicros","updatedAt")
        SELECT 'global','day',${dayStart},${pages},${estimatedCost},now() WHERE ${pages}::int <= ${config.globalDailyPages}::int
        ON CONFLICT ("scopeKey","bucketType","bucketStart") DO UPDATE SET "reservedPages"="invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages","estimatedCostMicros"="invoiceOcrUsageBuckets"."estimatedCostMicros"+EXCLUDED."estimatedCostMicros","updatedAt"=now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages" <= ${config.globalDailyPages}::int RETURNING 1
      ),
      global_month AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey","bucketType","bucketStart","reservedPages","estimatedCostMicros","updatedAt")
        SELECT 'global','month',${monthStart},${pages},${estimatedCost},now() WHERE ${pages}::int <= ${config.globalMonthlyPages}::int
        ON CONFLICT ("scopeKey","bucketType","bucketStart") DO UPDATE SET "reservedPages"="invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages","estimatedCostMicros"="invoiceOcrUsageBuckets"."estimatedCostMicros"+EXCLUDED."estimatedCostMicros","updatedAt"=now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages" <= ${config.globalMonthlyPages}::int RETURNING 1
      ),
      user_day AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey","bucketType","bucketStart","reservedPages","estimatedCostMicros","updatedAt")
        SELECT ${userScope},'day',${dayStart},${pages},${estimatedCost},now() WHERE ${pages}::int <= ${entitlement.dailyPageLimit}::int
        ON CONFLICT ("scopeKey","bucketType","bucketStart") DO UPDATE SET "reservedPages"="invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages","estimatedCostMicros"="invoiceOcrUsageBuckets"."estimatedCostMicros"+EXCLUDED."estimatedCostMicros","updatedAt"=now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages" <= ${entitlement.dailyPageLimit}::int RETURNING 1
      ),
      user_month AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey","bucketType","bucketStart","reservedPages","estimatedCostMicros","updatedAt")
        SELECT ${userScope},'month',${monthStart},${pages},${estimatedCost},now() WHERE ${pages}::int <= ${entitlement.monthlyPageLimit}::int
        ON CONFLICT ("scopeKey","bucketType","bucketStart") DO UPDATE SET "reservedPages"="invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages","estimatedCostMicros"="invoiceOcrUsageBuckets"."estimatedCostMicros"+EXCLUDED."estimatedCostMicros","updatedAt"=now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages"+EXCLUDED."reservedPages" <= ${entitlement.monthlyPageLimit}::int RETURNING 1
      ),
      quota_count AS (SELECT (SELECT count(*) FROM global_day)+(SELECT count(*) FROM global_month)+(SELECT count(*) FROM user_day)+(SELECT count(*) FROM user_month) AS n)
      SELECT 1 / CASE WHEN n=4 THEN 1 ELSE 0 END AS "quotaGuard" FROM quota_count
    `;
    return { clerkUserId: args.clerkUserId, dayStart, monthStart, costPerPage } satisfies OcrProviderBudgetReservation;
  } catch (error) {
    if (error instanceof OcrCommercialQuotaError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (/division by zero/i.test(message)) {
      const latest = await getOcrUsageSummary(args.clerkUserId).catch(() => before);
      if (latest.dayPages + pages > entitlement.dailyPageLimit) throw quotaPageError(entitlement, "daily_pages");
      if (latest.monthPages + pages > entitlement.monthlyPageLimit) throw quotaPageError(entitlement, "pages");
      throw new OcrSafetyQuotaError(`Global OCR emergency safety limit reached (${config.globalDailyPages}/day, ${config.globalMonthlyPages}/month).`);
    }
    console.error("[invoice-ocr] Failed to reserve OCR budget", { error: message, clerkUserId: args.clerkUserId, provider: args.provider, pages });
    throw error;
  }
}
export async function releaseUnusedOcrProviderBudget(args: { reservation: OcrProviderBudgetReservation; pages: number; runBudget?: OcrRunBudget }) {
  const pages = Number.isFinite(args.pages) ? Math.max(0, Math.trunc(args.pages)) : 0;
  if (pages === 0) return;
  const config = getOcrSafetyConfig();
  const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set"); const sql = neon(url);
  const estimatedCost = pages * args.reservation.costPerPage; const userScope = `user:${args.reservation.clerkUserId}`;
  await sql`UPDATE "invoiceOcrUsageBuckets"
    SET "reservedPages"=GREATEST(0,"reservedPages"-${pages}),
        "estimatedCostMicros"=GREATEST(0,"estimatedCostMicros"-${estimatedCost}),
        "updatedAt"=now()
    WHERE "scopeKey" IN ('global',${userScope})
      AND (("bucketType"='day' AND "bucketStart"=${args.reservation.dayStart}) OR ("bucketType"='month' AND "bucketStart"=${args.reservation.monthStart}))`;
  if (args.runBudget) args.runBudget.remainingPages = Math.min(config.maxPagesPerCron, args.runBudget.remainingPages + pages);
}
function envInt(name: string, fallback: number, min: number, max: number) { const parsed = Number.parseInt(process.env[name] ?? "", 10); if (!Number.isFinite(parsed)) return fallback; return Math.max(min, Math.min(max, parsed)); }
