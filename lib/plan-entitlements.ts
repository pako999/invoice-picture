import { neon } from "@neondatabase/serverless";
import { normalizePlan, type BillingPeriod, type CommercialPlan, type PaidPlan } from "@/lib/plans";

function sqlClient() { const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set"); return neon(url); }

export async function getCommercialPlanCode(clerkUserId: string): Promise<CommercialPlan> {
  const sql = sqlClient();
  const rows = await sql`
    SELECT e."planCode" AS "entitlementPlan", s."plan"::text AS "subscriptionPlan", s."currentPeriodEnd" AS "currentPeriodEnd", s."trialEndsAt" AS "trialEndsAt"
    FROM (SELECT ${clerkUserId}::varchar AS "clerkUserId") u
    LEFT JOIN "subscriptionPlanEntitlements" e ON e."clerkUserId" = u."clerkUserId"
    LEFT JOIN "subscriptions" s ON s."clerkUserId" = u."clerkUserId" LIMIT 1
  ` as Array<Record<string, unknown>>;
  const row = rows[0] ?? {};
  const entitlement = typeof row.entitlementPlan === "string" ? normalizePlan(row.entitlementPlan) : null;
  const subscription = typeof row.subscriptionPlan === "string" ? normalizePlan(row.subscriptionPlan) : "free";
  const now = Date.now();
  const periodEnd = row.currentPeriodEnd ? new Date(String(row.currentPeriodEnd)).getTime() : 0;
  const trialEnd = row.trialEndsAt ? new Date(String(row.trialEndsAt)).getTime() : 0;
  if (entitlement && ["basic", "pro", "accounting_pro", "accounting_max"].includes(entitlement) && periodEnd > now) return entitlement;
  if (subscription === "trial" && trialEnd > now) return "trial";
  if (["basic", "pro"].includes(subscription) && periodEnd > now) return subscription;
  if (subscription === "canceled") return "canceled";
  if (subscription === "expired") return "expired";
  return "free";
}

export async function setCommercialPlanEntitlement(args: { clerkUserId: string; plan: PaidPlan; billing?: BillingPeriod | null; source: "stripe" | "admin" | "bank_transfer" | "system" }) {
  const sql = sqlClient();
  await sql`INSERT INTO "subscriptionPlanEntitlements" ("clerkUserId","planCode","billing","source","createdAt","updatedAt") VALUES (${args.clerkUserId},${args.plan},${args.billing ?? null},${args.source},now(),now()) ON CONFLICT ("clerkUserId") DO UPDATE SET "planCode"=EXCLUDED."planCode","billing"=EXCLUDED."billing","source"=EXCLUDED."source","updatedAt"=now()`;
}

export async function clearCommercialPlanEntitlement(clerkUserId: string) { const sql = sqlClient(); await sql`DELETE FROM "subscriptionPlanEntitlements" WHERE "clerkUserId"=${clerkUserId}`; }
export function baseSubscriptionPlan(plan: PaidPlan): "basic" | "pro" { return plan === "basic" ? "basic" : "pro"; }
