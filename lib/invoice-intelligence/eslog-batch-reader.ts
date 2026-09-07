import { invoiceJsonSchema, normalizedInvoiceSchema, type NormalizedInvoice } from "./types";
import { normalizeInvoiceValues } from "./validation";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/ocr";

export type BatchDetectedInvoice = {
  startPage: number;
  endPage: number;
  continuesPrevious: boolean;
  invoice: NormalizedInvoice;
};

export async function readInvoiceBatchChunk(input: {
  base64: string;
  mimeType: string;
  filename: string;
  pages: number[];
}): Promise<{ invoices: BatchDetectedInvoice[]; pagesProcessed: number; costMicros: number; raw: unknown }> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const model = process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest";
  const dataUrl = `data:${input.mimeType};base64,${input.base64}`;
  const isImage = input.mimeType.startsWith("image/");
  const document = isImage
    ? { type: "image_url", image_url: dataUrl }
    : { type: "document_url", document_url: dataUrl };

  const response = await fetch(MISTRAL_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      document,
      ...(!isImage ? { pages: input.pages } : {}),
      include_blocks: true,
      confidence_scores_granularity: "block",
      table_format: "html",
      document_annotation_prompt: [
        "The selected pages may contain one invoice, multiple invoices, or continuation pages.",
        "Identify every distinct invoice and keep all pages belonging to the same multi-page invoice together.",
        "Never merge invoices with different invoice numbers, suppliers, dates or totals.",
        "If the first selected page clearly continues an invoice that began before this chunk, set continuesPrevious=true.",
        `Page indices in your answer are RELATIVE to this selected chunk: 0..${Math.max(0, input.pages.length - 1)}.`,
        "Extract each invoice only from document evidence. Return null for unreadable fields; never invent values.",
        "Normalize dates to YYYY-MM-DD, currency to ISO 4217, country to ISO alpha-2, money to decimal strings.",
        "Supplier is the issuer/seller; buyer is the recipient/customer. Preserve credit-note signs.",
        "Set validationStatus=pending. Deterministic financial validation runs afterwards.",
      ].join(" "),
      document_annotation_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_batch",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["invoices"],
            properties: {
              invoices: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["startPage", "endPage", "continuesPrevious", "invoice"],
                  properties: {
                    startPage: { type: "integer", minimum: 0 },
                    endPage: { type: "integer", minimum: 0 },
                    continuesPrevious: { type: "boolean" },
                    invoice: invoiceJsonSchema,
                  },
                },
              },
            },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000)),
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Mistral batch OCR failed (${response.status}): ${safeError(raw)}`);
  const annotationRaw = (raw as Record<string, unknown>).document_annotation;
  const annotation = typeof annotationRaw === "string" ? JSON.parse(annotationRaw) : annotationRaw;
  const rows = Array.isArray((annotation as any)?.invoices) ? (annotation as any).invoices : [];
  const maxRelative = Math.max(0, input.pages.length - 1);
  const invoices: BatchDetectedInvoice[] = rows.map((row: any) => {
    const relStart = clampInt(row.startPage, 0, maxRelative);
    const relEnd = clampInt(row.endPage, relStart, maxRelative);
    const invoice = normalizeInvoiceValues(normalizedInvoiceSchema.parse(row.invoice));
    return {
      startPage: input.pages[relStart] ?? input.pages[0] ?? 0,
      endPage: input.pages[relEnd] ?? input.pages[input.pages.length - 1] ?? 0,
      continuesPrevious: Boolean(row.continuesPrevious),
      invoice,
    };
  });

  const responsePages = Array.isArray((raw as any).pages) ? (raw as any).pages : [];
  const pagesProcessed = Number((raw as any).usage_info?.pages_processed ?? responsePages.length ?? input.pages.length || 1);
  const perPage = Number(process.env.MISTRAL_ANNOTATED_PAGE_COST_MICROS ?? 5000);
  return {
    invoices,
    pagesProcessed: Number.isFinite(pagesProcessed) && pagesProcessed > 0 ? pagesProcessed : Math.max(1, input.pages.length),
    costMicros: (Number.isFinite(perPage) ? perPage : 5000) * (Number.isFinite(pagesProcessed) && pagesProcessed > 0 ? pagesProcessed : Math.max(1, input.pages.length)),
    raw,
  };
}

export function mergeDetectedInvoices(existing: BatchDetectedInvoice[], incoming: BatchDetectedInvoice[]) {
  if (!existing.length) return incoming;
  const out = existing.map((x) => ({ ...x, invoice: structuredClone(x.invoice) }));
  for (const item of incoming) {
    const last = out[out.length - 1];
    if (last && (item.continuesPrevious || overlapsSameInvoice(last, item))) {
      last.endPage = Math.max(last.endPage, item.endPage);
      last.invoice = mergeInvoice(last.invoice, item.invoice);
      continue;
    }
    const duplicate = out.find((x) => strongSameInvoice(x.invoice, item.invoice));
    if (duplicate) {
      duplicate.startPage = Math.min(duplicate.startPage, item.startPage);
      duplicate.endPage = Math.max(duplicate.endPage, item.endPage);
      duplicate.invoice = mergeInvoice(duplicate.invoice, item.invoice);
    } else {
      out.push(item);
    }
  }
  return out;
}

function overlapsSameInvoice(a: BatchDetectedInvoice, b: BatchDetectedInvoice) {
  return b.startPage <= a.endPage && strongSameInvoice(a.invoice, b.invoice);
}

function strongSameInvoice(a: NormalizedInvoice, b: NormalizedInvoice) {
  const an = key(a.invoiceNumber); const bn = key(b.invoiceNumber);
  if (an && bn) return an === bn && compatibleSupplier(a, b);
  const av = key(a.supplier.vatNumber); const bv = key(b.supplier.vatNumber);
  const ad = key(a.issueDate); const bd = key(b.issueDate);
  const ag = moneyKey(a.totals.grossAmount); const bg = moneyKey(b.totals.grossAmount);
  return Boolean(av && bv && av === bv && ad && bd && ad === bd && ag && bg && ag === bg);
}

function compatibleSupplier(a: NormalizedInvoice, b: NormalizedInvoice) {
  const av = key(a.supplier.vatNumber); const bv = key(b.supplier.vatNumber);
  if (av && bv) return av === bv;
  const an = key(a.supplier.name); const bn = key(b.supplier.name);
  return !an || !bn || an === bn;
}

function mergeInvoice(a: NormalizedInvoice, b: NormalizedInvoice): NormalizedInvoice {
  const result = structuredClone(a);
  const prefer = (left: string | null, right: string | null) => right || left;
  result.documentType = b.documentType !== "unknown" ? b.documentType : a.documentType;
  result.documentLanguage = prefer(a.documentLanguage, b.documentLanguage);
  for (const k of Object.keys(result.supplier) as Array<keyof typeof result.supplier>) (result.supplier as any)[k] = prefer((a.supplier as any)[k], (b.supplier as any)[k]);
  for (const k of Object.keys(result.buyer) as Array<keyof typeof result.buyer>) (result.buyer as any)[k] = prefer((a.buyer as any)[k], (b.buyer as any)[k]);
  for (const k of ["invoiceNumber", "purchaseOrderNumber", "issueDate", "serviceDate", "dueDate", "paymentReference", "paymentTerms", "currency"] as const) result[k] = prefer(a[k], b[k]);
  for (const k of Object.keys(result.totals) as Array<keyof typeof result.totals>) (result.totals as any)[k] = prefer((a.totals as any)[k], (b.totals as any)[k]);
  result.lineItems = dedupe([...a.lineItems, ...b.lineItems], (x) => `${key(x.description)}|${moneyKey(x.netAmount)}|${moneyKey(x.grossAmount)}`);
  result.vatBreakdown = dedupe([...a.vatBreakdown, ...b.vatBreakdown], (x) => `${moneyKey(x.vatRate)}|${moneyKey(x.taxableAmount)}|${moneyKey(x.vatAmount)}`);
  const conf = [a.confidence.overall, b.confidence.overall].filter((x): x is number => typeof x === "number");
  result.confidence.overall = conf.length ? Math.min(...conf) : null;
  result.confidence.fields = { ...a.confidence.fields, ...b.confidence.fields };
  result.warnings = [...new Set([...a.warnings, ...b.warnings])];
  result.validationStatus = "pending";
  return normalizeInvoiceValues(result);
}

function dedupe<T>(rows: T[], f: (row: T) => string) { const seen = new Set<string>(); return rows.filter((r) => { const k = f(r); if (seen.has(k)) return false; seen.add(k); return true; }); }
function key(v: string | null) { return v?.trim().toLowerCase().replace(/\s+/g, "") || ""; }
function moneyKey(v: string | null) { if (!v) return ""; const n = Number(v.replace(",", ".")); return Number.isFinite(n) ? n.toFixed(2) : key(v); }
function clampInt(v: unknown, min: number, max: number) { const n = Number.isInteger(v) ? Number(v) : min; return Math.max(min, Math.min(max, n)); }
function safeError(raw: unknown) { try { return JSON.stringify(raw).slice(0, 1000); } catch { return "unknown error"; } }
