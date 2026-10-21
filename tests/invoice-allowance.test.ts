import test from "node:test";
import assert from "node:assert/strict";
import { ocrAllowanceUsage, hasOcrDocumentCapacity } from "../lib/invoice-intelligence/allowance";
import { PLAN_CONFIGS, PAID_PLANS } from "../lib/plans";

test("paid OCR limits depend on pages even when document telemetry exceeds the retired cap", () => {
  for (const plan of PAID_PLANS) {
    const config = PLAN_CONFIGS[plan];
    assert.equal(hasOcrDocumentCapacity(config.ocrDocumentsMonthly, 50_000, 500), true);
    const usage = ocrAllowanceUsage({ monthlyDocumentLimit: config.ocrDocumentsMonthly, monthlyPageLimit: config.ocrPagesMonthly, monthDocuments: 50_000, monthPages: 1 });
    assert.equal(usage.warningLevel, "ok");
    assert.equal(usage.remainingDocuments, null);
    assert.equal(usage.documentPercent, 0);
    assert.equal(usage.remainingPages, config.ocrPagesMonthly - 1);
  }
});

test("150 single-page invoices and 50 three-page invoices exhaust the same Basic allowance", () => {
  for (const monthDocuments of [150, 50]) {
    const usage = ocrAllowanceUsage({ monthlyDocumentLimit: null, monthlyPageLimit: 150, monthDocuments, monthPages: 150 });
    assert.equal(usage.warningLevel, "blocked");
    assert.equal(usage.remainingPages, 0);
  }
  assert.equal(ocrAllowanceUsage({ monthlyDocumentLimit: null, monthlyPageLimit: 150, monthDocuments: 149, monthPages: 149 }).warningLevel, "critical");
});

test("free and trial document caps remain enforced alongside their page allowance", () => {
  for (const plan of ["free", "trial"] as const) {
    const config = PLAN_CONFIGS[plan];
    assert.equal(hasOcrDocumentCapacity(config.ocrDocumentsMonthly, config.ocrDocumentsMonthly!), false);
    assert.equal(hasOcrDocumentCapacity(config.ocrDocumentsMonthly, 0, config.ocrDocumentsMonthly!), true);
    assert.equal(hasOcrDocumentCapacity(config.ocrDocumentsMonthly, 1, config.ocrDocumentsMonthly!), false);
    assert.equal(ocrAllowanceUsage({ monthlyDocumentLimit: config.ocrDocumentsMonthly, monthlyPageLimit: config.ocrPagesMonthly, monthDocuments: config.ocrDocumentsMonthly!, monthPages: 1 }).warningLevel, "blocked");
  }
});

test("page warnings use the actual allowance and do not block early through rounding", () => {
  const usage = (monthPages: number) => ocrAllowanceUsage({ monthlyDocumentLimit: null, monthlyPageLimit: 5500, monthDocuments: 0, monthPages });
  assert.equal(usage(4399).warningLevel, "ok");
  assert.equal(usage(4400).warningLevel, "warning");
  assert.equal(usage(5225).warningLevel, "critical");
  assert.equal(usage(5499).warningLevel, "critical");
  assert.equal(usage(5500).warningLevel, "blocked");
  assert.equal(usage(5501).remainingPages, 0);
  assert.equal(ocrAllowanceUsage({ monthlyDocumentLimit: 0, monthlyPageLimit: 0, monthDocuments: 0, monthPages: 0 }).warningLevel, "blocked");
});
