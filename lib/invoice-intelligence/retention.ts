import { and, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments } from "@/lib/schema";

export async function purgeExpiredInvoiceDocuments(limit = 50) {
  const db = getDb();
  const expired = await db.select({ id: invoiceDocuments.id, clerkUserId: invoiceDocuments.clerkUserId })
    .from(invoiceDocuments)
    .where(and(isNotNull(invoiceDocuments.retentionUntil), lte(invoiceDocuments.retentionUntil, new Date())))
    .limit(Math.max(1, Math.min(limit, 500)));

  for (const row of expired) {
    await db.insert(invoiceAuditLogs).values({
      documentId: row.id,
      clerkUserId: row.clerkUserId,
      action: "retention_delete",
      metadataJson: JSON.stringify({ reason: "retention_period_expired" }),
    });
    await db.delete(invoiceDocuments).where(invoiceDocuments.id.eq?.(row.id) as never);
  }
  return expired.length;
}
