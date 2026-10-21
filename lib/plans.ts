export type CommercialPlan = "free" | "trial" | "basic" | "pro" | "accounting_pro" | "accounting_max" | "expired" | "canceled";
export type PaidPlan = "basic" | "pro" | "accounting_pro" | "accounting_max";
export type BillingPeriod = "monthly" | "yearly";

export type PlanConfig = {
  code: CommercialPlan;
  nameSl: string;
  nameEn: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  /** null means pages are the only commercial OCR limit. */
  ocrDocumentsMonthly: number | null;
  ocrPagesMonthly: number;
  companyLimit: number | null;
  userLimit: number;
  unlimitedOriginalSending: boolean;
  structuredDelivery: boolean;
  apiDelivery: boolean;
  priorityProcessing: boolean;
};

export const PLAN_CONFIGS: Record<CommercialPlan, PlanConfig> = {
  free: { userLimit: 1, code: "free", nameSl: "Brezplačen", nameEn: "Free", monthlyPrice: 0, yearlyPrice: 0, ocrDocumentsMonthly: 3, ocrPagesMonthly: 10, companyLimit: 1, unlimitedOriginalSending: false, structuredDelivery: false, apiDelivery: false, priorityProcessing: false },
  trial: { userLimit: 1, code: "trial", nameSl: "Preizkusni", nameEn: "Trial", monthlyPrice: null, yearlyPrice: null, ocrDocumentsMonthly: 50, ocrPagesMonthly: 75, companyLimit: 1, unlimitedOriginalSending: true, structuredDelivery: true, apiDelivery: false, priorityProcessing: false },
  basic: { userLimit: 1, code: "basic", nameSl: "Osnovni", nameEn: "Basic", monthlyPrice: 16.50, yearlyPrice: 165, ocrDocumentsMonthly: null, ocrPagesMonthly: 150, companyLimit: 1, unlimitedOriginalSending: true, structuredDelivery: true, apiDelivery: false, priorityProcessing: false },
  pro: { userLimit: 3, code: "pro", nameSl: "PRO", nameEn: "PRO", monthlyPrice: 54, yearlyPrice: 540, ocrDocumentsMonthly: null, ocrPagesMonthly: 600, companyLimit: 3, unlimitedOriginalSending: true, structuredDelivery: true, apiDelivery: true, priorityProcessing: false },
  accounting_pro: { userLimit: 5, code: "accounting_pro", nameSl: "Računovodstvo PRO", nameEn: "Accounting PRO", monthlyPrice: 125, yearlyPrice: 1250, ocrDocumentsMonthly: null, ocrPagesMonthly: 2500, companyLimit: null, unlimitedOriginalSending: true, structuredDelivery: true, apiDelivery: true, priorityProcessing: true },
  accounting_max: { userLimit: 10, code: "accounting_max", nameSl: "Računovodstvo MAX", nameEn: "Accounting MAX", monthlyPrice: 199, yearlyPrice: 1990, ocrDocumentsMonthly: null, ocrPagesMonthly: 5500, companyLimit: null, unlimitedOriginalSending: true, structuredDelivery: true, apiDelivery: true, priorityProcessing: true },
  expired: { userLimit: 1, code: "expired", nameSl: "Potekel", nameEn: "Expired", monthlyPrice: null, yearlyPrice: null, ocrDocumentsMonthly: 0, ocrPagesMonthly: 0, companyLimit: 0, unlimitedOriginalSending: false, structuredDelivery: false, apiDelivery: false, priorityProcessing: false },
  canceled: { userLimit: 1, code: "canceled", nameSl: "Preklican", nameEn: "Canceled", monthlyPrice: null, yearlyPrice: null, ocrDocumentsMonthly: 0, ocrPagesMonthly: 0, companyLimit: 0, unlimitedOriginalSending: false, structuredDelivery: false, apiDelivery: false, priorityProcessing: false },
};

export const PAID_PLANS: PaidPlan[] = ["basic", "pro", "accounting_pro", "accounting_max"];
export const OCR_PAGE_ADDONS = [{ pages: 100, price: 3.90 }, { pages: 500, price: 19.90 }, { pages: 1000, price: 39.90 }] as const;
export const ADMIN_OCR_OVERRIDE = { email: "info@surf-store.com", dailyPages: 1000, monthlyPages: 30000, monthlyDocuments: 30000 } as const;

export function normalizePlan(value: string | null | undefined): CommercialPlan { return value && value in PLAN_CONFIGS ? value as CommercialPlan : "free"; }
export function getPlanConfig(value: string | null | undefined) { return PLAN_CONFIGS[normalizePlan(value)]; }
export function isPaidPlan(value: string | null | undefined): value is PaidPlan { return PAID_PLANS.includes(value as PaidPlan); }
export function planLabel(value: string | null | undefined, locale: "sl" | "en" = "sl") { const p = getPlanConfig(value); return locale === "en" ? p.nameEn : p.nameSl; }
export function planPrice(value: PaidPlan, billing: BillingPeriod) { const p = PLAN_CONFIGS[value]; return billing === "yearly" ? p.yearlyPrice! : p.monthlyPrice!; }
export function formatEur(value: number, locale: "sl" | "en" = "sl") { return new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(value) + " €"; }
export function planPagePrice(value: PaidPlan, billing: BillingPeriod = "monthly") { const p = PLAN_CONFIGS[value]; return (billing === "yearly" ? p.yearlyPrice! / 12 : p.monthlyPrice!) / p.ocrPagesMonthly; }
export function formatPagePrice(value: number, locale: "sl" | "en" = "sl") { return new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value) + " €"; }
export function recommendedOcrPlan(documents: number, pagesPerDocument: number): PaidPlan | null {
  return PAID_PLANS.find(code => PLAN_CONFIGS[code].ocrPagesMonthly >= documents * pagesPerDocument) ?? null;
}

export function nextPaidPlan(value: CommercialPlan): PaidPlan | null {
  switch (value) {
    case "free":
    case "expired":
    case "canceled":
      return "basic";
    case "trial":
    case "basic":
      return "pro";
    case "pro":
      return "accounting_pro";
    case "accounting_pro":
      return "accounting_max";
    case "accounting_max":
      return null;
  }
}
