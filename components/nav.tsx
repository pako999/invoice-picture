"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const links = [
  { href: "/scan",     label: "Skeniraj",  icon: "📷" },
  { href: "/invoices", label: "Računi",     icon: "📋" },
  { href: "/settings", label: "Nastavitve", icon: "⚙️" },
  { href: "/contact",  label: "Kontakt",    icon: "📨" },
];

export function Nav() {
  const path = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const isPublic = path === "/" || path === "/sign-in" || path === "/sign-up";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white flex-shrink-0">
          🧾 <span className="hidden sm:inline">Invoice Picture</span>
        </Link>

        {isSignedIn && (
          <nav className="flex items-center gap-1">
            {links.map((l) => (
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
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
          </nav>
        )}

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
  );
}
