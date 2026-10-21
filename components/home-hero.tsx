"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, FileCheck2 } from "lucide-react";
import { PAID_PLANS, PLAN_CONFIGS, formatEur } from "@/lib/plans";

export function HomeHero({ locale = "sl" }: { locale?: "sl" | "en" }) {
  const en = locale === "en";
  const [documents, setDocuments] = useState(100);
  const [pages, setPages] = useState(1);
  const [yearly, setYearly] = useState(false);
  const plan = PAID_PLANS.map(code => PLAN_CONFIGS[code]).find(p => p.ocrDocumentsMonthly >= documents && p.ocrPagesMonthly >= documents * pages);
  const cost = plan ? (yearly ? plan.yearlyPrice! / 12 : plan.monthlyPrice!) : null;
  const pricePerInvoice = cost === null ? null : cost / documents;
  // Illustration, not a measured performance claim: 3 minutes manual vs 30 seconds review at €15/hour.
  const hours = documents * 2.5 / 60;
  const savings = cost === null ? null : hours * 15 - cost;
  const number = (n: number) => new Intl.NumberFormat(en ? "en-IE" : "sl-SI", { maximumFractionDigits: 1 }).format(n);
  return (
    <section className="relative overflow-hidden bg-[#101d42] text-white">
      <div className="pointer-events-none absolute -right-40 -top-60 h-[700px] w-[700px] rounded-full bg-blue-500/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-wide text-blue-200">{en ? "FROM INVOICE TO ACCOUNTING" : "OD RAČUNA DO RAČUNOVODSTVA"}</p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl xl:text-6xl">{en ? "Less typing. More time for your business." : "Manj prepisovanja računov. Več časa za vaš posel."}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">{en ? "Take a photo or upload a PDF. AI reads the invoice, you check the details and send it to accounting." : "Slikajte račun ali naložite PDF. AI prebere podatke, vi jih preverite in račun pošljete v računovodstvo."}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/scan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-400">{en ? "Try for free" : "Preizkusite brezplačno"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            <Link href="#cenik" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">{en ? "View plans" : "Poglejte pakete"}</Link>
          </div>
          <p className="mt-3 text-sm text-blue-200">{en ? "Free: 3 invoices / 10 OCR pages per month." : "Brezplačno: 3 računi / 10 OCR strani na mesec."}</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {(en ? ["Read suppliers, amounts, VAT and payment details", "Split a PDF containing multiple invoices", "Review and export XML eSLOG or send the original"] : ["Prebrani dobavitelji, zneski, DDV in plačilni podatki", "Razdelitev PDF-ja z več računi", "Pregled in izvoz XML eSLOG ali pošiljanje izvirnika"]).map(item => <li key={item} className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}
          </ul>
        </div>
        <div className="min-w-0 rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><Clock3 aria-hidden="true" className="h-4 w-4" />{en ? "YOUR ESTIMATED SAVINGS" : "VAŠ OKVIRNI PRIHRANEK"}</div>
          <h2 className="mt-2 text-2xl font-bold">{en ? "How many invoices each month?" : "Koliko računov imate na mesec?"}</h2>
          <div className="mt-5 flex items-center justify-between gap-3"><label htmlFor="hero-documents" className="text-sm text-slate-600">{en ? "Invoices per month" : "Računi na mesec"}</label><output htmlFor="hero-documents" className="text-2xl font-extrabold tabular-nums">{number(documents)}</output></div>
          <input id="hero-documents" type="range" min="10" max="5000" step="10" value={documents} onChange={e => setDocuments(Number(e.target.value))} className="mt-3 h-8 w-full cursor-pointer accent-blue-600" />
          <div className="flex justify-between text-xs text-slate-500"><span>10</span><span>5.000</span></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><label htmlFor="hero-pages" className="text-slate-600">{en ? "Average pages per invoice" : "Povprečno strani na račun"}</label><input id="hero-pages" type="number" min="1" max="20" value={pages} onChange={e => setPages(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-slate-300 px-3 py-2" /></div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={yearly} onChange={e => setYearly(e.target.checked)} className="h-4 w-4 accent-blue-600" />{en ? "Annual billing" : "Letno plačilo"}</label>
          {pricePerInvoice !== null && cost !== null ? <div aria-live="polite" className="mt-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{en ? "YOUR AVERAGE OCR COST" : "VAŠA POVPREČNA CENA OCR OBDELAVE"}</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-5xl font-extrabold tracking-tight text-emerald-800" data-testid="hero-price-per-invoice">≈ {formatEur(pricePerInvoice, locale)}</span><span className="text-base font-bold text-emerald-900">{en ? "/ invoice" : "/ račun"}</span></p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{en ? "+ VAT · complete plan included" : "+ DDV · vključen celoten paket"}</p>
            <p className="mt-3 text-sm text-emerald-900">{formatEur(cost, locale)} {en ? "/ month" : "/ mesec"} ÷ {number(documents)} {en ? "invoices" : "računov"}</p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-800">{en ? "Average plan cost at your invoice volume, rounded to cents. This is not an additional per-invoice fee." : "Povprečni strošek paketa pri vaši količini računov, zaokrožen na cente. To ni dodatno plačilo za vsak račun."}{yearly ? (en ? " Calculated from the annual price divided by 12; billed annually." : " Izračun iz letne cene, deljene z 12; plačilo je letno.") : ""}</p>
          </div> : null}
          <div aria-live="polite" className="mt-4 rounded-2xl bg-blue-50 p-4">
            <p className="text-sm text-slate-600">{savings !== null && savings >= 0 ? (en ? "Estimated net savings / month" : "Ocenjeni neto prihranek / mesec") : (en ? "Estimated time saved / month" : "Ocenjeni prihranek časa / mesec")}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700">{savings !== null && savings >= 0 ? formatEur(savings, locale) : `${number(hours)} h`}</p>
            <p className="mt-2 text-sm text-slate-600">{en ? `About ${number(hours)} hours less manual work each month.` : `Približno ${number(hours)} ur manj ročnega dela na mesec.`}</p>
          </div>
          {plan && cost !== null ? <div className="mt-5 flex items-start gap-3"><FileCheck2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-blue-600" /><div className="min-w-0"><p className="font-bold">{en ? plan.nameEn : plan.nameSl} · {formatEur(cost, locale)} <span className="text-sm font-normal">{en ? "+ VAT / month" : "+ DDV / mesec"}</span></p><p className="mt-1 text-sm text-slate-600">{plan.ocrDocumentsMonthly.toLocaleString(en ? "en-IE" : "sl-SI")} {en ? "invoices" : "računov"} / {plan.ocrPagesMonthly.toLocaleString(en ? "en-IE" : "sl-SI")} {en ? "OCR pages per month" : "OCR strani na mesec"}</p>{yearly ? <p className="mt-1 text-xs text-slate-500">{en ? "Billed annually:" : "Letno plačilo:"} {formatEur(plan.yearlyPrice!, locale)} {en ? "+ VAT" : "+ DDV"}</p> : null}{savings !== null && savings < 0 ? <p className="mt-2 text-sm text-slate-600">{en ? "At these assumptions the plan costs more than the estimated labour saved." : "Pri teh predpostavkah je cena paketa višja od ocenjene vrednosti prihranjenega dela."}</p> : null}</div></div> : <p className="mt-5 text-sm text-slate-600">{en ? "This volume exceeds the included OCR limits. Contact us for a tailored plan." : "Ta obseg presega vključene OCR limite. Pišite nam za paket po meri."}</p>}
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">{en ? "Illustrative estimate: 3 min manual entry, 30 sec review, labour €15/hour. Savings = time saved × hourly rate − plan price, excluding VAT. Actual results vary. Plan selection considers invoices and pages for one company." : "Informativna ocena: 3 min ročnega vnosa, 30 s pregleda, delo 15 €/uro. Prihranek = prihranjeni čas × urna postavka − cena paketa, brez DDV. Dejanski rezultat je odvisen od računov. Izbira paketa upošteva račune in strani za eno podjetje."}</p>
        </div>
      </div>
    </section>
  );
}
