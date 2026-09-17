import { neon } from "@neondatabase/serverless";
import { getOcrUsageSummary, quotaPageError, resolveOcrEntitlement } from "@/lib/invoice-intelligence/quota";

export type OcrProvider = "mistral" | "azure";

export type OcrRunBudget = {
  remainingPages: number;
};

export class OcrSafetyQuotaError extends Error {
  readonly retryable = true;
  constructor(message = "Global OCR emergency safety quota reached") {
    super(message);
    this.name = "OcrSafetyQuotaError";
  }
}

export class OcrRunBudgetError extends Error {
  readonly retryable = true;
  constructor(message = "OCR cron run page budget reached") {
    super(message);
    this.name = "OcrRunBudgetError";
  }
}

export function getOcrSafetyConfig() {
  return {
    maxPagesPerDocument: envInt("INVOICE_MAX_OCR_PAGES_PER_DOCUMENT", 8, 1, 50),
    maxPagesPerCron: envInt("INVOICE_MAX_OCR_PAGES_PER_CRON", 24, 1, 500),
    maxDocumentsPerCron: envInt("INVOICE_MAX_DOCUMENTS_PER_CRON", 3, 1, 25),
    // Legacy shared user caps are no longer used for commercial enforcement.
    // User limits are resolved from the active subscription plan at runtime.
    userDailyPages: null,
    userMonthlyPages: null,
    // New emergency variables intentionally replace the old 1k/5k defaults so
    // a stale environment value cannot block all paying customers together.
    globalDailyPages: envInt("INVOICE_GLOBAL_EMERGENCY_DAILY_OCR_PAGE_LIMIT", 10_000, 1_000, 1_000_000),
    globalMonthlyPages: envInt("INVOICE_GLOBAL_EMERGENCY_MONTHLY_OCR_PAGE_LIMIT", 100_000, 10_000, 10_000_000),
  };
}

/** Best-effort page count without invoking any paid provider. PDF page objects are
 * normally visible even when page contents are compressed. `null` means unknown;
 * unknown PDFs are treated as max-size for budgeting and Mistral is still hard-capped. */
export function estimateSourcePages(input: { base64: string; mimeType: string; filename?: string }): number | null {
  const isPdf = input.mimeType === "application/pdf" || /\.pdf$/i.test(input.filename ?? "");
  if (!isPdf) return 1;
  try {
    const latin = Buffer.from(input.base64, "base64").toString("latin1");
    const count = (latin.match(/\/Type\s*\/Page\b/g) || []).length;
    return count > 0 ? count : null;
  } catch {
    return null;
  }
}

export function isPdfInput(input: { mimeType: string; filename?: string }) {
  return input.mimeType === "application/pdf" || /\.pdf$/i.test(input.filename ?? "");
}

/** Mistral OCR supports explicit page selection. We always send an allow-list for
 * PDFs so an unknown/malformed 1,000-page PDF can never cause 1,000 paid pages. */
export function mistralPagesForInput(input: { base64: string; mimeType: string; filename?: string }): number[] | undefined {
  if (!isPdfInput(input)) return undefined;
  const config = getOcrSafetyConfig();
  const estimated = estimateSourcePages(input);
  const count = Math.max(1, Math.min(estimated ?? config.maxPagesPerDocument, config.maxPagesPerDocument));
  return Array.from({ length: count }, (_, index) => index);
}

export function providerReservationPages(input: { base64: string; mimeType: string; filename?: string }) {
  const config = getOcrSafetyConfig();
  const estimated = estimateSourcePages(input);
  return Math.max(1, Math.min(estimated ?? config.maxPagesPerDocument, config.maxPagesPerDocument));
}

export function knownDocumentExceedsPageLimit(input: { base64: string; mimeType: string; filename?: string }) {
  const estimated = estimateSourcePages(input);
  return estimated != null && estimated > getOcrSafetyConfig().maxPagesPerDocument;
}

/** Azure does not use our explicit Mistral page allow-list. For PDFs whose page
 * count cannot be established cheaply, fail closed and do not invoke Azure. */
export function azureAllowedForInput(input: { base64: string; mimeType: string; filename?: string }) {
  if (!isPdfInput(input)) return true;
  const estimated = estimateSourcePages(input);
  return estimated != null && estimated <= getOcrSafetyConfig().maxPagesPerDocument;
}

export function createOcrRunBudget(): OcrRunBudget {
  return { remainingPages: getOcrSafetyConfig().maxPagesPerCron };
}

