"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, Coins, Copy, FileSearch, RefreshCw, XCircle } from "lucide-react";

type Payload = {
  totals: Record<string, number | null>;
  providerUsage: Record<string, number>;
  fieldAccuracy: Array<{ field: string; extracted: number; corrected: number; observedAccuracy: number | null }>;
  correctionsBySupplier: Array<{ supplier: string; corrections: number }>;
};

export function InvoiceProcessingDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const r = await fetch("/api/admin/invoice-processing", { cache: "no-store" }); setData(await r.json()); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const t = data?.totals ?? {};

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Admin · Invoice Intelligence</p><h1 className="text-3xl font-extrabold text-slate-950">OCR & obdelava računov</h1><p className="mt-1 text-slate-500">Meritve temeljijo na dejansko obdelanih dokumentih in uporabniških popravkih.</p></div><div className="flex gap-2"><Link href="/invoice-review" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold">Odpri review queue</Link><button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Osveži</button></div></div>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <Metric label="Dokumenti" value={t.documents} icon={<FileSearch className="h-5 w-5" />} />
      <Metric label="Obdelano" value={t.processed} icon={<Activity className="h-5 w-5 text-blue-600" />} />
      <Metric label="Auto approved" value={t.autoApproved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
      <Metric label="Review" value={t.needsReview} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} />
      <Metric label="Failed" value={t.failed} icon={<XCircle className="h-5 w-5 text-red-600" />} />
      <Metric label="Duplicates" value={t.duplicates} icon={<Copy className="h-5 w-5 text-purple-600" />} />
      <Metric label="Avg. čas" value={t.averageProcessingTimeMs == null ? "—" : `${(t.averageProcessingTimeMs / 1000).toFixed(1)} s`} icon={<Activity className="h-5 w-5" />} />
      <Metric label="Ta mesec" value={t.estimatedMonthlyProcessingCostMicros == null ? "—" : `${(t.estimatedMonthlyProcessingCostMicros / 1_000_000).toFixed(3)} $`} icon={<Coins className="h-5 w-5 text-amber-600" />} />
    </section>

    <div className="mt-7 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold">Uporaba OCR ponudnikov</h2><div className="mt-4 space-y-3">{Object.entries(data?.providerUsage ?? {}).map(([provider, count]) => <div key={provider} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-semibold capitalize">{provider}</span><span className="text-xl font-extrabold">{count}</span></div>)}{!Object.keys(data?.providerUsage ?? {}).length && <p className="text-sm text-slate-500">Še ni podatkov.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold">Popravki po dobavitelju</h2><p className="text-xs text-slate-500">Uporablja se tudi za supplier-specific mappings pri naslednjih računih.</p><div className="mt-4 max-h-80 space-y-2 overflow-auto">{data?.correctionsBySupplier.map((row) => <div key={row.supplier} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm"><span className="truncate pr-4">{row.supplier}</span><strong>{row.corrections}</strong></div>)}{!data?.correctionsBySupplier.length && <p className="text-sm text-slate-500">Še ni popravkov.</p>}</div></section>
    </div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-5"><h2 className="text-lg font-extrabold">Opažena natančnost po poljih</h2><p className="text-xs text-slate-500">Ocena = 1 − uporabniški popravki / polja z dokazom. To ni laboratorijska “99% accuracy” metrika; za to uporabite evaluation script z ground truth.</p></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Polje</th><th className="px-4 py-3 text-right">Ekstrakcije</th><th className="px-4 py-3 text-right">Popravki</th><th className="px-4 py-3 text-right">Opažena natančnost</th></tr></thead><tbody>{data?.fieldAccuracy.map((row) => <tr key={row.field} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{row.field}</td><td className="px-4 py-3 text-right">{row.extracted}</td><td className="px-4 py-3 text-right">{row.corrected}</td><td className="px-4 py-3 text-right font-bold">{row.observedAccuracy == null ? "—" : `${(row.observedAccuracy * 100).toFixed(1)}%`}</td></tr>)}</tbody></table></div></section>
  </main>;
}

function Metric({ label, value, icon }: { label: string; value: number | string | null | undefined; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>{icon}</div><div className="text-2xl font-extrabold text-slate-950">{value ?? 0}</div></div>;
}
