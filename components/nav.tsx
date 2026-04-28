"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/scan",     label: "Skeniraj",   icon: "📷" },
  { href: "/invoices", label: "Računi",      icon: "📋" },
  { href: "/settings", label: "Nastavitve",  icon: "⚙️" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
          🧾 <span>Invoice Picture</span>
        </Link>
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
      </div>
    </header>
  );
}
