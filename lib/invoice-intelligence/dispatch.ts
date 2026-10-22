import { after } from "next/server";

/** Document-scoped wakeup; no idle loop or cross-user queue scan.
 * The durable queue is the source of truth; cron recovers interrupted work.
 */
export function dispatchInvoiceProcessing(documentId: number) {
  after(async () => {
    try {
      const { runQueuedInvoiceJobs } = await import("./processor");
      await runQueuedInvoiceJobs(1, documentId);
    } catch (error) {
      console.error("invoice_immediate_processing_failed", { documentId, error: String(error) });
    }
  });
}

export function dispatchInvoiceDelivery(documentId: number) {
  after(async () => {
    try {
      const { runQueuedDeliveryJobs } = await import("./delivery");
      await runQueuedDeliveryJobs(1, documentId);
    } catch (error) {
      console.error("invoice_immediate_delivery_failed", { documentId, error: String(error) });
    }
  });
}
