import { recordProviderUsage, estimateChatCost, providerContext } from "@/lib/invoice-intelligence/provider-usage";
import { mistralJsonRequest } from "@/lib/invoice-intelligence/mistral-http";
import { ProviderRequestError, ProviderCapacityError, providerResponseError, reservationWasRejected } from "@/lib/invoice-intelligence/provider-errors";
import { mistralOcrModel, mistralChatModel } from "@/lib/invoice-intelligence/mistral-config";
import { VAT_EXTRACTION_PROMPT } from "@/lib/invoice-intelligence/extraction-prompt";
import { neon } from "@neondatabase/serverless";
import { invoiceJsonSchema, normalizedInvoiceSchema, type NormalizedInvoice } from "@/lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "@/lib/invoice-intelligence/validation";
import { releaseUnusedOcrProviderBudget, reserveOcrProviderBudget } from "@/lib/invoice-intelligence/safety";
import { getOcrUsageSummary, quotaPageError } from "@/lib/invoice-intelligence/quota";
import { parseInvoiceTextDeterministically, reconcileMistralInvoiceWithOcrText } from "@/lib/invoice-intelligence/providers";
import { measureInvoiceStage } from "@/lib/invoice-intelligence/timing";
import { tracedMistralFetch, tracedMistralJson, tracedMistralText, traceInvoiceStage, traceInvoiceSync } from "@/lib/invoice-intelligence/trace";

const OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";
const CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const BATCH_ENDPOINT = "https://api.mistral.ai/v1/batch/jobs";
const FILES_ENDPOINT = "https://api.mistral.ai/v1/files";

export function bulkSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ocrBulkPages(args: {
  clerkUserId: string;
  documentUrl: string;
  startPage: number;
  batchPages: number;
  pageCount: number;
}) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const usage = await getOcrUsageSummary(args.clerkUserId);
  const remainingDailyPages = Math.max(0, usage.dailyPageLimit - usage.dayPages);
  const availablePages = Math.min(usage.remainingPages, remainingDailyPages);
  if (availablePages <= 0) {
    throw quotaPageError(usage, remainingDailyPages <= 0 ? "daily_pages" : "pages");
  }

  // Read the original PDF in bounded page ranges instead of fetching it once
  // per page. Lower-tier workspaces can still override this down to one page.
  const providerPagesPerRequest = envInt("MISTRAL_BULK_OCR_PAGES_PER_REQUEST", 500, 1, 500);
  const pagesThisBatch = Math.min(
    args.batchPages,
    providerPagesPerRequest,
    availablePages,
    args.pageCount - args.startPage,
  );
  const endPage = Math.min(args.pageCount - 1, args.startPage + pagesThisBatch - 1);
  const pages = Array.from({ length: endPage - args.startPage + 1 }, (_, i) => args.startPage + i);
  let reservedPages = pages.length;
  const reservation = await reserveOcrProviderBudget({ clerkUserId: args.clerkUserId, provider: "mistral", pages: pages.length, costPerPageMicros: envInt("MISTRAL_PLAIN_OCR_PAGE_COST_MICROS", 4000, 0, 10_000_000) });
  const requestBody = () => JSON.stringify({
    model: mistralOcrModel(),
    document: { type: "document_url", document_url: args.documentUrl },
    pages,
    include_image_base64: false,
    include_blocks: false,
    table_format: "html",
    confidence_scores_granularity: "page",
  });

  try {
    const deadline = Date.now() + 150_000;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const { response, raw } = await measureInvoiceStage("bulk_ocr_request", { startPage: args.startPage, pages: pages.length, attempt }, () => mistralJsonRequest(OCR_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: requestBody(),
        signal: providerAttemptSignal(deadline, Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000)),
      }, null, { operation: "bulk_page_ocr", start_page: args.startPage, pages: pages.length, attempt }));
      if (response.ok) {
        const responsePages = Array.isArray(raw.pages) ? raw.pages : [];
        if (responsePages.length !== pages.length) {
          throw new ProviderRequestError(`Mistral bulk OCR returned ${responsePages.length}/${pages.length} requested pages`,200,"unknown",0,true);
        }
        if (reservedPages > pages.length) {
          await releaseUnusedOcrProviderBudget({ reservation, pages: reservedPages - pages.length });
        }
        return {
          pages: mapOcrPages(responsePages, args.startPage, pages.length),
          model: String(raw.model || mistralOcrModel()),
          nextPage: args.startPage + pages.length,
          done: args.startPage + pages.length >= args.pageCount,
        };
      }

      const retryable = response.status === 429;
      if (!retryable || attempt === 2) {
        throw providerResponseError(response, "Mistral bulk OCR", attempt === 2);
      }
      const delayMs = retryDelayMs(response.headers.get("Retry-After"), attempt);
      // A page-rate-limited workspace may reject a 25-page range forever.
      // Retry only its first page; the durable cursor preserves the remainder.
      if (response.status === 429 && pages.length > 1) {
        pages.splice(1);
        await releaseUnusedOcrProviderBudget({ reservation, pages: reservedPages - pages.length });
        reservedPages = pages.length;
      }
      console.warn(`[bulk-invoices] Mistral bulk OCR returned ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/2)`);
      await providerRetryDelay(delayMs, deadline, response.status);
    }
    throw new Error("Mistral bulk OCR failed after retries");
  } catch (error) {
    // A provider rejection must not consume the customer's internal allowance.
    // The same pages will be reserved again only when a later attempt runs.
    if (reservationWasRejected(error)) await releaseUnusedOcrProviderBudget({ reservation, pages: reservedPages }).catch((releaseError) => {
      console.error("[bulk-invoices] Failed to release unused OCR reservation", releaseError);
    });
    throw error;
  }
}

