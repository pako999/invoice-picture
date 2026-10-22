import { and, eq, inArray, notExists } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs } from "@/lib/schema";
import { dispatchInvoiceProcessing } from "./dispatch";

export async function queuePreviouslyUploadedDocuments(limit = 50) {
  if (!process.env.MISTRAL_API_KEY) return 0;
  const db = getDb();
  const rows = await db.select({ id: invoiceDocuments.id }).from(invoiceDocuments)
    .where(and(inArray(invoiceDocuments.status, ["uploaded", "queued"]),
      notExists(db.select({ id: invoiceProcessingJobs.id }).from(invoiceProcessingJobs)
        .where(eq(invoiceProcessingJobs.documentId, invoiceDocuments.id)))))
    .limit(Math.max(1, Math.min(limit, 500)));
  let queued = 0;
  for (const row of rows) {
    const inserted = await db.insert(invoiceProcessingJobs).values({ documentId: row.id, status: "queued" })
      .onConflictDoNothing({ target: invoiceProcessingJobs.documentId })
      .returning({ id: invoiceProcessingJobs.id });
    if (inserted.length) {
      await db.update(invoiceDocuments).set({ status: "queued", updatedAt: new Date() }).where(eq(invoiceDocuments.id, row.id));
      queued += 1;
      dispatchInvoiceProcessing(row.id);
    }
  }
  return queued;
}

