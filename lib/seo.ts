import type { Metadata } from "next";
import { localeUrl, type Locale } from "@/lib/i18n/config";

export const SITE_URL = "https://www.posljiracun.si";
export const SITE_NAME = "SlikajRačun";

interface PageSeoInput {
  title: string;
  description: string;
  /** The Slovenian slug, e.g. "zasebnost". Used to build SL+EN canonical URLs. */
  slug: string;
  /** Which locale this metadata is for. Default: "sl". */
  locale?: Locale;
}

export function pageMetadata({ title, description, slug, locale = "sl" }: PageSeoInput): Metadata {
  const canonicalPath = localeUrl(locale, slug);
  const url = `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "sl-SI": localeUrl("sl", slug),
        "en":    localeUrl("en", slug),
        "x-default": localeUrl("sl", slug),
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "sl" ? "sl_SI" : "en_US",
      alternateLocale: [locale === "sl" ? "en_US" : "sl_SI"],
      siteName: SITE_NAME,
      url,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
