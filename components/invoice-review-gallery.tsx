"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Check, CheckCircle2, Clock3, ExternalLink, Eye, FileSearch,
  Grid2X2, List, Loader2, Maximize2, RefreshCw, Trash2, X, XCircle,
} from "lucide-react";

type Doc = {
  id: number; filename: string; mimeType: string; status: string; provider: string | null;
  documentType: string | null; overallConfidenceBps: number | null; validationStatus: string;
  warningsJson: string | null; createdAt: string; previewUrl: string;
};
type Payload = { documents: Doc[]; stats: Record<string, number | null> };
type ConfirmAction = { kind: "approve" | "delete"; document: Doc } | null;

const filters = [
  ["needs_review", "Za pregled"], ["queued", "V čakalni vrsti"], ["processing", "Obdelava"],
  ["approved", "Potrjeno"], ["failed", "Napake"], ["all", "Vse"],
] as const;

export function InvoiceReviewGallery() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("needs_review");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [hovered, setHovered] = useState<Doc | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invoice-reader", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Računov ni bilo mogoče naložiti.");
      setPayload(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Računov ni bilo mogoče naložiti.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!preview && !confirmAction && !showBulkDelete) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showBulkDelete && !bulkDeleting) setShowBulkDelete(false);
      else if (confirmAction) setConfirmAction(null);
      else setPreview(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [bulkDeleting, confirmAction, preview, showBulkDelete]);

  useEffect(() => { setSelectedIds(new Set()); }, [filter]);

  const docs = useMemo(() => payload?.documents.filter((item) => filter === "all" || item.status === filter) ?? [], [payload, filter]);
  const stats = payload?.stats ?? {};
  const allVisibleSelected = docs.length > 0 && docs.every((item) => selectedIds.has(item.id));

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) docs.forEach((item) => next.delete(item.id));
      else docs.forEach((item) => next.add(item.id));
      return next;
    });
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/invoice-reader", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Izbranih računov ni bilo mogoče izbrisati.");
      setSelectedIds(new Set());
      setShowBulkDelete(false);
      setHovered(null);
      setPreview((current) => current && ids.includes(current.id) ? null : current);
      await load();
    } catch (deleteError) {
      setShowBulkDelete(false);
      setError(deleteError instanceof Error ? deleteError.message : "Izbranih računov ni bilo mogoče izbrisati.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    const { document: selected, kind } = confirmAction;
    setBusyId(selected.id);
    setError("");
    try {
      const response = await fetch(`/api/invoice-reader/${selected.id}`, {
        method: kind === "delete" ? "DELETE" : "PATCH",
        headers: kind === "approve" ? { "Content-Type": "application/json" } : undefined,
        body: kind === "approve" ? JSON.stringify({ action: "approve", changes: {} }) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? (kind === "delete" ? "Računa ni bilo mogoče izbrisati." : "Računa ni bilo mogoče potrditi."));
      setConfirmAction(null);
      setHovered(null);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(selected.id);
        return next;
      });
      setPreview((current) => current?.id === selected.id ? null : current);
      await load();
    } catch (actionError) {
      setConfirmAction(null);
      setError(actionError instanceof Error ? actionError.message : "Dejanja ni bilo mogoče dokončati.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Invoice Intelligence</p>
          <h1 className="text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl dark:text-white">Pregled in potrditev računov</h1>
          <p className="mt-1 break-words text-sm text-slate-500 sm:text-base">Oglejte si več računov hkrati, odprite original ter račun potrdite ali izbrišite.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Osveži
        </button>
      </div>

      <section className="mb-7 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Skupaj" value={stats.total} icon={<FileSearch className="h-5 w-5" />} />
        <Stat label="Potrjeno" value={stats.approved} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
        <Stat label="Za pregled" value={stats.needs_review} icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} />
        <Stat label="V obdelavi" value={(stats.queued ?? 0) + (stats.processing ?? 0)} icon={<Clock3 className="h-5 w-5 text-blue-600" />} />
        <Stat label="Napake" value={stats.failed} icon={<XCircle className="h-5 w-5 text-red-600" />} />
      </section>

      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1" aria-label="Filtriraj račune">
          {filters.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? "bg-slate-950 text-white dark:bg-blue-600" : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>{label}</button>)}
        </div>
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label="Način prikaza">
          <ViewButton active={view === "grid"} onClick={() => setView("grid")} icon={<Grid2X2 className="h-4 w-4" />}>Mreža</ViewButton>
          <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<List className="h-4 w-4" />}>Seznam</ViewButton>
        </div>
      </div>

      {!loading && docs.length > 0 ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 font-bold text-slate-800 dark:text-white">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Izberi vse prikazane
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-slate-500">{selectedIds.size} izbranih</span>
            <button type="button" onClick={() => setShowBulkDelete(true)} disabled={selectedIds.size === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
              <Trash2 className="h-4 w-4" /> Izbriši izbrane ({selectedIds.size})
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div> : null}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin" />Nalaganje…</div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" /><p className="font-semibold text-slate-800 dark:text-white">Ni dokumentov v tem pogledu.</p></div>
      ) : view === "grid" ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Računi">
          {docs.map((item) => <InvoiceCard key={item.id} document={item} selected={selectedIds.has(item.id)} busy={busyId === item.id} onToggle={() => toggleSelected(item.id)} onPreview={() => setPreview(item)} onHover={setHovered} onApprove={() => setConfirmAction({ kind: "approve", document: item })} onDelete={() => setConfirmAction({ kind: "delete", document: item })} />)}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label="Računi">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{docs.map((item) => <InvoiceRow key={item.id} document={item} selected={selectedIds.has(item.id)} busy={busyId === item.id} onToggle={() => toggleSelected(item.id)} onPreview={() => setPreview(item)} onApprove={() => setConfirmAction({ kind: "approve", document: item })} onDelete={() => setConfirmAction({ kind: "delete", document: item })} />)}</div>
        </section>
      )}

      {hovered && !preview && !confirmAction ? <HoverPreview document={hovered} /> : null}
      {preview ? <PreviewModal document={preview} onClose={() => setPreview(null)} /> : null}
      {confirmAction ? <ConfirmDialog action={confirmAction} busy={busyId === confirmAction.document.id} onCancel={() => setConfirmAction(null)} onConfirm={() => void runConfirmedAction()} /> : null}
      {showBulkDelete ? <BulkDeleteDialog count={selectedIds.size} busy={bulkDeleting} onCancel={() => setShowBulkDelete(false)} onConfirm={() => void deleteSelected()} /> : null}
    </main>
  );
}

