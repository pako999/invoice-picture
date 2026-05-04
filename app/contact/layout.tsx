import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Kontakt",
  description: "Stopite v stik z ekipo SlikajRačun. Email info@posljiracun.si, telefon 041 580 250. Pomoč pri nastavitvi računovodskega programa, integracije in tehnična podpora.",
  slug: "contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
