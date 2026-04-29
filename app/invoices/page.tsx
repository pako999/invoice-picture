"use client";
import { useEffect, useState } from "react";
import type { Invoice } from "@/lib/schema";

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const map = {
    sent:    { bg: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", label: "Poslano" },
    pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", label: "Čaka" },
    failed:  { bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", label: "Napaka" },
  };
  const { bg, label } = map[status];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${bg}`}>{label}</span>
  );
}

function fmt(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("sl-SI", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function InvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Res želiš izbrisati ta račun?")) return;
    setDeleting(id);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  }

  const sent = list.filter((i) => i.status === "sent").length;
  const failed = list.filter((i) => i.status === "failed").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Poslani računi</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Pregled vseh poslanih računov</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
        >
          🔄 Osveži
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Skupaj", value: list.length, cls: "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" },
          { label: "Poslano", value: sent, cls: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" },
          { label: "Napake", value: failed, cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 text-center ${s.cls}`}>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">⏳</div>
          <p>Nalagam...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-slate-500">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold">Še ni poslanih računov</p>
          <p className="text-sm mt-2">Pojdi na zavihek Skeniraj in pošlji prvi račun.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((inv) => (
            <div
              key={inv.id}
              className="flex items-start gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4"
            >
              {/* Thumbnail */}
              {inv.imageMime === "application/pdf" ? (
                <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex flex-col items-center justify-center flex-shrink-0 gap-0.5">
                  <span className="text-xl">📋</span>
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wide">PDF</span>
                </div>
              ) : inv.imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${inv.imageMime};base64,${inv.imageData}`}
                  alt="thumb"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                  📄
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{inv.subject}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                  <span className="font-medium">Za:</span> {inv.recipientEmail}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{fmt(inv.createdAt)}</p>
                {inv.status === "failed" && inv.errorMessage && (
                  <p className="text-xs text-red-500 mt-1 line-clamp-2">{inv.errorMessage}</p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(inv.id)}
                disabled={deleting === inv.id}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Izbriši"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
