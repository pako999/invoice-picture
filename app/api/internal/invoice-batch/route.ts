import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { runQueuedInvoiceJobs } from "@/lib/invoice-intelligence/processor";

export const maxDuration = 300;
export async function POST(request: Request) {
  if (!verifyBulkInternalSecret(request.headers.get("x-bulk-secret"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = z.object({ documentId: z.number().int().positive() }).parse(await request.json());
  const results = await runQueuedInvoiceJobs(1,documentId);
  return NextResponse.json({ success:true,processed:results.length,pending:results.some(result=>result.deferred) });
}
