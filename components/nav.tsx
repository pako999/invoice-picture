"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { LogoWordmark } from "@/components/logo";
import { getDict, type Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localeUrl, slugMap } from "@/lib/i18n/config";

const COOKIE = "preferred-lang";

function setLangCookie(locale: Locale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${locale}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

function detectLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "sl";
}

/** Build the equivalent URL in the other locale for the current path.
 *  /             ↔ /en
 *  /cenik        ↔ /en/pricing
 *  /en/privacy   ↔ /zasebnost
 */
function switchLocaleUrl(pathname: string, currentLocale: Locale, target: Locale): string {
  if (currentLocale === target) return pathname;

  if (currentLocale === "sl" && target === "en") {
    if (pathname === "/") return "/en";
    const sl = pathname.replace(/^\//, "");
    const en = slugMap[sl] ?? sl;
    return `/en/${en}`;
  }
  // en → sl
  if (pathname === "/en" || pathname === "/en/") return "/";
  const en = pathname.replace(/^\/en\/?/, "");
  const reverse = Object.entries(slugMap).find(([, e]) => e === en)?.[0];
  return reverse ? `/${reverse}` : `/${en}`;
}

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const locale = detectLocale(path);
  const dict = getDict(locale);
  const t = dict.nav;

  const isLanding = path === "/" || path === "/en";
  const appPaths = ["/scan", "/invoices", "/settings"];
  const isApp = appPaths.some((p) => path === p || path.startsWith(p + "/"));
  const isPublic = !isApp;

  const [menuOpen, setMenuOpen] = useState(false);

  // Build link sets in the right locale
  const appLinks = useMemo(
    () => [
      { href: "/scan",     label: t.scan,     icon: "📷" },
      { href: "/invoices", label: t.invoices, icon: "📋" },
      { href: "/settings", label: t.settings, icon: "⚙️" },
      { href: "/contact",  label: t.contact,  icon: "📨" },
    ],
    [t],
  );

  const publicLinks = useMemo(
    () => [
      { href: localeUrl(locale, "kako-deluje"),     label: t.howItWorks },
      { href: localeUrl(locale, "integracije"),     label: t.integrations },
      { href: localeUrl(locale, "funkcionalnosti"), label: t.features },
      { href: localeUrl(locale, "cenik"),           label: t.pricing },
    ],
    [locale, t],
  );

  const landingLinks = useMemo(
    () => [
      { href: "#kako-deluje",     label: t.howItWorks },
      { href: "#integracije",     label: t.integrations },
      { href: "#funkcionalnosti", label: t.features },
      { href: "#cenik",           label: t.pricing },
    ],
    [t],
  );

  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function changeLanguage(target: Locale) {
    setLangCookie(target);
    router.push(switchLocaleUrl(path, locale, target));
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={localeUrl(locale, "")} className="flex-shrink-0 text-lg" onClick={() => setMenuOpen(false)}>
            <LogoWordmark />
          </Link>

          {!isSignedIn && isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {landingLinks.map((l) => (
                <a key={l.href} href={l.href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {isSignedIn && (
            <nav className="hidden md:flex items-center gap-1">
              {appLinks.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    path === l.href ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}>
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {!isSignedIn && !isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {publicLinks.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    path === l.href ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Language switcher (compact, desktop only) */}
            <div className="hidden md:flex items-center gap-0.5 mr-1 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => changeLanguage("sl")}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  locale === "sl" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                }`}
                aria-label="Slovenščina"
              >
                SL
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  locale === "en" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                }`}
                aria-label="English"
              >
                EN
              </button>
            </div>

            <div className={`items-center gap-2 ${!isSignedIn ? "hidden md:flex" : "flex"}`}>
              {!isLoaded ? null : isSignedIn ? (
                <UserButton />
              ) : isPublic ? (
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      {t.signIn}
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-1.5">
                      <span>📷</span>
                      <span>{t.startScanning}</span>
                    </button>
                  </SignUpButton>
                </>
              ) : null}
            </div>

            {!isSignedIn && (
              <button type="button"
                aria-label={menuOpen ? t.closeMenu : t.openMenu}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                {menuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 6l12 12M18 6L6 18"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M4 12h16M4 17h16"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {!isSignedIn && menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
              {(isLanding ? landingLinks : publicLinks).map((l) => {
                const isAnchor = l.href.startsWith("#");
                const Tag: React.ElementType = isAnchor ? "a" : Link;
                return (
                  <Tag key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className={`px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      !isAnchor && path === l.href ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}>
                    {l.label}
                  </Tag>
                );
              })}
              <Link href={localeUrl(locale, "contact")} onClick={() => setMenuOpen(false)}
                className={`px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  path === localeUrl(locale, "contact") ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}>
                {t.contact}
              </Link>

              {/* Language switcher inside drawer */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={() => { changeLanguage("sl"); setMenuOpen(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    locale === "sl" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200"
                  }`}
                >
                  🇸🇮 {t.languageSlovenian}
                </button>
                <button
                  onClick={() => { changeLanguage("en"); setMenuOpen(false); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    locale === "en" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200"
                  }`}
                >
                  🇬🇧 {t.languageEnglish}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-col gap-2">
                {isLoaded && (
                  <>
                    <SignInButton mode="modal">
                      <button onClick={() => setMenuOpen(false)}
                        className="w-full text-base text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium px-3 py-3 rounded-lg transition-colors text-left">
                        {t.signIn}
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button onClick={() => setMenuOpen(false)}
                        className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <span>📷</span>
                        <span>{t.startScanning}</span>
                      </button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {isSignedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex">
          {appLinks.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${
                  active ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                }`}>
                <span className={`text-2xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
                  {l.icon}
                </span>
                <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-blue-600 dark:text-blue-400" : ""}`}>
                  {l.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
