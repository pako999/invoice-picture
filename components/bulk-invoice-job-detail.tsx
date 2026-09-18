"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Locale = "sl" | "en";

type Range = {
  startPage: number;
  endPage: number;
  boundaryConfidence: number | null;
  needsBoundaryReview: boolean;
};

type Group = {
  groupIndex: number;
  startPage: number;
  endPage: number;
  boundaryConfidenceBps: number | null;
  needsBoundaryReview: boolean;
  status: string;
  deliveryStatus: string;
  deliveryError: string | null;
  documentId: number | null;
  documentStatus: string | null;
  validationStatus: string | null;
  overallConfidenceBps: number | null;
  documentFilename: string | null;
  previewUrl: string | null;
};

type Job = {
  id: number;
  filename: string;
  byteSize: number;
  status: string;
  stage: string;
  pageCount: number | null;
  ocrNextPage: number;
  classifyCursor: number;
  ranges: Range[] | null;
  boundaryReviewRequired: boolean;
  totalInvoices: number;
  processedInvoices: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export function BulkInvoiceJobDetail({ id, locale }: { id: number; locale: Locale }) {
  const [job, setJob] = useState<Job | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [ranges, setRanges] = useState<Array<{ startPage: number; endPage: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [openPreviews, setOpenPreviews] = useState<number[]>([]);
  const prefix = locale === "en" ? "/en" : "";

  const load = useCallback(async () => {
    const response = await fetch(`/api/bulk-invoices/jobs/${id}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({})) as { job?: Job; groups?: Group[]; error?: string };
    if (!response.ok) {
      setMessage(body.error ?? (locale === "sl" ? "Paketa ni mogoče naložiti." : "Could not load batch."));
      return;
    }
    if (body.job) {
      setJob(body.job);
      setGroups(Array.isArray(body.groups) ? body.groups : []);
      if (body.job.stage === "boundary_review" && Array.isArray(body.job.ranges)) {
        setRanges((current) =>
          current.length
            ? current
            : body.job!.ranges!.map((range) => ({ startPage: range.startPage, endPage: range.endPage })),
        );
      }
    }
  }, [id, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!job || ["completed", "failed", "boundary_review", "quota_wait"].includes(job.stage)) return;
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const progress = useMemo(() => {
    if (!job) return 0;
    if (job.stage === "completed") return 100;
    if (job.stage === "ocr" && job.pageCount) return Math.min(99, Math.round((job.ocrNextPage / job.pageCount) * 100));
    if (job.stage === "classify" && job.pageCount) return Math.min(99, Math.round((job.classifyCursor / job.pageCount) * 100));
    if (job.stage === "extract" && job.totalInvoices) return Math.min(99, Math.round((job.processedInvoices / job.totalInvoices) * 100));
    if (job.stage === "split") return 75;
    if (job.stage === "boundary_review") return 70;
    return 5;
  }, [job]);

  async function saveRanges() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/bulk-invoices/jobs/${id}/ranges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranges }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Napaka");
      setMessage(locale === "sl" ? "Razdelitev je potrjena. Obdelava se nadaljuje." : "Split confirmed. Processing continues.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Napaka");
    } finally {
      setBusy(false);
    }
  }

  async function resumeQuota() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/bulk-invoices/jobs/${id}/resume`, { method: "POST" });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Napaka");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Napaka");
    } finally {
      setBusy(false);
    }
  }

  if (!job) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-500">{message || "…"}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Link href={`${prefix}/bulk-invoices`} className="text-sm font-bold text-blue-600 hover:underline">
          ← {locale === "sl" ? "PDF paketi" : "PDF batches"}
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold text-slate-950 dark:text-white">{job.filename}</h1>
            <p className="mt-1 text-sm text-slate-500">{stageLabel(job.stage, locale)}</p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700">
            ↻ {locale === "sl" ? "Osveži" : "Refresh"}
          </button>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={locale === "sl" ? "Strani" : "Pages"} value={job.pageCount ?? "—"} />
          <Stat label={locale === "sl" ? "Najdeni računi" : "Invoices"} value={job.totalInvoices || "—"} />
          <Stat label={locale === "sl" ? "Obdelano" : "Processed"} value={job.processedInvoices} />
          <Stat label={locale === "sl" ? "Napredek" : "Progress"} value={`${progress}%`} />
        </div>

        {job.lastError && (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {job.lastError}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">{message}</div>
        )}
      </section>

      {job.stage === "boundary_review" && (
        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
          <h2 className="text-xl font-extrabold text-amber-950 dark:text-amber-200">
            {locale === "sl" ? "Preverite razdelitev računov" : "Review invoice split"}
          </h2>
          <p className="mt-2 text-sm text-amber-900 dark:text-amber-300">
            {locale === "sl"
              ? "AI ni dovolj prepričan o eni ali več mejah dokumentov. Po potrebi popravite strani in nato potrdite razdelitev."
              : "AI is uncertain about one or more document boundaries. Adjust page ranges if needed, then confirm the split."}
          </p>

          <div className="mt-4 space-y-2">
            {ranges.map((range, index) => (
              <div key={index} className="grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-[100px_1fr_1fr] dark:bg-slate-900">
                <strong className="self-center text-sm">
                  {locale === "sl" ? "Račun" : "Invoice"} {index + 1}
                </strong>
                <label className="text-xs text-slate-500">
                  {locale === "sl" ? "Od strani" : "From page"}
                  <input
                    type="number"
                    min={1}
                    max={job.pageCount ?? 500}
                    value={range.startPage + 1}
                    onChange={(event) => {
                      const value = Math.max(0, Number(event.target.value) - 1);
                      setRanges((current) => current.map((item, i) => i === index ? { ...item, startPage: value } : item));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  {locale === "sl" ? "Do strani" : "To page"}
                  <input
                    type="number"
                    min={1}
                    max={job.pageCount ?? 500}
                    value={range.endPage + 1}
                    onChange={(event) => {
                      const value = Math.max(0, Number(event.target.value) - 1);
                      setRanges((current) => current.map((item, i) => i === index ? { ...item, endPage: value } : item));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            disabled={busy}
            onClick={() => void saveRanges()}
            className="mt-5 rounded-xl bg-amber-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {locale === "sl" ? "Potrdi razdelitev in nadaljuj" : "Confirm split and continue"}
          </button>
        </section>
      )}

      {job.stage === "quota_wait" && (
        <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/20">
          <h2 className="text-xl font-extrabold text-red-900 dark:text-red-200">
            {locale === "sl" ? "OCR limit paketa je prenizek" : "OCR plan limit reached"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={locale === "sl" ? "/cenik" : "/en/pricing"} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">
              {locale === "sl" ? "Nadgradi paket" : "Upgrade plan"}
            </Link>
            <button
              disabled={busy}
              onClick={() => void resumeQuota()}
              className="rounded-xl border border-red-300 bg-white px-5 py-3 font-bold text-red-800 disabled:opacity-50"
            >
              {locale === "sl" ? "Ponovno preveri limit" : "Check limit again"}
            </button>
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-extrabold text-slate-950 dark:text-white">
            {locale === "sl" ? "Posamezni računi" : "Individual invoices"} ({groups.length})
          </h2>
          <div className="space-y-2">
            {groups.map((group) => {
              const previewOpen = openPreviews.includes(group.groupIndex);
              return (
              <article
                key={group.groupIndex}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-bold text-slate-950 dark:text-white">
                      {locale === "sl" ? "Račun" : "Invoice"} {group.groupIndex + 1} · {locale === "sl" ? "strani" : "pages"} {group.startPage + 1}–{group.endPage + 1}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {group.documentStatus ?? group.status} · {group.deliveryStatus}
                      {group.overallConfidenceBps != null ? ` · ${Math.round(group.overallConfidenceBps / 100)}%` : ""}
                    </div>
                    {group.deliveryError && <div className="mt-1 text-xs text-red-600">{group.deliveryError}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.previewUrl && (
                      <button
                        type="button"
                        onClick={() => setOpenPreviews((current) => previewOpen ? current.filter((id) => id !== group.groupIndex) : [...current, group.groupIndex])}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {previewOpen ? (locale === "sl" ? "Skrij predogled" : "Hide preview") : (locale === "sl" ? "Predogled" : "Preview")}
                      </button>
                    )}
                    {group.documentId ? (
                      <Link
                        href={`/invoice-review/${group.documentId}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        {locale === "sl" ? "Odpri račun" : "Open invoice"}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">{locale === "sl" ? "V obdelavi…" : "Processing…"}</span>
                    )}
                  </div>
                </div>
                {previewOpen && group.previewUrl && (
                  <div className="border-t border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-950">
                    <iframe
                      src={group.previewUrl}
                      title={`${locale === "sl" ? "Predogled računa" : "Invoice preview"} ${group.groupIndex + 1}`}
                      className="h-[62vh] min-h-[420px] w-full rounded-xl bg-white"
                    />
                  </div>
                )}
              </article>
            )})}
          </div>
        </section>
      )}
    </div>
  );
}

function stageLabel(stage: string, locale: Locale) {
  const sl: Record<string, string> = {
    uploaded: "Priprava PDF-ja",
    ocr: "OCR vseh strani",
    classify: "AI prepoznava meje posameznih računov",
    boundary_review: "Potrebna je potrditev razdelitve",
    split: "PDF se deli na posamezne račune",
    extract: "OCR in validacija posameznih računov",
    quota_wait: "Čaka na nadgradnjo paketa",
    completed: "Obdelava je končana",
    failed: "Obdelava ni uspela",
  };
  const en: Record<string, string> = {
    uploaded: "Preparing PDF",
    ocr: "OCR of all pages",
    classify: "AI is detecting individual invoice boundaries",
    boundary_review: "Split confirmation required",
    split: "Splitting PDF into individual invoices",
    extract: "OCR and validation of individual invoices",
    quota_wait: "Waiting for plan upgrade",
    completed: "Processing completed",
    failed: "Processing failed",
  };
  return (locale === "sl" ? sl : en)[stage] ?? stage;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