export type MistralOcrBatchState = {
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "TIMEOUT_EXCEEDED" | "CANCELLATION_REQUESTED" | "CANCELLED";
  pages: Array<{ pageNumber: number; markdown: string; confidence: number | null }>;
  model: string;
  error: string | null;
};

/**
 * Bulk PDFs use Mistral's asynchronous Batch API. Batch work is independent
 * from the real-time pages-per-minute limit which can reject even a one-page
 * request on low usage tiers.
 */
export async function createMistralOcrBatch(args: {
  clerkUserId: string;
  documentUrl: string;
  startPage: number;
  batchPages: number;
  pageCount: number;
}) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const usage = await getOcrUsageSummary(args.clerkUserId);
  const remainingDailyPages = Math.max(0, usage.dailyPageLimit - usage.dayPages);
  const availablePages = Math.min(usage.remainingPages, remainingDailyPages);
  if (availablePages <= 0) {
    throw quotaPageError(usage, remainingDailyPages <= 0 ? "daily_pages" : "pages");
  }

  const pagesThisBatch = Math.min(
    Math.max(1, args.batchPages),
    availablePages,
    args.pageCount - args.startPage,
  );
  if (pagesThisBatch <= 0) throw new Error("Bulk OCR has no remaining pages to submit");
  const pages = Array.from({ length: pagesThisBatch }, (_, i) => args.startPage + i);
  const model = mistralOcrModel();
  const reservation = await reserveOcrProviderBudget({
    clerkUserId: args.clerkUserId,
    provider: "mistral",
    pages: pages.length,
    costPerPageMicros: envInt("MISTRAL_BATCH_OCR_PAGE_COST_MICROS", 2000, 0, 10_000_000),
  });

  try {
    const { response, raw } = await mistralJsonRequest(BATCH_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "/v1/ocr",
        model,
        timeout_hours: 24,
        metadata: {
          source: "posljiracun-bulk-pdf",
          start_page: String(args.startPage),
          page_count: String(pages.length),
        },
        requests: [{
          custom_id: `pages-${pages[0]}-${pages[pages.length - 1]}`,
          body: {
            document: { type: "document_url", document_url: args.documentUrl },
            pages,
            include_image_base64: false,
            include_blocks: false,
            table_format: "html",
            confidence_scores_granularity: "page",
          },
        }],
      }),
      signal: AbortSignal.timeout(90_000),
    }, null, { operation: "batch_ocr_submit", pages: pages.length });
    if (!response.ok || typeof raw.id !== "string") {
      throw response.ok ? new ProviderRequestError("Mistral Batch OCR submission returned no batch ID; completion is unknown", null, "unknown", 0, true) : providerResponseError(response, "Mistral Batch OCR submission", true);
    }
    return {
      batchId: raw.id as string,
      startPage: args.startPage,
      pageCount: pages.length,
      createdAt: new Date(),
      status: String(raw.status || "QUEUED"),
    };
  } catch (error) {
    if (reservationWasRejected(error)) await releaseUnusedOcrProviderBudget({ reservation, pages: pages.length }).catch((releaseError) => {
      console.error("[bulk-invoices] Failed to release rejected Batch OCR reservation", releaseError);
    });
    throw error;
  }
}

