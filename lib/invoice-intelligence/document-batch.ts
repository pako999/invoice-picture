import { tracedMistralFetch, tracedMistralJson, tracedMistralText } from "./trace";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { mistralJsonRequest } from "./mistral-http";
import { ProviderRequestError, providerResponseError, reservationWasRejected } from "./provider-errors";
import { recordProviderUsage } from "./provider-usage";
import type { OcrProviderBudgetReservation } from "./safety";

export class DocumentBatchPending extends Error {
  constructor(readonly retryInMs = 60_000) { super("Mistral batch is pending"); this.name = "DocumentBatchPending"; }
}

export type DocumentBatchState = {
  id: string; createdAt: number; pages: number;
  reservation: OcrProviderBudgetReservation; pollErrors?: number;
};
export function parseDocumentBatchState(value: string | null | undefined): DocumentBatchState | null {
  if (!value) return null;
  const state = JSON.parse(value) as DocumentBatchState;
  state.reservation.dayStart = new Date(state.reservation.dayStart);
  state.reservation.monthStart = new Date(state.reservation.monthStart);
  return state;
}

/** One stored provider batch per document. Many small documents use the
 * discounted async API without merging originals or losing filenames. */
export async function readDocumentBatch(args: { jobId: number; request: Record<string, any>; pages: number; reservation: OcrProviderBudgetReservation }) {
  if (!process.env.DATABASE_URL || !process.env.MISTRAL_API_KEY) throw new Error("Batch provider configuration is missing");
  const sql = neon(process.env.DATABASE_URL), headers = { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, "Content-Type": "application/json" };
  const [job] = await sql`SELECT "batchStateJson" FROM "invoiceProcessingJobs" WHERE "id"=${args.jobId}`;
  let state = parseDocumentBatchState(job?.batchStateJson);
  if (!state) {
    state = { id: `submitting:${randomUUID()}`, createdAt: Date.now(), pages: args.pages, reservation: args.reservation };
    const claimed = await sql`UPDATE "invoiceProcessingJobs" SET "batchStateJson"=${JSON.stringify(state)} WHERE "id"=${args.jobId} AND "batchStateJson" IS NULL RETURNING "id"`;
    if (!claimed.length) throw new DocumentBatchPending(1000);
    try {
      const { response, raw } = await mistralJsonRequest("https://api.mistral.ai/v1/batch/jobs", {
        method: "POST", headers, signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({ endpoint: "/v1/ocr", model: args.request.model, timeout_hours: 24,
          requests: [{ custom_id: `invoice-job-${args.jobId}`, body: args.request }] }),
      }, null, { operation: "document_batch_submit", model: args.request.model });
      if (!response.ok) throw providerResponseError(response,"Mistral document batch submission");
      if (typeof raw.id !== "string") throw new ProviderRequestError("Batch submission has unknown completion; review before retrying",null,"unknown",0,true);
      state.id = raw.id;
      await sql`UPDATE "invoiceProcessingJobs" SET "batchStateJson"=${JSON.stringify(state)} WHERE "id"=${args.jobId}`;
    } catch (error) {
      if (reservationWasRejected(error)) await sql`UPDATE "invoiceProcessingJobs" SET "batchStateJson"=NULL WHERE "id"=${args.jobId}`;
      throw error;
    }
    throw new DocumentBatchPending();
  }
  if (state.id.startsWith("submitting:")) throw new ProviderRequestError("Previous batch submission has unknown completion; review before manually retrying",null,"unknown",0,true);
  if (Date.now() - state.createdAt > 25 * 60 * 60_000) throw new ProviderRequestError("Mistral document batch exceeded its completion window",null,"unknown",0,true);
  let raw: any;
  try {
    ({ raw } = await requestBatchRead(`https://api.mistral.ai/v1/batch/jobs/${encodeURIComponent(state.id)}?inline=true`,headers));
  } catch (error) {
    state.pollErrors = (state.pollErrors ?? 0) + 1;
    await sql`UPDATE "invoiceProcessingJobs" SET "batchStateJson"=${JSON.stringify(state)} WHERE "id"=${args.jobId}`;
    if (state.pollErrors < 2) throw new DocumentBatchPending(error instanceof ProviderRequestError ? Math.max(60_000,error.retryAfterMs) : 60_000);
    throw error;
  }
  if (["QUEUED","RUNNING","CANCELLATION_REQUESTED"].includes(String(raw.status))) throw new DocumentBatchPending();
  if (raw.status !== "SUCCESS") {
    await recordProviderUsage({status:null,operation:"document_annotated_batch",batchId:state.id,model:args.request.model,unknown:true}).catch(()=>console.error("mistral_usage_record_failed"));
    throw new ProviderRequestError(`Mistral document batch ended with ${String(raw.status)}`,null,"unknown",0,true);
  }
  let records = Array.isArray(raw.outputs) ? raw.outputs : [];
  if (!records.length && typeof raw.output_file === "string") {
    const response = await tracedMistralFetch(`https://api.mistral.ai/v1/files/${encodeURIComponent(raw.output_file)}/content`,{headers,signal:AbortSignal.timeout(90_000)},null,{operation:"document_batch_result",batch_id:state.id});
    if (!response.ok) throw providerResponseError(response,"Mistral batch result download",true);
    records = (await tracedMistralText(response)).replace(/^\uFEFF/, "").split(/\r?\n/).filter(line=>line.trim()).map(line=>JSON.parse(line));
  }
  const record = records.find((row:any)=>row.custom_id===`invoice-job-${args.jobId}`) ?? (records.length===1 && records[0]?.custom_id == null ? records[0] : undefined);
  const response = record?.response;
  if (!response || Number(response.status_code)!==200 || !response.body) {
    const status = Number(response?.status_code);
    throw new ProviderRequestError("Mistral document batch returned no usable OCR result",Number.isInteger(status)?status:null,status>=400&&status<500&&status!==408?"rejected":"unknown",0,true);
  }
  await recordProviderUsage({raw:response.body,status:200,operation:"document_annotated_batch",annotated:true,batchId:state.id,model:args.request.model}).catch(()=>console.error("mistral_usage_record_failed"));
  return response.body;
}

async function requestBatchRead(url: string, headers: Record<string,string>) {
  const response = await tracedMistralFetch(url,{headers,signal:AbortSignal.timeout(60_000)},null,{operation:"document_batch_poll"});
  if (!response.ok) throw providerResponseError(response,"Mistral document batch poll",true);
  return { raw: await tracedMistralJson(response) };
}
