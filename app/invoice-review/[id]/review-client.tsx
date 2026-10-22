"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { invoiceIssueLabel } from "@/lib/invoice-intelligence/issue-labels";
import Link from "next/link";
import { InvoiceDocumentViewer } from "@/components/invoice-document-viewer";
import { SepaPaymentExport } from "@/components/sepa-payment-export";
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, FileText, History, Loader2, RefreshCw, Save, Wallet, XCircle } from "lucide-react";

type Evidence = { fieldPath: string; valueText: string | null; pageNumber: number | null; bbox: unknown; confidence: number | null };
type Validation = { status: string; warnings: string[]; errors: string[]; differences: Record<string, string> };
type Detail = {
  document: {
    id: number; filename: string; mimeType: string; status: string; provider: string | null; model: string | null;
    legacyMultiPagePdf?: boolean; estimatedPages?: number | null;
    normalized: InvoiceData | null; approved: InvoiceData | null; warnings: string[]; overallConfidenceBps: number | null;
  };
  evidence: Evidence[];
  validations: Validation[];
  duplicates: Array<{ id: number; duplicateOfDocumentId: number; reason: string }>;
  corrections: Array<{ id: number; fieldPath: string; oldValue: string | null; newValue: string | null; createdAt: string }>;
  fileUrl: string;
};

type InvoiceData = {
  documentType: string; documentLanguage: string | null; documentStatus: string | null; invoiceNumber: string | null; purchaseOrderNumber: string | null;
  deliveryNoteNumber: string | null; supplyPlace: string | null;
  issueDate: string | null; serviceDate: string | null; dueDate: string | null; paymentReference: string | null; paymentTerms: string | null; shippingMethod: string | null; currency: string | null;
  supplier: Record<string, string | null>; buyer: Record<string, string | null>;
  totals: Record<string, string | null>;
  lineItems: Array<Record<string, string | null>>;
  vatBreakdown: Array<Record<string, string | null>>;
  confidence: { overall: number | null; fields: Record<string, number | null> };
  warnings: string[];
};

const fieldGroups: Array<{ title: string; fields: Array<[string, string]> }> = [
  { title: "Dokument", fields: [["invoiceNumber", "Številka računa"], ["documentStatus", "Status dokumenta"], ["purchaseOrderNumber", "Naročilnica"], ["deliveryNoteNumber", "Dobavnica"], ["supplyPlace", "Kraj dobave/izdaje blaga"], ["issueDate", "Datum izdaje"], ["serviceDate", "Datum storitve"], ["dueDate", "Rok plačila"], ["currency", "Valuta"], ["paymentReference", "Sklic"], ["paymentTerms", "Plačilni pogoji"], ["shippingMethod", "Način odpreme"]] },
  { title: "Dobavitelj", fields: [["supplier.name", "Naziv"], ["supplier.vatNumber", "ID za DDV"], ["supplier.registrationNumber", "Matična"], ["supplier.address", "Naslov"], ["supplier.postalCode", "Pošta"], ["supplier.city", "Mesto"], ["supplier.countryCode", "Država"], ["supplier.iban", "IBAN"], ["supplier.bic", "BIC"], ["supplier.email", "E-mail"], ["supplier.phone", "Telefon"]] },
  { title: "Kupec", fields: [["buyer.name", "Naziv"], ["buyer.vatNumber", "ID za DDV"], ["buyer.registrationNumber", "Matična"], ["buyer.address", "Naslov"], ["buyer.postalCode", "Pošta"], ["buyer.city", "Mesto"], ["buyer.countryCode", "Država"]] },
  { title: "Zneski", fields: [["totals.amountBeforeDiscount", "Vrednost pred rabatom"], ["totals.netAmount", "Neto"], ["totals.discountAmount", "Popust"], ["totals.vatAmount", "DDV"], ["totals.grossAmount", "Bruto"], ["totals.amountPaid", "Plačano"], ["totals.amountDue", "Za plačilo"]] },
];

