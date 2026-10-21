import type { BillingPeriod, PaidPlan } from "@/lib/plans";

const STRIPE_PRICE_IDS: Record<PaidPlan, Record<BillingPeriod, () => string | undefined>> = {
  basic: {
    monthly: () => process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    yearly: () => process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: () => process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearly: () => process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  accounting_pro: {
    monthly: () => process.env.STRIPE_ACCOUNTING_PRO_MONTHLY_PRICE_ID,
    yearly: () => process.env.STRIPE_ACCOUNTING_PRO_YEARLY_PRICE_ID,
  },
  accounting_max: {
    monthly: () => process.env.STRIPE_ACCOUNTING_MAX_MONTHLY_PRICE_ID,
    yearly: () => process.env.STRIPE_ACCOUNTING_MAX_YEARLY_PRICE_ID,
  },
};

export function getStripePriceId(plan: PaidPlan, billing: BillingPeriod) {
  return STRIPE_PRICE_IDS[plan][billing]();
}

/** Validate configured IDs and fall back to the matching catalog price if an env ID is missing. */
export async function getVerifiedStripePriceId(plan: PaidPlan, billing: BillingPeriod) {
  const { getStripe } = await import("@/lib/stripe");
  const { matchStripePlan } = await import("@/lib/stripe-plan-validation");
  const stripe=getStripe(), configured=getStripePriceId(plan,billing);
  const prices=configured?[await stripe.prices.retrieve(configured)]: (await stripe.prices.list({active:true,currency:"eur",type:"recurring",limit:100})).data;
  const match=prices.find(price=>{const p=matchStripePlan(price);return price.active&&p?.tier===plan&&p.billing===billing;});
  if(!match)throw new Error("Stripe price does not match the selected plan and billing period");
  return match.id;
}