function InvoiceCard({ document: item, selected, busy, onToggle, onPreview, onHover, onApprove, onDelete }: { document: Doc; selected: boolean; busy: boolean; onToggle: () => void; onPreview: () => void; onHover: (document: Doc | null) => void; onApprove: () => void; onDelete: () => void }) {
  const warnings = parseWarnings(item.warningsJson);
  return (
    <article className={`relative flex min-w-0 flex-col rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 ${selected ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400" : "border-slate-200 dark:border-slate-700"}`}>
      <label className="absolute left-5 top-5 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white/95 shadow-md dark:border-slate-600 dark:bg-slate-900/95" title="Izberi račun">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" aria-label={`Izberi račun ${item.filename}`} />
      </label>
      <button type="button" onClick={onPreview} onPointerEnter={(event) => { if (event.pointerType === "mouse") onHover(item); }} onPointerLeave={() => onHover(null)} className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950" aria-label={`Odpri celoten predogled: ${item.filename}`}>
        <DocumentPreview document={item} compact />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/20"><span className="translate-y-2 rounded-full bg-white/95 p-3 text-slate-900 opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100"><Maximize2 className="h-5 w-5" /></span></span>
      </button>
      <div className="min-w-0 px-1 pb-1 pt-3">
        <div className="flex min-w-0 items-start justify-between gap-2"><h2 className="min-w-0 truncate font-extrabold text-slate-900 dark:text-white" title={item.filename}>{item.filename}</h2><Status status={item.status} /></div>
        <p className="mt-1 truncate text-xs text-slate-500">{item.documentType || "Dokument"} · {new Date(item.createdAt).toLocaleString("sl-SI")}</p>
        <p className="mt-1 text-xs text-slate-500">Zanesljivost: <strong className="text-slate-800 dark:text-slate-200">{confidence(item)}</strong></p>
        {warnings[0] ? <p className="mt-1 truncate text-xs text-amber-700" title={warnings[0]}>{warnings[0]}</p> : null}
      </div>
      <CardActions document={item} busy={busy} onPreview={onPreview} onApprove={onApprove} onDelete={onDelete} />
    </article>
  );
}

