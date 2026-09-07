import { NextResponse } from "next/server";
import { runQueuedInvoiceJobs } from "@/lib/invoice-intelligence/processor";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.max(1, Math.min(10, Number(process.env.INVOICE_CRON_BATCH_SIZE ?? 3)));
  const startedAt = Date.now();
  const results = await runQueuedInvoiceJobs(limit);
  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    durationMs: Date.now() - startedAt,
    results,
  });
}
