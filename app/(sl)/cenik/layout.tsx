import { pageMetadata } from "@/lib/seo";
import { PLAN_CONFIGS, formatEur } from "@/lib/plans";

export const metadata = pageMetadata({
  title: "Cena OCR obdelave računov",
  description: `Osnovni: ${formatEur(PLAN_CONFIGS.basic.monthlyPrice!)} za ${PLAN_CONFIGS.basic.ocrPagesMonthly} OCR strani/mesec. PRO: ${formatEur(PLAN_CONFIGS.pro.monthlyPrice!)} za ${PLAN_CONFIGS.pro.ocrPagesMonthly} strani/mesec. Cene brez DDV. Pri letnem plačilu 2 meseca brezplačno, brezplačen paket za preizkus.`,
  slug: "cenik",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) { return children; }
