import { clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { ADMIN_OCR_OVERRIDE, getPlanConfig, planLabel, type CommercialPlan } from "@/lib/plans";
import { getCommercialPlanCode } from "@/lib/plan-entitlements";

export type OcrQuotaEntitlement = {
  plan: CommercialPlan;
  planName: string;
  monthlyDocumentLimit: number;
  monthlyPageLimit: number;
  dailyPageLimit: number;
  adminOverride: boolean;
};

export type OcrUsageSummary = OcrQuotaEntitlement & {
  monthDocuments: number;
  monthPages: number;
  dayPages: number;
  estimatedMonthCostMicros: number;
  documentPercent: number;
  pagePercent: number;
  usagePercent: number;
  warningLevel: "ok" | "warning" | "critical" | "blocked";
  remainingDocuments: number;
  remainingPages: number;
  noticeSl: string | null;
  noticeEn: string | null;
};

export class OcrCommercialQuotaError extends Error {
  readonly code = "ocr_plan_limit_reached";
  readonly retryable = false;
  constructor(
    message: string,
    readonly quotaType: "documents" | "pages" | "daily_pages",
    readonly limit: number,
    readonly plan: CommercialPlan,
  ) {
    super(message);
    this.name = "OcrCommercialQuotaError";
  }
}

const emailCache = new Map<string, { email: string | null; expiresAt: number }>();

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

async function resolvePrimaryEmail(clerkUserId: string) {
  const cached = emailCache.get(clerkUserId);
  if (cached && cached.expiresAt > Date.now()) return cached.email;
  let email: string | null = null;
  try {
    const user = await (await clerkClient()).users.getUser(clerkUserId);
    const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId) ?? user.emailAddresses[0];
    email = primary?.emailAddress?.toLowerCase() ?? null;
  } catch (error) {
    console.warn("ocr_quota_email_lookup_failed", { clerkUserId, error });
  }
  emailCache.set(clerkUserId, { email, expiresAt: Date.now() + 10 * 60_000 });
  return email;
}

export async function resolveOcrEntitlement(clerkUserId: string): Promise<OcrQuotaEntitlement> {
  const [plan, email] = await Promise.all([getCommercialPlanCode(clerkUserId), resolvePrimaryEmail(clerkUserId)]);
  if (email === ADMIN_OCR_OVERRIDE.email) {
    return {
      plan,
      planName: `${planLabel(plan)} · Admin`,
      monthlyDocumentLimit: ADMIN_OCR_OVERRIDE.monthlyDocuments,
      monthlyPageLimit: ADMIN_OCR_OVERRIDE.monthlyPages,
      dailyPageLimit: ADMIN_OCR_OVERRIDE.dailyPages,
      adminOverride: true,
    };
  }
  const config = getPlanConfig(plan);
  return {
    plan,
    planName: config.nameSl,
    monthlyDocumentLimit: config.ocrDocumentsMonthly,
    monthlyPageLimit: config.ocrPagesMonthly,
    dailyPageLimit: config.ocrPagesMonthly,
    adminOverride: false,
  };
}

export async function getOcrUsageSummary(clerkUserId: string): Promise<OcrUsageSummary> {
  const entitlement = await resolveOcrEntitlement(clerkUserId);
  const sql = sqlClient();
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const scope = `user:${clerkUserId}`;
  const [docRows, bucketRows] = await Promise.all([
    sql`
      SELECT count(*)::int AS "count"
      FROM "invoiceDocuments"
      WHERE "clerkUserId" = ${clerkUserId} AND "createdAt" >= ${monthStart}
    `,
    sql`
      SELECT "bucketType", "bucketStart", "reservedPages", "estimatedCostMicros"
      FROM "invoiceOcrUsageBuckets"
      WHERE "scopeKey" = ${scope}
        AND (("bucketType" = 'day' AND "bucketStart" = ${dayStart}) OR ("bucketType" = 'month' AND "bucketStart" = ${monthStart}))
    `,
  ]);
  const monthDocuments = Number(docRows[0]?.count ?? 0);
  const day = bucketRows.find((row) => row.bucketType === "day");
  const month = bucketRows.find((row) => row.bucketType === "month");
  const dayPages = Number(day?.reservedPages ?? 0);
  const monthPages = Number(month?.reservedPages ?? 0);
  const estimatedMonthCostMicros = Number(month?.estimatedCostMicros ?? 0);
  const documentPercent = percent(monthDocuments, entitlement.monthlyDocumentLimit);
  const pagePercent = percent(monthPages, entitlement.monthlyPageLimit);
  const usagePercent = Math.max(documentPercent, pagePercent);
  const warningLevel = usagePercent >= 100 ? "blocked" : usagePercent >= 95 ? "critical" : usagePercent >= 80 ? "warning" : "ok";
  const remainingDocuments = Math.max(0, entitlement.monthlyDocumentLimit - monthDocuments);
  const remainingPages = Math.max(0, entitlement.monthlyPageLimit - monthPages);
  const notices = buildNotice(entitlement, { monthDocuments, monthPages, dayPages, warningLevel });

  return {
    ...entitlement,
    monthDocuments,
    monthPages,
    dayPages,
    estimatedMonthCostMicros,
    documentPercent,
    pagePercent,
    usagePercent,
    warningLevel,
    remainingDocuments,
    remainingPages,
    ...notices,
  };
}

