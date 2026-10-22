"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, FileText, Loader2, Mail, RefreshCw, Upload, XCircle } from "lucide-react";
import { flowItems, flowPollDelay, isOcrReady, isOcrWorking, shouldPollFlow, type FlowDelivery, type FlowSnapshot, type FlowUpload } from "@/lib/invoice-processing-flow";

const InvoiceEditor = dynamic(() => import("@/app/invoice-review/[id]/review-client").then((module) => module.InvoiceReviewClient), {
  loading: () => <p className="p-8 text-center text-slate-500">…</p>,
});

export function InvoiceProcessingFlow({ uploads, uploading, locale, onBack }: {
  uploads: FlowUpload[]; uploading: boolean; locale: "sl" | "en"; onBack: () => void;
}) {
  const en = locale === "en", prefix = en ? "/en" : "";
  const [statusResult, setStatusResult] = useState<{ key: string; data: FlowSnapshot } | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedList, setExpandedList] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const autoOpened = useRef(false);
  const latestUploads = useRef(uploads);
  latestUploads.current = uploads;
  const requestKey = useMemo(() => JSON.stringify({
    invoiceIds: [...new Set(uploads.filter((item) => item.status === "accepted" && item.invoiceId).map((item) => item.invoiceId))],
    documentIds: [...new Set(uploads.filter((item) => item.status === "accepted" && item.documentId).map((item) => item.documentId))],
    bulkJobIds: [...new Set(uploads.filter((item) => item.status === "accepted" && item.bulkJobId).map((item) => item.bulkJobId))],
  }), [uploads]);
  const snapshot = statusResult?.key === requestKey ? statusResult.data : null;
  const refreshStatus = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => { root.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, []);
  useEffect(() => {
    const input = JSON.parse(requestKey) as { invoiceIds: number[]; documentIds: number[]; bulkJobIds: number[] };
    if (!input.invoiceIds.length && !input.documentIds.length && !input.bulkJobIds.length) return;
    const controller = new AbortController();
    let stopped = false, inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let previous = "", unchanged = 0;
    const startedAt = Date.now();
    async function load() {
      clearTimeout(timer);
      if (stopped || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch("/api/invoice-processing/status", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: requestKey,
          cache: "no-store", signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(response.status === 401
          ? (en ? "Your session expired. Sign in again to view progress." : "Seja je potekla. Za ogled napredka se ponovno prijavite.")
          : (en ? "Progress could not be refreshed. Retrying…" : "Napredka ni mogoče osvežiti. Poskušam znova…"));
        if (stopped) return;
        setStatusResult({ key: requestKey, data: data as FlowSnapshot });
        setError("");
        const signature = JSON.stringify(data);
        unchanged = signature === previous ? unchanged + 1 : 0;
        previous = signature;
        if (shouldPollFlow(latestUploads.current.filter((item) => item.status === "accepted"), data)) {
          timer = setTimeout(() => void load(), flowPollDelay(Date.now() - startedAt, unchanged));
        }
      } catch (problem) {
        if (stopped || controller.signal.aborted) return;
        setError(problem instanceof Error ? problem.message : (en ? "Could not refresh progress." : "Napredka ni mogoče osvežiti."));
        timer = setTimeout(() => void load(), 15_000);
      } finally { inFlight = false; }
    }
    const visible = () => {
      if (document.visibilityState === "hidden") clearTimeout(timer);
      else void load();
    };
    void load();
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; clearTimeout(timer); controller.abort(); document.removeEventListener("visibilitychange", visible); };
    // requestKey changes only when the set of accepted uploads changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, refresh, en]);

  const items = useMemo(() => flowItems(uploads, snapshot), [uploads, snapshot]);
  const displayedItems = selectedId && !expandedList ? items.filter((item) => item.documentId === selectedId) : items;
  const ready = items.filter((item) => isOcrReady(item.status));
  const reviewIds = useMemo(() => items.filter((item) => item.documentId && (isOcrReady(item.status) || item.status === "failed")).map((item) => item.documentId!), [items]);
  const accepted = uploads.filter((item) => item.status === "accepted").length;
  const uploadErrors = uploads.filter((item) => item.status === "failed").length;
  const working = uploading || (!snapshot && accepted > 0) || Boolean(snapshot && shouldPollFlow(uploads, snapshot));
  const sent = items.filter((item) => item.delivery?.status === "sent").length;
  const approval = items.filter((item) => item.delivery?.status === "awaiting_approval").length;
  const deliveryErrors = items.filter((item) => ["failed", "retrying"].includes(item.delivery?.status ?? "")).length;
  const attention = items.some((item) => ["failed", "unavailable", "ocr_unavailable", "boundary_review", "quota_wait"].includes(item.status));

  useEffect(() => {
    if (!working) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [working]);
  useEffect(() => {
    if (uploading || autoOpened.current || !ready[0]?.documentId) return;
    autoOpened.current = true;
    setSelectedId(ready[0].documentId);
  }, [uploading, ready]);

  return (
    <div ref={root} className="w-full min-w-0 scroll-mt-20 pb-8">
      <div className={`mx-auto min-w-0 px-4 py-8 ${selectedId ? "max-w-[1600px]" : "max-w-3xl"}`}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">{en ? "Invoice processing" : "Obdelava računov"}</h1>
            <p className="mt-1 text-sm text-slate-500">{en ? `${uploads.length} uploaded file(s) · follow OCR and delivery below` : `${uploads.length} datotek · spremljajte OCR in pošiljanje spodaj`}</p>
          </div>
          <button type="button" disabled={uploading} onClick={onBack} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:text-white">{en ? "Upload more" : "Naloži še račune"}</button>
        </div>

        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6" aria-label={en ? "Processing progress" : "Napredek obdelave"}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {working ? <Loader2 aria-hidden="true" className="h-7 w-7 animate-spin motion-reduce:animate-none" /> : attention || deliveryErrors ? <AlertTriangle aria-hidden="true" className="h-7 w-7 text-amber-600" /> : <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-emerald-600" />}
            </div>
            <div className="min-w-0 flex-1" role="status" aria-live="polite">
              <h2 className="font-extrabold text-slate-950 dark:text-white">{uploading ? (en ? "Uploading your documents…" : "Nalagam dokumente…")
                : attention ? (en ? "Some documents need your attention" : "Nekateri dokumenti potrebujejo vašo pozornost")
                : ready.length ? (en ? "Invoices are ready for review" : "Računi so pripravljeni za pregled")
                : working ? (en ? "OCR processing in progress" : "OCR obdelava poteka") : (en ? "Processing status" : "Status obdelave")}</h2>
              <p className="mt-1 text-sm text-slate-500">{uploading ? (en ? "Keep this page open until every file has uploaded." : "Stran pustite odprto, dokler niso naložene vse datoteke.")
                : ready.length ? (en ? "Review the original, edit fields, approve and export XML or SEPA below." : "Spodaj preglejte original, uredite podatke, potrdite račun in izvozite XML ali SEPA.")
                : (en ? "The system reads, splits and checks your invoices. Larger PDFs can take several minutes." : "Sistem bere, razdeljuje in preverja račune. Večji PDF-ji lahko trajajo nekaj minut.")}</p>
            </div>
          </div>
          <ol className="mt-6 grid min-w-0 gap-4 sm:grid-cols-3">
            <Step icon={<Upload className="h-4 w-4" />} title={en ? "Upload" : "Nalaganje"} done={!uploading && accepted === uploads.length} active={uploading}>
              {accepted}/{uploads.length} {en ? "files received" : "datotek sprejetih"}{uploadErrors ? ` · ${uploadErrors} ${en ? "failed" : "neuspešnih"}` : ""}
            </Step>
            <Step icon={<FileText className="h-4 w-4" />} title={en ? "OCR / PDF split" : "OCR / razdelitev PDF"} done={!uploading && items.length > 0 && items.every((item) => isOcrReady(item.status) || item.status === "split_ready")} active={items.some((item) => isOcrWorking(item.status))}>
              {ready.length} {en ? "invoices ready" : "računov pripravljenih"}
            </Step>
            <Step icon={<Mail className="h-4 w-4" />} title={en ? "Email / API" : "E-pošta / API"} done={items.length > 0 && sent === items.length && !uploading && !working} active={items.some((item) => ["sending", "queued"].includes(item.delivery?.status ?? ""))}>
              {sent} {en ? "sent" : "poslanih"}{approval ? ` · ${approval} ${en ? "await approval" : "čaka potrditev"}` : ""}{deliveryErrors ? ` · ${deliveryErrors} ${en ? "errors" : "napak"}` : ""}
            </Step>
          </ol>
          {snapshot?.batches.map((batch) => <div key={batch.id} className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800 dark:text-slate-200">
            <p className="break-words font-semibold">{batch.filename}</p>
            <p className="mt-1">{stageLabel(batch.stage, en)}{batch.stage === "ocr" && batch.pageCount ? ` · ${Math.min(batch.ocrNextPage, batch.pageCount)}/${batch.pageCount} ${en ? "pages" : "strani"}` : ""}{batch.totalInvoices > 0 ? ` · ${batch.processedInvoices}/${batch.totalInvoices} ${en ? "invoices processed" : "računov obdelanih"}` : ""}</p>
            {batch.error && <p className="mt-1 break-words text-amber-700">{batch.error}</p>}
            <Link href={`${prefix}/bulk-invoices/${batch.id}`} className="mt-2 inline-flex min-h-10 items-center font-bold text-blue-700 underline">{["boundary_review", "quota_wait", "failed"].includes(batch.stage) ? (en ? "Resolve and continue →" : "Preveri in nadaljuj →") : (en ? "PDF batch details →" : "Podrobnosti PDF paketa →")}</Link>
          </div>)}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>{working ? (en ? "Status refreshes automatically while this page is visible." : "Status se samodejno osvežuje, ko je stran vidna.") : (en ? "Latest processing and sending status." : "Zadnji status obdelave in pošiljanja.")}{working && elapsed > 0 ? ` · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}` : ""}</span>
            <button type="button" onClick={refreshStatus} className="inline-flex min-h-10 items-center gap-1 font-bold text-blue-700"><RefreshCw className="h-3.5 w-3.5" />{en ? "Refresh" : "Osveži"}</button>
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
        </section>

        {selectedId && items.length > 1 && <button type="button" onClick={() => setExpandedList((value) => !value)} className="mt-5 min-h-11 text-sm font-bold text-blue-700">{expandedList ? (en ? "Show selected invoice only" : "Pokaži le izbrani račun") : (en ? `Show all ${items.length} invoices and delivery statuses` : `Pokaži vseh ${items.length} računov in status pošiljanja`)}</button>}
        <section className="mt-5 max-h-96 space-y-3 overflow-y-auto" aria-label={en ? "Uploaded invoices" : "Naloženi računi"}>
          {displayedItems.map((item) => <article key={item.key} className={`min-w-0 rounded-xl border bg-white p-4 dark:bg-slate-900 ${selectedId && selectedId === item.documentId ? "border-blue-500 ring-1 ring-blue-200" : "border-slate-200 dark:border-slate-700"}`}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-slate-950 dark:text-white">{item.filename}</p><p className="mt-1 text-sm text-slate-500">{stageLabel(item.status, en)}</p></div>
              {item.documentId && !isOcrWorking(item.status) && <button type="button" onClick={() => { autoOpened.current = true; setSelectedId(item.documentId!); }} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">{en ? "Open invoice" : "Odpri račun"}</button>}
              {!item.documentId && item.bulkJobId != null && item.groupIndex != null && item.status === "split_ready" && <Link href={`${prefix}/bulk-invoices/${item.bulkJobId}`} className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold text-blue-700">{en ? "Preview PDF" : "Predogled PDF"}</Link>}
            </div>
            {item.delivery && <DeliveryLine delivery={item.delivery} en={en} />}
            {item.error && <p role="alert" className="mt-2 break-words text-sm text-red-700">{item.error}</p>}
          </article>)}
        </section>
      </div>
      {selectedId && <>
        <InvoiceEditor key={selectedId} documentId={selectedId} reviewIds={reviewIds} onNavigate={setSelectedId} onUpdated={refreshStatus} onBack={() => setSelectedId(null)} />
        <section id="processing-history" className="mx-auto max-w-[1600px] px-4 py-5">
          <Link href={`/invoice-review/${selectedId}#processing-history`} className="inline-flex min-h-11 items-center font-bold text-blue-700 underline">{en ? "Open the full OCR processing history →" : "Odpri celotno zgodovino OCR obdelave →"}</Link>
        </section>
      </>}
    </div>
  );
}

function Step({ title, children, done, active, icon }: { title: string; children: React.ReactNode; done: boolean; active: boolean; icon: React.ReactNode }) {
  return <li className="flex min-w-0 items-start gap-2.5"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : icon}</span><div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p><p className="mt-1 text-xs text-slate-500">{children}</p></div></li>;
}

function DeliveryLine({ delivery, en }: { delivery: FlowDelivery; en: boolean }) {
  const labels = en ? { sent: "Sent", sending: "Sending…", queued: "Waiting to send", awaiting_approval: "Will send after invoice approval", retrying: "Sending failed; automatic retry scheduled", failed: "Sending failed", not_requested: "Automatic sending is not configured" }
    : { sent: "Poslano", sending: "Pošiljanje poteka…", queued: "Čaka na pošiljanje", awaiting_approval: "Pošiljanje po potrditvi računa", retrying: "Pošiljanje ni uspelo; sledi samodejni ponovni poskus", failed: "Pošiljanje ni uspelo", not_requested: "Samodejno pošiljanje ni nastavljeno" };
  const mode = delivery.mode === "api_json" ? "API JSON" : delivery.mode === "xml_zip_email" ? "XML ZIP" : delivery.mode === "xml_email" ? "XML" : "PDF / slika";
  const bad = delivery.status === "failed" || delivery.status === "retrying";
  return <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${delivery.status === "sent" ? "bg-emerald-50 text-emerald-900" : bad ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-950"}`}>
    {delivery.status === "sent" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : bad ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0" />}
    <div className="min-w-0"><p className="font-semibold">{labels[delivery.status]}</p>{delivery.target && <p className="mt-0.5 break-all">{mode} → <strong>{delivery.target}</strong></p>}{delivery.error && <p className="mt-1 break-words">{delivery.error}</p>}</div>
  </div>;
}

function stageLabel(stage: string, en: boolean) {
  const labels: Record<string, [string, string]> = {
    waiting: ["Čaka na nalaganje", "Waiting to upload"], uploading: ["Nalaganje datoteke…", "Uploading file…"], accepted: ["Datoteka je sprejeta", "File received"],
    uploaded: ["Priprava dokumenta", "Preparing document"], queued: ["V čakalni vrsti za obdelavo", "Queued for processing"], processing: ["OCR bere in preverja račun…", "OCR is reading and checking the invoice…"],
    ocr: ["OCR branje strani", "OCR is reading pages"], classify: ["Prepoznavanje meja računov", "Detecting invoice boundaries"], split: ["Razdeljevanje PDF-ja", "Splitting PDF"], extract: ["Zajem podatkov računov", "Extracting invoice fields"],
    needs_review: ["OCR je končan · preverite in potrdite podatke", "OCR complete · review and approve fields"], approved: ["OCR je končan · račun je potrjen", "OCR complete · invoice approved"],
    split_ready: ["PDF je razdeljen · brez zajema OCR podatkov", "PDF split complete · no OCR field extraction"], completed: ["Obdelava je končana", "Processing complete"],
    boundary_review: ["Potrdite razdelitev PDF-ja, da se obdelava nadaljuje", "Confirm PDF boundaries to continue processing"], quota_wait: ["OCR kvota je porabljena · preverite paket", "OCR allowance reached · check your plan"],
    failed: ["Obdelava ni uspela · preverite napako", "Processing failed · review the error"],
    ocr_unavailable: ["OCR ni bil zagnan · preverite limit ali napako obdelave", "OCR did not start · check the allowance or processing error"],
    unavailable: ["Status računa ni dosegljiv · poskusite osvežiti", "Invoice status unavailable · try refreshing"],
  };
  return labels[stage]?.[en ? 1 : 0] ?? stage;
}
