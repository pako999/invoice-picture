"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/scan",     label: "Skeniraj",  icon: "📷" },
  { href: "/invoices", label: "Računi",     icon: "📋" },
  { href: "/settings", label: "Nastavitve", icon: "⚙️" },
];

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Try to get session info — if 401 user is logged out
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) { setEmail(null); return null; }
        return r.json();
      })
      .then(() => {
        // We just need to know if authed; read email from cookie via whoami
      })
      .catch(() => {});

    // Read email from a lightweight endpoint
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.email ? setEmail(d.email) : setEmail(null))
      .catch(() => setEmail(null));
  }, [path]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  const isPublic = path === "/" || path === "/login" || path === "/register";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white flex-shrink-0">
          🧾 <span className="hidden sm:inline">Invoice Picture</span>
        </Link>

        {!isPublic && (
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
          {email ? (
            <>
              <span className="text-xs text-gray-500 dark:text-slate-400 hidden md:inline truncate max-w-40">{email}</span>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Odjava
              </button>
            </>
          ) : isPublic ? (
            <>
              <Link href="/login" className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 font-medium">
                Prijava
              </Link>
              <Link
                href="/register"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg transition-colors"
              >
                Registracija
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
