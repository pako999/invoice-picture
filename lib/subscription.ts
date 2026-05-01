import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions, type Subscription } from "@/lib/schema";

export const TRIAL_DAYS = 7;

export interface SubscriptionStatus {
  plan: Subscription["plan"];
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  canSend: boolean;
  trialActive: boolean;
  paid: boolean;
}

export async function getOrCreateSubscription(clerkUserId: string): Promise<Subscription> {
  const db = getDb();
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.clerkUserId, clerkUserId)).limit(1);
  if (existing) return existing;

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const [created] = await db
    .insert(subscriptions)
    .values({ clerkUserId, plan: "trial", trialEndsAt })
    .returning();
  return created;
}

export function evaluateStatus(sub: Subscription): SubscriptionStatus {
  const now = Date.now();
  const trialEnd = sub.trialEndsAt.getTime();
  const periodEnd = sub.currentPeriodEnd?.getTime() ?? 0;

  const trialActive = sub.plan === "trial" && trialEnd > now;
  const paid = (sub.plan === "basic" || sub.plan === "pro") && periodEnd > now;
  const daysRemaining = trialActive ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

  return {
    plan: sub.plan,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    daysRemaining,
    canSend: trialActive || paid,
    trialActive,
    paid,
  };
}

export async function getStatus(clerkUserId: string): Promise<SubscriptionStatus> {
  const sub = await getOrCreateSubscription(clerkUserId);
  return evaluateStatus(sub);
}
