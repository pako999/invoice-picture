import type { NormalizedInvoice } from "./types";

export type DeliveryMode = "email_ocr" | "api_json" | "xml_email";
export type XmlDeliveryFormat = "ubl_2_1" | "eslog_2_0_original";

export function buildInvoiceApiPayload(args: {
  documentId: number;
  companyId: number | null;
  sourceInvoiceId: number | null;
  invoice: NormalizedInvoice;
  source: { filename: string; mimeType: string; sha256: string; base64: string };
}) {
  return {
    schemaVersion: "1.0",
    event: "invoice.approved",
    generatedAt: new Date().toISOString(),
    documentId: args.documentId,
    companyId: args.companyId,
    sourceInvoiceId: args.sourceInvoiceId,
    invoice: args.invoice,
    sourceDocument: {
      filename: args.source.filename,
      mimeType: args.source.mimeType,
      sha256: args.source.sha256,
      base64: args.source.base64,
    },
  };
}

export function generateUbl21Xml(invoice: NormalizedInvoice) {
  const isCredit = invoice.documentType === "credit_note";
  const root = isCredit ? "CreditNote" : "Invoice";
  const ns = isCredit
    ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
    : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
  const lineRoot = isCredit ? "CreditNoteLine" : "InvoiceLine";
  const lineQty = isCredit ? "CreditedQuantity" : "InvoicedQuantity";

  const lines = invoice.lineItems.map((line, index) => `
  <cac:${lineRoot}>
    <cbc:ID>${index + 1}</cbc:ID>
    ${line.quantity ? `<cbc:${lineQty}>${xml(line.quantity)}</cbc:${lineQty}>` : ""}
    ${line.netAmount ? `<cbc:LineExtensionAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(line.netAmount)}</cbc:LineExtensionAmount>` : ""}
    <cac:Item>
      ${line.description ? `<cbc:Description>${xml(line.description)}</cbc:Description>` : ""}
      ${line.vatRate ? `<cac:ClassifiedTaxCategory><cbc:Percent>${xml(line.vatRate)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>` : ""}
    </cac:Item>
    ${line.unitPriceNet ? `<cac:Price><cbc:PriceAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(line.unitPriceNet)}</cbc:PriceAmount></cac:Price>` : ""}
  </cac:${lineRoot}>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="${ns}"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${xml(invoice.invoiceNumber || "UNKNOWN")}</cbc:ID>
  ${invoice.issueDate ? `<cbc:IssueDate>${xml(invoice.issueDate)}</cbc:IssueDate>` : ""}
  ${invoice.dueDate && !isCredit ? `<cbc:DueDate>${xml(invoice.dueDate)}</cbc:DueDate>` : ""}
  <cbc:DocumentCurrencyCode>${xml(invoice.currency || "EUR")}</cbc:DocumentCurrencyCode>
  ${invoice.purchaseOrderNumber ? `<cac:OrderReference><cbc:ID>${xml(invoice.purchaseOrderNumber)}</cbc:ID></cac:OrderReference>` : ""}
  <cac:AccountingSupplierParty>
    <cac:Party>
      ${invoice.supplier.vatNumber ? `<cbc:EndpointID>${xml(invoice.supplier.vatNumber)}</cbc:EndpointID>` : ""}
      <cac:PartyName><cbc:Name>${xml(invoice.supplier.name || "Unknown supplier")}</cbc:Name></cac:PartyName>
      ${addressXml(invoice.supplier)}
      ${invoice.supplier.vatNumber ? `<cac:PartyTaxScheme><cbc:CompanyID>${xml(invoice.supplier.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${xml(invoice.buyer.name || "Unknown buyer")}</cbc:Name></cac:PartyName>
      ${addressXml(invoice.buyer)}
      ${invoice.buyer.vatNumber ? `<cac:PartyTaxScheme><cbc:CompanyID>${xml(invoice.buyer.vatNumber)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>
  ${invoice.supplier.iban ? `<cac:PaymentMeans><cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>${invoice.paymentReference ? `<cbc:PaymentID>${xml(invoice.paymentReference)}</cbc:PaymentID>` : ""}<cac:PayeeFinancialAccount><cbc:ID>${xml(invoice.supplier.iban)}</cbc:ID>${invoice.supplier.bic ? `<cac:FinancialInstitutionBranch><cbc:ID>${xml(invoice.supplier.bic)}</cbc:ID></cac:FinancialInstitutionBranch>` : ""}</cac:PayeeFinancialAccount></cac:PaymentMeans>` : ""}
  ${invoice.totals.vatAmount ? `<cac:TaxTotal><cbc:TaxAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(invoice.totals.vatAmount)}</cbc:TaxAmount></cac:TaxTotal>` : ""}
  <cac:LegalMonetaryTotal>
    ${invoice.totals.netAmount ? `<cbc:LineExtensionAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(invoice.totals.netAmount)}</cbc:LineExtensionAmount>` : ""}
    ${invoice.totals.netAmount ? `<cbc:TaxExclusiveAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(invoice.totals.netAmount)}</cbc:TaxExclusiveAmount>` : ""}
    ${invoice.totals.grossAmount ? `<cbc:TaxInclusiveAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(invoice.totals.grossAmount)}</cbc:TaxInclusiveAmount>` : ""}
    ${invoice.totals.amountDue || invoice.totals.grossAmount ? `<cbc:PayableAmount currencyID="${xml(invoice.currency || "EUR")}">${xml(invoice.totals.amountDue || invoice.totals.grossAmount || "0")}</cbc:PayableAmount>` : ""}
  </cac:LegalMonetaryTotal>${lines}
</${root}>`;
}

