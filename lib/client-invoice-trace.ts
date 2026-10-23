import type { FlowSnapshot } from "./invoice-processing-flow";
import { beginInvoiceTrace, invoiceTraceEnabled, type TraceNotes } from "./invoice-intelligence/trace";

type UploadTrace = { finish: (extra?: TraceNotes) => void; invoiceId?: number; documentId?: number; bulkJobId?: number };
const uploads = new Map<string, UploadTrace>();
let sequence = 0;

export function startClientInvoiceTrace(localId: string, bytes: number) {
  if (!invoiceTraceEnabled()) return;
  if (uploads.size >= 500) uploads.delete(uploads.keys().next().value!);
  // localId contains a filename in the existing UI: use it only as a Map key.
  uploads.set(localId, { finish: beginInvoiceTrace("end_to_end", bytes, { source: "browser", trace_id: ++sequence, boundary: "upload_started_to_first_usable_result_observed" }) });
}

export function bindClientInvoiceTrace(localId: string, ids: { invoiceId?: number; documentId?: number; bulkJobId?: number }) {
  const trace = uploads.get(localId);
  if (trace) Object.assign(trace, ids);
}

export function failClientInvoiceTrace(localId: string) {
  uploads.get(localId)?.finish({ outcome: "upload_failed" });
  uploads.delete(localId);
}

export function finishClientInvoiceTraces(snapshot: FlowSnapshot) {
  if (!invoiceTraceEnabled()) return;
  for (const [localId, trace] of uploads) {
    const matches = snapshot.documents.filter(d => d.id === trace.documentId || (trace.invoiceId != null && d.sourceInvoiceId === trace.invoiceId) || (trace.bulkJobId != null && d.bulkJobId === trace.bulkJobId));
    const document = matches.find(d => ["approved", "needs_review"].includes(d.status)) ?? matches[0];
    const batch = snapshot.batches.find(b => b.id === trace.bulkJobId);
    const ready = document && ["approved", "needs_review"].includes(document.status);
    const terminal = document?.status === "failed" || (batch && ["failed", "boundary_review", "quota_wait", "completed"].includes(batch.stage));
    if (!ready && !terminal) continue;
    trace.finish({ outcome: ready ? "usable_result" : "terminal_status", document_id: document?.id ?? null, bulk_job_id: trace.bulkJobId ?? null });
    uploads.delete(localId);
  }
}
