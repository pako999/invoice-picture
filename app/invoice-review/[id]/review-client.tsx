"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, Save, XCircle } from "lucide-react";

type Evidence = { fieldPath: string; valueText: string | null; pageNumber: number | null; bbox: unknown; confidence: number | null };
type Validation = { status: string; warnings: string[]; errors: string[]; differences: Record<string, string> };
type Detail = {
  document: {
    id: number; filename: string; mimeType: string; status: string; provider: string | null; model: string | null;
    normalized: InvoiceData | null; approved: InvoiceData | null; warnings: string[]; overallConfidenceBps: number | null;
  };
  evidence: Evidence[];
  validations: Validation[];
  duplicates: Array<{ id: number; duplicateOfDocumentId: number; reason: string }>;
  corrections: Array<{ id: number; fieldPath: string; oldValue: string | null; newValue: string | null; createdAt: string }>;
  fileUrl: string;
};

type InvoiceData = {
  documentType: string; documentLanguage: string | null; invoiceNumber: string | null; purchaseOrderNumber: string | null;
  issueDate: string | null; serviceDate: string | null; dueDate: string | null; paymentReference: string | null; paymentTerms: string | null; currency: string | null;
  supplier: Record<string, string | null>; buyer: Record<string, string | null>;
  totals: Record<string, string | null>;
  lineItems: Array<Record<string, string | null>>;
  vatBreakdown: Array<Record<string, string | null>>;
  confidence: { overall: number | null; fields: Record<string, number | null> };
  warnings: string[];
};

const fieldGroups: Array<{ title: string; fields: Array<[string, string]> }> = [
  { title: "Dokument", fields: [["invoiceNumber", "Številka računa"], ["purchaseOrderNumber", "Naročilnica"], ["issueDate", "Datum izdaje"], ["serviceDate", "Datum storitve"], ["dueDate", "Rok plačila"], ["currency", "Valuta"], ["paymentReference", "Sklic"], ["paymentTerms", "Plačilni pogoji"]] },
  { title: "Dobavitelj", fields: [["supplier.name", "Naziv"], ["supplier.vatNumber", "ID za DDV"], ["supplier.registrationNumber", "Matična"], ["supplier.address", "Naslov"], ["supplier.postalCode", "Pošta"], ["supplier.city", "Mesto"], ["supplier.countryCode", "Država"], ["supplier.iban", "IBAN"], ["supplier.bic", "BIC"], ["supplier.email", "E-mail"], ["supplier.phone", "Telefon"]] },
  { title: "Kupec", fields: [["buyer.name", "Naziv"], ["buyer.vatNumber", "ID za DDV"], ["buyer.registrationNumber", "Matična"], ["buyer.address", "Naslov"], ["buyer.postalCode", "Pošta"], ["buyer.city", "Mesto"], ["buyer.countryCode", "Država"]] },
  { title: "Zneski", fields: [["totals.netAmount", "Neto"], ["totals.discountAmount", "Popust"], ["totals.vatAmount", "DDV"], ["totals.grossAmount", "Bruto"], ["totals.amountPaid", "Plačano"], ["totals.amountDue", "Za plačilo"]] },
];