export function InvoiceReviewClient({ documentId, onUpdated, onBack, reviewIds, onNavigate }: {
  documentId: number;
  onUpdated?: () => void;
  onBack?: () => void;
  reviewIds?: number[];
  onNavigate?: (documentId: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "sl";
  const [mobilePanel, setMobilePanel] = useState<"data" | "document">("data");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<Record<string, string>>( {} );
  const [initial, setInitial] = useState<Record<string, string>>( {} );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<number[]>([]);
  const submitting = useRef(false);

  const load = useCallback(async () => {
    const detailRes = await fetch(`/api/invoice-reader/${documentId}`, { cache: "no-store" });
    if (!detailRes.ok) throw new Error("Dokumenta ni mogoče odpreti");
    const json = await detailRes.json() as Detail;
    const isProcessing = json.document.status === "queued" || json.document.status === "processing";
    const invoice = isProcessing ? null : json.document.status === "approved" ? json.document.approved ?? json.document.normalized : json.document.normalized ?? json.document.approved;
    const flat = invoice ? flatten(invoice) : {};
    setDetail(json);
    setForm(flat);
    setInitial(flat);
  }, [documentId]);

  useEffect(() => {
    if (reviewIds) return;
    let active = true;
    void fetchReviewQueue({}).then((documents) => {
      if (active) setSiblings(documents.map((document) => document.id));
    }).catch(() => { /* A navigation-list failure must not hide the invoice. */ });
    return () => { active = false; };
  }, [documentId, reviewIds]);

  useEffect(() => { load().catch((e) => setMessage(e.message)); }, [load]);

  useEffect(() => {
    const status = detail?.document.status;
    if (status !== "queued" && status !== "processing") return;
    const timer = window.setInterval(() => void load().catch((e) => setMessage(e.message)), 3000);
    return () => window.clearInterval(timer);
  }, [detail?.document.status, load]);

  const submit = useCallback(async (action: "save" | "approve" | "reject" | "reprocess") => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(action);
    setMessage(null);
    try {
    const changes: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(form)) if ((initial[key] ?? "") !== value) changes[key] = value || null;
    const res = await fetch(`/api/invoice-reader/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, changes, reason: reason || undefined }),
    });
    const json = await res.json().catch(() => { throw new Error("Strežnik ni vrnil veljavnega odgovora"); });
    if (!res.ok) { setMessage(json.error ?? "Napaka"); return; }
    if (action === "reprocess" && Number.isInteger(Number(json.bulkJobId))) {
      router.push(`/bulk-invoices/${Number(json.bulkJobId)}`);
      return;
    }
    if (action === "approve" || action === "reject") {
      if (onUpdated) {
        onUpdated();
        let nextDocumentId: number | undefined;
        try {
          const pending = await fetchReviewQueue({ ids: reviewIds, excludeId: documentId, limit: 1 });
          nextDocumentId = pending[0]?.id;
        } catch { /* Return to the processing overview if refreshing the queue fails. */ }
        if (nextDocumentId && onNavigate) onNavigate(nextDocumentId);
        else if (onBack) onBack();
        else {
          setMessage(action === "approve" ? "Račun je potrjen." : "Račun je zavrnjen.");
          await load();
        }
        return;
      }
      let nextPath = "/invoices";
      try {
        const pending = await fetchReviewQueue({ excludeId: documentId, limit: 1 });
        if (pending[0]) nextPath = `/invoice-review/${pending[0].id}`;
      } catch {
        // The queue overview remains a safe fallback when refreshing the queue fails.
      }
      router.replace(nextPath);
      return;
    }
    setMessage(action === "reprocess" ? "Račun je ponovno v čakalni vrsti." : "Spremembe so shranjene.");
    await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Zahteve ni bilo mogoče zaključiti: ${error.message}. Osvežite status računa pred ponovnim poskusom.` : "Zahteve ni bilo mogoče zaključiti. Osvežite status računa.");
    } finally {
      submitting.current = false;
      setBusy(null);
    }
  }, [documentId, form, initial, reason, load, router, onUpdated, onNavigate, onBack, reviewIds]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void submit("save"); }
      if (event.altKey && event.key.toLowerCase() === "a") { event.preventDefault(); void submit("approve"); }
      if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); goRelative(-1); }
      if (event.altKey && event.key === "ArrowRight") { event.preventDefault(); goRelative(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, siblings, documentId, reviewIds, onNavigate, onBack]);

  function goRelative(offset: number) {
    const navigationIds = reviewIds ?? siblings;
    const index = navigationIds.indexOf(documentId);
    if (index < 0) return router.push("/invoices");
    const target = navigationIds[index + offset];
    if (target && onNavigate) onNavigate(target);
    else if (onNavigate) return;
    else if (target) router.push(`/invoice-review/${target}`);
    else router.push("/invoices");
  }

  const selectedEvidence = useMemo(() => detail?.evidence.find((e) => e.fieldPath === selectedPath) ?? null, [detail, selectedPath]);
  const latestValidation = detail?.validations?.[0] ?? null;
  const validationIssues = useMemo(() => [...new Set([
    ...(latestValidation?.errors ?? []),
    ...(latestValidation?.warnings ?? []),
  ])], [latestValidation]);
  const invoice = detail?.document.status === "approved" ? detail.document.approved ?? detail.document.normalized : detail?.document.normalized ?? detail?.document.approved;
  const hasChanges = Object.keys(form).some(key => form[key] !== initial[key]);
  const exportReady = detail?.document.status === "approved" && !hasChanges && busy === null;
  const status = detail?.document.status ?? "";
  const statusLabel = ({ approved: "Potrjeno", needs_review: "Čaka na pregled", queued: "V čakalni vrsti", processing: "Obdelava poteka", failed: "Napaka pri obdelavi", rejected: "Zavrnjeno" } as Record<string,string>)[status] || status;
  async function downloadXml() {
    setBusy("xml"); setMessage(null);
    try {
      const res = await fetch(`/api/invoice-reader/${documentId}/xml`, { cache: "no-store" });
      if (!res.ok) { const json = await res.json(); throw new Error(json.error || "Izvoz XML ni uspel."); }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a"); link.href = url; link.download = `racun-${documentId}.eslog.xml`; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Izvoz XML ni uspel."); }
    finally { setBusy(null); }
  }
  function openSepa() {
    setMobilePanel("data");
    window.requestAnimationFrame(() => {
      const section = document.getElementById("sepa-payment-export") as HTMLDetailsElement | null;
      if (section) { section.open = true; section.scrollIntoView({ behavior: "smooth", block: "start" }); section.querySelector("summary")?.focus({ preventScroll:true }); }
    });
  }
  const isProcessing = detail?.document.status === "queued" || detail?.document.status === "processing";
  const needsPdfSplit = detail?.document.legacyMultiPagePdf === true
    || (detail?.document.mimeType === "application/pdf" && detail.document.warnings.some((warning) => /hard-capped|first 25 pages|technical PDF limit/i.test(warning)));

  if (!detail) return <main className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden p-8"><div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Nalaganje dokumenta…</div>{message && <p className="mt-4 text-red-600">{message}</p>}</main>;

  return (
    <main className="mx-auto min-h-screen w-full min-w-0 max-w-[1600px] overflow-x-hidden bg-slate-50/80 px-3 pb-36 pt-6 sm:px-6 md:pb-5 lg:px-8 dark:bg-slate-950">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Podrobnosti računa</h1><p className="mt-1 break-all text-sm text-slate-500">ID: {documentId} · {detail.document.filename}</p></div>
        <nav aria-label="Navigacija pregleda" className="flex flex-wrap items-center gap-2">
          {onBack ? <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><ChevronLeft className="h-4 w-4" />Vsi naloženi računi</button> : <Link href="/invoices" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><ChevronLeft className="h-4 w-4" />Nazaj</Link>}
          <a href="#processing-history" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><History className="h-4 w-4" />Zgodovina</a>
          <button type="button" onClick={() => goRelative(-1)} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700" title="Prejšnji račun (Alt+←)" aria-label="Prejšnji račun"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => goRelative(1)} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700" title="Naslednji račun (Alt+→)" aria-label="Naslednji račun"><ChevronRight className="h-4 w-4" /></button>
        </nav>
      </div>
      <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6 dark:bg-slate-900 ${status === "approved" ? "border-emerald-200" : "border-amber-200"}`}>
        <div className="flex items-center gap-3">{status === "approved" ? <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-emerald-600" /> : <Clock3 aria-hidden="true" className={`h-7 w-7 ${isProcessing ? "animate-pulse text-blue-600" : "text-amber-600"}`} />}<div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trenutni status</p><p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">{statusLabel}{hasChanges ? " · neshranjene spremembe" : ""}</p></div></div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={downloadXml} disabled={!exportReady} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45">{busy === "xml" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Generiraj XML eSLOG</button>
          <button type="button" onClick={openSepa} disabled={isProcessing || !invoice} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-45"><Wallet className="h-4 w-4" />Pripravi SEPA XML</button>
        </div>
        {!exportReady && !isProcessing ? <p className="w-full text-xs text-slate-500">Za izvoz najprej preverite, shranite in potrdite podatke računa.</p> : null}
      </div>
      {message ? <p role="status" className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{message}</p> : null}
      {detail.document.legacyMultiPagePdf && !isProcessing ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-extrabold">Ta PDF vsebuje več strani in je bil obdelan po starem načinu.</div>
            <div className="mt-1">
              Prikazani OCR podatki lahko pripadajo samo prvemu računu. PDF ima približno {detail.document.estimatedPages ?? "več"} strani.
              Razdeli ga v posamezne račune in vsak račun bo obdelan ločeno.
            </div>
          </div>
          <button
            type="button"
            onClick={() => submit("reprocess")}
            disabled={busy !== null}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 font-bold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {busy === "reprocess" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Razdeli PDF na račune
          </button>
        </div>
      ) : null}

      {!isProcessing && (validationIssues.length > 0 || detail.duplicates.length > 0) ? (
        <div className="mb-4 min-w-0 break-words rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Potreben je pregled</div>
          <ul className="list-disc space-y-1 pl-5">{validationIssues.map((x) => {
            const issue = invoiceIssueLabel(x, locale);
            return <li key={x}>{issue.text}{issue.original && <details className="mt-1 text-sm"><summary className="cursor-pointer">Izvirno sporočilo</summary><p>{issue.original}</p></details>}</li>;
          })}{detail.duplicates.length > 0 && <li>Možen podvojen račun: {detail.duplicates.map((d) => `#${d.duplicateOfDocumentId}`).join(", ")}</li>}</ul>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-200/60 p-1 lg:hidden" role="group" aria-label="Pogled računa">
        <button type="button" aria-pressed={mobilePanel === "data"} onClick={() => setMobilePanel("data")} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold ${mobilePanel === "data" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><FileText className="h-4 w-4" />Podatki računa</button>
        <button type="button" aria-pressed={mobilePanel === "document"} onClick={() => setMobilePanel("document")} className={`min-h-11 rounded-lg text-sm font-bold ${mobilePanel === "document" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Izvirni dokument</button>
      </div>
      <div className="grid w-full min-w-0 max-w-full items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-6">
        <section aria-label="Izvirni račun" className={`${mobilePanel === "document" ? "block" : "hidden"} w-full min-w-0 lg:sticky lg:top-4 lg:block`}>
          <InvoiceDocumentViewer key={detail.fileUrl} url={detail.fileUrl} mimeType={detail.document.mimeType} filename={detail.document.filename}>{selectedEvidence ? <EvidenceOverlay evidence={selectedEvidence} /> : null}</InvoiceDocumentViewer>
          {selectedEvidence ? <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><strong>Prebrani podatek:</strong> {selectedEvidence.fieldPath} · stran {selectedEvidence.pageNumber ?? "—"} · zanesljivost {selectedEvidence.confidence == null ? "—" : `${Math.round(selectedEvidence.confidence * 100)}%`}</div> : null}
        </section>
        <section aria-label="Urejanje podatkov računa" className={`${mobilePanel === "data" ? "block" : "hidden"} w-full min-w-0 max-w-full space-y-4 pb-28 lg:block`}>
          {isProcessing ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center text-blue-950">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
              <h2 className="text-xl font-extrabold">Mistral OCR obdeluje račun</h2>
              <p className="mt-2 max-w-lg text-sm text-blue-800">Prejšnji podatki so skriti, da jih ne zamenjate z novim rezultatom. Stran se samodejno osveži, ko je obdelava končana.</p>
            </div>
          ) : <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 dark:border-slate-700 dark:bg-slate-900"><h2 className="mb-6 text-xl font-bold text-slate-950 dark:text-white">Podatki računa</h2>{[fieldGroups[1], fieldGroups[2], fieldGroups[0], fieldGroups[3]].map((group) => <FieldGroup key={group.title} title={group.title} fields={group.fields} form={form} setForm={setForm} evidence={detail.evidence} selectedPath={selectedPath} setSelectedPath={setSelectedPath} />)}<p className="mt-3 text-xs text-slate-500">Oranžno so označeni podatki z nižjo zanesljivostjo OCR. Preverite jih na izvirnem računu.</p></div>}

          {!isProcessing && invoice ? <SepaPaymentExport key={`${documentId}-${JSON.stringify(invoice)}`} documentId={documentId} invoice={invoice} ready={exportReady} onEditRecipient={() => { setMobilePanel("data"); const field = document.getElementById("invoice-field-supplier-iban"); field?.scrollIntoView({ behavior: "smooth", block: "center" }); field?.focus({ preventScroll: true }); }} /> : null}
          {!isProcessing && invoice?.vatBreakdown?.length ? <DataTable title="DDV razčlenitev" rows={invoice.vatBreakdown} columns={["vatRate", "taxableAmount", "vatAmount", "grossAmount"]} /> : null}
          {!isProcessing && invoice?.lineItems?.length ? <DataTable title={`Postavke (${invoice.lineItems.length})`} rows={invoice.lineItems} columns={["productCode", "description", "quantity", "unit", "unitPriceBeforeDiscount", "unitPriceNet", "discountPercent", "discountAmount", "vatRate", "netAmount", "vatAmount", "grossAmount"]} /> : null}

          {!isProcessing && detail.corrections.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold">Revizijska sled popravkov</h2><div className="mt-3 max-h-48 space-y-2 overflow-auto text-xs text-slate-600">{detail.corrections.map((c) => <div key={c.id} className="rounded-lg bg-slate-50 p-2"><strong>{c.fieldPath}</strong>: {c.oldValue ?? "∅"} → {c.newValue ?? "∅"} · {new Date(c.createdAt).toLocaleString("sl-SI")}</div>)}</div></div>}

          {!isProcessing && <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><label className="text-sm font-bold">Razlog / opomba (neobvezno)</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Npr. preverjeno z originalom…" /></div>}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
        {message && <p role="status" aria-live="polite" className="mx-auto mb-2 max-w-7xl break-words text-sm text-slate-700 dark:text-slate-200">{message}</p>}
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between gap-3">
          <div className="hidden text-sm text-slate-500 md:block">Ctrl/Cmd+S shrani · Alt+A potrdi · Alt+←/→ navigacija</div>
          {isProcessing ? <div className="flex min-h-12 items-center gap-2 font-bold text-blue-700"><Loader2 className="h-5 w-5 animate-spin" /> Mistral OCR obdeluje…</div> : <div className="grid w-full min-w-0 grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap">
            <Action busy={busy} name="approve" onClick={() => submit("approve")} icon={<Check className="h-5 w-5" />}>Potrdi in nadaljuj</Action>
            <Action busy={busy} name="save" onClick={() => submit("save")} icon={<Save className="h-5 w-5" />}>Shrani osnutek</Action>
            <Action busy={busy} name="reject" onClick={() => submit("reject")} icon={<XCircle className="h-5 w-5" />}>Zavrni</Action>
            <Action busy={busy} name="reprocess" onClick={() => submit("reprocess")} icon={<RefreshCw className="h-5 w-5" />}>{needsPdfSplit ? "Razdeli in ponovno obdelaj" : "Ponovno obdelaj"}</Action>
          </div>}
        </div>
      </div>
    </main>
  );
}

function FieldGroup({ title, fields, form, setForm, evidence, selectedPath, setSelectedPath }: { title: string; fields: Array<[string, string]>; form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>; evidence: Evidence[]; selectedPath: string | null; setSelectedPath: (path: string) => void }) {
  const party = title === "Dobavitelj" || title === "Kupec";
  const primary = fields.filter(([path]) => party ? /\.(name|vatNumber|address|postalCode|city|countryCode|iban)$/.test(path) : title === "Dokument" ? ["invoiceNumber", "currency", "issueDate", "serviceDate", "dueDate", "paymentReference"].includes(path) : true);
  const extra = fields.filter(field => !primary.includes(field));
  const renderFields = (items: Array<[string,string]>) => <div className="grid min-w-0 gap-x-4 gap-y-4 sm:grid-cols-2">{items.map(([path,label]) => {
    const ev = evidence.find(e => e.fieldPath === path);
    const low = ev?.confidence != null && ev.confidence < 0.92;
    const full = /\.(name|vatNumber|address)$/.test(path);
    const appearance = selectedPath === path ? "border-blue-500 ring-2 ring-blue-100" : low ? "border-amber-400 bg-amber-50/50" : "border-slate-300 dark:border-slate-600";
    return <label key={path} className={`block min-w-0 ${full ? "sm:col-span-2" : ""}`}><span className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><span>{label}</span>{ev?.confidence != null ? <span className={low ? "text-amber-700" : "text-slate-400"}>{Math.round(ev.confidence * 100)}%</span> : null}</span>{path.endsWith(".address") ? <textarea rows={2} value={form[path] ?? ""} onFocus={() => setSelectedPath(path)} onChange={e => setForm(f => ({...f,[path]:e.target.value}))} className={`w-full min-w-0 rounded-lg border bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:text-white ${appearance}`} /> : <input id={`invoice-field-${path.replace(/\./g, "-")}`} value={form[path] ?? ""} onFocus={() => setSelectedPath(path)} onChange={e => setForm(f => ({...f,[path]:e.target.value}))} className={`min-h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:text-white ${appearance}`} />}</label>;
  })}</div>;
  return <div className="mb-6 border-b border-slate-100 pb-6 last:mb-0 last:border-0 dark:border-slate-700"><h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">{title === "Dokument" ? "Račun" : title}</h3>{renderFields(primary)}{extra.length ? <details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-blue-700">Dodatni podatki · {title.toLowerCase()}</summary><div className="mt-4">{renderFields(extra)}</div></details> : null}</div>;
}

const tableColumnLabels: Record<string, string> = {
  productCode: "Šifra",
  description: "Opis postavke",
  quantity: "Količina",
  unit: "EM",
  unitPriceBeforeDiscount: "Cena pred rabatom",
  unitPriceNet: "Cena brez DDV",
  discountPercent: "Rabat %",
  discountAmount: "Rabat znesek",
  vatRate: "DDV %",
  netAmount: "Neto",
  vatAmount: "DDV",
  grossAmount: "Bruto",
  taxableAmount: "Osnova za DDV",
};

function DataTable({ title, rows, columns }: { title: string; rows: Array<Record<string, string | null>>; columns: string[] }) {
  return <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="p-4 font-extrabold">{title}</div><div className="max-w-full overflow-x-auto overscroll-x-contain"><table className="w-max min-w-full text-xs"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-left">{tableColumnLabels[c] ?? c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{columns.map((c) => <td key={c} className="max-w-[260px] truncate whitespace-nowrap px-3 py-2">{row[c] ?? "—"}</td>)}</tr>)}</tbody></table></div></div>;
}

function Action({ children, busy, name, onClick, icon }: { children: React.ReactNode; busy: string | null; name: "save" | "approve" | "reject" | "reprocess"; onClick: () => void; icon: React.ReactNode }) {
  const appearance = name === "approve"
    ? "min-w-[9.5rem] border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
    : name === "reject"
      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";
  return <button data-action={name} disabled={busy != null} onClick={onClick} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold shadow-sm disabled:opacity-50 md:w-auto md:px-4 md:py-2 ${appearance}`}>{busy === name ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{children}</button>;
}

async function fetchReviewQueue(input: { ids?: number[]; excludeId?: number; limit?: number }) {
  const response = await fetch("/api/invoice-reader/review-queue", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input), cache: "no-store",
  });
  if (!response.ok) throw new Error("Seznama računov ni mogoče osvežiti.");
  const data = await response.json() as { documents: Array<{ id: number }> };
  return data.documents;
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

