"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, Grid2X2, List, Trash2 } from "lucide-react";
import type { Invoice, Company } from "@/lib/schema";
import { InvoiceReviewGallery } from "@/components/invoice-review-gallery";

type FilterMode = "all" | "week" | "month" | "custom";
type InvoiceListItem = Invoice & {
  documentId?: number | null;
  documentStatus?: string | null;
  previewUrl?: string | null;
};
type ArchivedInvoice = InvoiceListItem;

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

function InvoicesTabs({ active, onChange }: { active: "ocr" | "archive"; onChange: (next: "ocr" | "archive") => void }) {
  return (
    <nav className="mx-auto mt-5 grid w-full min-w-0 max-w-7xl grid-cols-2 gap-2 overflow-hidden px-3 sm:px-6 lg:px-8" aria-label="Vrsta računov">
      <button type="button" onClick={() => onChange("ocr")} aria-current={active === "ocr" ? "page" : undefined} className={`min-w-0 rounded-xl px-2.5 py-3 text-xs font-extrabold leading-tight transition sm:px-5 sm:text-sm ${active === "ocr" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>OCR računi in potrjevanje</button>
      <button type="button" onClick={() => onChange("archive")} aria-current={active === "archive" ? "page" : undefined} className={`min-w-0 rounded-xl px-2.5 py-3 text-xs font-extrabold leading-tight transition sm:px-5 sm:text-sm ${active === "archive" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>Poslani arhiv</button>
    </nav>
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
  inv: ArchivedInvoice;
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
          {inv.imageMime === "application/pdf" && (inv.imageData || inv.previewUrl) ? (
            <iframe
              src={inv.imageData
                ? `data:application/pdf;base64,${inv.imageData}#toolbar=1&navpanes=0&view=FitH`
                : `${inv.previewUrl}#toolbar=1&navpanes=0&view=FitH`}
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
          ) : inv.imageData || inv.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inv.imageData ? `data:${inv.imageMime};base64,${inv.imageData}` : inv.previewUrl!}
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

function InvoiceThumbnail({ inv }: { inv: InvoiceListItem }) {
  if (inv.imageMime === "application/pdf" && inv.previewUrl) {
    return (
      <iframe
        src={`${inv.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title={`Predogled ${inv.filename ?? inv.subject}`}
        loading="lazy"
        tabIndex={-1}
        className="pointer-events-none h-full w-full bg-white"
      />
    );
  }
  if (inv.imageData) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`data:${inv.imageMime};base64,${inv.imageData}`} alt="" loading="lazy" className="h-full w-full object-contain" />;
  }
  if (inv.previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={inv.previewUrl} alt="" loading="lazy" className="h-full w-full object-contain" />;
  }
  return <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400"><span className="text-4xl">📄</span><span className="text-xs font-bold">Predogled ni na voljo</span></div>;
}

function HoverInvoicePreview({ inv }: { inv: InvoiceListItem }) {
  return (
    <aside className="pointer-events-none fixed bottom-4 right-4 top-20 z-[65] hidden w-[min(46vw,46rem)] overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl lg:block dark:border-slate-600 dark:bg-slate-900" aria-hidden="true">
      <div className="flex h-12 items-center justify-between gap-3 border-b border-gray-200 px-4 dark:border-slate-700">
        <span className="truncate text-sm font-bold text-gray-900 dark:text-white">{inv.subject}</span>
        <span className="shrink-0 text-xs font-semibold text-gray-500">Klikni za celoten pogled</span>
      </div>
      <div className="h-[calc(100%-3rem)] bg-gray-100 dark:bg-slate-950"><InvoiceThumbnail inv={inv} /></div>
    </aside>
  );
}

function DocumentStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const labels: Record<string, string> = {
    needs_review: "OCR za potrditev",
    approved: "OCR potrjen",
    queued: "OCR v vrsti",
    processing: "OCR obdelava",
    failed: "OCR napaka",
    uploaded: "OCR naložen",
  };
  const color = status === "needs_review"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
    : status === "approved"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
      : status === "failed"
        ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
        : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${color}`}>{labels[status] ?? status}</span>;
}

// "all" = show all, number = specific company id, "default" = invoices
// sent via the user's default email (companyId is null)
type CompanyFilter = "all" | "default" | number;

function BulkDeleteDialog({
  count,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  count: number;
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
        className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">🚩</span>
          <div>
            <h2 id="bulk-delete-title" className="text-xl font-extrabold text-red-700 dark:text-red-400">
              Trajno izbriši izbrane račune?
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              Izbranih je {count} {count === 1 ? "račun" : "računov"}.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Vsi izbrani računi in njihovi shranjeni predogledi v arhivu bodo trajno odstranjeni. Dejanja ni mogoče razveljaviti.
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Prekliči
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Brišem..." : `Trajno izbriši (${count})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [section, setSection] = useState<"ocr" | "archive">("ocr");
  const [list, setList] = useState<InvoiceListItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveError, setArchiveError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [approving, setApproving] = useState<number | null>(null);
  const [reprocessing, setReprocessing] = useState<Set<number>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");
  const [preview, setPreview] = useState<ArchivedInvoice | null>(null);
  const [hoveredPreview, setHoveredPreview] = useState<InvoiceListItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [details, setDetails] = useState<Record<number, ArchivedInvoice>>({});
  const [detailLoading, setDetailLoading] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [customFrom, setCustomFrom] = useState<string>(""); // YYYY-MM-DD
  const [customTo, setCustomTo] = useState<string>("");
  const [showRangePicker, setShowRangePicker] = useState(false);

  async function load() {
    setLoading(true);
    setArchiveError("");
    try {
      const [invRes, compRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/companies"),
      ]);
      const invData = await invRes.json();
      const compData = await compRes.json();
      if (!invRes.ok) throw new Error(invData?.error ?? "Arhiva računov ni bilo mogoče naložiti.");
      if (!compRes.ok) throw new Error(compData?.error ?? "Podjetij ni bilo mogoče naložiti.");
      setList(Array.isArray(invData) ? invData : []);
      setCompanies(Array.isArray(compData) ? compData : []);
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "Arhiva računov ni bilo mogoče naložiti.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadInvoiceDetail(inv: InvoiceListItem): Promise<ArchivedInvoice> {
    if (inv.imageData || details[inv.id]) {
      return details[inv.id] ?? inv;
    }

    setDetailLoading((current) => new Set(current).add(inv.id));
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      if (!res.ok) return inv;
      const full = await res.json() as ArchivedInvoice;
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

  async function openPreview(inv: InvoiceListItem) {
    setPreview(details[inv.id] ?? inv);
    const full = await loadInvoiceDetail(inv);
    setPreview(full);
  }

  async function restorePreview(inv: InvoiceListItem, file: File) {
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
    try {
      const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Računa ni bilo mogoče izbrisati.");
      setList((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setHoveredPreview((current) => current?.id === id ? null : current);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Računa ni bilo mogoče izbrisati.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleApprove(event: React.MouseEvent, inv: InvoiceListItem) {
    event.stopPropagation();
    if (!inv.documentId || inv.documentStatus !== "needs_review" || approving != null) return;
    if (!confirm("Potrdi trenutno prebrane podatke računa brez dodatnega urejanja?")) return;
    setApproving(inv.id);
    try {
      const response = await fetch(`/api/invoice-reader/${inv.documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", changes: {} }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Računa ni bilo mogoče potrditi.");
      setList((current) => current.map((item) => item.id === inv.id ? { ...item, documentStatus: "approved" } : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Računa ni bilo mogoče potrditi.");
    } finally {
      setApproving(null);
    }
  }

  // Apply company + date filters together. Company filter narrows the
  // list first (cheap O(n) pass), then the date filter does its window
  // check on the smaller set.

  async function handleReprocess(event: React.MouseEvent, inv: InvoiceListItem) {
    event.stopPropagation();
    if (!inv.documentId || reprocessing.has(inv.id)) return;

    setReprocessing((current) => new Set(current).add(inv.id));
    try {
      const response = await fetch(`/api/invoice-reader/${inv.documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprocess" }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Ponovne obdelave ni bilo mogoče zagnati.");

      setList((current) => current.map((item) => item.id === inv.id
        ? { ...item, status: "pending", errorMessage: null }
        : item));
      setDetails((current) => current[inv.id]
        ? { ...current, [inv.id]: { ...current[inv.id], status: "pending", errorMessage: null } }
        : current);
      setPreview((current) => current?.id === inv.id
        ? { ...current, status: "pending", errorMessage: null }
        : current);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Ponovne obdelave ni bilo mogoče zagnati.");
    } finally {
      setReprocessing((current) => {
        const next = new Set(current);
        next.delete(inv.id);
        return next;
      });
    }
  }

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

  const allVisibleSelected = filtered.length > 0 && filtered.every((invoice) => selectedIds.has(invoice.id));

  function toggleInvoiceSelection(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filtered.forEach((invoice) => next.delete(invoice.id));
      else filtered.forEach((invoice) => next.add(invoice.id));
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setBulkDeleting(true);
    setBulkDeleteError("");
    try {
      const response = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("bulk-delete-failed");

      const deletedIds = new Set(ids);
      setList((current) => current.filter((invoice) => !deletedIds.has(invoice.id)));
      setDetails((current) => {
        const next = { ...current };
        deletedIds.forEach((id) => { delete next[id]; });
        return next;
      });
      setPreview((current) => current && deletedIds.has(current.id) ? null : current);
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch {
      setBulkDeleteError("Računov ni bilo mogoče izbrisati. Poskusi znova.");
    } finally {
      setBulkDeleting(false);
    }
  }

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

  if (section === "ocr") {
    return (
      <>
        <InvoicesTabs active={section} onChange={setSection} />
        <InvoiceReviewGallery />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="-mx-3 -mt-6 mb-6 sm:-mx-6 sm:-mt-10 lg:-mx-8">
        <InvoicesTabs active={section} onChange={setSection} />
      </div>
      {preview && (
        <PreviewModal
          inv={preview}
          onClose={() => setPreview(null)}
          onRestore={(file) => restorePreview(preview, file)}
        />
      )}

      {hoveredPreview && !preview ? <HoverInvoicePreview inv={hoveredPreview} /> : null}

      {showBulkDelete ? (
        <BulkDeleteDialog
          count={selectedIds.size}
          deleting={bulkDeleting}
          error={bulkDeleteError}
          onCancel={() => {
            setShowBulkDelete(false);
            setBulkDeleteError("");
          }}
          onConfirm={() => { void handleBulkDelete(); }}
        />
      ) : null}

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

      {archiveError ? (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">{archiveError}</p>
          <button type="button" onClick={() => void load()} className="min-h-11 rounded-xl bg-red-600 px-4 font-bold text-white hover:bg-red-700">Poskusi znova</button>
        </div>
      ) : null}

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

      <div className="mb-5 flex justify-end">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label="Način prikaza računov">
          <button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold ${view === "grid" ? "bg-slate-900 text-white dark:bg-blue-600" : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><Grid2X2 className="h-4 w-4" /> Mreža</button>
          <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold ${view === "list" ? "bg-slate-900 text-white dark:bg-blue-600" : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><List className="h-4 w-4" /> Seznam</button>
        </div>
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

      {!loading && filtered.length > 0 ? (
        <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${selectedIds.size > 0 ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                className="h-5 w-5 rounded border-gray-300 accent-red-600"
              />
              Izberi vse prikazane
            </label>
            <span className="text-sm text-gray-500 dark:text-slate-400">{selectedIds.size} izbranih</span>
            {selectedIds.size > 0 ? (
              <span className="flex items-center gap-1 text-sm font-bold text-red-700 dark:text-red-400">
                <span aria-hidden="true">🚩</span> Izbrani računi bodo trajno odstranjeni.
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setBulkDeleteError("");
              setShowBulkDelete(true);
            }}
            disabled={selectedIds.size === 0}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            Izbriši izbrane ({selectedIds.size})
          </button>
        </div>
      ) : null}

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
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((inv) => (
            <article
              key={inv.id}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoveredPreview(inv); }}
              onPointerLeave={() => setHoveredPreview(null)}
              className={`group relative flex min-w-0 flex-col rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 ${selectedIds.has(inv.id) ? "border-red-400 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-950" : "border-gray-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-600"}`}
            >
              <label className="absolute right-5 top-5 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/95 shadow-md dark:bg-slate-900/95" onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => toggleInvoiceSelection(inv.id)} aria-label={`Izberi račun ${inv.subject}`} className="h-5 w-5 rounded border-gray-300 accent-red-600" />
              </label>

              <button type="button" onClick={() => { void openPreview(inv); }} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950" aria-label={`Odpri celoten predogled računa ${inv.subject}`}>
                <InvoiceThumbnail inv={inv} />
                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/20"><span className="translate-y-2 rounded-full bg-white/95 p-3 text-slate-900 opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100"><Eye className="h-5 w-5" /></span></span>
              </button>

              <div className="min-w-0 px-1 pb-2 pt-3">
                <div className="flex min-w-0 items-start justify-between gap-2"><h2 className="truncate font-extrabold text-gray-900 dark:text-white" title={inv.subject}>{inv.subject}</h2><StatusBadge status={inv.status} /></div>
                <p className="mt-1 truncate text-sm text-gray-500 dark:text-slate-400"><span className="font-medium">Za:</span> {inv.recipientEmail}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{fmt(inv.createdAt)}</p>
                <div className="mt-2"><DocumentStatusBadge status={inv.documentStatus} /></div>
                {inv.status === "failed" && inv.errorMessage ? <p className="mt-2 line-clamp-2 text-xs text-red-500">{inv.errorMessage}</p> : null}
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
                <button type="button" onClick={() => { void openPreview(inv); }} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Eye className="h-4 w-4" /> Poglej</button>
                {inv.documentStatus === "needs_review" && inv.documentId ? (
                  <button type="button" onClick={(event) => { void handleApprove(event, inv); }} disabled={approving === inv.id} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /> {approving === inv.id ? "..." : "Potrdi"}</button>
                ) : inv.documentId ? (
                  <Link href={`/invoice-review/${inv.documentId}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-2 text-center text-xs font-bold text-white hover:bg-blue-700">Podatki</Link>
                ) : <span />}
                <button type="button" onClick={(event) => { void handleDelete(event, inv.id); }} disabled={deleting === inv.id} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-200 px-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /> Izbriši</button>
                {inv.documentId ? <Link href={`/invoice-review/${inv.documentId}`} className="col-span-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700">Preglej in uredi OCR podatke</Link> : null}
                {inv.status === "failed" && inv.documentId ? <button type="button" onClick={(event) => { void handleReprocess(event, inv); }} disabled={reprocessing.has(inv.id)} className="col-span-3 min-h-10 rounded-lg border border-red-300 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{reprocessing.has(inv.id) ? "Obdelujem…" : "↻ Ponovno obdelaj OCR"}</button> : null}
              </div>
            </article>
          ))}
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
              className={`group flex items-start gap-4 bg-white dark:bg-slate-900 border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${selectedIds.has(inv.id) ? "border-red-400 ring-2 ring-red-100 dark:border-red-600 dark:ring-red-950" : "border-gray-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-600"}`}
            >
              <label
                className="mt-5 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(inv.id)}
                  onChange={() => toggleInvoiceSelection(inv.id)}
                  aria-label={`Izberi račun ${inv.subject}`}
                  className="h-5 w-5 rounded border-gray-300 accent-red-600"
                />
              </label>
              {/* Thumbnail */}
              {inv.imageMime === "application/pdf" ? (
                <div className="w-16 h-16 group-hover:w-40 group-hover:h-52 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex flex-col items-center justify-center flex-shrink-0 gap-0.5 overflow-hidden transition-all duration-200">
                  {displayInv.imageData || displayInv.previewUrl ? (
                    <iframe
                      src={displayInv.imageData
                        ? `data:application/pdf;base64,${displayInv.imageData}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
                        : `${displayInv.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
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
              ) : inv.imageData || inv.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inv.imageData ? `data:${inv.imageMime};base64,${inv.imageData}` : inv.previewUrl!}
                  alt="thumb"
                  loading="lazy"
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
                <div className="mt-2"><DocumentStatusBadge status={inv.documentStatus} /></div>
                {inv.status === "failed" && inv.errorMessage && (
                  <p className="text-xs text-red-500 mt-1 line-clamp-2">{inv.errorMessage}</p>
                )}
              </div>

              {/* Preview hint + Delete */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">Klikni za predogled</span>
                {inv.documentStatus === "needs_review" && inv.documentId ? (
                  <button type="button" onClick={(event) => { void handleApprove(event, inv); }} disabled={approving === inv.id} className="min-h-9 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{approving === inv.id ? "Potrjujem…" : "✓ Potrdi"}</button>
                ) : inv.documentId ? (
                  <Link href={`/invoice-review/${inv.documentId}`} onClick={(event) => event.stopPropagation()} className="inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">OCR podatki</Link>
                ) : null}
                {inv.status === "failed" && inv.documentId ? (
                  <button
                    type="button"
                    onClick={(event) => { void handleReprocess(event, inv); }}
                    disabled={reprocessing.has(inv.id)}
                    className="min-h-9 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-60 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                    title="Ponovno obdelaj OCR"
                  >
                    {reprocessing.has(inv.id) ? "⏳" : "↻"} Ponovno obdelaj
                  </button>
                ) : null}
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
