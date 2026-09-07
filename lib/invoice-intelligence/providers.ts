import {
  emptyInvoice,
  invoiceJsonSchema,
  normalizedInvoiceSchema,
  type FieldEvidence,
  type NormalizedInvoice,
  type ReaderResult,
} from "./types";
import { normalizeInvoiceValues } from "./validation";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/ocr";
const AZURE_API_VERSION = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION ?? "2024-11-30";

export async function readDeterministically(input: { base64: string; mimeType: string; filename: string }): Promise<ReaderResult | null> {
  const bytes = Buffer.from(input.base64, "base64");
  const text = bytes.toString("utf8");
  const looksXml = /xml/i.test(input.mimeType) || /\.xml$/i.test(input.filename) || /^\s*<\?xml|^\s*<(Invoice|CreditNote|eSlog)/i.test(text);

  if (looksXml) {
    const invoice = parseStructuredXml(text);
    if (!invoice) return null;
    return {
      provider: "deterministic",
      model: "xml-parser-v1",
      invoice: normalizeInvoiceValues(invoice),
      rawText: stripXml(text),
      rawResponse: { source: "structured_xml", filename: input.filename },
      evidence: [],
      pagesProcessed: 1,
      costMicros: 0,
    };
  }

  if (input.mimeType === "application/pdf" || /\.pdf$/i.test(input.filename)) {
    const pdfText = extractSimplePdfText(bytes);
    if (pdfText.length >= 250 && /(invoice|račun|racun|rechnung|fattura|račun broj|ddv|vat)/i.test(pdfText)) {
      const invoice = parseTextLayer(pdfText);
      if (criticalCount(invoice) >= 5) {
        return {
          provider: "deterministic",
          model: "pdf-text-layer-v1",
          invoice: normalizeInvoiceValues(invoice),
          rawText: pdfText,
          rawResponse: { source: "pdf_text_layer", filename: input.filename },
          evidence: [],
          pagesProcessed: estimatePdfPages(bytes),
          costMicros: 0,
        };
      }
    }
  }

  return null;
}

