import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { SITE_URL } from "@/lib/i18n/config";
import { LangEffect } from "./lang-effect";

const enDict = getDict("en");

export const metadata: Metadata = {
  title: {
    default: enDict.home.metaTitle,
    template: "%s — Slikaj Račun",
  },
  description: enDict.home.metaDescription,
  alternates: {
    canonical: "/en",
    languages: {
      "sl-SI": "/",
      "en":    "/en",
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
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LangEffect />
      {children}
    </>
  );
}
