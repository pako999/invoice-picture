import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { TrialBanner } from "@/components/trial-banner";

const SITE_URL = "https://www.posljiracun.si";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SlikajRačun — Pošlji račun z enim klikom",
    template: "%s — SlikajRačun",
  },
  description:
    "Fotografiraj papirnat račun in ga pošlji na email računovodskega programa v sekundi. Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.",
  keywords: [
    "računi",
    "OCR računi",
    "skeniranje računov",
    "Minimax email",
    "Birokrat OCR",
    "Pantheon",
    "računovodstvo",
    "fotografiranje računov",
    "elektronski računi",
    "Slovenija",
  ],
  authors: [{ name: "Sport Group d.o.o." }],
  creator: "Sport Group d.o.o.",
  publisher: "Sport Group d.o.o.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    url: SITE_URL,
    siteName: "SlikajRačun",
    title: "SlikajRačun — Pošlji račun z enim klikom",
    description:
      "Fotografiraj papirnat račun in ga pošlji na email računovodskega programa v sekundi. Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SlikajRačun — Pošlji račun z enim klikom",
    description:
      "Fotografiraj papirnat račun in ga pošlji na email računovodskega programa v sekundi.",
  },
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "business",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SlikajRačun",
  legalName: "Sport Group d.o.o.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.svg`,
  email: "info@posljiracun.si",
  telephone: "+386 41 580 250",
  address: {
    "@type": "PostalAddress",
    addressCountry: "SI",
    addressLocality: "Ljubljana",
  },
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SlikajRačun",
  url: SITE_URL,
  inLanguage: "sl-SI",
  publisher: { "@id": `${SITE_URL}#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="sl" className="light" style={{ colorScheme: "light" }}>
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
          <Nav />
          <TrialBanner />
          <main className="pb-20 md:pb-0">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