export async function pollMistralOcrBatch(args: {
  batchId: string;
  startPage: number;
  expectedPageCount: number;
}): Promise<MistralOcrBatchState> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const response = await tracedMistralFetch(`${BATCH_ENDPOINT}/${encodeURIComponent(args.batchId)}?inline=true`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(60_000),
  }, null, { operation: "batch_ocr_poll", batch_id: args.batchId });
  const raw = await tracedMistralJson(response).catch(() => ({}));
  if (!response.ok) {
    throw providerResponseError(response,"Mistral Batch OCR status",true);
  }
  recordBatchTiming(raw, args.batchId, "ocr");

  const status = String(raw.status || "").toUpperCase() as MistralOcrBatchState["status"];
  const model = String(raw.model || mistralOcrModel());
  if (status === "QUEUED" || status === "RUNNING" || status === "CANCELLATION_REQUESTED") {
    return { status, pages: [], model, error: null };
  }
  if (status !== "SUCCESS") {
    return { status, pages: [], model, error: batchError(raw) };
  }

  let records: unknown[] = Array.isArray(raw.outputs) ? raw.outputs : [];
  if (!records.length && typeof raw.output_file === "string" && raw.output_file) {
    const output = await tracedMistralFetch(`${FILES_ENDPOINT}/${encodeURIComponent(raw.output_file)}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(90_000),
    }, null, { operation: "batch_ocr_result_download" });
    if (!output.ok) {
      const detail = await tracedMistralText(output).catch(() => "");
      throw new Error(`Mistral Batch OCR result download failed (${output.status}): ${detail.slice(0, 500)}`);
    }
    records = parseJsonLines(await tracedMistralText(output));
  }

  const body = batchResponseBody(records[0]);
  await recordProviderUsage({ raw: body, status: 200, operation: "batch_ocr", model, batchId: args.batchId }).catch(() => console.error("mistral_usage_record_failed"));
  const responsePages = Array.isArray(body?.pages) ? body.pages : [];
  if (responsePages.length !== args.expectedPageCount) {
    throw new ProviderRequestError(`Mistral Batch OCR returned ${responsePages.length}/${args.expectedPageCount} requested pages`,200,"unknown",0,true);
  }
  return {
    status,
    model: String(body?.model || model),
    error: null,
    pages: mapOcrPages(responsePages, args.startPage, args.expectedPageCount),
  };
}

export async function releaseMistralOcrBatchReservation(args: {
  clerkUserId: string;
  createdAt: Date;
  pages: number;
}) {
  const createdAt = args.createdAt;
  const dayStart = new Date(Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), createdAt.getUTCDate()));
  const monthStart = new Date(Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), 1));
  await releaseUnusedOcrProviderBudget({
    reservation: {
      clerkUserId: args.clerkUserId,
      dayStart,
      monthStart,
      costPerPage: envInt("MISTRAL_BATCH_OCR_PAGE_COST_MICROS", 2000, 0, 10_000_000),
    },
    pages: args.pages,
  });
}

const classificationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pages"],
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pageNumber", "startsNewInvoice", "continuationOfPrevious", "invoiceNumber", "supplierName", "confidence", "reason"],
        properties: {
          pageNumber: { type: "integer" },
          startsNewInvoice: { type: "boolean" },
          continuationOfPrevious: { type: "boolean" },
          invoiceNumber: { type: ["string", "null"] },
          supplierName: { type: ["string", "null"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

export type BulkPageClassification = {
  pageNumber: number;
  startsNewInvoice: boolean;
  continuationOfPrevious: boolean;
  invoiceNumber: string | null;
  supplierName: string | null;
  confidence: number;
  reason: string;
};

function classificationRequest(args:{pages:Array<{pageNumber:number;markdown:string}>;previousPage?:{pageNumber:number;markdown:string}|null}) {
  const input=args.pages.map(p=>({pageNumber:p.pageNumber,markdown:p.markdown.slice(0,5000)}));
  const previous=args.previousPage?{pageNumber:args.previousPage.pageNumber,markdown:args.previousPage.markdown.slice(-3500)}:null;
  return {model:mistralChatModel("classifier"),name:"invoice_page_boundaries",schema:classificationSchema,prompt:["You split a scanned PDF containing multiple accounting documents into invoice groups.","For EACH supplied page decide whether that page starts a new invoice/document or continues the previous page.","Invoices can have multiple pages. Never assume one page equals one invoice.","A new invoice is likely when invoice number, supplier/issuer, title (Invoice/Račun/Rechnung/Fattura/Credit note/Proforma) or document identity clearly changes.","Continuation pages often repeat headers, carry line items, totals, terms or attachments belonging to the same invoice.","If uncertain, prefer continuation and lower confidence rather than creating a false split.","Page numbers are zero-based and MUST match the supplied pageNumber values.","Page 0 of the complete document must start a new invoice.",previous?`Previous context before this batch: ${JSON.stringify(previous)}`:"There is no previous page before this batch.",`Pages to classify: ${JSON.stringify(input)}`].join("\n")};
}
function parseClassifications(raw:any):BulkPageClassification[]{const rows=Array.isArray(raw?.pages)?raw.pages:[];return rows.map((row:Record<string,any>)=>({pageNumber:Number(row.pageNumber),startsNewInvoice:Boolean(row.startsNewInvoice),continuationOfPrevious:Boolean(row.continuationOfPrevious),invoiceNumber:row.invoiceNumber==null?null:String(row.invoiceNumber),supplierName:row.supplierName==null?null:String(row.supplierName),confidence:clamp01(Number(row.confidence)),reason:String(row.reason||"")}));}
export async function createMistralClassificationBatch(args:{pages:Array<{pageNumber:number;markdown:string}>;previousPage?:{pageNumber:number;markdown:string}|null}){return createMistralStructuredBatch(classificationRequest(args),"bulk-classify");}
export async function pollMistralClassificationBatch(batchId:string){const state=await pollMistralStructuredBatch(batchId,"classification");return{...state,result:state.result?parseClassifications(state.result):null};}

export async function classifyBulkPages(args: {
  pages: Array<{ pageNumber: number; markdown: string }>;
  previousPage?: { pageNumber: number; markdown: string } | null;
}): Promise<BulkPageClassification[]> {
  if (args.pages.length === 1 && args.pages[0].pageNumber === 0 && !args.previousPage) return classifyBulkPagesDeterministically(args);
  let raw: any;
  try {
    raw = await mistralStructured(classificationRequest(args));
  } catch (error) {
    if (error instanceof ProviderRequestError && error.status != null && error.status < 500 && error.status !== 429) throw error;
    console.warn(`[bulk-invoices] Mistral classification unavailable; using deterministic boundaries: ${error instanceof Error ? error.message : String(error)}`);
    return classifyBulkPagesDeterministically(args);
  }
  return parseClassifications(raw);
}

export function classifyBulkPagesDeterministically(args: {
  pages: Array<{ pageNumber: number; markdown: string }>;
  previousPage?: { pageNumber: number; markdown: string } | null;
}): BulkPageClassification[] {
  let previous = args.previousPage ?? null;
  return args.pages.map((page) => {
    const currentText = normalizeBoundaryText(page.markdown);
    const previousText = previous ? normalizeBoundaryText(previous.markdown) : "";
    const currentMarker = pageMarker(currentText);
    const previousMarker = pageMarker(previousText);
    const currentKind = documentKind(currentText);
    const previousKind = documentKind(previousText);
    const currentId = documentIdentifier(currentText, currentKind);
    const previousId = documentIdentifier(previousText, previousKind);

    let startsNewInvoice = false;
    let confidence = 0.45;
    let reason = "No reliable boundary marker; treated as a continuation for manual review.";

    if (page.pageNumber === 0) {
      startsNewInvoice = true;
      confidence = 1;
      reason = "First page of the PDF.";
    } else if (currentMarker && currentMarker.current > 1) {
      confidence = 0.99;
      reason = `Explicit page ${currentMarker.current} of ${currentMarker.total} marker.`;
    } else if (currentMarker?.current === 1) {
      startsNewInvoice = true;
      confidence = 0.99;
      reason = `Explicit first-page marker (1 of ${currentMarker.total}).`;
    } else if (currentId && previousId && currentId !== previousId) {
      startsNewInvoice = true;
      confidence = 0.98;
      reason = `Document identifier changed from ${previousId} to ${currentId}.`;
    } else if (currentId && previousId && currentId === previousId) {
      startsNewInvoice = Boolean(currentKind && previousKind && currentKind !== previousKind);
      confidence = startsNewInvoice ? 0.94 : 0.97;
      reason = startsNewInvoice
        ? `Document type changed from ${previousKind} to ${currentKind}.`
        : `Document identifier ${currentId} continues from the previous page.`;
    } else if (currentId) {
      startsNewInvoice = true;
      confidence = currentKind ? 0.86 : 0.78;
      reason = `Found a new document identifier (${currentId}).`;
    } else if (previousMarker && previousMarker.current < previousMarker.total) {
      confidence = 0.92;
      reason = `Previous page indicates a ${previousMarker.total}-page document.`;
    } else if (currentKind && currentKind !== previousKind) {
      startsNewInvoice = true;
      confidence = 0.68;
      reason = `Found a new ${currentKind} heading without a reliable identifier; manual review required.`;
    }

    const row: BulkPageClassification = {
      pageNumber: page.pageNumber,
      startsNewInvoice,
      continuationOfPrevious: !startsNewInvoice,
      invoiceNumber: currentId,
      supplierName: null,
      confidence,
      reason: `Deterministic fallback: ${reason}`,
    };
    previous = page;
    return row;
  });
}

function normalizeBoundaryText(markdown: string) {
  return markdown
    .replace(/[\*_`#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pageMarker(text: string) {
  const match = text.match(/(?:page|stran|[šs]tevilo\s+strani|tevilo\s+strani)\s*:?\s*(\d+)\s*(?:of|od|\/)\s*(\d+)/iu)
    ?? text.match(/\bstran\s*:?\s*(\d+)\b/iu);
  if (!match) return null;
  const current = Number(match[1]);
  const total = Number(match[2] ?? current);
  return Number.isInteger(current) && current > 0 && Number.isInteger(total) && total >= current
    ? { current, total }
    : null;
}

function documentKind(text: string) {
  const front = text.slice(0, 400);
  if (/\breceipt\b/iu.test(front)) return "receipt";
  if (/\b(?:credit\s+note|dobropis)\b/iu.test(front)) return "credit_note";
  if (/\b(?:predra[čc]un|proforma)\b/iu.test(front)) return "proforma";
  if (/\b(?:invoice|ra\s*[čc]\s*un|rechnung|fattura)\b/iu.test(front)) return "invoice";
  return null;
}

function documentIdentifier(text: string, kind: string | null) {
  const receipt = text.match(/\breceipt\s*(?:number|no\.?|#)\s*:?\s*([\p{L}\d][\p{L}\d._/–—-]{2,})/iu)?.[1];
  if (kind === "receipt" && receipt) return receipt.toUpperCase();
  const match = text.match(/(?:invoice\s*(?:number|no\.?|#)|predra[čc]un\s*(?:[šs]t(?:evilka)?\.?|#)?|ra[čc]un\s*(?:[šs]t(?:evilka)?\.?|st\.?|#)|[šs]t\.?\s*ra[čc]una|[šs]tevilka\s+fakture)\s*:?\s*([\p{L}\d][\p{L}\d._/–—-]{2,})/iu);
  return (receipt ?? match?.[1] ?? null)?.toUpperCase() ?? null;
}

export function hasUsableBulkOcrMarkdown(markdown: string) {
  const text = markdown.replace(/---\s*PAGE\s+\d+\s*---/gi, " ").replace(/\s+/g, " ").trim();
  return text.length >= 80
    && /(?:invoice|receipt|ra[čc]un|rechnung|fattura|predra[čc]un|proforma|dobropis|credit\s+note|vat|ddv|total|skupaj|za\s+pla[čc]ilo)/i.test(text);
}

function invoiceExtractionRequest(markdown:string,ocrConfidence:number|null){return{model:mistralChatModel("extract"),name:"normalized_invoice",schema:invoiceJsonSchema,prompt:[VAT_EXTRACTION_PROMPT,"Extract one accounting document from the OCR markdown below.","The page group has already been split and should represent exactly one invoice, credit note, receipt, proforma or quotation.","Never invent missing values. Return null when genuinely absent.","Ignore OCR page separators such as --- PAGE 1 ---; they are never supplier names or invoice data.","Read invoiceNumber only from a labelled invoice-number field, never from a logo, brand name or supplier name.","Read VAT/tax IDs only from explicitly labelled tax-ID fields; never derive them from city names or ordinary words.","Dates may use numeric or written English month formats. Extract all labelled issue and due dates.","Normalize dates to YYYY-MM-DD, currency to ISO 4217 and monetary values to decimal strings without currency symbols.","Supplier is the issuer/seller; buyer is the recipient/customer.","Keep the supplier name with the supplier VAT, address, email and IBAN block; keep the buyer name with the buyer VAT and address block.","Never copy the buyer name into the supplier. If the names match but VAT numbers or addresses differ, re-check the OCR text.","Preserve document status (including Draft/Osnutek), delivery-note number, supply/place of delivery, shipping method, total before discount, VAT breakdown, totals, IBAN, BIC, payment reference and terms when visible.","For EVERY visible line item return productCode/SKU, full description, quantity, unit, unitPriceBeforeDiscount, unitPriceNet after discount, discountPercent, discountAmount, vatRate, netAmount, vatAmount and grossAmount. Never omit a visible item description.","Only rows from the actual items/services table are line items. Never use payment instructions, QR captions, slogans, footer text, 'Slikaj in plačaj', 'Scan and pay', 'Plačilo', 'Payment', 'Sklic', 'IBAN' or similar payment text as a line-item description.","Set validationStatus to pending. Deterministic validation runs after extraction.",`OCR page confidence available to the system: ${ocrConfidence==null?"unknown":ocrConfidence.toFixed(4)}.`,"OCR markdown:",markdown.slice(0,120000)].join("\n")};}
function finalizeStructuredInvoice(raw: any, markdown: string, ocrConfidence: number | null, model: string) {
  // Transport accounting is not part of the model's strict invoice schema.
  // Preserve it in the raw audit record, while validating every invoice field.
  const { _provider: providerMetadata, ...invoiceData } = raw;
  const invoice = normalizeInvoiceValues(reconcileMistralInvoiceWithOcrText(normalizedInvoiceSchema.parse(invoiceData), markdown));
  if (ocrConfidence != null) invoice.confidence.overall = Math.min(invoice.confidence.overall ?? 1, ocrConfidence);
  const validation = validateInvoice(invoice);
  invoice.validationStatus = validation.status === "failed" ? "needs_review" : validation.status;
  return {
    invoice, validation, raw, provider: "mistral" as const,
    model: String(providerMetadata?.model || model),
    costMicros: providerMetadata?.estimatedCostMicros ?? null,
  };
}
export async function createMistralInvoiceExtractionBatch(markdown:string,ocrConfidence:number|null){return createMistralStructuredBatch(invoiceExtractionRequest(markdown,ocrConfidence),"bulk-extract");}
export async function pollMistralInvoiceExtractionBatch(args:{batchId:string;markdown:string;ocrConfidence:number|null}){const state=await pollMistralStructuredBatch(args.batchId,"invoice extraction");return{...state,result:state.result?finalizeStructuredInvoice(state.result,args.markdown,args.ocrConfidence,mistralChatModel("extract")):null};}

export async function extractBulkInvoice(markdown: string, ocrConfidence: number | null, previousInvoice: NormalizedInvoice | null = null): Promise<{
  invoice: NormalizedInvoice;
  validation: ReturnType<typeof validateInvoice>;
  raw: unknown;
  provider: "mistral" | "deterministic";
  model: string;
  costMicros?: number | null;
}> {
  const request=invoiceExtractionRequest(markdown,ocrConfidence);const model=request.model;
  try {
    const raw = await mistralStructured(request);
    return finalizeStructuredInvoice(raw,markdown,ocrConfidence,model);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!(error instanceof ProviderCapacityError) && /\b429\b|rate limit/i.test(message)) {
      const parsedInvoice = normalizeInvoiceValues(parseInvoiceTextDeterministically(markdown));
      const invoice = previousInvoice
        ? preserveMissingFallbackValues(parsedInvoice, previousInvoice)
        : parsedInvoice;
      const fallbackWarning = "Mistral rate limit fallback was used; verify all extracted fields before approval.";
      if (!invoice.warnings.includes(fallbackWarning)) invoice.warnings.push(fallbackWarning);
      invoice.validationStatus = "needs_review";
      const checked = validateInvoice(invoice);
      const validation = {
        ...checked,
        status: "needs_review" as const,
        warnings: [...checked.warnings, fallbackWarning],
      };
      console.warn(`[bulk-invoices] Mistral rate limit reached; completed with deterministic OCR-text fallback. ${message}`);
      return {
        invoice,
        validation,
        raw: { fallback: "ocr_text_rate_limit", error: message },
        provider: "deterministic",
        model: "ocr-text-rate-limit-fallback-v1",
      };
    }
    console.warn(`[bulk-invoices] Mistral structured extraction is temporarily unavailable; invoice remains queued. ${message}`);
    throw error;
  }
}

function preserveMissingFallbackValues(fresh: NormalizedInvoice, previous: NormalizedInvoice) {
  const merged = structuredClone(fresh) as Record<string, any>;
  const fillMissing = (target: Record<string, any>, source: Record<string, any>) => {
    for (const [key, sourceValue] of Object.entries(source)) {
      if (["warnings", "validationStatus", "confidence"].includes(key) || sourceValue == null || sourceValue === "") continue;
      const targetValue = target[key];
      if (Array.isArray(sourceValue)) {
        if ((!Array.isArray(targetValue) || targetValue.length === 0) && sourceValue.length > 0) {
          target[key] = structuredClone(sourceValue);
        }
      } else if (typeof sourceValue === "object") {
        if (!targetValue || typeof targetValue !== "object" || Array.isArray(targetValue)) target[key] = {};
        fillMissing(target[key], sourceValue as Record<string, any>);
      } else if (targetValue == null || targetValue === "" || (key === "documentType" && targetValue === "unknown")) {
        target[key] = sourceValue;
      }
    }
  };
  fillMissing(merged, previous as unknown as Record<string, any>);
  return normalizeInvoiceValues(normalizedInvoiceSchema.parse(merged));
}

export async function extractBulkInvoiceFromDocument(documentUrl: string, ocrConfidence: number | null, sourcePages = 1): Promise<{
  invoice: NormalizedInvoice;
  validation: ReturnType<typeof validateInvoice>;
  raw: unknown;
  provider: "mistral";
  model: string;
  costMicros?: number | null;
}> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const parsedUrl = new URL(documentUrl);
  const deadline = Date.now() + 150_000;
  if (parsedUrl.protocol !== "https:") throw new Error("Bulk OCR document URL must use HTTPS");

  const model = mistralOcrModel();
  const requestBody = JSON.stringify({
    model,
    document: { type: "document_url", document_url: documentUrl },
    include_image_base64: false,
    include_blocks: true,
    table_format: "html",
    confidence_scores_granularity: "block",
    document_annotation_prompt: [
      VAT_EXTRACTION_PROMPT,
      "Extract exactly one accounting document from this PDF using OCR and return the complete structured invoice.",
      "Never invent missing values. Supplier is the issuer/seller and buyer is the recipient/customer.",
      "Read invoiceNumber only from a labelled invoice-number field, never from a logo or brand.",
      "Extract all labelled issue, service and due dates, including written English month formats, and normalize them to YYYY-MM-DD.",
      "Extract every line item/product row with description, code when present, quantity, unit, unit price, discount, VAT rate and amounts.",
      "Only actual product/service table rows are line items. Never use payment instructions, QR captions, slogans, footer text, 'Slikaj in plačaj', 'Scan and pay', 'Plačilo', 'Payment', 'Sklic' or 'IBAN' as an item description.",
      "Extract currency, totals, VAT breakdown, IBAN, BIC, payment reference and payment terms whenever visible.",
      "Read tax IDs only from explicitly labelled tax fields and never from city names or ordinary words.",
      "Normalize currencies to ISO 4217 and monetary values to decimal strings without currency symbols.",
      "Set validationStatus to pending; deterministic validation runs after extraction.",
    ].join(" "),
    document_annotation_format: {
      type: "json_schema",
      json_schema: { name: "normalized_invoice", strict: true, schema: invoiceJsonSchema },
    },
  });

  const owner = providerContext();
  const reservation = owner ? await reserveOcrProviderBudget({ clerkUserId: owner.clerkUserId, provider: "mistral", pages: sourcePages }) : null;
  try {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { response, raw } = await mistralJsonRequest(OCR_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: requestBody,
      signal: providerAttemptSignal(deadline, 90_000),
    }, null, { operation: "child_annotated_ocr", model, attempt });
    if (response.ok) {
      const annotationRaw = raw.document_annotation;
      const annotation = typeof annotationRaw === "string" ? JSON.parse(annotationRaw) : annotationRaw;
      const pages = Array.isArray(raw.pages) ? raw.pages : [];
      const markdown = pages.map((page: Record<string, any>) => pageOcrText(page)).join("\n\n");
      const invoice = normalizeInvoiceValues(reconcileMistralInvoiceWithOcrText(normalizedInvoiceSchema.parse(annotation), markdown));
      if (ocrConfidence != null) invoice.confidence.overall = Math.min(invoice.confidence.overall ?? 1, ocrConfidence);
      const validation = validateInvoice(invoice);
      invoice.validationStatus = validation.status === "failed" ? "needs_review" : validation.status;
      return { invoice, validation, raw, provider: "mistral", model: String(raw.model || model), costMicros: Number(raw.usage_info?.pages_processed ?? sourcePages) * Number(process.env.MISTRAL_ANNOTATED_PAGE_COST_MICROS ?? 5000) };
    }
    if (response.status !== 429) {
      throw providerResponseError(response, "Mistral OCR annotation", attempt === 2);
    }
    if (attempt === 2) throw providerResponseError(response, "Mistral OCR annotation", attempt === 2);
    const delayMs = retryDelayMs(response.headers.get("Retry-After"), attempt);
    console.warn(`[bulk-invoices] Mistral OCR annotation returned ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/2)`);
    await providerRetryDelay(delayMs, deadline, response.status);
  }
  throw new Error("Mistral OCR annotation failed after retries");
  } catch (error) {
    if (reservation && reservationWasRejected(error)) await releaseUnusedOcrProviderBudget({ reservation, pages: sourcePages }).catch(() => console.error("bulk_fallback_reservation_release_failed"));
    throw error;
  }
}

type StructuredRequest={model:string;name:string;schema:unknown;prompt:string;retryRateLimit?:boolean};
type StructuredBatchStatus="QUEUED"|"RUNNING"|"SUCCESS"|"FAILED"|"TIMEOUT_EXCEEDED"|"CANCELLATION_REQUESTED"|"CANCELLED";
async function createMistralStructuredBatch(args: StructuredRequest, source: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const { response, raw } = await mistralJsonRequest(BATCH_ENDPOINT, {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: "/v1/chat/completions", model: args.model, timeout_hours: 24,
      metadata: { source }, requests: [{ custom_id: source, body: structuredRequestBody(args) }] }),
    signal: AbortSignal.timeout(90_000),
  }, null, { operation: "batch_structured_submit", source });
  if (!response.ok) throw providerResponseError(response, `Mistral Batch ${source} submission`, true);
  if (typeof raw.id !== "string") throw new ProviderRequestError("Mistral batch returned no ID; completion is unknown", null, "unknown", 0, true);
  return { batchId: raw.id as string, status: String(raw.status || "QUEUED") as StructuredBatchStatus };
}
async function pollMistralStructuredBatch(batchId:string,label:string):Promise<{status:StructuredBatchStatus;result:any|null;error:string|null}>{const apiKey=process.env.MISTRAL_API_KEY;if(!apiKey)throw new Error("MISTRAL_API_KEY is not configured");const response=await tracedMistralFetch(`${BATCH_ENDPOINT}/${encodeURIComponent(batchId)}?inline=true`,{headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(60000)},null,{operation:"batch_structured_poll",batch_id:batchId,label});const raw=await tracedMistralJson(response).catch(()=>({}));if(!response.ok)throw providerResponseError(response,`Mistral Batch ${label} status`,true);recordBatchTiming(raw,batchId,label);const status=String(raw.status||"").toUpperCase() as StructuredBatchStatus;if(status==="QUEUED"||status==="RUNNING"||status==="CANCELLATION_REQUESTED")return{status,result:null,error:null};if(status!=="SUCCESS")return{status,result:null,error:batchError(raw,label)};let records:unknown[]=Array.isArray(raw.outputs)?raw.outputs:[];if(!records.length&&typeof raw.output_file==="string"&&raw.output_file){const output=await tracedMistralFetch(`${FILES_ENDPOINT}/${encodeURIComponent(raw.output_file)}/content`,{headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(90000)},null,{operation:"batch_structured_result_download"});if(!output.ok)throw new Error(`Mistral Batch ${label} result download failed (${output.status})`);records=parseJsonLines(await tracedMistralText(output));}const body=batchResponseBody(records[0],label);await recordProviderUsage({raw:body,status:200,operation:`batch_${label}`,batchId}).catch(()=>console.error("mistral_usage_record_failed"));const content=body?.choices?.[0]?.message?.content;const result=typeof content==="string"?traceInvoiceSync("parse",Buffer.byteLength(content),{operation:"batch_structured_content"},()=>JSON.parse(content)):content;if(!result||typeof result!=="object")throw new Error(`Mistral Batch ${label} returned no structured content`);return{status,result:{...result,_provider:{model:body?.model,usage:body?.usage??null,estimatedCostMicros:estimateChatCost(String(body?.model),body?.usage,true)}},error:null};}
function structuredRequestBody(args:StructuredRequest){return{model:args.model,temperature:0,messages:[{role:"user",content:args.prompt}],response_format:{type:"json_schema",json_schema:{name:args.name,strict:true,schema:args.schema}}};}
async function mistralStructured(args: StructuredRequest) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const requestBody = JSON.stringify(structuredRequestBody(args));

  const deadline = Date.now() + 150_000;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { response, raw: body } = await measureInvoiceStage("bulk_structured_request", { model: args.model, operation: args.name, attempt, requestBytes: Buffer.byteLength(requestBody) }, () => mistralJsonRequest(CHAT_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: requestBody,
      signal: providerAttemptSignal(deadline, 90_000),
    }, Buffer.byteLength(args.prompt), { operation: args.name, model: args.model, attempt }));
    if (response.ok) {
      const content = body?.choices?.[0]?.message?.content;
      const parsed = typeof content === "string" ? traceInvoiceSync("parse", Buffer.byteLength(content), { operation: args.name }, () => JSON.parse(content)) : content;
      if (parsed && typeof parsed === "object") return { ...parsed, _provider: { model: String(body.model || args.model), usage: body.usage ?? null, estimatedCostMicros: estimateChatCost(String(body.model || args.model), body.usage) } };
      throw new Error("Mistral returned no structured content");
    }

    const retryable = response.status === 429 && args.retryRateLimit !== false;
    if (!retryable || attempt === 2) {
      throw providerResponseError(response, "Mistral structured extraction", attempt === 2);
    }

    const delayMs = retryDelayMs(response.headers.get("Retry-After"), attempt);
    console.warn(`[bulk-invoices] Mistral request returned ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/2)`);
    await providerRetryDelay(delayMs, deadline, response.status);
  }

  throw new Error("Mistral structured extraction failed after retries");
}

