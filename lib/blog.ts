// Central blog post registry — bilingual (SL primary + EN mirror).
// Used by blog indexes, sitemap and per-post pages.

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
    id: "accounting-software-slovenia",
    publishedAt: "2026-09-04",
    coverImage: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1600&q=80",
    slug: "racunovodska-programska-oprema-slovenija",
    keyword: "računovodska programska oprema",
    title: "Računovodska programska oprema v Sloveniji: kaj izbrati v 2026",
    description: "Vodnik po računovodski programski opremi v Sloveniji: kaj preveriti pri izbiri, OCR, email uvoz računov, delo z več podjetji in povezovanje mobilnega zajema dokumentov.",
    readingMinutes: 9,
    excerpt: "Kako izbrati računovodsko programsko opremo, ki podpira OCR, email uvoz in učinkovit zajem prejetih računov brez nepotrebnega ročnega dela.",
    coverAlt: "Računovodska programska oprema na računalniku v pisarni",
    slugEn: "accounting-software-slovenia-guide",
    keywordEn: "accounting software slovenia",
    titleEn: "Accounting Software in Slovenia: What to Look for in 2026",
    descriptionEn: "Guide to accounting software in Slovenia: OCR, invoice email import, multi-company workflows and mobile document capture.",
    readingMinutesEn: 9,
    excerptEn: "How to choose accounting software in Slovenia that supports OCR, email import and efficient incoming-invoice workflows.",
    coverAltEn: "Accounting software displayed on an office computer",
  },
  {
    id: "online-accounting-programs",
    publishedAt: "2026-09-04",
    coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1600&q=80",
    slug: "spletni-racunovodski-programi-slovenija",
    keyword: "spletni računovodski programi",
    title: "Spletni računovodski programi: prednosti, OCR in izbira v 2026",
    description: "Kaj ponujajo spletni računovodski programi, kako delujejo OCR, email uvoz in dostop iz brskalnika ter kako urediti hitrejše pošiljanje prejetih računov.",
    readingMinutes: 8,
    excerpt: "Spletno računovodstvo omogoča delo od kjerkoli. Poglejte, katere funkcije so pomembne pri računih, OCR in sodelovanju z računovodstvom.",
    coverAlt: "Spletni računovodski program odprt v brskalniku",
    slugEn: "online-accounting-software-slovenia",
    keywordEn: "online accounting software slovenia",
    titleEn: "Online Accounting Software in Slovenia: OCR & Cloud Guide (2026)",
    descriptionEn: "How online accounting software works, which OCR and invoice-import features matter and how to streamline incoming documents.",
    readingMinutesEn: 8,
    excerptEn: "A practical guide to browser-based accounting, OCR, invoice email import and cloud workflows.",
    coverAltEn: "Online accounting software open in a web browser",
  },
  {
    id: "cloud-accounting-integration",
    publishedAt: "2026-09-04",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    slug: "cloud-racunovodska-integracija-ocr",
    keyword: "cloud računovodska integracija",
    title: "Cloud računovodska integracija: OCR, email uvoz in avtomatizacija",
    description: "Kako povezati cloud računovodstvo z OCR in email uvozom računov. Praktičen workflow za podjetja in računovodske servise z več družbami.",
    readingMinutes: 8,
    excerpt: "Cloud računovodska integracija ne potrebuje nujno zapletenega API-ja. Pri prejetih računih je lahko zanesljiv email + OCR workflow dovolj.",
    coverAlt: "Cloud računovodska integracija in digitalni dokumenti",
    slugEn: "cloud-accounting-integration-ocr",
    keywordEn: "cloud accounting integration OCR",
    titleEn: "Cloud Accounting Integration: OCR, Email Import & Automation",
    descriptionEn: "How to connect cloud accounting with OCR and invoice email import. A practical multi-company workflow for businesses and accounting firms.",
    readingMinutesEn: 8,
    excerptEn: "A practical cloud accounting integration workflow using OCR and email-based invoice import.",
    coverAltEn: "Cloud accounting integration with digital documents",
  },
  {
    id: "minimax-email-import",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
    slug: "minimax-email-uvoz-racunov",
    keyword: "minimax ocr",
    title: "Minimax OCR in email uvoz računov: vodnik 2026",
    description: "Minimax OCR: kako najti @minimax.si email za uvoz, pravilno poslati fotografijo računa in avtomatizirati obdelavo prejetih računov. Vodnik 2026.",
    readingMinutes: 7,
    excerpt: "Vse, kar moraš vedeti o Minimax OCR in email uvozu računov — od pravega @minimax.si naslova do pošiljanja fotografije z mobilno aplikacijo.",
    coverAlt: "Pametni telefon, ki fotografira papirnat račun za Minimax OCR",
    slugEn: "minimax-email-invoice-import",
    keywordEn: "minimax invoice OCR email import",
    titleEn: "Minimax OCR & Email Invoice Import: Step-by-Step Guide (2026)",
    descriptionEn: "Minimax OCR guide: find your Minimax import email, send invoice photos correctly and automate incoming invoice processing from your phone.",
    readingMinutesEn: 7,
    excerptEn: "How Minimax OCR and email invoice import work, from finding the right import address to sending an invoice photo from your phone.",
    coverAltEn: "Smartphone photographing a paper invoice for Minimax OCR",
  },
  {
    id: "birokrat-ocr",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    slug: "birokrat-ocr-uvoz-racunov",
    keyword: "birokrat ocr",
    title: "Birokrat OCR: kako nastaviti uvoz računov po emailu",
    description: "Korak-za-korakom vodnik za nastavitev Birokrat OCR uvoza računov. Aktivacija, email naslov, pošiljanje fotografij in najpogostejše napake.",
    readingMinutes: 6,
    excerpt: "Birokrat OCR omogoča avtomatsko branje podatkov s fotografije računa. Tukaj je celotna pot od aktivacije do prvega knjiženja.",
    coverAlt: "Računovodska programska oprema na zaslonu prenosnika",
    slugEn: "birokrat-ocr-invoice-import",
    keywordEn: "birokrat ocr",
    titleEn: "Birokrat OCR: Email Invoice Import Setup Guide (2026)",
    descriptionEn: "Set up Birokrat OCR invoice import step by step: activation, import email, invoice photos and the most common setup problems.",
    readingMinutesEn: 6,
    excerptEn: "Birokrat OCR reads invoice data from photos. Follow the full setup path from activation to your first imported invoice.",
    coverAltEn: "Accounting software on a laptop screen",
  },
  {
    id: "pantheon-ebooks-ocr",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80",
    slug: "pantheon-ebooks-ocr-vodnik",
    keyword: "pantheon ocr",
    title: "Pantheon eBooks OCR: vodnik za avtomatsko knjiženje",
    description: "Kako Pantheon eBooks OCR storitev prepozna podatke s slike računa in jih avtomatsko knjiži. Aktivacija, omejitve in nasveti za boljše prepoznavanje.",
    readingMinutes: 8,
    excerpt: "Datalab Pantheon ima eBooks OCR storitev za avtomatsko obdelavo dokumentov. Razložim, kako jo povezati z mobilnim slikanjem računov.",
    coverAlt: "Dokumenti in računi razporejeni na pisalni mizi",
    slugEn: "pantheon-ebooks-ocr-guide",
    keywordEn: "pantheon ebooks ocr",
    titleEn: "Pantheon eBooks OCR: Invoice Automation Guide (2026)",
    descriptionEn: "How Pantheon eBooks OCR reads invoice photos and automates document processing. Setup, limitations and practical accuracy tips.",
    readingMinutesEn: 8,
    excerptEn: "How to use Datalab Pantheon eBooks OCR for automatic document processing and connect it with mobile invoice capture.",
    coverAltEn: "Documents and invoices arranged on a desk",
  },
  {
    id: "best-invoice-scanner-apps",
    publishedAt: "2026-05-04",
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    slug: "najboljse-aplikacije-za-skeniranje-racunov",
    keyword: "aplikacija za skeniranje računov",
    title: "Aplikacija za skeniranje računov: 6 najboljših v Sloveniji (2026)",
    description: "Iščete aplikacijo za skeniranje računov? Primerjava 6 rešitev za fotografiranje, PDF, OCR in pošiljanje računov v Minimax, Birokrat, Pantheon in druge programe.",
    readingMinutes: 9,
    excerpt: "Primerjava aplikacij za skeniranje računov v Sloveniji: hitrost zajema, OCR, pošiljanje v računovodstvo, podprti programi in cene.",
    coverAlt: "Aplikacija za skeniranje računov na pametnem telefonu",
    slugEn: "best-invoice-scanner-apps-slovenia",
    keywordEn: "invoice scanner app",
    titleEn: "Invoice Scanner App: 6 Best Options in Slovenia (2026)",
    descriptionEn: "Looking for an invoice scanner app? Compare 6 options for phone scanning, PDF, OCR and sending invoices to accounting software in Slovenia.",
    readingMinutesEn: 9,
    excerptEn: "Compare invoice scanner apps by capture speed, OCR workflow, accounting integrations and pricing.",
    coverAltEn: "Invoice scanner app displayed on a smartphone",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostEn(slugEn: string): BlogPost | undefined {
  return posts.find((p) => p.slugEn === slugEn);
}
