import { workspaceAuth as auth } from "@/lib/workspace";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments, invoiceProcessingAttempts } from "@/lib/schema";

const historyLabels: Record<string, [string, string]> = {
  succeeded: ["Uspešno", "Succeeded"], skipped: ["Preskočeno", "Skipped"],
  processing: ["Obdelava poteka", "Processing"], failed: ["Neuspešno", "Failed"],
  queued: ["V čakalni vrsti", "Queued"], completed: ["Zaključeno", "Completed"],
  download: ["Prenos dokumenta", "Document download"], view: ["Ogled računa", "Invoice viewed"],
  approve: ["Potrditev računa", "Invoice approved"], auto_approved: ["Samodejna potrditev", "Automatically approved"],
  sent_to_review: ["Poslano v pregled", "Sent for review"], edit: ["Urejanje podatkov", "Details edited"],
  save: ["Shranjevanje", "Saved"], reject: ["Zavrnitev računa", "Invoice rejected"], delete: ["Izbris računa", "Invoice deleted"],
  reprocess: ["Ponovna obdelava", "Reprocessing"], reprocess_as_bulk: ["Ponovna obdelava kot PDF paket", "Reprocessed as PDF batch"],
  reprocess_completed_inline: ["Ponovna obdelava zaključena", "Reprocessing completed"],
  structured_delivery_success: ["Uspešno pošiljanje", "Delivery succeeded"], structured_delivery_failed: ["Neuspešno pošiljanje", "Delivery failed"],
  structured_zip_delivery_success: ["Uspešno pošiljanje ZIP paketa", "ZIP delivery succeeded"],
  ocr_plan_limit_reached: ["Dosežena omejitev OCR paketa", "OCR plan limit reached"],
  export: ["Izvoz podatkov", "Data export"], gdpr_export: ["Izvoz osebnih podatkov", "Personal data export"],
  retention_delete: ["Izbris po poteku hrambe", "Deleted after retention period"],
};

export async function ProcessingHistory({ documentId, locale = "sl" }: { documentId: number; locale?: "sl" | "en" }) {
  const en = locale === "en";
  const label = (value: string) => historyLabels[value]?.[en ? 1 : 0] ?? (en ? value : "Drugi dogodek");
  const { userId } = await auth();
  if (!userId) return null;
  const db = getDb();
  const [document] = await db.select({ id: invoiceDocuments.id })
    .from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId)))
    .limit(1);
  if (!document) return null;

  const [attempts, audit] = await Promise.all([
    db.select({
      id: invoiceProcessingAttempts.id,
      provider: invoiceProcessingAttempts.provider,
      model: invoiceProcessingAttempts.model,
      status: invoiceProcessingAttempts.status,
      errorMessage: invoiceProcessingAttempts.errorMessage,
      durationMs: invoiceProcessingAttempts.durationMs,
      pagesProcessed: invoiceProcessingAttempts.pagesProcessed,
      startedAt: invoiceProcessingAttempts.startedAt,
      completedAt: invoiceProcessingAttempts.completedAt,
    }).from(invoiceProcessingAttempts)
      .where(eq(invoiceProcessingAttempts.documentId, documentId))
      .orderBy(desc(invoiceProcessingAttempts.startedAt))
      .limit(50),
    db.select().from(invoiceAuditLogs)
      .where(and(eq(invoiceAuditLogs.documentId, documentId), eq(invoiceAuditLogs.clerkUserId, userId)))
      .orderBy(desc(invoiceAuditLogs.createdAt))
      .limit(100),
  ]);

  return (
    <section id="processing-history" className="mx-auto mb-28 mt-4 w-full min-w-0 max-w-[1600px] overflow-x-hidden px-3 sm:px-5 lg:px-7">
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-extrabold text-slate-900 dark:text-white">{en ? "OCR processing history" : "Zgodovina OCR obdelave"}</h2>
          <div className="mt-3 space-y-2 text-xs">
            {attempts.length === 0 ? <p className="text-slate-500">{en ? "No processing attempts yet." : "Še ni poskusov obdelave."}</p> : attempts.map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2"><strong>{a.provider === "deterministic" ? (en ? "Direct document reading" : "Neposredno branje dokumenta") : a.provider} · {a.model || "—"}</strong><span title={a.status}>{label(a.status)}</span></div>
                <div className="mt-1 text-slate-500">{a.durationMs == null ? "—" : `${a.durationMs} ms`} · {en ? "pages" : "strani"} {a.pagesProcessed ?? "—"}</div>
                {a.errorMessage && <div className="mt-1 text-red-600">{a.errorMessage}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-extrabold text-slate-900 dark:text-white">{en ? "Activity log" : "Dnevnik dejanj"}</h2>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto text-xs">
            {audit.map((a) => <div key={a.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><strong title={a.action}>{label(a.action)}</strong><div className="mt-1 text-slate-500">{new Date(a.createdAt).toLocaleString(en ? "en-GB" : "sl-SI")}</div></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

