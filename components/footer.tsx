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

function isAppRoute(pathname: string) {
  const clean = pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  return ["/scan", "/invoices", "/settings", "/invoice-review", "/admin", "/upgrade"].some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

const faqSl = [
  {
    q: "Kaj je OCR računov in katere podatke prebere?",
    a: "OCR računov iz PDF-ja ali fotografije prebere strukturirane računovodske podatke, na primer številko računa, datume, dobavitelja, DDV številko, IBAN, neto, DDV, bruto znesek, DDV razčlenitev in postavke.",
  },
  {
    q: "Ali OCR deluje za slovenske in angleške račune?",
    a: "Da. Slikaj Račun je namenjen slovenskim in angleškim računom ter pogostim mednarodnim oznakam, zato lahko v istem postopku obdelate domače in tuje dobavitelje.",
  },
  {
    q: "Ali moram zamenjati svoj računovodski program?",
    a: "Ne. Slikaj Račun dopolnjuje vaš obstoječi računovodski sistem. Za izdajanje in knjiženje še naprej uporabljate svoj program, Slikaj Račun pa poskrbi za zajem, OCR, pregled in dostavo prejetih računov.",
  },
  {
    q: "Ali deluje z Minimax, Birokrat, Pantheon in drugimi programi?",
    a: "Da. Originalni dokument lahko pošljete na uvozni email računovodskega programa. Pri naprednejšem workflowu lahko potrjene podatke uporabite tudi za UBL, eSLOG ali API dostavo, odvisno od sistema in paketa.",
  },
  {
    q: "Kaj se zgodi, če OCR ni dovolj zanesljiv?",
    a: "Račun gre v pregled. Uporabnik vidi originalni dokument in prebrane podatke drug ob drugem, popravi morebitne napake in račun potrdi. Negotov dokument se ne pošlje slepo naprej.",
  },
  {
    q: "Ali lahko obdelujem račune za več podjetij?",
    a: "Da. Višji paketi omogočajo več podjetij v enem uporabniškem računu, ločene destinacije ter množični upload dokumentov za hitrejše delo podjetij in računovodskih servisov.",
  },
];

const faqEn = [
  {
    q: "What is invoice OCR and which fields can it extract?",
    a: "Invoice OCR turns a PDF or image into structured accounting data such as invoice number, dates, supplier details, VAT ID, IBAN, net amount, VAT, gross total, VAT breakdown and line items.",
  },
  {
    q: "Does invoice OCR work with Slovenian and English invoices?",
    a: "Yes. Slikaj Račun is designed for Slovenian and English invoices and common international invoice labels, so local and foreign supplier invoices can use the same workflow.",
  },
  {
    q: "Do I need to replace my accounting software?",
    a: "No. Slikaj Račun complements the accounting system you already use. Keep your current invoicing and bookkeeping software while Slikaj Račun handles incoming-invoice capture, OCR, review and delivery.",
  },
  {
    q: "Does it work with Minimax, Birokrat, Pantheon and other systems?",
    a: "Yes. You can forward the original invoice to an accounting import email. Approved structured data can also be used in UBL, eSLOG or API workflows depending on the destination system and plan.",
  },
  {
    q: "What happens when OCR confidence is too low?",
    a: "The invoice is sent to review. The original document and extracted fields are shown side by side so a user can correct and approve the result before it continues downstream.",
  },
  {
    q: "Can accounting firms manage multiple companies?",
    a: "Yes. Higher plans support multiple companies under one user account, separate delivery destinations and bulk document upload for faster processing.",
  },
];

export function Footer() {
  const path = usePathname();
  const locale = detectLocale(path);
  const dict = getDict(locale);
  const t = dict.footer;
  const year = new Date().getFullYear();
  const showFaq = !isAppRoute(path);
  const faq = locale === "sl" ? faqSl : faqEn;

  const productLinks = [
    { label: t.productHowItWorks,   href: localeUrl(locale, "kako-deluje") },
    { label: locale === "sl" ? "OCR računov" : "Invoice OCR Slovenia", href: locale === "sl" ? "/ocr-racunov" : "/en/invoice-ocr-slovenia" },
    { label: t.productIntegrations, href: localeUrl(locale, "integracije") },
    { label: t.productFeatures,     href: localeUrl(locale, "funkcionalnosti") },
    { label: t.productPricing,      href: localeUrl(locale, "cenik") },
    { label: t.productBlog,         href: localeUrl(locale, "blog") },
    ...(locale === "sl"
      ? [
          { label: "Programi za račune", href: "/programi-za-racune" },
          { label: "Program za račune", href: "/program-za-racune" },
          { label: "Aplikacija za račune", href: "/aplikacija-za-racune" },
        ]
      : []),
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
    { label: t.legalGdpr,     href: localeUrl(locale, "gdpr") },
    { label: t.legalCookies,  href: localeUrl(locale, "piskotki") },
    { label: t.legalRefunds,  href: localeUrl(locale, "vracila") },
  ];

  return (
    <>
      {showFaq && (
        <section className="border-t border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-blue-700">FAQ</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {locale === "sl" ? "Najpogostejša vprašanja o OCR računov" : "Common questions about invoice OCR"}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {locale === "sl"
                  ? "Kratki odgovori o skeniranju, avtomatskem branju računov, integracijah in delu z več podjetji."
                  : "Quick answers about scanning, invoice data extraction, accounting integrations and multi-company workflows."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {faq.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-5 open:bg-white open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-slate-950 marker:content-none">
                    <span>{item.q}</span>
                    <span className="mt-0.5 shrink-0 text-xl leading-none text-blue-600 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={locale === "sl" ? "/ocr-racunov" : "/en/invoice-ocr-slovenia"}
                className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                {locale === "sl" ? "Več o OCR računov" : "Explore invoice OCR"}
              </Link>
              <Link
                href={localeUrl(locale, "pogosta-vprasanja")}
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                {locale === "sl" ? "Vsa pogosta vprašanja" : "View all FAQs"}
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-slate-900 text-slate-300 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Logo size={32} />
                <span className="font-extrabold text-white text-lg tracking-tight">Slikaj Račun</span>
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
                  <li key={`${l.label}-${l.href}`}>
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
    </>
  );
}
