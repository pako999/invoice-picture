import { UserGuideContent } from "@/components/user-guide-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "OCR Reader User Guide",
  description:
    "Complete Slikaj Račun guide: AI OCR Reader, multi-invoice PDF splitting, invoice review and approval, and delivery by email, XML, ZIP or API.",
  slug: "navodila-za-uporabo",
  locale: "en",
});

export default function UserGuide() {
  return <UserGuideContent locale="en" />;
}
