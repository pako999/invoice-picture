import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import NotFound from "./(sl)/not-found";
import { SITE_URL } from "@/lib/i18n/config";

// Rendered for URLs that match no route. Needed because the app has two root
// layouts (app/(sl) for Slovenian, app/en for English) so each can set the
// correct <html lang>.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Stran ni najdena — Slikaj Račun",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <SiteShell lang="sl">
      <NotFound />
    </SiteShell>
  );
}
