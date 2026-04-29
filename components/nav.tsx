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

export function Nav() {
  const path = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const isPublic = path === "/" || path === "/sign-in" || path === "/sign-up";

  return (
    <>
      {/* ── Top header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(244,239,228,0.92)", borderColor: "#DDD5C8" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-lg">
            <LogoWordmark />
          </Link>

          {/* Desktop nav links — hidden on mobile (bottom nav takes over) */}
          {isSignedIn && (
            <nav className="hidden md:flex items-center gap-1">
              {appLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    path === l.href
                      ? "text-white"
                      : "hover:bg-black/5"
                  }`}
                  style={path === l.href ? { background: "#C94A1A", color: "#fff" } : { color: "#3D3A34" }}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {!isSignedIn && (
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/contact"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:bg-black/5"
                style={{ color: "#3D3A34" }}>
                <span>📨</span><span>Kontakt</span>
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
                  <button className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    Prijava
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg transition-colors">
                    Registracija
                  </button>
                </SignUpButton>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav — only for signed-in users ── */}
      {isSignedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
          style={{ background: "#F4EFE4", borderTop: "1px solid #DDD5C8" }}>
          {appLinks.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? "#C94A1A" : "#8A8175" }}
              >
                <span className={`text-2xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
                  {l.icon}
                </span>
                <span className="text-[10px] font-semibold tracking-wide">
                  {l.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: "#C94A1A" }} />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
