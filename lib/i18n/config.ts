// Central i18n configuration.
//
// URL strategy: Slovenian stays at root (preserves existing SEO),
// English lives under /en/ with translated slugs.
//
//   /                  → SL home
//   /en                → EN home
//   /cenik             → SL pricing
//   /en/pricing        → EN pricing
//   /zasebnost         → SL privacy
//   /en/privacy        → EN privacy
//
// hreflang tags in each page's metadata point Google at both versions.

export const locales = ["sl", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sl";

export const SITE_URL = "https://www.posljiracun.si";

// SL slug -> EN slug (used by canonical/alternate URL builder)
// Anything not in this map is assumed to be the same on both sides
// (e.g. /scan, /invoices, /settings — those are app routes, not marketing).
export const slugMap: Record<string, string> = {
  "": "",
  cenik: "pricing",
  "kako-deluje": "how-it-works",
  funkcionalnosti: "features",
  integracije: "integrations",
  "pogosta-vprasanja": "faq",
  "navodila-za-uporabo": "user-guide",
  "pomoc-pri-nastavitvi": "setup-help",
  zasebnost: "privacy",
  "pogoji-uporabe": "terms",
  vracila: "refunds",
  piskotki: "cookies",
  contact: "contact",
  upgrade: "upgrade",
  blog: "blog",
};

const reverseSlugMap = Object.fromEntries(
  Object.entries(slugMap).map(([sl, en]) => [en, sl]),
) as Record<string, string>;

/** Build the URL for a page in a given locale.
 *
 *   localeUrl("sl", "cenik")             → "/cenik"
 *   localeUrl("en", "cenik")             → "/en/pricing"
 *   localeUrl("en", "")                  → "/en"
 *   localeUrl("sl", "")                  → "/"
 */
export function localeUrl(locale: Locale, slugSl: string): string {
  const trimmed = slugSl.replace(/^\//, "").replace(/\/$/, "");
  if (locale === "sl") {
    return trimmed === "" ? "/" : `/${trimmed}`;
  }
  const enSlug = slugMap[trimmed] ?? trimmed;
  return enSlug === "" ? "/en" : `/en/${enSlug}`;
}

/** Map an English slug back to its Slovenian counterpart. */
export function slugSlFromEn(slugEn: string): string {
  return reverseSlugMap[slugEn] ?? slugEn;
}

/** Build the alternates.languages map for Next.js Metadata. */
export function alternateLanguages(slugSl: string) {
  return {
    "sl-SI": localeUrl("sl", slugSl),
    "en":    localeUrl("en", slugSl),
    "x-default": localeUrl("sl", slugSl),
  };
}
