"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  deliveredInvoices: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  deliveryNotRequired: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

const STAGE_SL: Record<string, string> = {
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {locale === "sl" ? "PDF paketi računov" : "Invoice PDF batches"}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
            {locale === "sl"
              ? "En PDF lahko vsebuje več deset ali več sto računov. Sistem prepozna meje dokumentov, jih razdeli in vsak račun obdela posebej."
              : "One PDF can contain dozens or hundreds of invoices. The system detects document boundaries, splits the file and processes each invoice separately."}
          </p>
        </div>
        <Link
          href={`${prefix}/scan`}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {locale === "sl" ? "Naloži PDF" : "Upload PDF"}
        </Link>
      </div>

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
            const stageLabel = (locale === "sl" ? STAGE_SL : STAGE_EN)[job.stage] ?? job.stage;

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
                  <Stat label={locale === "sl" ? "Najdeni računi" : "Invoices found"} value={job.totalInvoices || "—"} />
                  <Stat label={locale === "sl" ? "Obdelano" : "Processed"} value={job.processedInvoices} />
                  <Stat
                    label={locale === "sl" ? "E-pošta" : "Email"}
                    value={job.deliveryNotRequired > 0
                      ? (locale === "sl" ? "API/XML" : "API/XML")
                      : `${job.deliveredInvoices}/${job.totalInvoices || "—"}`}
                  />
                  <Stat label={locale === "sl" ? "Napredek" : "Progress"} value={progress == null ? "—" : `${progress}%`} />
                </div>

                {done && job.deliveredInvoices > 0 && (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {locale === "sl"
                      ? `${job.deliveredInvoices} računov je bilo poslanih v ${job.deliveredInvoices} ločenih e-poštnih sporočilih.`
                      : `${job.deliveredInvoices} invoices were sent in ${job.deliveredInvoices} separate email messages.`}
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
  if (job.stage === "completed") return 100;
  if (job.stage === "ocr" && job.pageCount) return Math.min(99, Math.round((job.ocrNextPage / job.pageCount) * 100));
  if (job.stage === "extract" && job.totalInvoices) return Math.min(99, Math.round((job.processedInvoices / job.totalInvoices) * 100));
  if (job.stage === "classify") return 60;
  if (job.stage === "split") return 75;
  if (job.stage === "boundary_review") return 70;
  return 5;
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
