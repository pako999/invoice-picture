"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localeUrl } from "@/lib/i18n/config";

function detectLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "sl";
}

export function Footer() {
  const path = usePathname();
  const locale = detectLocale(path);
  const dict = getDict(locale);
  const t = dict.footer;
  const home = localeUrl(locale, "");
  const year = new Date().getFullYear();

  const productLinks = [
    { label: t.productHowItWorks,   href: `${home === "/" ? "" : home}#kako-deluje` },
    { label: t.productIntegrations, href: `${home === "/" ? "" : home}#integracije` },
    { label: t.productFeatures,     href: `${home === "/" ? "" : home}#funkcionalnosti` },
    { label: t.productPricing,      href: `${home === "/" ? "" : home}#cenik` },
    { label: t.productBlog,         href: localeUrl(locale, "blog") },
  ];
  const helpLinks = [
    { label: t.helpUserGuide, href: localeUrl(locale, "navodila-za-uporabo") },
    { label: t.helpFAQ,        href: localeUrl(locale, "pogosta-vprasanja") },
    { label: t.helpContact,    href: localeUrl(locale, "contact") },
    { label: t.helpSetupHelp,  href: localeUrl(locale, "pomoc-pri-nastavitvi") },
  ];
  const legalLinks = [
    { label: t.legalPrivacy,  href: localeUrl(locale, "zasebnost") },
    { label: t.legalTerms,    href: localeUrl(locale, "pogoji-uporabe") },
    { label: t.legalCookies,  href: localeUrl(locale, "piskotki") },
    { label: t.legalRefunds,  href: localeUrl(locale, "vracila") },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Logo size={32} />
              <span className="font-extrabold text-white text-lg tracking-tight">SlikajRačun</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{t.tagline}</p>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              {t.company}<br />
              {t.address}<br />
              {t.vat}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">{t.productTitle}</h4>
            <ul className="flex flex-col gap-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">{t.helpTitle}</h4>
            <ul className="flex flex-col gap-3">
              {helpLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">{t.legalTitle}</h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
          {t.rights(year)}
        </div>
      </div>
    </footer>
  );
}
