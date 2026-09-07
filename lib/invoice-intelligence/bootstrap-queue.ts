import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs } from "@/lib/schema";

export async function queuePreviouslyUploadedDocuments(limit = 50) {
  if (!process.env.MISTRAL_API_KEY) return 0;
  const db = getDb();
  const rows = await db.select({ id: invoiceDocuments.id }).from(invoiceDocuments)
    .where(eq(invoiceDocuments.status, "uploaded"))
    .limit(Math.max(1, Math.min(limit, 500)));
  let queued = 0;
  for (const row of rows) {
    const inserted = await db.insert(invoiceProcessingJobs).values({ documentId: row.id, status: "queued" })
      .onConflictDoNothing({ target: invoiceProcessingJobs.documentId })
      .returning({ id: invoiceProcessingJobs.id });
    if (inserted.length) {
      await db.update(invoiceDocuments).set({ status: "queued", updatedAt: new Date() }).where(eq(invoiceDocuments.id, row.id));
      queued += 1;
    }
  }
  return queued;
}
