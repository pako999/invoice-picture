import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Auth-protected routes (signed-in app surface). Mirror in /en too.
const isProtected = createRouteMatcher([
  "/scan(.*)", "/invoices(.*)", "/settings(.*)",
  "/en/scan(.*)", "/en/invoices(.*)", "/en/settings(.*)",
]);

const COOKIE = "preferred-lang";

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
  if (isProtected(req)) {
    await auth.protect();
  }

  if (shouldRedirectToEn(req)) {
    const url = new URL(req.url);
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
