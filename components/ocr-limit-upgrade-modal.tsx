"use client";

import Link from "next/link";
import { PLAN_CONFIGS, nextPaidPlan, planLabel, type CommercialPlan } from "@/lib/plans";

type Props = {
  locale: "sl" | "en";
  plan: CommercialPlan;
  message?: string | null;
  originalSent?: boolean;
  onClose: () => void;
};

export function OcrLimitUpgradeModal({ locale, plan, message, originalSent = false, onClose }: Props) {
  const en = locale === "en";
  const nextPlan = nextPaidPlan(plan);
  const nextConfig = nextPlan ? PLAN_CONFIGS[nextPlan] : null;
  const prefix = en ? "/en" : "";
  const href = nextPlan
    ? `${prefix}/upgrade?plan=${nextPlan}&source=ocr-limit#plan-${nextPlan}`
    : `${prefix}/contact`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ocr-limit-title">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
        <div className="mb-4 text-4xl" aria-hidden="true">📊</div>
        <h2 id="ocr-limit-title" className="text-2xl font-black text-slate-950 dark:text-white">
          {en ? "Your OCR allowance is used up" : "Porabili ste OCR limit paketa"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {message || (en ? "You have reached the maximum number of OCR documents or pages included in your plan." : "Dosegli ste največje število OCR dokumentov ali strani, vključenih v vaš paket.")}
        </p>
        {originalSent && (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {en ? "The original PDF/image was still sent. Only AI OCR processing was skipped." : "Originalni PDF/slika je bil vseeno poslan. Izpuščena je bila samo AI OCR obdelava."}
          </p>
        )}
        {nextConfig ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">{en ? "Recommended next plan" : "Priporočen naslednji paket"}</p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{planLabel(nextPlan, locale)}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {nextConfig.ocrDocumentsMonthly} {en ? "OCR documents" : "OCR dokumentov"} · {nextConfig.ocrPagesMonthly} {en ? "OCR pages per month" : "OCR strani mesečno"}
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200">
            {en ? "You are already on the highest plan. Contact us for a custom allowance." : "Uporabljate najvišji paket. Za večji obseg nas kontaktirajte."}
          </p>
        )}
        <div className="mt-6 space-y-3">
          <Link href={href} className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            {nextPlan ? (en ? `Upgrade to ${planLabel(nextPlan, "en")} →` : `Nadgradi na ${planLabel(nextPlan, "sl")} →`) : (en ? "Contact support →" : "Kontaktiraj podporo →")}
          </Link>
          <button type="button" onClick={onClose} className="w-full rounded-xl py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            {en ? "Close" : "Zapri"}
          </button>
        </div>
      </div>
    </div>
  );
}
