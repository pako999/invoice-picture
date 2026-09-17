"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { CommercialPlanCheckout } from "@/components/commercial-plan-checkout";
import { PLAN_CONFIGS, formatEur, type BillingPeriod, type PaidPlan } from "@/lib/plans";

const paidOrder: PaidPlan[] = ["basic", "pro", "accounting_pro", "accounting_max"];

function features(plan: PaidPlan, en: boolean) {
  const cfg = PLAN_CONFIGS[plan];
  const companies = cfg.companyLimit == null
    ? (en ? "Unlimited companies" : "Neomejeno podjetij")
    : `${cfg.companyLimit} ${en ? (cfg.companyLimit === 1 ? "company" : "companies") : (cfg.companyLimit === 1 ? "podjetje" : "podjetja")}`;
  const common = [
    en ? "Unlimited original PDF/image email sending" : "Neomejeno pošiljanje originalnih PDF/slik",
    en ? `${cfg.ocrDocumentsMonthly.toLocaleString()} AI OCR documents / month` : `${cfg.ocrDocumentsMonthly.toLocaleString("sl-SI")} AI OCR dokumentov / mesec`,
    en ? `${cfg.ocrPagesMonthly.toLocaleString()} OCR pages / month` : `${cfg.ocrPagesMonthly.toLocaleString("sl-SI")} OCR strani / mesec`,
    companies,
    en ? "Invoice archive and review" : "Arhiv računov in pregled OCR podatkov",
    en ? "Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka" : "Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
  ];
  if (cfg.structuredDelivery) common.push(en ? "UBL 2.1 / eSLOG 2.0 XML delivery" : "UBL 2.1 / eSLOG 2.0 XML pošiljanje");
  if (cfg.apiDelivery) common.push(en ? "Structured JSON API delivery" : "Strukturirano JSON API pošiljanje");
  if (cfg.priorityProcessing) common.push(en ? "Priority OCR processing and support" : "Prednostna OCR obdelava in podpora");
  return common;
}

export function CommercialPricingGrid({ locale = "sl", compact = false }: { locale?: "sl" | "en"; compact?: boolean }) {
  const en = locale === "en";
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const free = PLAN_CONFIGS.free;

  return (
    <section className={compact ? "" : "py-16"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          {!compact && <>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">{en ? "Plans & pricing" : "Paketi in cenik"}</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{en ? "Choose the OCR capacity you need" : "Izberite OCR kapaciteto, ki jo potrebujete"}</h1>
            <p className="max-w-3xl text-lg text-slate-600">{en ? "Original invoice email sending stays unlimited on every paid plan. AI OCR is metered separately by documents and pages." : "Pri vseh plačljivih paketih ostane pošiljanje originalnih računov po e-pošti neomejeno. AI OCR ima ločeno mesečno omejitev dokumentov in strani."}</p>
          </>}
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button onClick={() => setBilling("monthly")} className={`rounded-full px-5 py-2 text-sm font-bold ${billing === "monthly" ? "bg-slate-950 text-white" : "text-slate-600"}`}>{en ? "Monthly" : "Mesečno"}</button>
            <button onClick={() => setBilling("yearly")} className={`rounded-full px-5 py-2 text-sm font-bold ${billing === "yearly" ? "bg-slate-950 text-white" : "text-slate-600"}`}>{en ? "Yearly" : "Letno"}</button>
            {billing === "yearly" && <span className="pr-3 text-xs font-bold text-emerald-700">{en ? "≈ 2 months free" : "≈ 2 meseca brezplačno"}</span>}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="min-h-[130px]">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{en ? "Try it" : "Za preizkus"}</p>
              <h2 className="mt-2 text-2xl font-black">{en ? free.nameEn : free.nameSl}</h2>
              <p className="mt-3 text-4xl font-black">0 €</p>
              <p className="text-sm text-slate-500">{en ? "forever" : "za vedno"}</p>
            </div>
            <Link href={en ? "/sign-up" : "/sign-up"} className="mt-5 inline-flex w-full justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold hover:bg-slate-50">{en ? "Start free →" : "Začni brezplačno →"}</Link>
            <ul className="mt-6 space-y-3 text-sm">
              {[en ? "3 AI OCR documents / month" : "3 AI OCR dokumenti / mesec", en ? "10 OCR pages / month" : "10 OCR strani / mesec", en ? "1 company" : "1 podjetje", en ? "Original email sending up to the free invoice allowance" : "Pošiljanje originalov do brezplačne omejitve"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/><span>{item}</span></li>)}
              <li className="flex gap-2 text-slate-400"><X className="mt-0.5 h-4 w-4 shrink-0"/><span>{en ? "API / priority processing" : "API / prednostna obdelava"}</span></li>
            </ul>
          </article>

          {paidOrder.map((plan, index) => {
            const cfg = PLAN_CONFIGS[plan];
            const price = billing === "yearly" ? cfg.yearlyPrice! : cfg.monthlyPrice!;
            const featured = plan === "pro";
            return <article key={plan} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${featured ? "border-2 border-blue-600 shadow-xl" : "border-slate-200"}`}>
              {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{en ? "Most popular" : "Najbolj priljubljen"}</span>}
              {plan === "accounting_pro" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white">{en ? "Accounting" : "Računovodstvo"}</span>}
              <div className="min-h-[130px]">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{index < 2 ? (en ? "Business" : "Podjetje") : (en ? "Accounting firms" : "Računovodski servisi")}</p>
                <h2 className="mt-2 text-2xl font-black">{en ? cfg.nameEn : cfg.nameSl}</h2>
                <p className="mt-3 text-4xl font-black">{formatEur(price, locale)}</p>
                <p className="text-sm text-slate-500">/ {billing === "monthly" ? (en ? "month" : "mesec") : (en ? "year" : "leto")}{billing === "yearly" ? (en ? " · billed yearly" : " · letno plačilo") : ""}</p>
              </div>
              <CommercialPlanCheckout tier={plan} billing={billing} className={featured ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-950 text-white hover:bg-slate-800"}/>
              <ul className="mt-6 space-y-3 text-sm">{features(plan, en).map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/><span>{item}</span></li>)}</ul>
            </article>;
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950">
          <strong>{en ? "Need more OCR?" : "Potrebujete več OCR?"}</strong> {en ? "Add-on packs are available: +100 pages €3.90, +500 pages €19.90, +1,000 pages €39.90. Original PDF/image email sending remains unlimited on paid plans even when the AI OCR allowance is used." : "Na voljo so dodatni paketi: +100 strani 3,90 €, +500 strani 19,90 €, +1.000 strani 39,90 €. Tudi ko porabite AI OCR limit, ostane pošiljanje originalnega PDF/slike po e-pošti pri plačljivih paketih neomejeno."}
        </div>
      </div>
    </section>
  );
}