export function resolveXmlDelivery(args: {
  format: XmlDeliveryFormat;
  invoice: NormalizedInvoice;
  originalBase64: string;
  originalMimeType: string;
  originalFilename: string;
}) {
  if (args.format === "eslog_2_0_original") {
    const isXml = /xml/i.test(args.originalMimeType) || /\.xml$/i.test(args.originalFilename);
    const original = isXml ? Buffer.from(args.originalBase64, "base64").toString("utf8") : "";
    if (!isLikelyEslog20Xml(original)) {
      throw new Error("eSLOG 2.0 delivery requires an original eSLOG XML document. OCR-derived invoices are exported as UBL 2.1 instead.");
    }
    return { xml: original, filename: replaceExt(args.originalFilename, ".xml"), format: "eslog_2_0" as const };
  }
  return {
    xml: generateUbl21Xml(args.invoice),
    filename: `${safeBase(args.invoice.invoiceNumber || args.originalFilename || "invoice")}.ubl.xml`,
    format: "ubl_2_1" as const,
  };
}

export function isLikelyEslog20Xml(value: string) {
  if (!value.trim().startsWith("<")) return false;
  return /eSLOG|e-SLOG|E_SLOG|CrossIndustryInvoice|UNH|INVOIC/i.test(value)
    && /(Invoice|Ra[cč]un|INVOIC|CrossIndustryInvoice)/i.test(value);
}

export function validatePublicHttpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("API endpoint must use HTTPS");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "::1") throw new Error("Local API endpoints are not allowed");
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) throw new Error("Private network API endpoints are not allowed");
  const private172 = /^172\.(\d{1,3})\./.exec(host);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) throw new Error("Private network API endpoints are not allowed");
  return url.toString();
}

function addressXml(party: { address?: string | null; postalCode?: string | null; city?: string | null; countryCode?: string | null }) {
  if (!party.address && !party.postalCode && !party.city && !party.countryCode) return "";
  return `<cac:PostalAddress>${party.address ? `<cbc:StreetName>${xml(party.address)}</cbc:StreetName>` : ""}${party.city ? `<cbc:CityName>${xml(party.city)}</cbc:CityName>` : ""}${party.postalCode ? `<cbc:PostalZone>${xml(party.postalCode)}</cbc:PostalZone>` : ""}${party.countryCode ? `<cac:Country><cbc:IdentificationCode>${xml(party.countryCode)}</cbc:IdentificationCode></cac:Country>` : ""}</cac:PostalAddress>`;
}

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function safeBase(value: string) { return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "invoice"; }
function replaceExt(value: string, ext: string) { const clean = value.replace(/\.[^.]+$/, ""); return `${safeBase(clean)}${ext}`; }
