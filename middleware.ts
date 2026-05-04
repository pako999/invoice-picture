import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Auth-protected routes: signed-in app surface. Live at root URLs.
// /en/* mirrors of these get rewritten back to root (see appRouteMap).
const isProtected = createRouteMatcher([
  "/scan(.*)", "/invoices(.*)", "/settings(.*)",
]);

const COOKIE = "preferred-lang";

// App routes don't have separate /en/ versions — the UI is locale-aware
// internally. Hitting /en/scan, /en/invoices, /en/settings or /en/upgrade
// permanently redirects to the canonical root URL.
const appRouteMap: Record<string, string> = {
  "/en/scan": "/scan",
  "/en/invoices": "/invoices",
  "/en/settings": "/settings",
  "/en/upgrade": "/upgrade",
};

function shouldRedirectToEn(req: Request): boolean {
  const url = new URL(req.url);
  // Only consider the bare root "/" (and exact root, not /something)
  if (url.pathname !== "/") return false;

  // Skip if user already explicitly chose a language (cookie)
  const cookie = req.headers.get("cookie") ?? "";
  if (cookie.includes(`${COOKIE}=sl`)) return false;
  if (cookie.includes(`${COOKIE}=en`)) return true;

  // Vercel forwards geo info via these headers
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    "";
  if (country === "SI") return false;

  // Fall back to Accept-Language header
  const acceptLang = req.headers.get("accept-language") ?? "";
  if (/(^|[,\s])sl\b/i.test(acceptLang)) return false;
  if (/(^|[,\s])en\b/i.test(acceptLang)) return true;

  // Default: stay on Slovenian (this is a Slovenian product, after all)
  return false;
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  // 1. /en/<app-route> → /<app-route> (no separate EN UI for app pages)
  //    Match /en/scan, /en/scan/anything, /en/invoices, etc.
  for (const [enPrefix, slPrefix] of Object.entries(appRouteMap)) {
    if (url.pathname === enPrefix || url.pathname.startsWith(enPrefix + "/")) {
      const target = url.pathname.replace(enPrefix, slPrefix);
      const newUrl = new URL(req.url);
      newUrl.pathname = target;
      return NextResponse.redirect(newUrl, 308); // permanent so SEO consolidates
    }
  }

  // 2. Auth gate after the redirect, so /en/scan still requires auth
  //    once it's been redirected to /scan.
  if (isProtected(req)) {
    await auth.protect();
  }

  // 3. Locale-based "/" → "/en" redirect for non-Slovenian visitors
  if (shouldRedirectToEn(req)) {
    const newUrl = new URL(req.url);
    newUrl.pathname = "/en";
    return NextResponse.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