function retryDelayMs(retryAfter: string | null, attempt: number) {
  const fallbackMs = 2000;
  if (!retryAfter) return fallbackMs;

  const seconds = Number(retryAfter);
  const parsedMs = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();
  if (!Number.isFinite(parsedMs) || parsedMs <= 0) return fallbackMs;
  return Math.ceil(parsedMs);
}

function providerAttemptSignal(deadline: number, requestedMs: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Mistral operation exceeded its retry time budget");
  const timeout = Number.isFinite(requestedMs) && requestedMs > 0 ? requestedMs : 90_000;
  return AbortSignal.timeout(Math.max(1, Math.floor(Math.min(remaining, timeout))));
}

function recordBatchTiming(raw: any, batchId: string, operation: string) {
  const created = Number(raw.created_at), started = Number(raw.started_at), completed = Number(raw.completed_at);
  if (!Number.isFinite(created) || created <= 0) return;
  console.info("invoice_stage_timing", {
    stage: "provider_batch_wait", batchId, operation, status: String(raw.status),
    queueWaitMs: started > 0 ? Math.max(0, (started - created) * 1000) : Math.max(0, Date.now() - created * 1000),
    providerProcessingMs: started > 0 && completed > 0 ? Math.max(0, (completed - started) * 1000) : null,
  });
}