export async function assertOcrDocumentQuota(clerkUserId: string) {
  const summary = await getOcrUsageSummary(clerkUserId);
  if (summary.monthDocuments >= summary.monthlyDocumentLimit) {
    throw new OcrCommercialQuotaError(
      summary.adminOverride
        ? `Admin OCR mesečni limit ${summary.monthlyDocumentLimit} dokumentov je dosežen.`
        : `Dosežen je mesečni OCR limit paketa ${summary.planName}: ${summary.monthlyDocumentLimit} dokumentov. Originalno pošiljanje računov še vedno deluje; za nadaljnjo AI obdelavo nadgradite paket.`,
      "documents",
      summary.monthlyDocumentLimit,
      summary.plan,
    );
  }
  return summary;
}

export function quotaPageError(entitlement: OcrQuotaEntitlement, type: "pages" | "daily_pages") {
  const limit = type === "daily_pages" ? entitlement.dailyPageLimit : entitlement.monthlyPageLimit;
  const message = entitlement.adminOverride
    ? `Admin OCR ${type === "daily_pages" ? "dnevni" : "mesečni"} limit ${limit} strani je dosežen.`
    : `Dosežen je ${type === "daily_pages" ? "dnevni" : "mesečni"} OCR limit paketa ${entitlement.planName}: ${limit} strani. Originalno pošiljanje računov še vedno deluje; za nadaljnjo AI obdelavo nadgradite paket.`;
  return new OcrCommercialQuotaError(message, type, limit, entitlement.plan);
}

function percent(value: number, limit: number) {
  if (limit <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.round((value / limit) * 1000) / 10);
}

function buildNotice(
  entitlement: OcrQuotaEntitlement,
  usage: { monthDocuments: number; monthPages: number; dayPages: number; warningLevel: OcrUsageSummary["warningLevel"] },
) {
  if (entitlement.adminOverride && usage.dayPages >= entitlement.dailyPageLimit) {
    return {
      noticeSl: `Dosežen je admin dnevni OCR limit ${entitlement.dailyPageLimit} strani. OCR obdelava je ustavljena do naslednjega dne.`,
      noticeEn: `The admin daily OCR limit of ${entitlement.dailyPageLimit} pages has been reached. OCR processing is paused until the next day.`,
    };
  }
  if (usage.warningLevel === "blocked") {
    return {
      noticeSl: `Dosežen je OCR limit paketa ${entitlement.planName}. Poraba: ${usage.monthDocuments}/${entitlement.monthlyDocumentLimit} dokumentov in ${usage.monthPages}/${entitlement.monthlyPageLimit} strani.`,
      noticeEn: `The OCR limit for ${entitlement.planName} has been reached. Usage: ${usage.monthDocuments}/${entitlement.monthlyDocumentLimit} documents and ${usage.monthPages}/${entitlement.monthlyPageLimit} pages.`,
    };
  }
  if (usage.warningLevel === "critical") {
    return {
      noticeSl: `Porabili ste najmanj 95 % mesečnega OCR limita paketa ${entitlement.planName}.`,
      noticeEn: `You have used at least 95% of the monthly OCR allowance for ${entitlement.planName}.`,
    };
  }
  if (usage.warningLevel === "warning") {
    return {
      noticeSl: `Porabili ste najmanj 80 % mesečnega OCR limita paketa ${entitlement.planName}.`,
      noticeEn: `You have used at least 80% of the monthly OCR allowance for ${entitlement.planName}.`,
    };
  }
  return { noticeSl: null, noticeEn: null };
}