function InvoiceRow({ document: item, selected, busy, onToggle, onPreview, onApprove, onDelete }: { document: Doc; selected: boolean; busy: boolean; onToggle: () => void; onPreview: () => void; onApprove: () => void; onDelete: () => void }) {
  return <article className={`grid grid-cols-[auto_6rem_minmax(0,1fr)] items-center gap-3 p-3 sm:grid-cols-[auto_6rem_minmax(0,1fr)_auto] ${selected ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}`}><label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl" title="Izberi račun"><input type="checkbox" checked={selected} onChange={onToggle} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" aria-label={`Izberi račun ${item.filename}`} /></label><button type="button" onClick={onPreview} className="relative aspect-[4/3] w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700" aria-label={`Predogled: ${item.filename}`}><DocumentPreview document={item} compact /></button><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><h2 className="truncate font-bold text-slate-900 dark:text-white">{item.filename}</h2><Status status={item.status} /></div><p className="mt-1 truncate text-sm text-slate-500">{item.documentType || "Dokument"} · {item.provider || "čaka na obdelavo"} · {new Date(item.createdAt).toLocaleString("sl-SI")} · {confidence(item)}</p></div><div className="col-span-3 sm:col-span-1"><CardActions document={item} busy={busy} onPreview={onPreview} onApprove={onApprove} onDelete={onDelete} compact /></div></article>;
}

