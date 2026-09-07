"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, RefreshCw, XCircle } from "lucide-react";

type Doc = {
  id: number;
  filename: string;
  status: string;
  provider: string | null;
  documentType: string | null;
  overallConfidenceBps: number | null;
  validationStatus: string;
  warningsJson: string | null;
  createdAt: string;
};

type Payload = { documents: Doc[]; stats: Record<string, number | null> };

export default function InvoiceReviewPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("needs_review");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/invoice-reader", { cache: "no-store" });
    const json = await res.json();
    setPayload(json);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  const docs = useMemo(() => payload?.documents.filter((d) => filter === "all" || d.status === filter) ?? [], [payload, filter]);
  const stats = payload?.stats ?? {};

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Invoice Intelligence</p>
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">Pregled in potrditev računov</h1>
          <p className="mt-1 text-slate-500">Samodejno potrjeni računi ostanejo ločeni od tistih, ki potrebujejo človeški pregled.</p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Osveži
        </button>
      </div>

      <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Skupaj" value={stats.total} icon={<FileSearch className="h-5 w-5" />} />
        <Stat label="Samodejno potrjeno" value={stats.approved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
        <Stat label="Za pregled" value={stats.needs_review} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} />
        <Stat label="V obdelavi" value={(stats.queued ?? 0) + (stats.processing ?? 0)} icon={<Clock3 className="h-5 w-5 text-blue-600" />} />
        <Stat label="Napake" value={stats.failed} icon={<XCircle className="h-5 w-5 text-red-600" />} />
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["needs_review", "Za pregled"], ["queued", "V čakalni vrsti"], ["processing", "Obdelava"], ["approved", "Potrjeno"], ["failed", "Napake"], ["all", "Vse"],
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? "bg-slate-950 text-white dark:bg-blue-600" : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Nalaganje…</div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" /><p className="font-semibold text-slate-800 dark:text-white">Ni dokumentov v tem pogledu.</p></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {docs.map((doc) => {
              let warnings: string[] = [];
              try { warnings = doc.warningsJson ? JSON.parse(doc.warningsJson) : []; } catch { /* ignore */ }
              return (
                <Link key={doc.id} href={`/invoice-review/${doc.id}`} className="grid gap-3 p-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center dark:hover:bg-slate-800/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="truncate font-bold text-slate-900 dark:text-white">{doc.filename}</span><Status status={doc.status} /></div>
                    <p className="mt-1 text-sm text-slate-500">{doc.documentType || "Dokument"} · {doc.provider || "čaka na obdelavo"} · {new Date(doc.createdAt).toLocaleString("sl-SI")}</p>
                    {warnings.length > 0 && <p className="mt-1 truncate text-xs text-amber-700">{warnings[0]}</p>}
                  </div>
                  <div className="text-sm text-slate-500">Zanesljivost: <strong className="text-slate-800 dark:text-slate-200">{doc.overallConfidenceBps == null ? "—" : `${Math.round(doc.overallConfidenceBps / 100)}%`}</strong></div>
                  <span className="text-sm font-semibold text-blue-600">Odpri →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | null | undefined; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="mb-2 flex items-center justify-between text-slate-500"><span className="text-xs font-bold uppercase tracking-wide">{label}</span>{icon}</div><div className="text-3xl font-extrabold text-slate-950 dark:text-white">{value ?? 0}</div></div>;
}

function Status({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "needs_review" ? "bg-amber-100 text-amber-700" : status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{status.replace("_", " ")}</span>;
}
