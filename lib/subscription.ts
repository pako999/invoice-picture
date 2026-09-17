import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoices, subscriptions, type Subscription } from "@/lib/schema";
import { getCommercialPlanCode } from "@/lib/plan-entitlements";
import { getPlanConfig, type CommercialPlan } from "@/lib/plans";

export const TRIAL_DAYS = 7;
export const FREE_MONTHLY_LIMIT = 3;

export interface SubscriptionStatus {
  plan: Subscription["plan"];
  commercialPlan: CommercialPlan;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  canSend: boolean;
  trialActive: boolean;
  paid: boolean;
  isFree: boolean;
  monthlyUsage: number;
  monthlyLimit: number | null;
  ocrDocumentsMonthly: number;
  ocrPagesMonthly: number;
  companyLimit: number | null;
}

export async function getOrCreateSubscription(clerkUserId: string): Promise<Subscription> {
  const db = getDb();
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.clerkUserId, clerkUserId)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(subscriptions)
    .values({ clerkUserId, plan: "free", trialEndsAt: new Date() })
    .returning();
  return created;
}

export async function getMonthlyInvoiceCount(clerkUserId: string): Promise<number> {
  const db = getDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [result] = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(eq(invoices.clerkUserId, clerkUserId), gte(invoices.createdAt, startOfMonth)));
  return Number(result?.count ?? 0);
}

export function evaluateStatus(sub: Subscription, monthlyUsage = 0, commercialPlan?: CommercialPlan): SubscriptionStatus {
  const now = Date.now();
  const trialEnd = sub.trialEndsAt.getTime();
  const periodEnd = sub.currentPeriodEnd?.getTime() ?? 0;

  const trialActive = sub.plan === "trial" && trialEnd > now;
  const paid = (sub.plan === "basic" || sub.plan === "pro") && periodEnd > now;
  const isFree = sub.plan === "free";
  const daysRemaining = trialActive ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;
  const effectivePlan = commercialPlan ?? (trialActive ? "trial" : paid ? sub.plan : isFree ? "free" : sub.plan === "canceled" ? "canceled" : "expired");
  const planConfig = getPlanConfig(effectivePlan);

  return {
    plan: sub.plan,
    commercialPlan: effectivePlan,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    daysRemaining,
    canSend: trialActive || paid || isFree,
    trialActive,
    paid,
    isFree,
    monthlyUsage,
    monthlyLimit: isFree ? FREE_MONTHLY_LIMIT : null,
    ocrDocumentsMonthly: planConfig.ocrDocumentsMonthly,
    ocrPagesMonthly: planConfig.ocrPagesMonthly,
    companyLimit: planConfig.companyLimit,
  };
}

export async function getStatus(clerkUserId: string): Promise<SubscriptionStatus> {
  const sub = await getOrCreateSubscription(clerkUserId);
  const [monthlyUsage, commercialPlan] = await Promise.all([
    sub.plan === "free" ? getMonthlyInvoiceCount(clerkUserId) : Promise.resolve(0),
    getCommercialPlanCode(clerkUserId),
  ]);
  return evaluateStatus(sub, monthlyUsage, commercialPlan);
}
