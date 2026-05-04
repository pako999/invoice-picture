import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { TrialBanner } from "@/components/trial-banner";
import { getDict } from "@/lib/i18n";
import { SITE_URL } from "@/lib/i18n/config";

const slDict = getDict("sl");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: slDict.home.metaTitle,
    template: "%s — Slikaj Račun",
  },
  description: slDict.home.metaDescription,
  keywords: [
    "računi", "OCR računi", "skeniranje računov",
    "Minimax email", "Birokrat OCR", "Pantheon",
    "računovodstvo", "fotografiranje računov",
    "elektronski računi", "Slovenija",
  ],
  authors: [{ name: "Sport Group d.o.o." }],
  creator: "Sport Group d.o.o.",
  publisher: "Sport Group d.o.o.",
  alternates: {
    canonical: "/",
    languages: {
      "sl-SI": "/",
      "en":    "/en",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Slikaj Račun",
    title: slDict.home.metaTitle,
    description: slDict.home.metaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: slDict.home.metaTitle,
    description: slDict.home.metaDescription,
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
  name: "Slikaj Račun",
  legalName: "Sport Group d.o.o.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.svg`,
  email: "info@posljiracun.si",
  telephone: "+386 41 580 250",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Osojnikova 4",
    postalCode: "2000",
    addressLocality: "Maribor",
    addressCountry: "SI",
  },
  vatID: "SI72133449",
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Slikaj Račun",
  url: SITE_URL,
  inLanguage: ["sl-SI", "en"],
  publisher: { "@id": `${SITE_URL}#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Root layout: <html lang="sl"> by default. Nav/Footer auto-detect
  // locale from the URL (/en/* → English) and re-render accordingly.
  // The /en subtree's client-side layout flips <html lang> to "en".
  return (
    <ClerkProvider>
      <html lang="sl" className="light" style={{ colorScheme: "light" }}>
        <body>
          <script type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
          <script type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
          <Nav />
          <TrialBanner />
          <main className="pb-20 md:pb-0">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
