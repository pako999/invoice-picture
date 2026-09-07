import { NextResponse } from "next/server";
import { runQueuedInvoiceJobs } from "@/lib/invoice-intelligence/processor";
import { purgeExpiredInvoiceDocuments } from "@/lib/invoice-intelligence/retention";
import { queuePreviouslyUploadedDocuments } from "@/lib/invoice-intelligence/bootstrap-queue";
import { queuePendingApprovedDeliveries, runQueuedDeliveryJobs } from "@/lib/invoice-intelligence/delivery";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.max(1, Math.min(10, Number(process.env.INVOICE_CRON_BATCH_SIZE ?? 3)));
  const deliveryLimit = Math.max(1, Math.min(20, Number(process.env.INVOICE_DELIVERY_BATCH_SIZE ?? 5)));
  const startedAt = Date.now();
  const newlyQueued = await queuePreviouslyUploadedDocuments(100);
  const results = await runQueuedInvoiceJobs(limit);
  const newlyQueuedDeliveries = await queuePendingApprovedDeliveries(100);
  const deliveryResults = await runQueuedDeliveryJobs(deliveryLimit);
  const retentionDeleted = await purgeExpiredInvoiceDocuments(50);
  return NextResponse.json({
    newlyQueued,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    newlyQueuedDeliveries,
    deliveriesProcessed: deliveryResults.length,
    deliveriesSucceeded: deliveryResults.filter((r) => r.ok).length,
    deliveriesFailed: deliveryResults.filter((r) => !r.ok).length,
    retentionDeleted,
    durationMs: Date.now() - startedAt,
    results,
    deliveryResults,
  });
}
