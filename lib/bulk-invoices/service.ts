import { neon } from "@neondatabase/serverless";
import { invoiceJsonSchema, normalizedInvoiceSchema, type NormalizedInvoice } from "@/lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "@/lib/invoice-intelligence/validation";
import { reserveOcrProviderBudget } from "@/lib/invoice-intelligence/safety";
import { getOcrUsageSummary, quotaPageError } from "@/lib/invoice-intelligence/quota";
import { reconcileMistralInvoiceWithOcrText } from "@/lib/invoice-intelligence/providers";

const OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";
const CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

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

  const pagesThisBatch = Math.min(args.batchPages, availablePages, args.pageCount - args.startPage);
  const endPage = Math.min(args.pageCount - 1, args.startPage + pagesThisBatch - 1);
  const pages = Array.from({ length: endPage - args.startPage + 1 }, (_, i) => args.startPage + i);
  await reserveOcrProviderBudget({ clerkUserId: args.clerkUserId, provider: "mistral", pages: pages.length });

  const response = await fetch(OCR_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest",
      document: { type: "document_url", document_url: args.documentUrl },
      pages,
      include_blocks: false,
      confidence_scores_granularity: "page",
      table_format: "markdown",
    }),
    signal: AbortSignal.timeout(Math.max(90_000, Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000))),
  });
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Mistral bulk OCR failed (${response.status}): ${providerError(raw)}`);

  const responsePages = Array.isArray(raw.pages) ? raw.pages : [];
  return {
    pages: responsePages.map((page: Record<string, any>, i: number) => ({
      pageNumber: Number.isInteger(page.index) ? Number(page.index) : args.startPage + i,
      markdown: typeof page.markdown === "string" ? page.markdown : "",
      confidence: pageConfidence(page),
    })),
    model: String(raw.model || process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest"),
    nextPage: endPage + 1,
    done: endPage + 1 >= args.pageCount,
  };
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

export async function classifyBulkPages(args: {
  pages: Array<{ pageNumber: number; markdown: string }>;
  previousPage?: { pageNumber: number; markdown: string } | null;
}): Promise<BulkPageClassification[]> {
  const input = args.pages.map((p) => ({
    pageNumber: p.pageNumber,
    markdown: p.markdown.slice(0, 5000),
  }));
  const previous = args.previousPage
    ? { pageNumber: args.previousPage.pageNumber, markdown: args.previousPage.markdown.slice(-3500) }
    : null;

  let raw: any;
  try {
    raw = await mistralStructured({
      model: process.env.MISTRAL_BULK_CLASSIFIER_MODEL || "mistral-small-latest",
      name: "invoice_page_boundaries",
      schema: classificationSchema,
      prompt: [
        "You split a scanned PDF containing multiple accounting documents into invoice groups.",
        "For EACH supplied page decide whether that page starts a new invoice/document or continues the previous page.",
        "Invoices can have multiple pages. Never assume one page equals one invoice.",
        "A new invoice is likely when invoice number, supplier/issuer, title (Invoice/Račun/Rechnung/Fattura/Credit note/Proforma) or document identity clearly changes.",
        "Continuation pages often repeat headers, carry line items, totals, terms or attachments belonging to the same invoice.",
        "If uncertain, prefer continuation and lower confidence rather than creating a false split.",
        "Page numbers are zero-based and MUST match the supplied pageNumber values.",
        "Page 0 of the complete document must start a new invoice.",
        previous ? `Previous context before this batch: ${JSON.stringify(previous)}` : "There is no previous page before this batch.",
        `Pages to classify: ${JSON.stringify(input)}`,
      ].join("\n"),
    });
  } catch (error) {
    console.warn(`[bulk-invoices] Mistral classification unavailable; using deterministic boundaries: ${error instanceof Error ? error.message : String(error)}`);
    return classifyBulkPagesDeterministically(args);
  }
  const rows = Array.isArray(raw.pages) ? raw.pages : [];
  return rows.map((row: Record<string, any>) => ({
    pageNumber: Number(row.pageNumber),
    startsNewInvoice: Boolean(row.startsNewInvoice),
    continuationOfPrevious: Boolean(row.continuationOfPrevious),
    invoiceNumber: row.invoiceNumber == null ? null : String(row.invoiceNumber),
    supplierName: row.supplierName == null ? null : String(row.supplierName),
    confidence: clamp01(Number(row.confidence)),
    reason: String(row.reason || ""),
  }));
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

export async function extractBulkInvoice(markdown: string, ocrConfidence: number | null): Promise<{
  invoice: NormalizedInvoice;
  validation: ReturnType<typeof validateInvoice>;
  raw: unknown;
  provider: "mistral" | "deterministic";
  model: string;
}> {
  const model = process.env.MISTRAL_BULK_EXTRACT_MODEL || "mistral-small-latest";
  try {
    const raw = await mistralStructured({
      model,
      name: "normalized_invoice",
      schema: invoiceJsonSchema,
      prompt: [
        "Extract one accounting document from the OCR markdown below.",
        "The page group has already been split and should represent exactly one invoice, credit note, receipt, proforma or quotation.",
        "Never invent missing values. Return null when genuinely absent.",
        "Ignore OCR page separators such as --- PAGE 1 ---; they are never supplier names or invoice data.",
        "Read invoiceNumber only from a labelled invoice-number field, never from a logo, brand name or supplier name.",
        "Read VAT/tax IDs only from explicitly labelled tax-ID fields; never derive them from city names or ordinary words.",
        "Dates may use numeric or written English month formats. Extract all labelled issue and due dates.",
        "Normalize dates to YYYY-MM-DD, currency to ISO 4217 and monetary values to decimal strings without currency symbols.",
        "Supplier is the issuer/seller; buyer is the recipient/customer.",
        "Preserve line items, discounts, VAT breakdown, totals, IBAN, BIC, payment reference and terms when visible.",
        "Set validationStatus to pending. Deterministic validation runs after extraction.",
        `OCR page confidence available to the system: ${ocrConfidence == null ? "unknown" : ocrConfidence.toFixed(4)}.`,
        "OCR markdown:",
        markdown.slice(0, 120_000),
      ].join("\n"),
    });
    const invoice = normalizeInvoiceValues(reconcileMistralInvoiceWithOcrText(normalizedInvoiceSchema.parse(raw), markdown));
    if (ocrConfidence != null) invoice.confidence.overall = Math.min(invoice.confidence.overall ?? 1, ocrConfidence);
    const validation = validateInvoice(invoice);
    invoice.validationStatus = validation.status === "failed" ? "needs_review" : validation.status;
    return { invoice, validation, raw, provider: "mistral", model };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[bulk-invoices] Mistral structured extraction is temporarily unavailable; invoice remains queued. ${message}`);
    throw new Error(`Mistral OCR extraction is required and will be retried: ${message}`);
  }
}

