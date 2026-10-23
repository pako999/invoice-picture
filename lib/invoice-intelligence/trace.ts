export type TraceNotes = Record<string, string | number | boolean | null>;
type TraceStage = "file_read" | "preprocess" | "upload" | "ocr_ttfb" | "ocr_total" | "parse" | "db_write" | "end_to_end" | "mistral_http_ttfb" | "mistral_http_total" | "provider_queue_wait" | "provider_batch_wait";

/** Browser output stays in the browser console. Never send document data to logs. */
export function invoiceTraceEnabled() {
  return typeof window === "undefined"
    ? process.env.INVOICE_OCR_TRACE === "1"
    : process.env.NEXT_PUBLIC_INVOICE_OCR_TRACE === "1";
}

export function emitInvoiceTrace(stage: TraceStage, input_bytes: number | null, ms: number, notes: TraceNotes) {
  if (!invoiceTraceEnabled()) return;
  // Diagnostics must not change the outcome, including when a logger fails.
  try { console.info(JSON.stringify({ stage, input_bytes, ms: Math.max(0, Math.round(ms)), notes })); } catch {}
}

export function beginInvoiceTrace(stage: TraceStage, inputBytes: number | null, notes: TraceNotes) {
  if (!invoiceTraceEnabled()) return (_extra?: TraceNotes) => {};
  const started = performance.now();
  let finished = false;
  return (extra: TraceNotes = {}) => {
    if (finished) return;
    finished = true;
    emitInvoiceTrace(stage, inputBytes, performance.now() - started, { ...notes, ...extra });
  };
}

export async function traceInvoiceStage<T>(stage: TraceStage, inputBytes: number | null, notes: TraceNotes, operation: () => PromiseLike<T>): Promise<T> {
  if (!invoiceTraceEnabled()) return operation();
  const finish = beginInvoiceTrace(stage, inputBytes, notes);
  try { const value = await operation(); finish({ outcome: "ok" }); return value; }
  catch (error) { finish({ outcome: "error" }); throw error; }
}

export function traceInvoiceSync<T>(stage: TraceStage, inputBytes: number | null, notes: TraceNotes, operation: () => T): T {
  if (!invoiceTraceEnabled()) return operation();
  const finish = beginInvoiceTrace(stage, inputBytes, notes);
  try { const value = operation(); finish({ outcome: "ok" }); return value; }
  catch (error) { finish({ outcome: "error" }); throw error; }
}

const providerResponses = new WeakMap<Response, { started: number; inputBytes: number | null; notes: TraceNotes; totalStage: "ocr_total" | "mistral_http_total" }>();

/** No new client, dispatcher, retries, signals, response clones or body reads. */
export async function tracedMistralFetch(url: string, init: RequestInit, inputBytes: number | null, notes: TraceNotes): Promise<Response> {
  if (!invoiceTraceEnabled()) return fetch(url, init);
  const ocr = url === "https://api.mistral.ai/v1/ocr";
  const started = performance.now();
  const totalStage = ocr ? "ocr_total" : "mistral_http_total";
  try {
    const response = await fetch(url, init);
    emitInvoiceTrace(ocr ? "ocr_ttfb" : "mistral_http_ttfb", inputBytes, performance.now() - started,
      { ...notes, boundary: "response_headers_received", http_status: response.status });
    providerResponses.set(response, { started, inputBytes, notes, totalStage });
    return response;
  } catch (error) {
    emitInvoiceTrace(totalStage, inputBytes, performance.now() - started, { ...notes, outcome: "network_error" });
    throw error;
  }
}

/** Caller retains its existing .catch / error handling; JSON is consumed once. */
async function tracedMistralBody<T>(response: Response, consume: () => Promise<T>, decoder: "json" | "text"): Promise<T> {
  const trace = providerResponses.get(response);
  if (!trace) return consume();
  let parsed = false;
  try { const value = await consume(); parsed = true; return value; }
  finally {
    providerResponses.delete(response);
    emitInvoiceTrace(trace.totalStage, trace.inputBytes, performance.now() - trace.started, {
      ...trace.notes, boundary: "response_body_and_decode_complete", decoder, http_status: response.status,
      outcome: parsed ? (response.ok ? "ok" : "http_error") : "body_error",
    });
  }
}

export function tracedMistralJson(response: Response): Promise<any> {
  return tracedMistralBody(response, () => response.json(), "json");
}

export function tracedMistralText(response: Response): Promise<string> {
  return tracedMistralBody(response, () => response.text(), "text");
}
