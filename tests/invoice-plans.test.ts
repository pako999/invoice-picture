import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OCR_OVERRIDE, PLAN_CONFIGS, getPlanConfig, isPaidPlan, nextPaidPlan, planPagePrice, recommendedOcrPlan } from "../lib/plans";

test("commercial OCR plans expose agreed prices and limits",()=>{
  assert.deepEqual([PLAN_CONFIGS.basic.monthlyPrice,PLAN_CONFIGS.basic.ocrDocumentsMonthly,PLAN_CONFIGS.basic.ocrPagesMonthly,PLAN_CONFIGS.basic.companyLimit],[16.5,null,150,1]);
  assert.deepEqual([PLAN_CONFIGS.pro.monthlyPrice,PLAN_CONFIGS.pro.ocrDocumentsMonthly,PLAN_CONFIGS.pro.ocrPagesMonthly,PLAN_CONFIGS.pro.companyLimit],[54,null,600,3]);
  assert.deepEqual([PLAN_CONFIGS.accounting_pro.monthlyPrice,PLAN_CONFIGS.accounting_pro.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_pro.ocrPagesMonthly,PLAN_CONFIGS.accounting_pro.companyLimit],[125,null,2500,null]);
  assert.deepEqual([PLAN_CONFIGS.accounting_max.monthlyPrice,PLAN_CONFIGS.accounting_max.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_max.ocrPagesMonthly,PLAN_CONFIGS.accounting_max.companyLimit],[199,null,5500,null]);
});

test("yearly prices and delivery entitlements are correct",()=>{
  assert.equal(PLAN_CONFIGS.basic.yearlyPrice,165);assert.equal(PLAN_CONFIGS.pro.yearlyPrice,540);assert.equal(PLAN_CONFIGS.accounting_pro.yearlyPrice,1250);assert.equal(PLAN_CONFIGS.accounting_max.yearlyPrice,1990);
  assert.equal(PLAN_CONFIGS.basic.structuredDelivery,true);assert.equal(PLAN_CONFIGS.basic.apiDelivery,false);assert.equal(PLAN_CONFIGS.pro.apiDelivery,true);assert.equal(PLAN_CONFIGS.accounting_pro.priorityProcessing,true);
});

test("admin OCR override is 1000 pages per day",()=>{assert.equal(ADMIN_OCR_OVERRIDE.email,"info@surf-store.com");assert.equal(ADMIN_OCR_OVERRIDE.dailyPages,1000);assert.equal(ADMIN_OCR_OVERRIDE.monthlyPages,30000);});

test("paid plan detection does not treat free/trial as paid",()=>{assert.equal(isPaidPlan("accounting_max"),true);assert.equal(isPaidPlan("trial"),false);assert.equal(getPlanConfig("missing").code,"free");});

test("quota upgrades always point to the next useful paid plan",()=>{
  assert.equal(nextPaidPlan("free"),"basic");
  assert.equal(nextPaidPlan("trial"),"pro");
  assert.equal(nextPaidPlan("basic"),"pro");
  assert.equal(nextPaidPlan("pro"),"accounting_pro");
  assert.equal(nextPaidPlan("accounting_pro"),"accounting_max");
  assert.equal(nextPaidPlan("accounting_max"),null);
});

test("included team users count the owner and grow with the plan",()=>{
  assert.deepEqual([PLAN_CONFIGS.free.userLimit,PLAN_CONFIGS.basic.userLimit,PLAN_CONFIGS.pro.userLimit,PLAN_CONFIGS.accounting_pro.userLimit,PLAN_CONFIGS.accounting_max.userLimit],[1,1,3,5,10]);
});


test("the calculator uses OCR pages, including invoices above the retired document caps", () => {
  for (const count of [10, 50, 100, 150]) assert.equal(recommendedOcrPlan(count, 1), "basic");
  assert.equal(recommendedOcrPlan(160, 1), "pro");
  assert.equal(recommendedOcrPlan(50, 3), "basic");
  assert.equal(recommendedOcrPlan(60, 3), "pro");
  assert.equal(recommendedOcrPlan(600, 1), "pro");
  assert.equal(recommendedOcrPlan(610, 1), "accounting_pro");
  assert.equal(recommendedOcrPlan(2500, 1), "accounting_pro");
  assert.equal(recommendedOcrPlan(2510, 1), "accounting_max");
  assert.equal(recommendedOcrPlan(5500, 1), "accounting_max");
  assert.equal(recommendedOcrPlan(5510, 1), null);
});

test("page rates are fixed by the selected plan and annual discounts keep monthly quotas", () => {
  assert.equal(planPagePrice("basic"), 0.11);
  assert.equal(planPagePrice("pro"), 0.09);
  assert.equal(planPagePrice("basic", "yearly"), 165 / 12 / 150);
  assert.equal(planPagePrice("pro", "yearly"), 540 / 12 / 600);
  assert.equal(PLAN_CONFIGS.basic.ocrPagesMonthly, 150);
  assert.equal(PLAN_CONFIGS.pro.ocrPagesMonthly, 600);
});
