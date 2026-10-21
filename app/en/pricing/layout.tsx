import { pageMetadata } from "@/lib/seo";
import { PLAN_CONFIGS, formatEur } from "@/lib/plans";

export const metadata = pageMetadata({
  title: "Invoice OCR pricing: businesses and accounting firms",
  description: `Basic: ${formatEur(PLAN_CONFIGS.basic.monthlyPrice!, "en")}/month for ${PLAN_CONFIGS.basic.ocrPagesMonthly} OCR pages. PRO: ${formatEur(PLAN_CONFIGS.pro.monthlyPrice!, "en")}/month for ${PLAN_CONFIGS.pro.ocrPagesMonthly} pages. Prices exclude VAT. Annual billing: 2 months free.`,
  slug: "cenik",
  locale: "en",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) { return children; }
