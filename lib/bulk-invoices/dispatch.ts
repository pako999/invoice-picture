import { after } from "next/server";
import { BULK_PDF_GATEWAY_URL } from "./config";

/** Capture the existing user's credential before the response. Never expose an internal secret. */
export function dispatchBulkJob(jobId: number, ownerId: string, token: string) {
  after(async () => {
    try {
      const response = await fetch(`${BULK_PDF_GATEWAY_URL}/run`, {
        method: "POST", redirect: "error",
        headers: { Authorization: `Bearer ${token}`, "x-workspace-owner": ownerId, "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }), signal: AbortSignal.timeout(260_000),
      });
      if (!response.ok) throw new Error(`Bulk dispatch HTTP ${response.status}`);
      await response.text();
    } catch (error) { console.error("bulk_immediate_dispatch_failed", { jobId, error: String(error) }); }
  });
}