export function InvoiceReviewClient({ documentId }: { documentId: number }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<Record<string, string>>( {} );
  const [initial, setInitial] = useState<Record<string, string>>( {} );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<number[]>([]);

  const load = useCallback(async () => {
    const [detailRes, listRes] = await Promise.all([
      fetch(`/api/invoice-reader/${documentId}`, { cache: "no-store" }),
      fetch("/api/invoice-reader", { cache: "no-store" }),
    ]);
    if (!detailRes.ok) throw new Error("Dokumenta ni mogoče odpreti");
    const json = await detailRes.json() as Detail;
    const list = await listRes.json();
    const invoice = json.document.approved ?? json.document.normalized;
    const flat = invoice ? flatten(invoice) : {};
    setDetail(json);
    setForm(flat);
    setInitial(flat);
    setSiblings((list.documents ?? []).filter((d: { status: string }) => d.status === "needs_review").map((d: { id: number }) => d.id));
  }, [documentId]);

  useEffect(() => { load().catch((e) => setMessage(e.message)); }, [load]);

  const submit = useCallback(async (action: "save" | "approve" | "reject" | "reprocess") => {
    setBusy(action);
    setMessage(null);
    const changes: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(form)) if ((initial[key] ?? "") !== value) changes[key] = value || null;
    const res = await fetch(`/api/invoice-reader/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, changes, reason: reason || undefined }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setMessage(json.error ?? "Napaka"); return; }
    setMessage(action === "approve" ? "Račun je potrjen." : action === "reject" ? "Račun je zavrnjen." : action === "reprocess" ? "Račun je ponovno v čakalni vrsti." : "Spremembe so shranjene.");
    await load();
    if (action === "approve" || action === "reject") setTimeout(() => goRelative(1), 250);
  }, [documentId, form, initial, reason, load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void submit("save"); }
      if (event.altKey && event.key.toLowerCase() === "a") { event.preventDefault(); void submit("approve"); }
      if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); goRelative(-1); }
      if (event.altKey && event.key === "ArrowRight") { event.preventDefault(); goRelative(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, siblings, documentId]);

  function goRelative(offset: number) {
    const index = siblings.indexOf(documentId);
    if (index < 0) return router.push("/invoice-review");
    const target = siblings[index + offset];
    if (target) router.push(`/invoice-review/${target}`);
    else router.push("/invoice-review");
  }

  const selectedEvidence = useMemo(() => detail?.evidence.find((e) => e.fieldPath === selectedPath) ?? null, [detail, selectedPath]);
  const latestValidation = detail?.validations?.[0] ?? null;
  const invoice = detail?.document.approved ?? detail?.document.normalized;

  if (!detail) return <main className="mx-auto max-w-7xl p-8"><div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Nalaganje dokumenta…</div>{message && <p className="mt-4 text-red-600">{message}</p>}</main>;

  return (
    <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 lg:px-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/invoice-review" className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0"><h1 className="truncate text-xl font-extrabold text-slate-950 dark:text-white">{detail.document.filename}</h1><p className="text-xs text-slate-500">{detail.document.provider ?? "—"} · {detail.document.model ?? "—"} · {detail.document.status}</p></div>
        </div>
        <div className="flex items-center gap-2"><button onClick={() => goRelative(-1)} className="rounded-lg border p-2" title="Prejšnji (Alt+←)"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => goRelative(1)} className="rounded-lg border p-2" title="Naslednji (Alt+→)"><ChevronRight className="h-4 w-4" /></button></div>
      </div>

      {(latestValidation?.errors.length || latestValidation?.warnings.length || detail.duplicates.length > 0) ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Potreben je pregled</div>
          <ul className="list-disc space-y-1 pl-5">{latestValidation?.errors.map((x) => <li key={x}>{x}</li>)}{latestValidation?.warnings.map((x) => <li key={x}>{x}</li>)}{detail.duplicates.length > 0 && <li>Možen podvojen račun: {detail.duplicates.map((d) => `#${d.duplicateOfDocumentId}`).join(", ")}</li>}</ul>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,.95fr)]">
        <section className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm lg:h-full">
            {detail.document.mimeType.startsWith("image/") ? (
              <div className="relative h-full w-full overflow-auto bg-slate-900/5 p-4"><img src={detail.fileUrl} alt={detail.document.filename} className="mx-auto max-h-full max-w-full object-contain" />{selectedEvidence && <EvidenceOverlay evidence={selectedEvidence} />}</div>
            ) : detail.document.mimeType === "application/pdf" ? (
              <iframe src={detail.fileUrl} title={detail.document.filename} className="h-full w-full bg-white" />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center"><a href={detail.fileUrl} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Prenesi izvorni dokument</a></div>
            )}
          </div>
          {selectedEvidence && <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><strong>Dokaz:</strong> {selectedEvidence.fieldPath} · stran {selectedEvidence.pageNumber ?? "—"} · zanesljivost {selectedEvidence.confidence == null ? "—" : `${Math.round(selectedEvidence.confidence * 100)}%`}</div>}
        </section>

        <section className="space-y-4 pb-28">
          {fieldGroups.map((group) => <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} evidence={detail.evidence} selectedPath={selectedPath} setSelectedPath={setSelectedPath} />)}

          {invoice?.vatBreakdown?.length ? <DataTable title="DDV razčlenitev" rows={invoice.vatBreakdown} columns={["vatRate", "taxableAmount", "vatAmount", "grossAmount"]} /> : null}
          {invoice?.lineItems?.length ? <DataTable title={`Postavke (${invoice.lineItems.length})`} rows={invoice.lineItems} columns={["description", "quantity", "unitPriceNet", "vatRate", "netAmount", "vatAmount", "grossAmount"]} /> : null}

          {detail.corrections.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold">Revizijska sled popravkov</h2><div className="mt-3 max-h-48 space-y-2 overflow-auto text-xs text-slate-600">{detail.corrections.map((c) => <div key={c.id} className="rounded-lg bg-slate-50 p-2"><strong>{c.fieldPath}</strong>: {c.oldValue ?? "∅"} → {c.newValue ?? "∅"} · {new Date(c.createdAt).toLocaleString("sl-SI")}</div>)}</div></div>}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><label className="text-sm font-bold">Razlog / opomba (obvezno pri potrditvi z napakami)</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Npr. preverjeno z originalom…" /></div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2"><div className="text-sm text-slate-500">{message || "Ctrl/Cmd+S shrani · Alt+A potrdi · Alt+←/→ navigacija"}</div><div className="flex flex-wrap gap-2"><Action busy={busy} name="reprocess" onClick={() => submit("reprocess")} icon={<RefreshCw className="h-4 w-4" />}>Ponovno obdelaj</Action><Action busy={busy} name="reject" onClick={() => submit("reject")} className="border-red-200 text-red-700" icon={<XCircle className="h-4 w-4" />}>Zavrni</Action><Action busy={busy} name="save" onClick={() => submit("save")} icon={<Save className="h-4 w-4" />}>Shrani</Action><Action busy={busy} name="approve" onClick={() => submit("approve")} className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" icon={<Check className="h-4 w-4" />}>Potrdi račun</Action></div></div>
      </div>
    </main>
  );
}

function FieldGroup({ title, fields, form, setForm, evidence, selectedPath, setSelectedPath }: { title: string; fields: Array<[string, string]>; form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>; evidence: Evidence[]; selectedPath: string | null; setSelectedPath: (path: string) => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h2 className="mb-3 text-lg font-extrabold text-slate-900 dark:text-white">{title}</h2><div className="grid gap-3 sm:grid-cols-2">{fields.map(([path, label]) => { const ev = evidence.find((e) => e.fieldPath === path); const low = ev?.confidence != null && ev.confidence < 0.92; return <label key={path} className={`rounded-xl border p-2 ${selectedPath === path ? "border-blue-400 bg-blue-50/60" : low ? "border-amber-300 bg-amber-50" : "border-slate-200 dark:border-slate-700"}`}><div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>{label}</span><span className={low ? "text-amber-700" : "text-slate-400"}>{ev?.confidence == null ? "" : `${Math.round(ev.confidence * 100)}%`}</span></div><input value={form[path] ?? ""} onFocus={() => setSelectedPath(path)} onChange={(e) => setForm((f) => ({ ...f, [path]: e.target.value }))} className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none dark:text-white" /></label>; })}</div></div>;
}

function DataTable({ title, rows, columns }: { title: string; rows: Array<Record<string, string | null>>; columns: string[] }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="p-4 font-extrabold">{title}</div><div className="overflow-x-auto"><table className="min-w-full text-xs"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{columns.map((c) => <th key={c} className="px-3 py-2 text-left">{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{columns.map((c) => <td key={c} className="max-w-[260px] truncate px-3 py-2">{row[c] ?? "—"}</td>)}</tr>)}</tbody></table></div></div>;
}

function Action({ children, busy, name, onClick, icon, className = "" }: { children: React.ReactNode; busy: string | null; name: string; onClick: () => void; icon: React.ReactNode; className?: string }) {
  return <button disabled={busy != null} onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 ${className}`}>{busy === name ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{children}</button>;
}

function flatten(invoice: InvoiceData) {
  const out: Record<string, string> = {};
  for (const [, fields] of fieldGroups.map((g) => [g.title, g.fields] as const)) for (const [path] of fields) out[path] = String(getPath(invoice, path) ?? "");
  return out;
}
function getPath(obj: unknown, path: string): unknown { return path.split(".").reduce<unknown>((v, key) => v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined, obj); }

function EvidenceOverlay({ evidence }: { evidence: Evidence }) {
  const style = bboxToStyle(evidence.bbox);
  if (!style) return <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-amber-400/70" />;
  return <div className="pointer-events-none absolute border-4 border-amber-400 bg-amber-300/20 shadow-[0_0_0_9999px_rgba(0,0,0,.04)]" style={style} />;
}

function bboxToStyle(bbox: unknown): React.CSSProperties | null {
  let values: number[] | null = null;
  if (Array.isArray(bbox) && bbox.length >= 4 && bbox.every((x) => typeof x === "number")) values = bbox.slice(0, 4) as number[];
  else if (bbox && typeof bbox === "object") {
    const b = bbox as Record<string, unknown>;
    if ([b.x1, b.y1, b.x2, b.y2].every((x) => typeof x === "number")) values = [b.x1, b.y1, b.x2, b.y2] as number[];
  }
  if (!values) return null;
  const [x1, y1, x2, y2] = values;
  const max = Math.max(...values.map(Math.abs));
  const scale = max <= 1 ? 100 : max <= 1000 ? 0.1 : 0.05;
  return { left: `${x1 * scale}%`, top: `${y1 * scale}%`, width: `${Math.max(1, (x2 - x1) * scale)}%`, height: `${Math.max(1, (y2 - y1) * scale)}%` };
}
