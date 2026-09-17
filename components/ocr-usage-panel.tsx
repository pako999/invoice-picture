"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Usage = {
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
        const res = await fetch("/api/ocr-usage", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json() as Usage;
        if (mounted) setUsage(json);
      } catch { /* settings must still work */ }
    }
    void load();
    const timer = setInterval(() => { void load(); }, 30_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  if (!usage) return null;
  const alert = usage.warningLevel !== "ok";
  return (
    <section className={`mx-auto mb-6 max-w-5xl rounded-2xl border p-5 shadow-sm ${alert ? "border-amber-300 bg-amber-50" : "border-blue-100 bg-blue-50/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">AI OCR · {usage.planName}</p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-950">{en ? "Monthly OCR usage" : "Mesečna OCR poraba"}</h2>
          {alert && <p className="mt-1 text-sm font-medium text-amber-800">{en ? usage.noticeEn : usage.noticeSl}</p>}
        </div>
        <Link href={en ? "/en/pricing" : "/cenik"} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
          {en ? "Plans & limits" : "Paketi in limiti"}
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Meter label={en ? "OCR documents" : "OCR dokumenti"} value={usage.monthDocuments} limit={usage.monthlyDocumentLimit} />
        <Meter label={en ? "OCR pages" : "OCR strani"} value={usage.monthPages} limit={usage.monthlyPageLimit} />
      </div>
      {usage.adminOverride && (
        <p className="mt-3 text-xs font-semibold text-slate-600">{en ? "Admin daily page limit" : "Admin dnevni limit strani"}: {usage.dayPages}/{usage.dailyPageLimit}</p>
      )}
      <p className="mt-3 text-xs text-slate-500">{en ? "Paid plans keep normal original PDF/JPG email forwarding unlimited; these limits apply only to AI OCR processing." : "Pri plačljivih paketih ostane navadno pošiljanje originalnih PDF/JPG dokumentov po e-pošti neomejeno; ti limiti veljajo samo za AI OCR obdelavo."}</p>
    </section>
  );
}

function Meter({ label, value, limit }: { label: string; value: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, (value / limit) * 100) : 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{label}</span><strong>{value}/{limit}</strong></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
