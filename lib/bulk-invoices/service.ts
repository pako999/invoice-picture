import { neon } from "@neondatabase/serverless";
import { invoiceJsonSchema, normalizedInvoiceSchema, type NormalizedInvoice } from "@/lib/invoice-intelligence/types";
import { normalizeInvoiceValues, validateInvoice } from "@/lib/invoice-intelligence/validation";
import { reserveOcrProviderBudget } from "@/lib/invoice-intelligence/safety";

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
  const endPage = Math.min(args.pageCount - 1, args.startPage + args.batchPages - 1);
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
    markdown: p.markdown.slice(0, 9000),
  }));
  const previous = args.previousPage
    ? { pageNumber: args.previousPage.pageNumber, markdown: args.previousPage.markdown.slice(-3500) }
    : null;

  const raw = await mistralStructured({
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

export async function extractBulkInvoice(markdown: string, ocrConfidence: number | null): Promise<{
  invoice: NormalizedInvoice;
  validation: ReturnType<typeof validateInvoice>;
  raw: unknown;
}> {
  const raw = await mistralStructured({
    model: process.env.MISTRAL_BULK_EXTRACT_MODEL || "mistral-small-latest",
    name: "normalized_invoice",
    schema: invoiceJsonSchema,
    prompt: [
      "Extract one accounting document from the OCR markdown below.",
      "The page group has already been split and should represent exactly one invoice, credit note, receipt, proforma or quotation.",
      "Never invent missing values. Return null when genuinely absent.",
      "Normalize dates to YYYY-MM-DD, currency to ISO 4217 and monetary values to decimal strings without currency symbols.",
      "Supplier is the issuer/seller; buyer is the recipient/customer.",
      "Preserve line items, discounts, VAT breakdown, totals, IBAN, BIC, payment reference and terms when visible.",
      "Set validationStatus to pending. Deterministic validation runs after extraction.",
      `OCR page confidence available to the system: ${ocrConfidence == null ? "unknown" : ocrConfidence.toFixed(4)}.`,
      "OCR markdown:",
      markdown.slice(0, 120_000),
    ].join("\n"),
  });
  const invoice = normalizeInvoiceValues(normalizedInvoiceSchema.parse(raw));
  if (ocrConfidence != null) invoice.confidence.overall = Math.min(invoice.confidence.overall ?? 1, ocrConfidence);
  const validation = validateInvoice(invoice);
  invoice.validationStatus = validation.status === "failed" ? "needs_review" : validation.status;
  return { invoice, validation, raw };
}

async function mistralStructured(args: { model: string; name: string; schema: unknown; prompt: string }) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.model,
      temperature: 0,
      messages: [{ role: "user", content: args.prompt }],
      response_format: { type: "json_schema", json_schema: { name: args.name, strict: true, schema: args.schema } },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Mistral structured extraction failed (${response.status}): ${providerError(body)}`);
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content === "string") return JSON.parse(content);
  if (content && typeof content === "object") return content;
  throw new Error("Mistral returned no structured content");
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
