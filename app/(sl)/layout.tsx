import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
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
  manifest: "/site.webmanifest",
  category: "business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="sl">{children}</SiteShell>;
}
