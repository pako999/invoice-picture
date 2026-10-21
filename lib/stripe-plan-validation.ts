import type Stripe from "stripe";
import { PAID_PLANS, PLAN_CONFIGS, type BillingPeriod, type PaidPlan } from "@/lib/plans";

/** Resolve the purchased plan from Stripe's actual recurring price, never UI metadata alone. */
export function matchStripePlan(price: Pick<Stripe.Price,"unit_amount"|"currency"|"recurring"|"metadata"|"tax_behavior">): {tier:PaidPlan;billing:BillingPeriod}|null {
  const billing = price.recurring?.interval === "year" ? "yearly" : price.recurring?.interval === "month" ? "monthly" : null;
  if(!billing || price.recurring?.interval_count !== 1 || price.currency !== "eur" || price.tax_behavior !== "exclusive")return null;
  const tier=PAID_PLANS.find(plan=>price.metadata.plan===plan);
  if(!tier || (price.metadata.billing && price.metadata.billing!==billing))return null;
  const c=PLAN_CONFIGS[tier];
  return price.unit_amount===Math.round((billing==="yearly"?c.yearlyPrice!:c.monthlyPrice!)*100)?{tier,billing}:null;
}
