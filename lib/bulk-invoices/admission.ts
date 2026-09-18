import { getStatus } from "@/lib/subscription";
import { bulkSql } from "@/lib/bulk-invoices/service";

export class BulkAdmissionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "subscription_required" | "bulk_backpressure",
  ) {
    super(message);
    this.name = "BulkAdmissionError";
  }
}

export async function assertBulkJobAdmission(clerkUserId: string) {
  const subscription = await getStatus(clerkUserId);
  if (!subscription.canSend) {
    throw new BulkAdmissionError("Paket ni aktiven.", 402, "subscription_required");
  }

  const sql = bulkSql();
  const [userCounts, globalCounts] = await Promise.all([
    sql`SELECT count(*)::int AS count FROM "bulkInvoiceJobs" WHERE "clerkUserId"=${clerkUserId} AND "status"='processing'`,
    sql`SELECT count(*)::int AS count FROM "bulkInvoiceJobs" WHERE "status"='processing'`,
  ]);
  if (Number(userCounts[0]?.count ?? 0) >= 2) {
    throw new BulkAdmissionError("Hkrati lahko obdelujete največ 2 velika PDF paketa.", 429, "bulk_backpressure");
  }
  if (Number(globalCounts[0]?.count ?? 0) >= 120) {
    throw new BulkAdmissionError("Sistem trenutno obdeluje veliko bulk PDF-jev. Poskusite ponovno čez nekaj minut.", 429, "bulk_backpressure");
  }
}
