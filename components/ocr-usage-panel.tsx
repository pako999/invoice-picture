"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextPaidPlan, planLabel, type CommercialPlan } from "@/lib/plans";

type Usage = {
  plan: CommercialPlan;
  planName: string;
  monthDocuments: number;
  monthlyDocumentLimit: number;
  monthPages: number;
  monthlyPageLimit: number;
  dayPages: number;
  dailyPageLimit: number;
  usagePercent: number;
  warningLevel: "ok" | "warning" | "critical" | "blocked";
  adminOverride: boolean;
  noticeSl: string | null;
  noticeEn: string | null;
};

export function OcrUsagePanel({ locale = "sl" }: { locale?: "sl" | "en" }) {
  const en = locale === "en";
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/ocr-usage", { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json();
        if (mounted) setUsage(next);
      } catch {}
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  if (!usage) return null;
  const alert = usage.warningLevel !== "ok";
  const upgrade = nextPaidPlan(usage.plan);
  const prefix = en ? "/en" : "";
  const href = usage.warningLevel === "blocked" && upgrade
    ? `${prefix}/upgrade?plan=${upgrade}&source=ocr-limit#plan-${upgrade}`
    : en ? "/en/pricing" : "/cenik";
  const cta = usage.warningLevel === "blocked" && upgrade
    ? (en ? `Upgrade to ${planLabel(upgrade, "en")}` : `Nadgradi na ${planLabel(upgrade, "sl")}`)
    : (en ? "Plans & limits" : "Paketi in limiti");

  return (
    <section className={`mx-auto my-4 max-w-5xl rounded-2xl border p-4 shadow-sm ${alert ? usage.warningLevel === "blocked" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50" : "border-blue-100 bg-blue-50/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">AI OCR · {usage.planName}</p>
          <h2 className="mt-1 text-base font-extrabold text-slate-950">{en ? "Monthly OCR usage" : "Mesečna OCR poraba"}</h2>
          {alert && <p className={`mt-1 text-sm font-medium ${usage.warningLevel === "blocked" ? "text-red-800" : "text-amber-900"}`}>{en ? usage.noticeEn : usage.noticeSl}</p>}
        </div>
        <Link href={href} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">{cta}</Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Meter label={en ? "OCR documents" : "OCR dokumenti"} value={usage.monthDocuments} limit={usage.monthlyDocumentLimit} />
        <Meter label={en ? "OCR pages" : "OCR strani"} value={usage.monthPages} limit={usage.monthlyPageLimit} />
      </div>
      {usage.adminOverride && <p className="mt-3 text-xs font-semibold text-slate-600">{en ? "Admin daily pages" : "Admin dnevni limit strani"}: {usage.dayPages}/{usage.dailyPageLimit}</p>}
      <p className="mt-3 text-xs text-slate-500">{en ? "Paid plans keep original PDF/JPG email forwarding unlimited; these limits apply only to AI OCR." : "Pri plačljivih paketih ostane pošiljanje originalnih PDF/JPG po e-pošti neomejeno; ti limiti veljajo samo za AI OCR."}</p>
    </section>
  );
}

function Meter({ label, value, limit }: { label: string; value: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, value / limit * 100) : 100;
  return <div><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{label}</span><strong>{value}/{limit}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"><div className={`h-full rounded-full ${percent >= 100 ? "bg-red-600" : percent >= 80 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${percent}%` }} /></div></div>;
}
