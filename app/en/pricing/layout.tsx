import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "Basic at €6.99 / month, PRO Accounting at €17.99 / month. -20% yearly. No lock-in, cancel anytime. Unlimited photographs and sends.",
  slug: "cenik",
  locale: "en",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