async function providerRetryDelay(delayMs: number, deadline: number, status: number) {
  // Never start a retry that cannot fit within the worker's HTTP timeout.
  // Long Retry-After values yield to durable recovery rather than retry early.
  if (Date.now() + delayMs + 1000 >= deadline) {
    throw new ProviderRequestError(`Mistral request failed (${status}); Retry-After exceeds the operation deadline`, status, "rejected", delayMs, true);
  }
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function pageOcrText(page: Record<string, any>) {
  const markdown = typeof page.markdown === "string" ? page.markdown : "";
  const tables = Array.isArray(page.tables)
    ? page.tables.map((table: Record<string, any>) =>
        String(table.html ?? table.content ?? table.markdown ?? table.text ?? "")
      ).filter(Boolean)
    : [];
  return [markdown, ...tables].filter(Boolean).join("\n\n");
}

function pageConfidence(page: Record<string, any>) {
  const scores = page.confidence_scores;
  const value = scores?.average_page_confidence_score ?? scores?.averagePageConfidenceScore ?? null;
  const n = value == null ? null : Number(value);
  return n != null && Number.isFinite(n) ? clamp01(n) : null;
}

function clamp01(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function providerError(raw: any) {
  return String(raw?.message || raw?.detail || raw?.error?.message || JSON.stringify(raw)).slice(0, 500);
}

function parseJsonLines(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        throw new Error("Mistral Batch OCR returned an invalid JSONL result");
      }
    });
}

