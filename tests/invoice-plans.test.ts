import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OCR_OVERRIDE, PLAN_CONFIGS, getPlanConfig, isPaidPlan } from "../lib/plans";

test("commercial OCR plans expose agreed prices and limits",()=>{
  assert.deepEqual([PLAN_CONFIGS.basic.monthlyPrice,PLAN_CONFIGS.basic.ocrDocumentsMonthly,PLAN_CONFIGS.basic.ocrPagesMonthly,PLAN_CONFIGS.basic.companyLimit],[9.9,50,75,1]);
  assert.deepEqual([PLAN_CONFIGS.pro.monthlyPrice,PLAN_CONFIGS.pro.ocrDocumentsMonthly,PLAN_CONFIGS.pro.ocrPagesMonthly,PLAN_CONFIGS.pro.companyLimit],[29.9,500,600,3]);
  assert.deepEqual([PLAN_CONFIGS.accounting_pro.monthlyPrice,PLAN_CONFIGS.accounting_pro.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_pro.ocrPagesMonthly,PLAN_CONFIGS.accounting_pro.companyLimit],[59.95,2000,2500,null]);
  assert.deepEqual([PLAN_CONFIGS.accounting_max.monthlyPrice,PLAN_CONFIGS.accounting_max.ocrDocumentsMonthly,PLAN_CONFIGS.accounting_max.ocrPagesMonthly,PLAN_CONFIGS.accounting_max.companyLimit],[134.95,5000,5500,null]);
});

test("yearly prices and delivery entitlements are correct",()=>{
  assert.equal(PLAN_CONFIGS.basic.yearlyPrice,99);assert.equal(PLAN_CONFIGS.pro.yearlyPrice,299);assert.equal(PLAN_CONFIGS.accounting_pro.yearlyPrice,599.5);assert.equal(PLAN_CONFIGS.accounting_max.yearlyPrice,1349.5);
  assert.equal(PLAN_CONFIGS.basic.structuredDelivery,true);assert.equal(PLAN_CONFIGS.basic.apiDelivery,false);assert.equal(PLAN_CONFIGS.pro.apiDelivery,true);assert.equal(PLAN_CONFIGS.accounting_pro.priorityProcessing,true);
});

test("admin OCR override is 1000 pages per day",()=>{assert.equal(ADMIN_OCR_OVERRIDE.email,"info@surf-store.com");assert.equal(ADMIN_OCR_OVERRIDE.dailyPages,1000);assert.equal(ADMIN_OCR_OVERRIDE.monthlyPages,30000);});

test("paid plan detection does not treat free/trial as paid",()=>{assert.equal(isPaidPlan("accounting_max"),true);assert.equal(isPaidPlan("trial"),false);assert.equal(getPlanConfig("missing").code,"free");});
