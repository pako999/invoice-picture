"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentUploadSection } from "@/components/document-upload-section";

type Locale = "sl" | "en";

type BulkJob = {
  id: number;
  filename: string;
  byteSize: number;
  status: string;
  stage: string;
  pageCount: number | null;
  ocrNextPage: number;
  boundaryReviewRequired: boolean;
  totalInvoices: number;
  processedInvoices: number;
  deliveryMode: "email_ocr" | "split_pdf_email" | "xml_email" | "xml_zip_email" | "api_json";
  deliveredInvoices: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  awaitingApproval: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

const STAGE_SL: Record<string, string> = {
  queued: "V čakalni vrsti",
  uploaded: "Priprava PDF-ja",
  ocr: "OCR strani",
  classify: "Prepoznavanje računov",
  boundary_review: "Pregled razdelitve",
  split: "Razdeljevanje PDF-ja",
  extract: "Obdelava posameznih računov",
  quota_wait: "Čaka na nadgradnjo paketa",
  completed: "Končano",
  failed: "Napaka",
};

const STAGE_EN: Record<string, string> = {
  queued: "Queued",
  uploaded: "Preparing PDF",
  ocr: "OCR pages",
  classify: "Detecting invoices",
  boundary_review: "Split review",
  split: "Splitting PDF",
  extract: "Processing individual invoices",
  quota_wait: "Waiting for plan upgrade",
  completed: "Completed",
  failed: "Failed",
};

export function BulkInvoiceJobList({ locale }: { locale: Locale }) {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const prefix = locale === "en" ? "/en" : "";

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/bulk-invoices/jobs", { cache: "no-store" });
        const body = await response.json().catch(() => ({})) as { jobs?: BulkJob[] };
        if (mounted && response.ok) setJobs(Array.isArray(body.jobs) ? body.jobs : []);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <DocumentUploadSection>
        <section className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30 sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {locale === "sl" ? "PDF paketi računov" : "Invoice PDF batches"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              {locale === "sl"
                ? "Naložite PDF z več računi. Sistem samodejno prepozna, katere strani spadajo skupaj, in ga razdeli na posamezne račune — tudi če ima račun več strani."
                : "Upload a PDF containing multiple invoices. The system automatically groups the pages and splits it into individual invoices, including multi-page invoices."}
            </p>
            <Link
              href={`${prefix}/scan#document-upload`}
              className="mx-auto mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-extrabold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:w-auto"
            >
              {locale === "sl" ? "Naloži PDF" : "Upload PDF"}
            </Link>
          </div>
          <div className="mt-6 border-t border-blue-200 pt-5 dark:border-blue-900">
            <h2 className="font-bold text-slate-950 dark:text-white">
              {locale === "sl" ? "Kako želite obdelati in poslati račune?" : "How should invoices be processed and delivered?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {locale === "sl" ? "Pred nalaganjem v nastavitvah podjetja izberite prejemnikov e-poštni naslov in način pošiljanja:" : "Before uploading, choose the recipient email and delivery method in your company settings:"}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {(locale === "sl" ? [
                ["Ločeni PDF-ji", "Vsak račun pošljemo v svojem e-poštnem sporočilu. AI prepozna razdelitev, podatkov računa pa ne zajema."],
                ["OCR e-pošta", "Originalni PDF ali sliko pošljemo na OCR e-poštni naslov vašega računovodskega programa."],
                ["XML po e-pošti", "Po OCR obdelavi, pregledu in potrditvi pošljemo vsak račun kot XML v obliki eSLOG 2.0 ali UBL 2.1."],
                ["XML v ZIP-u", "Ko potrdite vse račune iz PDF paketa, pošljemo en ZIP z ločeno XML datoteko za vsak račun."],
                ["API JSON", "Po OCR obdelavi in potrditvi pošljemo strukturirane podatke ter originalni dokument na vaš API naslov."],
              ] : [
                ["Separate PDFs", "Each invoice is sent in its own email. AI detects the split without extracting invoice fields."],
                ["OCR email", "The original PDF or image is sent to your accounting software’s OCR email address."],
                ["XML by email", "After OCR, review and approval, each invoice is emailed as eSLOG 2.0 or UBL 2.1 XML."],
                ["XML ZIP", "Once every invoice in the PDF batch is approved, one ZIP is sent with a separate XML file for each invoice."],
                ["API JSON", "After OCR and approval, structured data and the original document are sent to your API endpoint."],
              ]).map(([title, description]) => (
                <li key={title}><strong className="text-slate-800 dark:text-slate-100">{title}:</strong> {description}</li>
              ))}
            </ul>
            <Link href={`${prefix}/settings`} className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700 underline underline-offset-4 hover:text-blue-900 dark:text-blue-300">
              {locale === "sl" ? "Odpri nastavitve podjetja →" : "Open company settings →"}
            </Link>
          </div>
        </section>
      </DocumentUploadSection>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          {locale === "sl" ? "Nalaganje…" : "Loading…"}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          {locale === "sl" ? "Še nimate naloženih PDF paketov." : "You do not have any PDF batches yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const done = job.stage === "completed";
            const review = job.stage === "boundary_review";
            const progress = progressFor(job);
            const stageLabel = splitStageLabel(job, locale);

            return (
              <Link
                key={job.id}
                href={`${prefix}/bulk-invoices/${job.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-extrabold text-slate-950 dark:text-white">{job.filename}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatBytes(job.byteSize)} · {new Date(job.createdAt).toLocaleString(locale === "sl" ? "sl-SI" : "en-GB")}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      done
                        ? "bg-emerald-100 text-emerald-700"
                        : review
                          ? "bg-amber-100 text-amber-800"
                          : job.lastError
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {stageLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <Stat label={locale === "sl" ? "Strani" : "Pages"} value={job.pageCount ?? "—"} />
                  <Stat label={job.deliveryMode === "split_pdf_email" ? (locale === "sl" ? "Ločeni PDF-ji" : "Separate PDFs") : (locale === "sl" ? "Najdeni računi" : "Invoices found")} value={job.totalInvoices || "—"} />
                  <Stat label={locale === "sl" ? "Obdelano" : "Processed"} value={job.processedInvoices} />
                  <Stat
                    label={job.deliveryMode === "api_json" ? "API" : job.deliveryMode === "xml_zip_email" ? "XML ZIP" : job.deliveryMode === "xml_email" ? "XML e-mail" : job.deliveryMode === "split_pdf_email" ? "PDF e-mail" : (locale === "sl" ? "E-pošta" : "Email")}
                    value={`${job.deliveredInvoices}/${job.totalInvoices || "—"}`}
                  />
                  <Stat label={locale === "sl" ? "Napredek" : "Progress"} value={progress == null ? "—" : `${progress}%`} />
                </div>

                {job.stage === "queued" && (
                  <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">
                    {locale === "sl" ? "PDF je sprejet. Obdelava se začne samodejno, ko se sprosti mesto; hkrati obdelujemo največ dva vaša paketa." : "PDF accepted. Processing starts automatically when a slot is available; up to two of your batches run at once."}
                  </p>
                )}
                {job.deliveredInvoices > 0 && (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {deliveryMessage(job, locale)}
                  </div>
                )}
                {job.awaitingApproval > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    {locale === "sl"
                      ? `${job.awaitingApproval} računov čaka na potrditev. Po potrditvi bo vsak poslan ločeno.`
                      : `${job.awaitingApproval} invoices await approval. Each will be delivered separately after approval.`}
                  </div>
                )}

                {job.lastError && (
                  <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    {job.lastError}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function progressFor(job: BulkJob) {
  if (job.stage === "queued") return 0;
  if (job.stage === "completed") return 100;
  if (job.stage === "ocr" && job.pageCount) return Math.min(99, Math.round((job.ocrNextPage / job.pageCount) * 100));
  if (job.stage === "extract" && job.totalInvoices) return Math.min(99, Math.round((job.processedInvoices / job.totalInvoices) * 100));
  if (job.stage === "classify") return 60;
  if (job.stage === "split") return 75;
  if (job.stage === "boundary_review") return 70;
  return 5;
}

function deliveryMessage(job: BulkJob, locale: Locale) {
  if (job.deliveryMode === "api_json") {
    return locale === "sl" ? `${job.deliveredInvoices} računov je bilo ločeno poslanih v API.` : `${job.deliveredInvoices} invoices were delivered separately to the API.`;
  }
  if (job.deliveryMode === "xml_email") {
    return locale === "sl" ? `${job.deliveredInvoices} potrjenih računov je bilo poslanih v ${job.deliveredInvoices} ločenih XML e-poštnih sporočilih.` : `${job.deliveredInvoices} approved invoices were sent in ${job.deliveredInvoices} separate XML emails.`;
  }
  if (job.deliveryMode === "xml_zip_email") {
    return locale === "sl" ? `ZIP z ${job.deliveredInvoices} ločenimi XML računi je bil pripravljen za skupinski uvoz.` : `A ZIP with ${job.deliveredInvoices} separate XML invoices was prepared for bulk import.`;
  }
  if (job.deliveryMode === "split_pdf_email") {
    return locale === "sl" ? `Prepoznani računi so bili brez zajema podatkov poslani v ${job.deliveredInvoices} ločenih PDF sporočilih.` : `Detected invoices were sent in ${job.deliveredInvoices} separate PDF emails without extracting invoice fields.`;
  }
  return locale === "sl" ? `${job.deliveredInvoices} računov je bilo poslanih v ${job.deliveredInvoices} ločenih e-poštnih sporočilih.` : `${job.deliveredInvoices} invoices were sent in ${job.deliveredInvoices} separate email messages.`;
}

function splitStageLabel(job: BulkJob, locale: Locale) {
  if (job.deliveryMode === "split_pdf_email") {
    if (job.stage === "ocr") return locale === "sl" ? "Prepoznavanje strani" : "Reading pages";
    if (job.stage === "classify") return locale === "sl" ? "Prepoznavanje meja računov" : "Detecting invoice boundaries";
    if (job.stage === "extract") return locale === "sl" ? "Pošiljanje PDF-jev" : "Sending PDFs";
  }
  return (locale === "sl" ? STAGE_SL : STAGE_EN)[job.stage] ?? job.stage;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
