"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { LogoWordmark } from "@/components/logo";

const appLinks = [
  { href: "/scan",     label: "Skeniraj",   icon: "📷" },
  { href: "/invoices", label: "Računi",      icon: "📋" },
  { href: "/settings", label: "Nastavitve",  icon: "⚙️" },
  { href: "/contact",  label: "Kontakt",     icon: "📨" },
];

const publicLinks = [
  { href: "/kako-deluje",     label: "Kako deluje" },
  { href: "/integracije",     label: "Integracije" },
  { href: "/funkcionalnosti", label: "Funkcionalnosti" },
  { href: "/cenik",           label: "Cenik" },
];

const landingLinks = [
  { href: "#kako-deluje",     label: "Kako deluje" },
  { href: "#integracije",     label: "Integracije" },
  { href: "#funkcionalnosti", label: "Funkcionalnosti" },
  { href: "#cenik",           label: "Cenik" },
];

export function Nav() {
  const path = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const isLanding = path === "/";
  const appPaths = ["/scan", "/invoices", "/settings"];
  const isApp = appPaths.some((p) => path === p || path.startsWith(p + "/"));
  const isPublic = !isApp;

  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Top header ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-lg" onClick={() => setMenuOpen(false)}>
            <LogoWordmark />
          </Link>

          {/* Landing page nav links — sections (desktop only) */}
          {!isSignedIn && isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {landingLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {/* App nav links — signed in (desktop only) */}
          {isSignedIn && (
            <nav className="hidden md:flex items-center gap-1">
              {appLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    path === l.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Public-page nav (signed-out, non-landing, desktop only) */}
          {!isSignedIn && !isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {publicLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    path === l.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side: auth buttons (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Auth buttons — desktop always, mobile only when signed in */}
            <div className={`items-center gap-2 ${!isSignedIn ? "hidden md:flex" : "flex"}`}>
              {!isLoaded ? null : isSignedIn ? (
                <UserButton />
              ) : isPublic ? (
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      Prijava
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-1.5">
                      <span>📷</span>
                      <span>Začni skenirati</span>
                    </button>
                  </SignUpButton>
                </>
              ) : null}
            </div>

            {/* Hamburger — mobile, signed-out only */}
            {!isSignedIn && (
              <button
                type="button"
                aria-label={menuOpen ? "Zapri meni" : "Odpri meni"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
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

        {/* ── Mobile dropdown panel ── */}
        {!isSignedIn && menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
              {(isLanding ? landingLinks : publicLinks).map((l) => {
                const isAnchor = l.href.startsWith("#");
                const Tag: React.ElementType = isAnchor ? "a" : Link;
                const linkProps = isAnchor ? { href: l.href } : { href: l.href };
                return (
                  <Tag
                    key={l.href}
                    {...linkProps}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      !isAnchor && path === l.href
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {l.label}
                  </Tag>
                );
              })}
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  path === "/contact"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Kontakt
              </Link>

              {/* Auth buttons inside drawer */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-col gap-2">
                {isLoaded && (
                  <>
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-base text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium px-3 py-3 rounded-lg transition-colors text-left"
                      >
                        Prijava
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📷</span>
                        <span>Začni skenirati</span>
                      </button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Mobile bottom nav — only for signed-in users ── */}
      {isSignedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex">
          {appLinks.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
              >
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
