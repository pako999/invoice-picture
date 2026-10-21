import type Stripe from "stripe";
import { PAID_PLANS, PLAN_CONFIGS, type BillingPeriod, type PaidPlan } from "@/lib/plans";

// Exact retired prices are accepted only for existing subscription events, never new checkout.
const LEGACY_PRICES: Record<string, { tier: PaidPlan; billing: BillingPeriod; amount: number }> = {
  price_1URVYoIhs4eVf4aqgnKIHhW3: { tier: "basic", billing: "monthly", amount: 1350 },
  price_1URVYuIhs4eVf4aqrG8uBjNy: { tier: "basic", billing: "yearly", amount: 13500 },
  price_1URVYuIhs4eVf4aq9Eila7of: { tier: "pro", billing: "monthly", amount: 4800 },
  price_1URVYvIhs4eVf4aqzVKb8nPe: { tier: "pro", billing: "yearly", amount: 48000 },
};

/** Resolve the purchased plan from Stripe's actual recurring price, never UI metadata alone. */
export function matchStripePlan(price: Pick<Stripe.Price,"unit_amount"|"currency"|"recurring"|"metadata"|"tax_behavior"> & { id?: string }, options: { allowLegacy?: boolean } = {}): {tier:PaidPlan;billing:BillingPeriod}|null {
  const billing = price.recurring?.interval === "year" ? "yearly" : price.recurring?.interval === "month" ? "monthly" : null;
  if(!billing || price.recurring?.interval_count !== 1 || price.currency !== "eur" || price.tax_behavior !== "exclusive")return null;
  const tier=PAID_PLANS.find(plan=>price.metadata.plan===plan);
  if(!tier || (price.metadata.billing && price.metadata.billing!==billing))return null;
  const c=PLAN_CONFIGS[tier];
  const legacy = price.id ? LEGACY_PRICES[price.id] : undefined;
  if (options.allowLegacy && legacy?.tier === tier && legacy.billing === billing && legacy.amount === price.unit_amount) return { tier, billing };
  return price.unit_amount===Math.round((billing==="yearly"?c.yearlyPrice!:c.monthlyPrice!)*100)?{tier,billing}:null;
}
