"use client";
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
  const isPublic = path === "/" || path === "/sign-in" || path === "/sign-up";

  return (
    <>
      {/* ── Top header ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-lg">
            <LogoWordmark />
          </Link>

          {/* Landing page nav links — sections */}
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

          {/* App nav links — signed in */}
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

          {/* Contact link on non-landing public pages */}
          {!isSignedIn && !isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/contact"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  path === "/contact"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>📨</span>
                <span>Kontakt</span>
              </Link>
            </nav>
          )}

          {/* Auth buttons */}
          <div className="flex items-center gap-2 ml-auto">
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
        </div>
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
