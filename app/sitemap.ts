import type { MetadataRoute } from "next";

const SITE_URL = "https://www.posljiracun.si";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/",                       priority: 1.0, changeFrequency: "weekly" },
    { path: "/kako-deluje",            priority: 0.9, changeFrequency: "monthly" },
    { path: "/integracije",            priority: 0.9, changeFrequency: "monthly" },
    { path: "/funkcionalnosti",        priority: 0.9, changeFrequency: "monthly" },
    { path: "/cenik",                  priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact",                priority: 0.7, changeFrequency: "yearly" },
    { path: "/pomoc-pri-nastavitvi",   priority: 0.7, changeFrequency: "monthly" },
    { path: "/navodila-za-uporabo",    priority: 0.7, changeFrequency: "monthly" },
    { path: "/pogosta-vprasanja",      priority: 0.7, changeFrequency: "monthly" },
    { path: "/pogoji-uporabe",         priority: 0.3, changeFrequency: "yearly" },
    { path: "/zasebnost",              priority: 0.3, changeFrequency: "yearly" },
    { path: "/piskotki",               priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
