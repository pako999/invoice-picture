import { recordProviderUsage } from "./provider-usage";
import { acquireMistralSlot } from "./provider-slots";
import { ProviderRequestError, providerResponseError } from "./provider-errors";
import { beginInvoiceTrace, tracedMistralFetch, tracedMistralJson, type TraceNotes } from "./trace";

/** Global native fetch keeps the runtime's connection pool. Hold admission
 * through the complete body read; no retry is hidden in this transport. */
export async function mistralJsonRequest(url: string, init: RequestInit, inputBytes: number | null, notes: TraceNotes) {
  const request = typeof init.body === "string" ? JSON.parse(init.body) : {};
  const finishAdmission = beginInvoiceTrace("provider_queue_wait",inputBytes,notes);
  let release: () => Promise<void>;
  try { release = await acquireMistralSlot(init.signal); finishAdmission({outcome:"admitted"}); }
  catch (error) {
    finishAdmission({outcome:"not_sent"});
    if (error instanceof ProviderRequestError) throw error;
    throw new ProviderRequestError("Mistral admission failed; no provider request was sent", 503, "rejected", 0, true);
  }
  const accounting = { operation: String(notes.operation ?? "unknown"), model: String(request.model ?? notes.model ?? "unknown"), annotated: Boolean(request.document_annotation_format) };
  const account = (value: Parameters<typeof recordProviderUsage>[0]) => recordProviderUsage(value).catch(() => console.error("mistral_usage_record_failed"));
  try {
    let response: Response;
    try { response = await tracedMistralFetch(url, init, inputBytes, notes); }
    catch { await account({ ...accounting, status: null, unknown: true }); throw new ProviderRequestError("Mistral connection interrupted; completion is unknown. Review before retrying.", null, "unknown", 0, true); }
    let raw: any;
    try { raw = await tracedMistralJson(response); }
    catch {
      await account({ ...accounting, status: response.status, unknown: response.ok || (response.status >= 500 || response.status === 408) });
      if (!response.ok) throw providerResponseError(response, "Mistral request");
      throw new ProviderRequestError("Mistral returned an unreadable response; completion is unknown. Review before retrying.", response.status, "unknown", 0, true);
    }
    // Batch submission itself has no inference usage; count its completed
    // output once when the stored batch ID is polled below.
    if (!url.includes("/batch/jobs")) await account({ ...accounting, raw, status: response.status, unknown: (response.status >= 500 || response.status === 408) });
    return { response, raw };
  } finally {
    // The lease also expires after a killed process. A release failure must
    // never turn successful inference into a duplicate billed request.
    await release().catch(() => console.error("mistral_slot_release_failed"));
  }
}
