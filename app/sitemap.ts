import type { MetadataRoute } from "next";
import { localeUrl } from "@/lib/i18n/config";

const SITE_URL = "https://www.posljiracun.si";

// Pages live in BOTH locales — sitemap emits the SL canonical with
// hreflang alternates so Google understands the EN counterpart exists.
// The 4 legal pages were translated; marketing/help pages still
// being translated incrementally — but we list both versions
// so Google indexes them as soon as the EN slug is live.

const bilingualRoutes: { slug: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { slug: "",                         priority: 1.0, changeFrequency: "weekly" },
  { slug: "kako-deluje",              priority: 0.9, changeFrequency: "monthly" },
  { slug: "integracije",              priority: 0.9, changeFrequency: "monthly" },
  { slug: "funkcionalnosti",          priority: 0.9, changeFrequency: "monthly" },
  { slug: "cenik",                    priority: 0.9, changeFrequency: "monthly" },
  { slug: "contact",                  priority: 0.7, changeFrequency: "yearly" },
  { slug: "pomoc-pri-nastavitvi",     priority: 0.7, changeFrequency: "monthly" },
  { slug: "navodila-za-uporabo",      priority: 0.7, changeFrequency: "monthly" },
  { slug: "pogosta-vprasanja",        priority: 0.7, changeFrequency: "monthly" },
  { slug: "pogoji-uporabe",           priority: 0.3, changeFrequency: "yearly" },
  { slug: "zasebnost",                priority: 0.3, changeFrequency: "yearly" },
  { slug: "piskotki",                 priority: 0.3, changeFrequency: "yearly" },
  { slug: "vracila",                  priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const r of bilingualRoutes) {
    const slUrl = `${SITE_URL}${localeUrl("sl", r.slug)}`;
    const enUrl = `${SITE_URL}${localeUrl("en", r.slug)}`;

    // Slovenian primary
    entries.push({
      url: slUrl,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: {
        languages: {
          "sl-SI": slUrl,
          "en":    enUrl,
          "x-default": slUrl,
        },
      },
    });

    // English mirror
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      // Slightly lower priority for the secondary language so Google
      // doesn't dilute ranking signal between the two versions
      priority: Math.max(0.1, r.priority - 0.1),
      alternates: {
        languages: {
          "sl-SI": slUrl,
          "en":    enUrl,
          "x-default": slUrl,
        },
      },
    });
  }

  return entries;
}
