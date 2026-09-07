import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments, invoiceProcessingAttempts } from "@/lib/schema";

export async function ProcessingHistory({ documentId }: { documentId: number }) {
  const { userId } = await auth();
  if (!userId) return null;
  const db = getDb();
  const [document] = await db.select({ id: invoiceDocuments.id })
    .from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId)))
    .limit(1);
  if (!document) return null;

  const [attempts, audit] = await Promise.all([
    db.select().from(invoiceProcessingAttempts).where(eq(invoiceProcessingAttempts.documentId, documentId)).orderBy(desc(invoiceProcessingAttempts.startedAt)).limit(50),
    db.select().from(invoiceAuditLogs).where(and(eq(invoiceAuditLogs.documentId, documentId), eq(invoiceAuditLogs.clerkUserId, userId))).orderBy(desc(invoiceAuditLogs.createdAt)).limit(100),
  ]);

  return (
    <section className="mx-auto mb-28 mt-4 max-w-[1600px] px-3 sm:px-5 lg:px-7">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-extrabold text-slate-900 dark:text-white">Zgodovina OCR obdelave</h2>
          <div className="mt-3 space-y-2 text-xs">
            {attempts.length === 0 ? <p className="text-slate-500">Še ni processing poskusov.</p> : attempts.map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2"><strong>{a.provider} · {a.model || "—"}</strong><span>{a.status}</span></div>
                <div className="mt-1 text-slate-500">{a.durationMs == null ? "—" : `${a.durationMs} ms`} · strani {a.pagesProcessed ?? "—"} · strošek {a.costMicros == null ? "—" : `${(a.costMicros / 1_000_000).toFixed(4)} €`}</div>
                {a.errorMessage && <div className="mt-1 text-red-600">{a.errorMessage}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-extrabold text-slate-900 dark:text-white">Audit trail</h2>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto text-xs">
            {audit.map((a) => <div key={a.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><strong>{a.action}</strong><div className="mt-1 text-slate-500">{new Date(a.createdAt).toLocaleString("sl-SI")}</div></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
