// Central blog post registry. One entry per post — used by:
//  - /blog index page (lists all posts)
//  - sitemap.ts (so Google gets every URL)
//  - per-post pages (canonical metadata)
// Programmatic SEO: each entry is keyword-optimised for a specific
// long-tail search query. See keyword column.

export type BlogPost = {
  slug: string;
  /** Primary search keyword we're targeting. Drives the H1 + meta. */
  keyword: string;
  /** ≤ 60 chars — fits Google SERP without truncation. */
  title: string;
  /** ≤ 160 chars — fits Google SERP description. Keyword + CTA. */
  description: string;
  /** ISO date string. */
  publishedAt: string;
  /** Reading-time estimate in minutes. */
  readingMinutes: number;
  /** One-line teaser used on the blog index. */
  excerpt: string;
  /** Hero / cover image (Unsplash, CC0). Used on listing + post header. */
  coverImage: string;
  /** Short alt text describing the cover image. */
  coverAlt: string;
};

export const posts: BlogPost[] = [
  {
    slug: "minimax-email-uvoz-racunov",
    keyword: "minimax email uvoz",
    title: "Minimax email uvoz računov: kompletni vodnik 2026",
    description:
      "Kako pravilno nastaviti email uvoz računov v Minimax in pošiljati papirnate račune z ene fotografije. Korak za korakom, z OCR primeri.",
    publishedAt: "2026-05-04",
    readingMinutes: 7,
    excerpt:
      "Vse, kar moraš vedeti o email uvozu računov v Minimax — od iskanja pravega naslova do pošiljanja prve slike z mobilno aplikacijo.",
    // Phone photographing receipt — directly maps to "fotografiraj račun in pošlji"
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
    coverAlt: "Pametni telefon, ki fotografira papirnat račun",
  },
  {
    slug: "birokrat-ocr-uvoz-racunov",
    keyword: "birokrat ocr",
    title: "Birokrat OCR: kako nastaviti uvoz računov po emailu",
    description:
      "Korak-za-korakom vodnik za nastavitev Birokrat OCR uvoza računov. Aktivacija, email naslov, pošiljanje fotografij in najpogostejše napake.",
    publishedAt: "2026-05-04",
    readingMinutes: 6,
    excerpt:
      "Birokrat OCR omogoča avtomatsko branje podatkov s fotografije računa. Tukaj je celotna pot od aktivacije do prvega knjiženja.",
    // Laptop with spreadsheets / accounting software UI
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    coverAlt: "Računovodska programska oprema na zaslonu prenosnika",
  },
  {
    slug: "pantheon-ebooks-ocr-vodnik",
    keyword: "pantheon ocr",
    title: "Pantheon eBooks OCR: vodnik za avtomatsko knjiženje",
    description:
      "Kako Pantheon eBooks OCR storitev prepozna podatke s slike računa in jih avtomatsko knjiži. Aktivacija, omejitve in nasveti za boljše prepoznavanje.",
    publishedAt: "2026-05-04",
    readingMinutes: 8,
    excerpt:
      "Datalab Pantheon ima eBooks OCR storitev za avtomatsko obdelavo dokumentov. Razložim, kako jo povezati z mobilnim slikanjem računov.",
    // Desk with documents being processed — fits ERP/document automation
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80",
    coverAlt: "Dokumenti in računi razporejeni na pisalni mizi",
  },
  {
    slug: "najboljse-aplikacije-za-skeniranje-racunov",
    keyword: "aplikacija za skeniranje računov",
    title: "Najboljše aplikacije za skeniranje računov v Sloveniji 2026",
    description:
      "Primerjava 6 mobilnih aplikacij za skeniranje in pošiljanje računov v računovodske programe. Kaj so prednosti, slabosti in cene v Sloveniji.",
    publishedAt: "2026-05-04",
    readingMinutes: 9,
    excerpt:
      "Kateri aplikaciji za fotografiranje računov zaupati v Sloveniji? Naredil sem direktno primerjavo, ceniki, podprti programi in slabosti.",
    // Multiple phones / app comparison
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    coverAlt: "Različne mobilne aplikacije na zaslonu pametnega telefona",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