function CardActions({ document: item, busy, onPreview, onApprove, onDelete, compact = false }: { document: Doc; busy: boolean; onPreview: () => void; onApprove: () => void; onDelete: () => void; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-3 sm:flex" : "mt-auto grid-cols-3 pt-3"}`}>
      <button type="button" onClick={onPreview} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Eye className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>Poglej</span></button>
      {item.status === "needs_review" ? <button type="button" onClick={onApprove} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>Potrdi</span></button> : <Link href={`/invoice-review/${item.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-xs font-bold text-white hover:bg-blue-700"><ExternalLink className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>Odpri</span></Link>}
      <button type="button" onClick={onDelete} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /><span className={compact ? "sr-only" : ""}>Izbriši</span></button>
      {!compact ? <Link href={`/invoice-review/${item.id}`} className="col-span-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700">Preglej podatke <ExternalLink className="h-3.5 w-3.5" /></Link> : null}
    </div>
  );
}

function DocumentPreview({ document: item, compact = false }: { document: Doc; compact?: boolean }) {
  if (item.mimeType.startsWith("image/")) return <img src={item.previewUrl} alt="" loading="lazy" className="h-full w-full object-contain" />;
  if (item.mimeType === "application/pdf") return <iframe src={`${item.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`} loading="lazy" tabIndex={-1} title={compact ? `Predogled: ${item.filename}` : item.filename} className="pointer-events-none h-full w-full bg-white" />;
  return <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-slate-500"><FileSearch className="h-9 w-9" /><span className="text-xs font-semibold">Predogled ni na voljo</span></div>;
}

function HoverPreview({ document: item }: { document: Doc }) {
  return <aside className="pointer-events-none fixed bottom-4 right-4 top-20 z-[70] hidden w-[min(46vw,46rem)] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl lg:block dark:border-slate-600 dark:bg-slate-900" aria-hidden="true"><div className="flex h-12 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700"><span className="max-w-[80%] truncate text-sm font-bold">{item.filename}</span><span className="text-xs font-semibold text-slate-500">Kliknite za celozaslonski pogled</span></div><div className="h-[calc(100%-3rem)]"><DocumentPreview document={item} /></div></aside>;
}

function PreviewModal({ document: item, onClose }: { document: Doc; onClose: () => void }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-labelledby="invoice-preview-title" className="flex h-[95dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}><header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-5 dark:border-slate-700"><div className="min-w-0"><h2 id="invoice-preview-title" className="truncate font-extrabold text-slate-950 dark:text-white">{item.filename}</h2><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("sl-SI")}</p></div><div className="flex shrink-0 items-center gap-2"><Link href={`/invoice-review/${item.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700">Preglej podatke <ExternalLink className="h-4 w-4" /></Link><button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800" aria-label="Zapri predogled"><X className="h-5 w-5" /></button></div></header><div className="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950"><DocumentPreview document={item} /></div></section></div>;
}

function ConfirmDialog({ action, busy, onCancel, onConfirm }: { action: Exclude<ConfirmAction, null>; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const deleting = action.kind === "delete";
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={() => { if (!busy) onCancel(); }}><section role="dialog" aria-modal="true" aria-labelledby="confirm-action-title" className={`w-full max-w-lg rounded-2xl border-2 bg-white p-6 shadow-2xl dark:bg-slate-900 ${deleting ? "border-red-500" : "border-emerald-500"}`} onMouseDown={(event) => event.stopPropagation()}><h2 id="confirm-action-title" className={`text-xl font-extrabold ${deleting ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{deleting ? "Trajno izbriši račun?" : "Potrdi račun brez dodatnega pregleda?"}</h2><p className="mt-2 break-all font-semibold text-slate-900 dark:text-white">{action.document.filename}</p><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{deleting ? "Račun, izvorna datoteka in podatki obdelave bodo trajno odstranjeni. Dejanja ni mogoče razveljaviti." : "Potrjeni bodo trenutno prebrani podatki. Če jih želite najprej popraviti, izberite »Preglej podatke« na kartici računa."}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Prekliči</button><button type="button" onClick={onConfirm} disabled={busy} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-bold text-white disabled:opacity-50 ${deleting ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : deleting ? <Trash2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}{busy ? "Prosim, počakajte…" : deleting ? "Trajno izbriši" : "Potrdi račun"}</button></div></section></div>;
}

function BulkDeleteDialog({ count, busy, onCancel, onConfirm }: { count: number; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={() => { if (!busy) onCancel(); }}><section role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title" className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-white p-6 shadow-2xl dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}><h2 id="bulk-delete-title" className="text-xl font-extrabold text-red-700 dark:text-red-400">Trajno izbriši izbrane račune?</h2><p className="mt-3 text-slate-700 dark:text-slate-200">Izbrisali boste <strong>{count} {count === 1 ? "račun" : count === 2 ? "računa" : "računov"}</strong>, njihove izvorne datoteke in podatke obdelave.</p><p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-400">Tega dejanja ni mogoče razveljaviti.</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Prekliči</button><button type="button" onClick={onConfirm} disabled={busy || count === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{busy ? "Brisanje…" : `Trajno izbriši (${count})`}</button></div></section></div>;
}

function ViewButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) { return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold ${active ? "bg-slate-950 text-white dark:bg-blue-600" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{icon}{children}</button>; }
function Stat({ label, value, icon }: { label: string; value: number | null | undefined; icon: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 dark:border-slate-700 dark:bg-slate-900"><div className="mb-2 flex items-center justify-between text-slate-500"><span className="text-[11px] font-bold uppercase tracking-wide sm:text-xs">{label}</span>{icon}</div><div className="text-2xl font-extrabold text-slate-950 sm:text-3xl dark:text-white">{value ?? 0}</div></div>; }
function Status({ status }: { status: string }) { const labels: Record<string, string> = { approved: "Potrjeno", needs_review: "Za pregled", failed: "Napaka", queued: "V vrsti", processing: "Obdelava", uploaded: "Naloženo" }; const cls = status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "needs_review" ? "bg-amber-100 text-amber-700" : status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"; return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{labels[status] ?? status.replace("_", " ")}</span>; }
function parseWarnings(value: string | null) { if (!value) return [] as string[]; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
function confidence(document: Doc) { return document.overallConfidenceBps == null ? "—" : `${Math.round(document.overallConfidenceBps / 100)}%`; }

