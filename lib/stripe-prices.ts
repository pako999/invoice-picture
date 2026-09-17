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
