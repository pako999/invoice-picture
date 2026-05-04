import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with the SlikajRačun team. Email info@posljiracun.si, phone +386 41 580 250. Setup help, integrations and technical support.",
  slug: "contact",
  locale: "en",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