export async function extractBulkInvoiceFromDocument(documentUrl: string, ocrConfidence: number | null): Promise<{
  invoice: NormalizedInvoice;
  validation: ReturnType<typeof validateInvoice>;
  raw: unknown;
  provider: "mistral";
  model: string;
}> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const parsedUrl = new URL(documentUrl);
  if (parsedUrl.protocol !== "https:") throw new Error("Bulk OCR document URL must use HTTPS");
  const model = process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest";
  const requestBody = JSON.stringify({
    model,
    document: { type: "document_url", document_url: documentUrl },
    include_blocks: true,
    confidence_scores_granularity: "block",
    table_format: "html",
    document_annotation_prompt: [
      "Extract exactly one accounting document from this PDF using OCR and return the complete structured invoice.",
      "Never invent missing values. Supplier is the issuer/seller and buyer is the recipient/customer.",
      "Read invoiceNumber only from a labelled invoice-number field, never from a logo or brand.",
      "Extract all labelled issue, service and due dates, including written English month formats, and normalize them to YYYY-MM-DD.",
      "Extract every line item/product row with description, code when present, quantity, unit, unit price, discount, VAT rate and amounts.",
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

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(OCR_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: requestBody,
      signal: AbortSignal.timeout(180_000),
    });
    const raw = await response.json().catch(() => ({}));
    if (response.ok) {
      const annotationRaw = raw.document_annotation;
      const annotation = typeof annotationRaw === "string" ? JSON.parse(annotationRaw) : annotationRaw;
      const pages = Array.isArray(raw.pages) ? raw.pages : [];
      const markdown = pages.map((page: Record<string, unknown>) => typeof page.markdown === "string" ? page.markdown : "").join("\n\n");
      const invoice = normalizeInvoiceValues(reconcileMistralInvoiceWithOcrText(normalizedInvoiceSchema.parse(annotation), markdown));
      if (ocrConfidence != null) invoice.confidence.overall = Math.min(invoice.confidence.overall ?? 1, ocrConfidence);
      const validation = validateInvoice(invoice);
      invoice.validationStatus = validation.status === "failed" ? "needs_review" : validation.status;
      return { invoice, validation, raw, provider: "mistral", model: String(raw.model || model) };
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Mistral OCR annotation failed (${response.status}): ${providerError(raw)}`);
    }
    if (attempt === 3) throw new Error(`Mistral OCR annotation failed (${response.status}): ${providerError(raw)}`);
    const delayMs = retryDelayMs(response.headers.get("Retry-After"), attempt);
    console.warn(`[bulk-invoices] Mistral OCR annotation returned ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/3)`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("Mistral OCR annotation failed after retries");
}

async function mistralStructured(args: { model: string; name: string; schema: unknown; prompt: string; retryRateLimit?: boolean }) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const requestBody = JSON.stringify({
    model: args.model,
    temperature: 0,
    messages: [{ role: "user", content: args.prompt }],
    response_format: { type: "json_schema", json_schema: { name: args.name, strict: true, schema: args.schema } },
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: requestBody,
      signal: AbortSignal.timeout(90_000),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      const content = body?.choices?.[0]?.message?.content;
      if (typeof content === "string") return JSON.parse(content);
      if (content && typeof content === "object") return content;
      throw new Error("Mistral returned no structured content");
    }

    const retryable = (response.status === 429 && args.retryRateLimit !== false) || response.status >= 500;
    if (!retryable || attempt === 3) {
      throw new Error(`Mistral structured extraction failed (${response.status}): ${providerError(body)}`);
    }

    const delayMs = retryDelayMs(response.headers.get("Retry-After"), attempt);
    console.warn(`[bulk-invoices] Mistral request returned ${response.status}; retrying in ${delayMs}ms (attempt ${attempt + 1}/3)`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Mistral structured extraction failed after retries");
}

function retryDelayMs(retryAfter: string | null, attempt: number) {
  const fallbackMs = attempt === 1 ? 10_000 : 30_000;
  if (!retryAfter) return fallbackMs;

  const seconds = Number(retryAfter);
  const parsedMs = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();
  if (!Number.isFinite(parsedMs) || parsedMs <= 0) return fallbackMs;
  return Math.min(60_000, Math.ceil(parsedMs));
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
