import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { TrialBanner } from "@/components/trial-banner";
import { CookieBanner } from "@/components/cookie-banner";
import { SITE_URL } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
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
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: "Slikaj Račun",
  url: SITE_URL,
  inLanguage: ["sl-SI", "en"],
  publisher: { "@id": `${SITE_URL}#organization` },
};

/** Shared <html> shell for both root layouts: app/(sl)/layout.tsx renders it
 *  with lang="sl", app/en/layout.tsx with lang="en", so crawlers get the
 *  correct document language in the server-rendered HTML. */
export function SiteShell({ lang, children }: { lang: Locale; children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang={lang} className="light" style={{ colorScheme: "light" }}>
        <body>
          <script type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
          <script type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
          <Nav />
          <TrialBanner />
          <main className="w-full min-w-0 overflow-x-hidden pb-20 md:pb-0">{children}</main>
          <Footer />
          <CookieBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
