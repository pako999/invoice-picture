import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { brandedEmail } from "@/lib/email-template";
import { baseSubscriptionPlan, clearCommercialPlanEntitlement, setCommercialPlanEntitlement } from "@/lib/plan-entitlements";
import { isPaidPlan, planLabel, type BillingPeriod, type PaidPlan } from "@/lib/plans";
import { getResend } from "@/lib/resend";
import { subscriptions } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";

export type StripePlanMetadata = {
  clerkUserId?: string;
  customerEmail?: string;
  tier?: string;
  billing?: string;
  previousSubscriptionId?: string;
};

function addPeriod(from: Date, billing: BillingPeriod) {
  const value = new Date(from);
  if (billing === "yearly") value.setUTCFullYear(value.getUTCFullYear() + 1);
  else value.setUTCMonth(value.getUTCMonth() + 1);
  return value;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription, billing: BillingPeriod) {
  const itemEnds = subscription.items.data.map((item) => item.current_period_end).filter((value) => Number.isFinite(value));
  const unixSeconds = itemEnds.length ? Math.max(...itemEnds) : null;
  return unixSeconds ? new Date(unixSeconds * 1000) : addPeriod(new Date(), billing);
}

function stripeCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
}

async function customerEmail(userId: string, supplied?: string) {
  if (supplied) return supplied;
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    return (user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId) ?? user.emailAddresses[0])?.emailAddress;
  } catch {
    return undefined;
  }
}

async function sendActivation(userId: string, tier: PaidPlan, suppliedEmail?: string) {
  const email = await customerEmail(userId, suppliedEmail);
  if (!email) return;
  const result = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "Vaš paket Slikaj Račun je aktiviran",
    html: brandedEmail({
      preheader: "Plačilo je uspešno in paket je aktiviran",
      eyebrow: "Uspešno plačilo",
      title: "Vaš paket je aktiviran",
      introHtml: `<p style="margin:0">Hvala za plačilo. Paket <strong>${planLabel(tier)}</strong> je aktiviran in ga lahko takoj uporabljate.</p>`,
      noticeHtml: "AI OCR limiti in funkcije paketa so že aktivni.",
      cta: { label: "Odpri Slikaj Račun", url: "https://www.posljiracun.si/scan" },
    }),
  });
  if (result.error) console.error("[stripe] activation email failed", result.error);
}

async function cancelPreviousSubscription(previousSubscriptionId: string | undefined, activeSubscriptionId: string) {
  if (!previousSubscriptionId || previousSubscriptionId === activeSubscriptionId) return;
  try {
    const previous = await getStripe().subscriptions.retrieve(previousSubscriptionId);
    if (previous.status !== "canceled") await getStripe().subscriptions.cancel(previousSubscriptionId);
  } catch (error) {
    if ((error as { code?: string }).code === "resource_missing") return;
    throw error;
  }
}

export async function activateStripeSubscription(subscription: Stripe.Subscription, fallbackMetadata: StripePlanMetadata = {}) {
  const metadata = { ...fallbackMetadata, ...subscription.metadata };
  const userId = metadata.clerkUserId;
  const tier = metadata.tier;
  const billing: BillingPeriod = metadata.billing === "yearly" ? "yearly" : "monthly";
  if (!userId || !isPaidPlan(tier)) {
    console.warn("[stripe] invalid or missing plan metadata", { subscriptionId: subscription.id, tier, hasUserId: Boolean(userId) });
    return false;
  }

  const now = new Date();
  const currentPeriodEnd = subscriptionPeriodEnd(subscription, billing);
  const db = getDb();
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.clerkUserId, userId)).limit(1);
  const previousSubscriptionId = metadata.previousSubscriptionId || existing?.stripeSubscriptionId || undefined;
  const isNewPaidSubscription = existing?.stripeSubscriptionId !== subscription.id;
  const basePlan = baseSubscriptionPlan(tier);

  await db.insert(subscriptions).values({
    clerkUserId: userId,
    plan: basePlan,
    trialEndsAt: now,
    currentPeriodEnd,
    stripeCustomerId: stripeCustomerId(subscription),
    stripeSubscriptionId: subscription.id,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: subscriptions.clerkUserId,
    set: {
      plan: basePlan,
      currentPeriodEnd,
      stripeCustomerId: stripeCustomerId(subscription),
      stripeSubscriptionId: subscription.id,
      updatedAt: now,
    },
  });
  await setCommercialPlanEntitlement({ clerkUserId: userId, plan: tier, billing, source: "stripe" });
  await cancelPreviousSubscription(previousSubscriptionId, subscription.id);
  console.info("[stripe] commercial plan activated after confirmed payment", { userId, tier, billing, currentPeriodEnd: currentPeriodEnd.toISOString() });
  if (isNewPaidSubscription) await sendActivation(userId, tier, metadata.customerEmail).catch((error) => console.error("[stripe] activation email", error));
  return true;
}

export async function refreshStripeSubscription(subscription: Stripe.Subscription) {
  const db = getDb();
  const [stored] = await db.select({ clerkUserId: subscriptions.clerkUserId }).from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1);
  if (!stored) return false;
  return activateStripeSubscription(subscription, { clerkUserId: stored.clerkUserId });
}

export async function cancelStripeSubscription(subscription: Stripe.Subscription) {
  const db = getDb();
  const [stored] = await db.select({ clerkUserId: subscriptions.clerkUserId }).from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1);
  if (!stored) {
    console.info("[stripe] ignored cancellation for superseded subscription", { subscriptionId: subscription.id });
    return false;
  }
  await db.update(subscriptions).set({ plan: "canceled", updatedAt: new Date() }).where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  await clearCommercialPlanEntitlement(stored.clerkUserId);
  return true;
}
