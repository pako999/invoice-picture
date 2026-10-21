import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { PAID_PLANS,PLAN_CONFIGS } from "../lib/plans";
import { matchStripePlan } from "../lib/stripe-plan-validation";
import { memberHasSeat } from "../lib/workspace-limits";
function price(plan="pro",amount=5400,interval="month") {return {unit_amount:amount,currency:"eur",metadata:{plan,billing:interval==="month"?"monthly":"yearly"},tax_behavior:"exclusive",recurring:{interval,interval_count:1}} as unknown as Stripe.Price;}
test("all eight Stripe recurring prices resolve to the configured plan and billing period",()=>{
 for(const plan of PAID_PLANS)for(const billing of ["monthly","yearly"] as const){const c=PLAN_CONFIGS[plan],p=price(plan,Math.round((billing==="monthly"?c.monthlyPrice!:c.yearlyPrice!)*100),billing==="monthly"?"month":"year");assert.deepEqual(matchStripePlan(p),{tier:plan,billing});}
});
test("mismatched, discounted legacy, foreign-currency and inclusive prices cannot activate a different tier",()=>{
 const p=price();assert.equal(matchStripePlan({...p,unit_amount:2990}),null);assert.equal(matchStripePlan({...p,currency:"usd"}),null);assert.equal(matchStripePlan({...p,tax_behavior:"inclusive"}),null);assert.equal(matchStripePlan({...p,metadata:{plan:"accounting_max",billing:"monthly"}}),null);assert.equal(matchStripePlan({...p,recurring:{...p.recurring!,interval_count:2}}),null);assert.equal(matchStripePlan({...p,metadata:{plan:"pro",billing:"yearly"}}),null);
});
test("workspace access requires a current seat, reserves the owner and blocks excess members after downgrade",()=>{
 const members=["first","second","third","fourth"];
 assert.equal(memberHasSeat("owner","owner",members,1),true);
 assert.equal(memberHasSeat("outsider","owner",members,10),false);
 assert.equal(memberHasSeat("first","owner",members,1),false);
 assert.equal(memberHasSeat("second","owner",members,3),true);
 assert.equal(memberHasSeat("third","owner",members,3),false);
 assert.equal(memberHasSeat("fourth","owner",members,5),true);
 assert.equal(memberHasSeat("first","owner",[],5),false);
});


test("retired prices renew existing subscriptions but cannot be used for new checkout", () => {
  for (const [id, tier, amount, interval] of [
    ["price_1URVYoIhs4eVf4aqgnKIHhW3", "basic", 1350, "month"],
    ["price_1URVYuIhs4eVf4aqrG8uBjNy", "basic", 13500, "year"],
    ["price_1URVYuIhs4eVf4aq9Eila7of", "pro", 4800, "month"],
    ["price_1URVYvIhs4eVf4aqzVKb8nPe", "pro", 48000, "year"],
  ] as const) {
    const p = { ...price(tier, amount, interval), id };
    assert.equal(matchStripePlan(p), null);
    assert.deepEqual(matchStripePlan(p, { allowLegacy: true }), { tier, billing: interval === "month" ? "monthly" : "yearly" });
    assert.equal(matchStripePlan({ ...p, id: "price_unverified" }, { allowLegacy: true }), null);
    assert.equal(matchStripePlan({ ...p, unit_amount: amount - 1 }, { allowLegacy: true }), null);
    assert.equal(matchStripePlan({ ...p, metadata: { plan: "accounting_max" } }, { allowLegacy: true }), null);
  }
});
