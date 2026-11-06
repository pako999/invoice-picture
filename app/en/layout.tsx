import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { SITE_URL } from "@/lib/i18n/config";
import { SiteShell } from "@/components/site-shell";

const enDict = getDict("en");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: enDict.home.metaTitle,
    template: "%s — Slikaj Račun",
  },
  description: enDict.home.metaDescription,
  keywords: [
    "invoice OCR Slovenia",
    "invoice scanner app Slovenia",
    "invoice data extraction",
    "accounting software Slovenia",
    "invoice automation",
    "UBL invoices",
    "eSLOG",
    "accounting integrations Slovenia",
  ],
  alternates: {
    canonical: "/en",
    languages: {
      "sl-SI": "/",
      "en": "/en",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["sl_SI"],
    url: `${SITE_URL}/en`,
    siteName: "Slikaj Račun",
    title: enDict.home.metaTitle,
    description: enDict.home.metaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: enDict.home.metaTitle,
    description: enDict.home.metaDescription,
  },
  authors: [{ name: "Sport Group d.o.o." }],
  creator: "Sport Group d.o.o.",
  publisher: "Sport Group d.o.o.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/site.webmanifest",
  category: "business",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
