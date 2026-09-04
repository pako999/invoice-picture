// Central blog post registry — bilingual (SL primary + EN mirror).
// Used by:
//  - /blog and /en/blog index pages
//  - sitemap.ts (with hreflang alternates)
//  - per-post pages
//
// Each post has BOTH a SL and EN slug, optimised for that language's
// search keywords. Programmatic SEO: branded long-tail per language.

export type BlogPost = {
  id: string;
  publishedAt: string;
  coverImage: string;
  slug: string;
  keyword: string;
  title: string;
  description: string;
  readingMinutes: number;
  excerpt: string;
  coverAlt: string;
  slugEn: string;
  keywordEn: string;
  titleEn: string;
  descriptionEn: string;
  readingMinutesEn: number;
  excerptEn: string;
  coverAltEn: string;
};

export const posts: BlogPost[] = [
  {
    id: "minimax-email-import",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
    slug: "minimax-email-uvoz-racunov",
    keyword: "minimax ocr",
    title: "Minimax OCR in email uvoz računov: vodnik 2026",
    description:
      "Minimax OCR: kako najti @minimax.si email za uvoz, pravilno poslati fotografijo računa in avtomatizirati obdelavo prejetih računov. Vodnik 2026.",
    readingMinutes: 7,
    excerpt:
      "Vse, kar moraš vedeti o Minimax OCR in email uvozu računov — od pravega @minimax.si naslova do pošiljanja fotografije z mobilno aplikacijo.",
    coverAlt: "Pametni telefon, ki fotografira papirnat račun za Minimax OCR",
    slugEn: "minimax-email-invoice-import",
    keywordEn: "minimax email invoice import",
    titleEn: "Minimax email invoice import: complete 2026 guide",
    descriptionEn:
      "How to set up email-based invoice import in Minimax and send paper receipts with a single phone photo. Step-by-step guide with OCR examples.",
    readingMinutesEn: 7,
    excerptEn:
      "Everything you need to know about Minimax email invoice import — from finding the right address to sending the first photo from a mobile app.",
    coverAltEn: "Smartphone photographing a paper invoice",
  },
  {
    id: "birokrat-ocr",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    slug: "birokrat-ocr-uvoz-racunov",
    keyword: "birokrat ocr",
    title: "Birokrat OCR: kako nastaviti uvoz računov po emailu",
    description:
      "Korak-za-korakom vodnik za nastavitev Birokrat OCR uvoza računov. Aktivacija, email naslov, pošiljanje fotografij in najpogostejše napake.",
    readingMinutes: 6,
    excerpt:
      "Birokrat OCR omogoča avtomatsko branje podatkov s fotografije računa. Tukaj je celotna pot od aktivacije do prvega knjiženja.",
    coverAlt: "Računovodska programska oprema na zaslonu prenosnika",
    slugEn: "birokrat-ocr-invoice-import",
    keywordEn: "birokrat ocr",
    titleEn: "Birokrat OCR: how to set up email invoice import",
    descriptionEn:
      "Step-by-step guide for setting up Birokrat OCR invoice import. Activation, email address, sending photos and the most common pitfalls.",
    readingMinutesEn: 6,
    excerptEn:
      "Birokrat OCR auto-reads invoice data from a photo. Here's the full path from activation to your first booked invoice.",
    coverAltEn: "Accounting software on a laptop screen",
  },
  {
    id: "pantheon-ebooks-ocr",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80",
    slug: "pantheon-ebooks-ocr-vodnik",
    keyword: "pantheon ocr",
    title: "Pantheon eBooks OCR: vodnik za avtomatsko knjiženje",
    description:
      "Kako Pantheon eBooks OCR storitev prepozna podatke s slike računa in jih avtomatsko knjiži. Aktivacija, omejitve in nasveti za boljše prepoznavanje.",
    readingMinutes: 8,
    excerpt:
      "Datalab Pantheon ima eBooks OCR storitev za avtomatsko obdelavo dokumentov. Razložim, kako jo povezati z mobilnim slikanjem računov.",
    coverAlt: "Dokumenti in računi razporejeni na pisalni mizi",
    slugEn: "pantheon-ebooks-ocr-guide",
    keywordEn: "pantheon ebooks ocr",
    titleEn: "Pantheon eBooks OCR: a guide to automatic invoice booking",
    descriptionEn:
      "How Datalab Pantheon's eBooks OCR service reads data from invoice photos and books them automatically. Activation, limitations and accuracy tips.",
    readingMinutesEn: 8,
    excerptEn:
      "Datalab Pantheon offers eBooks OCR for automatic document processing. Here's how to connect it with mobile invoice capture.",
    coverAltEn: "Documents and invoices arranged on a desk",
  },
  {
    id: "best-invoice-scanner-apps",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    slug: "najboljse-aplikacije-za-skeniranje-racunov",
    keyword: "aplikacija za skeniranje računov",
    title: "Aplikacija za skeniranje računov: 6 najboljših v Sloveniji (2026)",
    description:
      "Iščete aplikacijo za skeniranje računov? Primerjava 6 rešitev za fotografiranje, PDF, OCR in pošiljanje računov v Minimax, Birokrat, Pantheon in druge programe.",
    readingMinutes: 9,
    excerpt:
      "Primerjava aplikacij za skeniranje računov v Sloveniji: hitrost zajema, OCR, pošiljanje v računovodstvo, podprti programi in cene.",
    coverAlt: "Aplikacija za skeniranje računov na pametnem telefonu",
    slugEn: "best-invoice-scanner-apps-slovenia",
    keywordEn: "best invoice scanner app",
    titleEn: "Best invoice scanner apps in Slovenia (2026 review)",
    descriptionEn:
      "Comparison of 6 mobile apps for scanning and sending invoices to accounting software. Pros, cons and pricing in the Slovenian market.",
    readingMinutesEn: 9,
    excerptEn:
      "Which invoice-photographing app should you trust in Slovenia? Direct comparison with pricing, supported programs and weaknesses.",
    coverAltEn: "Different mobile apps on a smartphone screen",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostEn(slugEn: string): BlogPost | undefined {
  return posts.find((p) => p.slugEn === slugEn);
}