export async function readWithMistral(input: { base64: string; mimeType: string; filename: string }): Promise<ReaderResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");
  const model = process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest";
  const dataUrl = `data:${input.mimeType};base64,${input.base64}`;
  const document = input.mimeType.startsWith("image/")
    ? { type: "image_url", image_url: dataUrl }
    : { type: "document_url", document_url: dataUrl };

  const response = await fetch(MISTRAL_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      document,
      include_blocks: true,
      confidence_scores_granularity: "block",
      table_format: "html",
      document_annotation_prompt: [
        "Extract invoice data only from document evidence.",
        "Return null for missing or unreadable values. Never invent values.",
        "Normalize dates to YYYY-MM-DD, currencies to ISO 4217, countries to ISO alpha-2.",
        "Return monetary values as decimal strings without currency symbols and keep credit-note signs correct.",
        "Supplier means the issuer/seller; buyer means the customer/recipient.",
        "Set validationStatus to pending; deterministic validation runs after extraction.",
      ].join(" "),
      document_annotation_format: {
        type: "json_schema",
        json_schema: { name: "normalized_invoice", strict: true, schema: invoiceJsonSchema },
      },
    }),
    signal: AbortSignal.timeout(Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000)),
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Mistral OCR failed (${response.status}): ${safeError(raw)}`);
  const annotationRaw = raw.document_annotation;
  const annotation = typeof annotationRaw === "string" ? JSON.parse(annotationRaw) : annotationRaw;
  const invoice = normalizeInvoiceValues(normalizedInvoiceSchema.parse(annotation));
  const pages = Array.isArray(raw.pages) ? raw.pages : [];
  const rawText = pages.map((p: Record<string, unknown>) => typeof p.markdown === "string" ? p.markdown : "").join("\n\n");
  const evidence = buildEvidence(invoice, pages);
  const pageCount = Number(raw.usage_info?.pages_processed ?? pages.length ?? 1);
  const costPerAnnotatedPageMicros = Number(process.env.MISTRAL_ANNOTATED_PAGE_COST_MICROS ?? 5000);

  return {
    provider: "mistral",
    model: String(raw.model || model),
    invoice,
    rawText,
    rawResponse: raw,
    evidence,
    pagesProcessed: pageCount,
    costMicros: Number.isFinite(costPerAnnotatedPageMicros) ? pageCount * costPerAnnotatedPageMicros : null,
  };
}

export async function readWithAzure(input: { base64: string; mimeType: string; filename: string }): Promise<ReaderResult> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "");
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key) throw new Error("Azure Document Intelligence is not configured");
  const model = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-invoice";
  const url = `${endpoint}/documentintelligence/documentModels/${encodeURIComponent(model)}:analyze?api-version=${encodeURIComponent(AZURE_API_VERSION)}`;
  const start = await fetch(url, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ base64Source: input.base64 }),
    signal: AbortSignal.timeout(Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000)),
  });
  if (!start.ok) throw new Error(`Azure analyze failed (${start.status}): ${await start.text()}`);
  const operation = start.headers.get("operation-location");
  if (!operation) throw new Error("Azure did not return operation-location");

  const deadline = Date.now() + Number(process.env.INVOICE_OCR_TIMEOUT_MS ?? 90_000);
  let raw: Record<string, any> = {};
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await fetch(operation, { headers: { "Ocp-Apim-Subscription-Key": key }, signal: AbortSignal.timeout(15_000) });
    raw = await poll.json();
    if (!poll.ok) throw new Error(`Azure poll failed (${poll.status})`);
    if (raw.status === "succeeded") break;
    if (raw.status === "failed") throw new Error(`Azure processing failed: ${safeError(raw)}`);
  }
  if (raw.status !== "succeeded") throw new Error("Azure processing timed out");

  const document = raw.analyzeResult?.documents?.[0] ?? {};
  const fields = document.fields ?? {};
  const invoice = normalizeInvoiceValues(mapAzureInvoice(fields));
  const evidence = azureEvidence(fields);
  const pagesProcessed = Number(raw.analyzeResult?.pages?.length ?? 1);
  const azurePageCostMicros = Number(process.env.AZURE_PAGE_COST_MICROS ?? 0);

  return {
    provider: "azure",
    model,
    invoice,
    rawText: String(raw.analyzeResult?.content ?? ""),
    rawResponse: raw,
    evidence,
    pagesProcessed,
    costMicros: azurePageCostMicros > 0 ? pagesProcessed * azurePageCostMicros : null,
  };
}

export function azureConfigured() {
  return Boolean(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
}

function parseStructuredXml(xml: string): NormalizedInvoice | null {
  if (!/<(Invoice|CreditNote|eSlog|Racun|Račun)(\s|>)/i.test(xml)) return null;
  const invoice = emptyInvoice();
  invoice.documentType = /<CreditNote(\s|>)/i.test(xml) ? "credit_note" : "invoice";
  invoice.invoiceNumber = firstTag(xml, ["ID", "InvoiceNumber", "StevilkaRacuna", "ŠtevilkaRačuna"]);
  invoice.issueDate = firstTag(xml, ["IssueDate", "DatumIzdaje"]);
  invoice.dueDate = firstTag(xml, ["DueDate", "DatumZapadlosti"]);
  invoice.currency = firstTag(xml, ["DocumentCurrencyCode", "Currency", "Valuta"]);
  invoice.supplier.name = firstNested(xml, ["AccountingSupplierParty", "SellerSupplierParty", "Dobavitelj"], ["RegistrationName", "Name", "Naziv"]);
  invoice.supplier.vatNumber = firstNested(xml, ["AccountingSupplierParty", "SellerSupplierParty", "Dobavitelj"], ["CompanyID", "VATIdentifier", "DavcnaStevilka"]);
  invoice.buyer.name = firstNested(xml, ["AccountingCustomerParty", "BuyerCustomerParty", "Kupec"], ["RegistrationName", "Name", "Naziv"]);
  invoice.buyer.vatNumber = firstNested(xml, ["AccountingCustomerParty", "BuyerCustomerParty", "Kupec"], ["CompanyID", "VATIdentifier", "DavcnaStevilka"]);
  invoice.totals.netAmount = firstTag(xml, ["TaxExclusiveAmount", "LineExtensionAmount", "NetAmount"]);
  invoice.totals.vatAmount = firstNested(xml, ["TaxTotal", "Davki"], ["TaxAmount", "VATAmount"]);
  invoice.totals.grossAmount = firstTag(xml, ["TaxInclusiveAmount", "PayableAmount", "GrossAmount"]);
  invoice.totals.amountDue = firstTag(xml, ["PayableAmount", "AmountDue"]);
  invoice.supplier.iban = firstTag(xml, ["ID", "IBAN"]);
  invoice.confidence = { overall: 0.98, fields: {} };
  invoice.warnings.push("Structured XML parsed deterministically; verify unsupported local extensions if present.");
  invoice.validationStatus = "pending";
  return criticalCount(invoice) >= 4 ? invoice : null;
}

function parseTextLayer(text: string): NormalizedInvoice {
  const invoice = emptyInvoice();
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  invoice.documentType = /credit note|dobropis|gutschrift/i.test(text) ? "credit_note" : "invoice";
  invoice.invoiceNumber = match(text, /(?:invoice|račun|racun|rechnung|fattura)(?:\s*(?:no\.?|nr\.?|št\.?|st\.?|number))?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-_/]{2,})/i);
  invoice.issueDate = match(text, /(?:issue date|datum izdaje|datum računa|rechnungsdatum|data fattura)\s*[:]?\s*(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i);
  invoice.dueDate = match(text, /(?:due date|rok plačila|rok placila|fällig|scadenza)\s*[:]?\s*(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i);
  invoice.currency = match(text, /\b(EUR|USD|GBP|CHF|HRK|CZK|PLN|HUF|SEK|NOK|DKK|RON|BGN)\b/i)?.toUpperCase() ?? null;
  invoice.supplier.vatNumber = match(text, /\b((?:SI|HR|DE|ATU|IT|FR)[A-Z0-9]{7,13})\b/i)?.toUpperCase() ?? null;
  invoice.supplier.iban = match(text, /\b([A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30})\b/i)?.replace(/\s/g, "") ?? null;
  invoice.totals.grossAmount = match(text, /(?:total|skupaj|za plačilo|za placilo|gesamt|totale)[^\d\-]{0,20}(-?[\d.,]+)\s*(?:EUR|€)?/i);
  invoice.totals.vatAmount = match(text, /(?:VAT|DDV|MwSt|IVA)[^\d\-]{0,20}(-?[\d.,]+)/i);
  invoice.totals.netAmount = match(text, /(?:net total|osnova|neto|netto|imponibile)[^\d\-]{0,20}(-?[\d.,]+)/i);
  invoice.supplier.name = lines.find((line) => line.length >= 3 && line.length <= 100 && !/invoice|račun|racun|rechnung|fattura/i.test(line)) ?? null;
  invoice.confidence = { overall: 0.72, fields: {} };
  invoice.validationStatus = "pending";
  return invoice;
}

function mapAzureInvoice(fields: Record<string, any>): NormalizedInvoice {
  const invoice = emptyInvoice();
  const value = (name: string) => azureFieldValue(fields[name]);
  invoice.documentType = /credit/i.test(String(value("DocumentType") ?? "")) ? "credit_note" : "invoice";
  invoice.invoiceNumber = value("InvoiceId");
  invoice.purchaseOrderNumber = value("PurchaseOrder");
  invoice.issueDate = value("InvoiceDate");
  invoice.dueDate = value("DueDate");
  invoice.currency = azureCurrency(fields.InvoiceTotal) || azureCurrency(fields.AmountDue);
  invoice.supplier.name = value("VendorName");
  invoice.supplier.address = value("VendorAddress");
  invoice.supplier.vatNumber = value("VendorTaxId");
  invoice.buyer.name = value("CustomerName");
  invoice.buyer.address = value("CustomerAddress");
  invoice.buyer.vatNumber = value("CustomerTaxId");
  invoice.paymentTerms = value("PaymentTerm");
  invoice.totals.netAmount = azureMoney(fields.SubTotal);
  invoice.totals.vatAmount = azureMoney(fields.TotalTax);
  invoice.totals.grossAmount = azureMoney(fields.InvoiceTotal);
  invoice.totals.amountDue = azureMoney(fields.AmountDue);
  invoice.lineItems = Array.isArray(fields.Items?.valueArray)
    ? fields.Items.valueArray.map((entry: any) => {
        const p = entry?.valueObject ?? {};
        return {
          description: azureFieldValue(p.Description), quantity: azureFieldValue(p.Quantity), unit: azureFieldValue(p.Unit),
          unitPriceNet: azureMoney(p.UnitPrice), discountPercent: azureFieldValue(p.DiscountRate), discountAmount: azureMoney(p.Discount),
          vatRate: azureFieldValue(p.TaxRate), netAmount: azureMoney(p.Amount), vatAmount: azureMoney(p.Tax), grossAmount: null,
        };
      })
    : [];
  invoice.confidence.overall = typeof documentConfidence(fields) === "number" ? documentConfidence(fields) : null;
  invoice.validationStatus = "pending";
  return normalizedInvoiceSchema.parse(invoice);
}

function buildEvidence(invoice: NormalizedInvoice, pages: any[]): FieldEvidence[] {
  const flattened = flattenCritical(invoice);
  const evidence: FieldEvidence[] = [];
  for (const [fieldPath, rawValue] of Object.entries(flattened)) {
    if (!rawValue) continue;
    const needle = normalizeSearch(String(rawValue));
    let best: FieldEvidence | null = null;
    for (const page of pages) {
      for (const block of Array.isArray(page.blocks) ? page.blocks : []) {
        const content = String(block.content ?? block.text ?? "");
        if (!content || !normalizeSearch(content).includes(needle)) continue;
        const conf = block.confidence_score ?? block.confidence_scores?.block ?? block.confidence_scores?.confidence ?? null;
        const candidate: FieldEvidence = {
          fieldPath,
          valueText: String(rawValue),
          pageNumber: Number(page.index ?? 0) + 1,
          bbox: block.bbox ?? block.bounding_box ?? null,
          confidence: typeof conf === "number" ? conf : invoice.confidence.fields[fieldPath] ?? invoice.confidence.overall,
        };
        if (!best || (candidate.confidence ?? 0) > (best.confidence ?? 0)) best = candidate;
      }
    }
    if (best) evidence.push(best);
  }
  return evidence;
}

function azureEvidence(fields: Record<string, any>): FieldEvidence[] {
  const map: Record<string, string> = {
    "supplier.name": "VendorName", "supplier.vatNumber": "VendorTaxId", invoiceNumber: "InvoiceId", issueDate: "InvoiceDate",
    currency: "InvoiceTotal", "totals.netAmount": "SubTotal", "totals.vatAmount": "TotalTax", "totals.grossAmount": "InvoiceTotal",
  };
  return Object.entries(map).flatMap(([fieldPath, azureName]) => {
    const field = fields[azureName];
    if (!field) return [];
    const region = field.boundingRegions?.[0];
    return [{
      fieldPath,
      valueText: azureFieldValue(field),
      pageNumber: region?.pageNumber ?? null,
      bbox: region?.polygon ?? null,
      confidence: typeof field.confidence === "number" ? field.confidence : null,
    } satisfies FieldEvidence];
  });
}

function flattenCritical(invoice: NormalizedInvoice) {
  return {
    "supplier.name": invoice.supplier.name,
    "supplier.vatNumber": invoice.supplier.vatNumber,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    currency: invoice.currency,
    "totals.netAmount": invoice.totals.netAmount,
    "totals.vatAmount": invoice.totals.vatAmount,
    "totals.grossAmount": invoice.totals.grossAmount,
  };
}

export function criticalCount(invoice: NormalizedInvoice) {
  return Object.values(flattenCritical(invoice)).filter((x) => x != null && x !== "").length;
}

function firstTag(xml: string, tags: string[]) {
  for (const tag of tags) {
    const value = match(xml, new RegExp(`<(?:[A-Za-z0-9_-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tag}>`, "i"));
    if (value) return decodeXml(stripXml(value)).trim() || null;
  }
  return null;
}

function firstNested(xml: string, parents: string[], children: string[]) {
  for (const parent of parents) {
    const section = match(xml, new RegExp(`<(?:[A-Za-z0-9_-]+:)?${parent}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${parent}>`, "i"));
    if (section) {
      const value = firstTag(section, children);
      if (value) return value;
    }
  }
  return null;
}

function match(text: string, regex: RegExp) { return regex.exec(text)?.[1]?.trim() ?? null; }
function stripXml(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function decodeXml(value: string) { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }

function extractSimplePdfText(bytes: Buffer) {
  const latin = bytes.toString("latin1");
  const chunks: string[] = [];
  for (const hit of latin.matchAll(/\(([^()]*)\)\s*Tj/g)) chunks.push(unescapePdf(hit[1]));
  for (const hit of latin.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    for (const part of hit[1].matchAll(/\(([^()]*)\)/g)) chunks.push(unescapePdf(part[1]));
  }
  return chunks.join("\n").replace(/\s+/g, " ").trim();
}

function unescapePdf(value: string) { return value.replace(/\\([()\\])/g, "$1").replace(/\\n/g, "\n").replace(/\\r/g, "\r"); }
function estimatePdfPages(bytes: Buffer) { return Math.max(1, (bytes.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length); }
function normalizeSearch(value: string) { return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9čšžćđäöüß€.,-]/g, ""); }
function safeError(value: unknown) { try { return JSON.stringify(value).slice(0, 1000); } catch { return "unknown error"; } }
function azureFieldValue(field: any): string | null {
  if (!field) return null;
  const value = field.valueString ?? field.valueDate ?? field.valueNumber ?? field.valueInteger ?? field.content;
  return value == null ? null : String(value);
}
function azureMoney(field: any): string | null {
  const amount = field?.valueCurrency?.amount ?? field?.valueNumber ?? field?.content;
  return amount == null ? null : String(amount).replace(/[^0-9.,\-]/g, "");
}
function azureCurrency(field: any): string | null { return field?.valueCurrency?.currencyCode ?? null; }
function documentConfidence(fields: Record<string, any>) {
  const critical = ["VendorName", "InvoiceId", "InvoiceDate", "SubTotal", "TotalTax", "InvoiceTotal"];
  const values = critical.map((k) => fields[k]?.confidence).filter((x) => typeof x === "number") as number[];
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
