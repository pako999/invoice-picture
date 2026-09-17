"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewDocument = {
  id: number;
  status: "uploaded" | "queued" | "processing" | "needs_review" | "approved" | "failed" | string;
  filename: string;
};

type ReviewPayload = {
  documents?: ReviewDocument[];
  stats?: Record<string, number | null>;
};

export function InvoiceReviewShortcut({ locale = "sl" }: { locale?: "sl" | "en" }) {
  const en = locale === "en";
  const [payload, setPayload] = useState<ReviewPayload | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const res = await fetch("/api/invoice-reader", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json() as ReviewPayload;
        if (mounted) setPayload(json);
      } catch {
        // The legacy invoice screen must continue working even if OCR status cannot load.
      }
    }

    void load();
    timer = setInterval(() => { void load(); }, 5000);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const state = useMemo(() => {
    const docs = payload?.documents ?? [];
    const needs = docs.filter((d) => d.status === "needs_review");
    const working = docs.filter((d) => d.status === "uploaded" || d.status === "queued" || d.status === "processing");
    const failed = docs.filter((d) => d.status === "failed");
    const approved = docs.filter((d) => d.status === "approved");
    return { needs, working, failed, approved };
  }, [payload]);

  if (!payload) return null;

  if (state.needs.length > 0) {
    const first = state.needs[0];
    return (
      <aside className="fixed right-4 top-20 z-[70] w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xl shadow-amber-900/10 dark:border-amber-700 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-amber-950 dark:text-amber-100">
              {en ? `${state.needs.length} invoice${state.needs.length === 1 ? "" : "s"} need approval` : `${state.needs.length} ${state.needs.length === 1 ? "račun čaka" : "računi čakajo"} na potrditev`}
            </p>
            <p className="mt-1 truncate text-xs text-amber-800 dark:text-amber-300">{first.filename}</p>
            <Link href={`/invoice-review/${first.id}`} className="mt-3 inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700">
              {en ? "Review and approve →" : "Preglej in potrdi →"}
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  if (state.working.length > 0) {
    return (
      <aside className="fixed right-4 top-20 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-xl dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <span className="animate-pulse text-2xl">🤖</span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-blue-950 dark:text-blue-100">
              {en ? `OCR processing: ${state.working.length}` : `OCR obdelava: ${state.working.length} v teku`}
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              {en ? "When a document needs your confirmation, the approval button will appear here automatically." : "Ko bo račun potreboval tvojo potrditev, se bo tukaj samodejno prikazal gumb za pregled."}
            </p>
            <Link href="/invoice-review" className="mt-2 inline-flex text-xs font-bold text-blue-700 underline underline-offset-2 dark:text-blue-300">
              {en ? "Open OCR status" : "Odpri OCR status"}
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  if (state.failed.length > 0) {
    return (
      <aside className="fixed right-4 top-20 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xl dark:border-red-800 dark:bg-red-950">
        <p className="font-extrabold text-red-900 dark:text-red-100">{en ? `${state.failed.length} OCR error(s)` : `${state.failed.length} OCR napak`}</p>
        <Link href="/invoice-review" className="mt-2 inline-flex rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">{en ? "Open OCR review" : "Odpri OCR pregled"}</Link>
      </aside>
    );
  }

  return (
    <Link href="/invoice-review" className="fixed right-4 top-20 z-[70] rounded-xl border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-bold text-emerald-700 shadow-lg backdrop-blur hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400">
      {en ? "✓ OCR review" : "✓ OCR pregled"}
    </Link>
  );
}
