"use client";
import { useEffect, useMemo, useState } from "react";
import type { Invoice, Company } from "@/lib/schema";

type FilterMode = "all" | "week" | "month" | "custom";

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "Vse",
  week: "Ta teden",
  month: "Ta mesec",
  custom: "Po izbiri",
};

function fmtDateShort(d: Date) {
  return d.toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toInputDate(d: Date) {
  // YYYY-MM-DD for <input type="date">
  return d.toISOString().slice(0, 10);
}

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Datoteke ni bilo mogoče prebrati."));
    reader.readAsDataURL(file);
  });
}

function PreviewModal({ inv, onClose, onRestore }: {
  inv: Invoice;
  onClose: () => void;
  onRestore: (file: File) => Promise<void>;
}) {
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{inv.subject}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Za: {inv.recipientEmail}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{fmt(inv.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={inv.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image / PDF */}
        <div className="p-4 flex-1 min-h-0 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
          {inv.imageMime === "application/pdf" && inv.imageData ? (
            <iframe
              src={`data:application/pdf;base64,${inv.imageData}#toolbar=1&navpanes=0&view=FitH`}
              title={inv.filename ?? "Račun PDF"}
              className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white"
            />
          ) : inv.imageMime === "application/pdf" ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <span className="text-6xl">📋</span>
              <p className="font-semibold text-gray-600 dark:text-slate-300">Predogled starejšega PDF-ja ni na voljo</p>
              <p className="text-sm">{inv.filename ?? "račun.pdf"}</p>
              <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700">
                {restoring ? "Obnavljam predogled..." : "Ponovno izberi ta PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={restoring}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setRestoring(true);
                    setRestoreError("");
                    try {
                      await onRestore(file);
                    } catch (error) {
                      setRestoreError(error instanceof Error ? error.message : "Predogleda ni bilo mogoče obnoviti.");
                    } finally {
                      setRestoring(false);
                    }
                  }}
                />
              </label>
              <p className="max-w-md text-center text-xs">Datoteka se samo doda temu arhiviranemu računu. E-pošta se ne pošlje ponovno in kvota se ne porabi.</p>
              {restoreError && <p className="text-sm font-medium text-red-500">{restoreError}</p>}
            </div>
          ) : inv.imageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:${inv.imageMime};base64,${inv.imageData}`}
              alt="Račun"
              className="max-w-full max-h-full object-contain rounded-xl border border-gray-200 dark:border-slate-700"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <span className="text-5xl">📄</span>
              <p className="text-sm">Predogled ni na voljo</p>
            </div>
          )}
        </div>

        {inv.status === "failed" && inv.errorMessage && (
          <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400">
            {inv.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// "all" = show all, number = specific company id, "default" = invoices
// sent via the user's default email (companyId is null)
type CompanyFilter = "all" | "default" | number;

export default function InvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [details, setDetails] = useState<Record<number, Invoice>>({});
  const [detailLoading, setDetailLoading] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [customFrom, setCustomFrom] = useState<string>(""); // YYYY-MM-DD
  const [customTo, setCustomTo] = useState<string>("");
  const [showRangePicker, setShowRangePicker] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [invRes, compRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/companies"),
      ]);
      const invData = await invRes.json();
      const compData = await compRes.json();
      setList(Array.isArray(invData) ? invData : []);
      setCompanies(Array.isArray(compData) ? compData : []);
    } catch {
      setList([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadInvoiceDetail(inv: Invoice): Promise<Invoice> {
    if (inv.imageData || details[inv.id]) {
      return details[inv.id] ?? inv;
    }

    setDetailLoading((current) => new Set(current).add(inv.id));
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      if (!res.ok) return inv;
      const full = await res.json() as Invoice;
      setDetails((current) => ({ ...current, [inv.id]: full }));
      return full;
    } finally {
      setDetailLoading((current) => {
        const next = new Set(current);
        next.delete(inv.id);
        return next;
      });
    }
  }

  async function openPreview(inv: Invoice) {
    setPreview(details[inv.id] ?? inv);
    const full = await loadInvoiceDetail(inv);
    setPreview(full);
  }

  async function restorePreview(inv: Invoice, file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Izberi PDF datoteko.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("PDF je večji od 10 MB.");
    }

    const imageBase64 = await fileToBase64(file);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, filename: file.name, mime: "application/pdf" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? "Predogleda ni bilo mogoče obnoviti.");
    }

    const restored = { ...inv, imageData: imageBase64, imageMime: "application/pdf", filename: file.name };
    setDetails((current) => ({ ...current, [inv.id]: restored }));
    setList((current) => current.map((item) => item.id === inv.id ? { ...item, filename: file.name } : item));
    setPreview(restored);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Res želiš izbrisati ta račun?")) return;
    setDeleting(id);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
  }

  // Apply company + date filters together. Company filter narrows the
  // list first (cheap O(n) pass), then the date filter does its window
  // check on the smaller set.
  const filtered = useMemo(() => {
    let rows = list;

    // 1. Company filter
    if (companyFilter === "default") {
      rows = rows.filter((i) => i.companyId == null);
    } else if (typeof companyFilter === "number") {
      rows = rows.filter((i) => i.companyId === companyFilter);
    }

    // 2. Date filter
    if (filter === "all") return rows;
    const now = new Date();
    let from: Date;
    let to: Date | null = null;
    if (filter === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - 7);
    } else if (filter === "month") {
      from = new Date(now);
      from.setMonth(now.getMonth() - 1);
    } else {
      if (!customFrom) return rows;
      from = new Date(customFrom + "T00:00:00");
      if (customTo) to = new Date(customTo + "T23:59:59");
    }
    return rows.filter((i) => {
      const d = new Date(i.createdAt);
      if (d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [list, companyFilter, filter, customFrom, customTo]);

  const sent = filtered.filter((i) => i.status === "sent").length;
  const failed = filtered.filter((i) => i.status === "failed").length;

  function pickFilter(mode: FilterMode) {
    if (mode === "custom") {
      // Default to last 30 days if nothing set yet
      if (!customFrom) {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setCustomFrom(toInputDate(d));
      }
      if (!customTo) setCustomTo(toInputDate(new Date()));
      setShowRangePicker(true);
    } else {
      setShowRangePicker(false);
      setFilter(mode);
    }
  }

  function applyCustomRange() {
    setFilter("custom");
    setShowRangePicker(false);
  }

  function clearCustomRange() {
    setCustomFrom("");
    setCustomTo("");
    setFilter("all");
    setShowRangePicker(false);
  }

  const customLabel = filter === "custom" && customFrom
    ? `${fmtDateShort(new Date(customFrom + "T00:00:00"))}${customTo ? " – " + fmtDateShort(new Date(customTo + "T00:00:00")) : ""}`
    : FILTER_LABELS.custom;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {preview && (
        <PreviewModal
          inv={preview}
          onClose={() => setPreview(null)}
          onRestore={(file) => restorePreview(preview, file)}
        />
      )}

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

      {/* Company filter pills — shown only if the user has any companies.
          Free / Basic users with 0 companies don't see this row at all. */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setCompanyFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              companyFilter === "all"
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400"
            }`}
          >
            🏢 Vsa podjetja
          </button>
          {companies.map((c) => {
            const active = companyFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCompanyFilter(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  active
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400"
                }`}
              >
                {c.name}
              </button>
            );
          })}
          {/* Default-email bucket — only relevant if there are invoices
              that weren't sent via a specific company */}
          {list.some((i) => i.companyId == null) && (
            <button
              onClick={() => setCompanyFilter("default")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                companyFilter === "default"
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400"
              }`}
            >
              📧 Privzeti email
            </button>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "week", "month", "custom"] as FilterMode[]).map((m) => {
          const active = filter === m;
          const label = m === "custom" ? customLabel : FILTER_LABELS[m];
          return (
            <button
              key={m}
              onClick={() => pickFilter(m)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                active
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom range picker */}
      {showRangePicker && (
        <div className="mb-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Izberi datumsko obdobje</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Od</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={toInputDate(new Date())}
                className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Do</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                max={toInputDate(new Date())}
                min={customFrom || undefined}
                className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyCustomRange}
              disabled={!customFrom}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50"
            >
              Potrdi
            </button>
            <button
              onClick={clearCustomRange}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-700"
            >
              Počisti
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Skupaj", value: filtered.length, cls: "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" },
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-slate-500">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold">
            {list.length === 0 ? "Še ni poslanih računov" : "Ni računov v izbranem obdobju"}
          </p>
          <p className="text-sm mt-2">
            {list.length === 0
              ? "Pojdi na zavihek Skeniraj in pošlji prvi račun."
              : "Spremeni filter, da prikažeš več računov."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inv) => {
            const displayInv = details[inv.id] ?? inv;
            return (
            <div
              key={inv.id}
              onMouseEnter={() => { void loadInvoiceDetail(inv); }}
              onClick={() => { void openPreview(inv); }}
              className="group flex items-start gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
            >
              {/* Thumbnail */}
              {inv.imageMime === "application/pdf" ? (
                <div className="w-16 h-16 group-hover:w-40 group-hover:h-52 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex flex-col items-center justify-center flex-shrink-0 gap-0.5 overflow-hidden transition-all duration-200">
                  {displayInv.imageData ? (
                    <iframe
                      src={`data:application/pdf;base64,${displayInv.imageData}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      title={`Predogled ${displayInv.filename}`}
                      className="hidden group-hover:block w-full h-full bg-white pointer-events-none"
                    />
                  ) : (
                    <>
                      <span className="text-xl">{detailLoading.has(inv.id) ? "⏳" : "📋"}</span>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wide">PDF</span>
                    </>
                  )}
                </div>
              ) : inv.imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${inv.imageMime};base64,${inv.imageData}`}
                  alt="thumb"
                  className="w-16 h-16 group-hover:w-40 group-hover:h-52 rounded-xl object-contain bg-gray-50 dark:bg-slate-950 flex-shrink-0 border border-gray-200 dark:border-slate-700 transition-all duration-200"
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

              {/* Preview hint + Delete */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">Klikni za predogled</span>
                <button
                  onClick={(e) => handleDelete(e, inv.id)}
                  disabled={deleting === inv.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Izbriši"
                >
                  🗑️
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
