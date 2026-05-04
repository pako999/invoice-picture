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
  /** Optional: explicit URL pair for pages whose SL ↔ EN slugs differ
   *  in unpredictable ways (e.g. blog posts). When provided, the
   *  alternates use these directly instead of the slugMap derivation. */
  altPaths?: { sl: string; en: string };
}

export function pageMetadata({ title, description, slug, locale = "sl", altPaths }: PageSeoInput): Metadata {
  const canonicalPath = altPaths
    ? (locale === "sl" ? altPaths.sl : altPaths.en)
    : localeUrl(locale, slug);
  const url = `${SITE_URL}${canonicalPath}`;

  const slPath = altPaths?.sl ?? localeUrl("sl", slug);
  const enPath = altPaths?.en ?? localeUrl("en", slug);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "sl-SI": slPath,
        "en":    enPath,
        "x-default": slPath,
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
