import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OCR_OVERRIDE, PLAN_CONFIGS, getPlanConfig, isPaidPlan, nextPaidPlan } from "../lib/plans";

test("commercial OCR plans expose agreed prices and limits",()=>{
  assert.deepEqual([PLAN_CONFIGS.basic.monthlyPrice,PLAN_CONFIGS.basic.ocrDocumentsMonthly,PLAN_CONFIGS.basic.ocrPagesMonthly,PLAN_CONFIGS.basic.companyLimit],[13.5,50,150,1]);
  assert.deepEqual([PLAN_CONFIGS.pro.monthlyPrice,PLAN_CONFIGS.pro.ocrDocumentsMonthly,PLAN_CONFIGS.pro.ocrPagesMonthly,PLAN_CONFIGS.pro.companyLimit],[48,500,600,3]);
  assert.deepEqual([PLAN_CONFIGS.accounting_pro.monthlyPrice,PLAN_CONFIGS.accounting_pro.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_pro.ocrPagesMonthly,PLAN_CONFIGS.accounting_pro.companyLimit],[125,2000,2500,null]);
  assert.deepEqual([PLAN_CONFIGS.accounting_max.monthlyPrice,PLAN_CONFIGS.accounting_max.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_max.ocrPagesMonthly,PLAN_CONFIGS.accounting_max.companyLimit],[199,5000,5500,null]);
});

test("yearly prices and delivery entitlements are correct",()=>{
  assert.equal(PLAN_CONFIGS.basic.yearlyPrice,135);assert.equal(PLAN_CONFIGS.pro.yearlyPrice,480);assert.equal(PLAN_CONFIGS.accounting_pro.yearlyPrice,1250);assert.equal(PLAN_CONFIGS.accounting_max.yearlyPrice,1990);
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