function batchResponseBody(record: unknown, label="OCR"): any {
  if (!record || typeof record !== "object") return null;
  const value = record as Record<string, any>;
  const response = value.response;
  const statusCode = Number(response?.status_code ?? response?.statusCode ?? 200);
  if (Number.isFinite(statusCode) && statusCode >= 400) {
    throw new Error(`Mistral Batch ${label} request failed (${statusCode}): ${providerError(response?.body ?? response)}`);
  }
  return response?.body ?? value.body ?? value;
}

function batchError(raw: any, label="OCR") {
  const errors = Array.isArray(raw?.errors)
    ? raw.errors.map((item: unknown) => providerError(item)).filter(Boolean).join("; ")
    : "";
  return (errors || `Mistral Batch ${label} ended with status ${String(raw?.status || "unknown")}`).slice(0, 1000);
}


export function mapOcrPages(responsePages: Array<Record<string, any>>, startPage: number, count: number) {
  if (responsePages.length !== count) throw new ProviderRequestError("Mistral returned incomplete page coverage; review before retrying",200,"unknown",0,true);
  const pages = responsePages.map((page, i) => ({
    pageNumber: Number.isInteger(page.index) ? Number(page.index) : startPage + i,
    markdown: pageOcrText(page), confidence: pageConfidence(page),
  }));
  if (new Set(pages.map(page => page.pageNumber)).size !== count || pages.some(page => page.pageNumber < startPage || page.pageNumber >= startPage + count)) {
    throw new ProviderRequestError("Mistral returned invalid page indices; review before retrying",200,"unknown",0,true);
  }
  return pages.sort((a,b) => a.pageNumber-b.pageNumber);
}