export async function reserveOcrProviderBudget(args: {
  clerkUserId: string;
  provider: OcrProvider;
  pages: number;
  runBudget?: OcrRunBudget;
}) {
  const config = getOcrSafetyConfig();
  const entitlement = await resolveOcrEntitlement(args.clerkUserId);
  const pages = Math.max(1, Math.min(Math.trunc(args.pages), config.maxPagesPerDocument));

  if (args.runBudget) {
    if (pages > args.runBudget.remainingPages) {
      throw new OcrRunBudgetError(`OCR cron safety limit reached (${config.maxPagesPerCron} provider pages per run)`);
    }
    args.runBudget.remainingPages -= pages;
  }

  // Fast user-facing check before the transactional reservation. The SQL below
  // remains the source of truth for concurrency safety.
  const before = await getOcrUsageSummary(args.clerkUserId);
  if (before.dayPages + pages > entitlement.dailyPageLimit) throw quotaPageError(entitlement, "daily_pages");
  if (before.monthPages + pages > entitlement.monthlyPageLimit) throw quotaPageError(entitlement, "pages");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const costPerPage = args.provider === "mistral"
    ? envInt("MISTRAL_ANNOTATED_PAGE_COST_MICROS", 5000, 0, 10_000_000)
    : envInt("AZURE_PAGE_COST_MICROS", 0, 0, 10_000_000);
  const estimatedCost = pages * costPerPage;
  const userScope = `user:${args.clerkUserId}`;

  try {
    await sql`
      WITH
      global_day AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey", "bucketType", "bucketStart", "reservedPages", "estimatedCostMicros", "updatedAt")
        SELECT 'global', 'day', ${dayStart}, ${pages}, ${estimatedCost}, now()
        WHERE ${pages} <= ${config.globalDailyPages}
        ON CONFLICT ("scopeKey", "bucketType", "bucketStart") DO UPDATE SET
          "reservedPages" = "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages",
          "estimatedCostMicros" = "invoiceOcrUsageBuckets"."estimatedCostMicros" + EXCLUDED."estimatedCostMicros",
          "updatedAt" = now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages" <= ${config.globalDailyPages}
        RETURNING 1
      ),
      global_month AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey", "bucketType", "bucketStart", "reservedPages", "estimatedCostMicros", "updatedAt")
        SELECT 'global', 'month', ${monthStart}, ${pages}, ${estimatedCost}, now()
        WHERE ${pages} <= ${config.globalMonthlyPages}
        ON CONFLICT ("scopeKey", "bucketType", "bucketStart") DO UPDATE SET
          "reservedPages" = "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages",
          "estimatedCostMicros" = "invoiceOcrUsageBuckets"."estimatedCostMicros" + EXCLUDED."estimatedCostMicros",
          "updatedAt" = now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages" <= ${config.globalMonthlyPages}
        RETURNING 1
      ),
      user_day AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey", "bucketType", "bucketStart", "reservedPages", "estimatedCostMicros", "updatedAt")
        SELECT ${userScope}, 'day', ${dayStart}, ${pages}, ${estimatedCost}, now()
        WHERE ${pages} <= ${entitlement.dailyPageLimit}
        ON CONFLICT ("scopeKey", "bucketType", "bucketStart") DO UPDATE SET
          "reservedPages" = "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages",
          "estimatedCostMicros" = "invoiceOcrUsageBuckets"."estimatedCostMicros" + EXCLUDED."estimatedCostMicros",
          "updatedAt" = now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages" <= ${entitlement.dailyPageLimit}
        RETURNING 1
      ),
      user_month AS (
        INSERT INTO "invoiceOcrUsageBuckets" ("scopeKey", "bucketType", "bucketStart", "reservedPages", "estimatedCostMicros", "updatedAt")
        SELECT ${userScope}, 'month', ${monthStart}, ${pages}, ${estimatedCost}, now()
        WHERE ${pages} <= ${entitlement.monthlyPageLimit}
        ON CONFLICT ("scopeKey", "bucketType", "bucketStart") DO UPDATE SET
          "reservedPages" = "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages",
          "estimatedCostMicros" = "invoiceOcrUsageBuckets"."estimatedCostMicros" + EXCLUDED."estimatedCostMicros",
          "updatedAt" = now()
        WHERE "invoiceOcrUsageBuckets"."reservedPages" + EXCLUDED."reservedPages" <= ${entitlement.monthlyPageLimit}
        RETURNING 1
      ),
      quota_count AS (
        SELECT
          (SELECT count(*) FROM global_day) +
          (SELECT count(*) FROM global_month) +
          (SELECT count(*) FROM user_day) +
          (SELECT count(*) FROM user_month) AS n
      )
      SELECT 1 / CASE WHEN n = 4 THEN 1 ELSE 0 END AS "quotaGuard" FROM quota_count
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/division by zero|quota/i.test(message)) {
      const latest = await getOcrUsageSummary(args.clerkUserId).catch(() => before);
      if (latest.dayPages + pages > entitlement.dailyPageLimit) throw quotaPageError(entitlement, "daily_pages");
      if (latest.monthPages + pages > entitlement.monthlyPageLimit) throw quotaPageError(entitlement, "pages");
      throw new OcrSafetyQuotaError(
        `Global OCR emergency safety limit reached (${config.globalDailyPages}/day, ${config.globalMonthlyPages}/month).`,
      );
    }
    throw error;
  }
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
