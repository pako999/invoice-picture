import { UserGuideContent } from "@/components/user-guide-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Navodila za uporabo OCR Readerja",
  description:
    "Celoten vodnik za Slikaj Račun: AI OCR Reader, razdeljevanje PDF-jev, pregled in potrjevanje računov ter dostava prek e-pošte, XML, ZIP ali API-ja.",
  slug: "navodila-za-uporabo",
});

export default function Navodila() {
  return <UserGuideContent locale="sl" />;
}
