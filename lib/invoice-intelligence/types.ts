import { z } from "zod";

const nullableText = z.string().nullable();
const nullableDecimal = z.string().nullable();
const nullableStringJsonSchema = { type: ["string", "null"] } as const;

function partyJsonSchema(supplier: boolean) {
  const fields = supplier
    ? ["name", "address", "postalCode", "city", "countryCode", "vatNumber", "registrationNumber", "email", "phone", "iban", "bic"]
    : ["name", "address", "postalCode", "city", "countryCode", "vatNumber", "registrationNumber"];
  return {
    type: "object",
    additionalProperties: false,
    required: fields,
    properties: Object.fromEntries(fields.map((key) => [key, nullableStringJsonSchema])),
  } as const;
}

export const invoiceLineItemSchema = z.object({
  productCode: nullableText.default(null),
  description: nullableText,
  quantity: nullableDecimal,
  unit: nullableText,
  unitPriceBeforeDiscount: nullableDecimal.default(null),
  unitPriceNet: nullableDecimal,
  discountPercent: nullableDecimal,
  discountAmount: nullableDecimal,
  vatRate: nullableDecimal,
  netAmount: nullableDecimal,
  vatAmount: nullableDecimal,
  grossAmount: nullableDecimal,
}).strict();

export const vatBreakdownSchema = z.object({
  vatRate: nullableDecimal,
  taxableAmount: nullableDecimal,
  vatAmount: nullableDecimal,
  grossAmount: nullableDecimal,
}).strict();

export const normalizedInvoiceSchema = z.object({
  documentType: z.enum(["invoice", "credit_note", "receipt", "proforma", "unknown"]),
  documentLanguage: nullableText,
  documentStatus: nullableText.default(null),
  supplier: z.object({
    name: nullableText,
    address: nullableText,
    postalCode: nullableText,
    city: nullableText,
    countryCode: nullableText,
    vatNumber: nullableText,
    registrationNumber: nullableText,
    email: nullableText,
    phone: nullableText,
    iban: nullableText,
    bic: nullableText,
  }).strict(),
  buyer: z.object({
    name: nullableText,
    address: nullableText,
    postalCode: nullableText,
    city: nullableText,
    countryCode: nullableText,
    vatNumber: nullableText,
    registrationNumber: nullableText,
  }).strict(),
  invoiceNumber: nullableText,
  purchaseOrderNumber: nullableText,
  deliveryNoteNumber: nullableText.default(null),
  supplyPlace: nullableText.default(null),
  issueDate: nullableText,
  serviceDate: nullableText,
  dueDate: nullableText,
  paymentReference: nullableText,
  paymentTerms: nullableText,
  shippingMethod: nullableText.default(null),
  currency: nullableText,
  lineItems: z.array(invoiceLineItemSchema),
  totals: z.object({
    amountBeforeDiscount: nullableDecimal.default(null),
    netAmount: nullableDecimal,
    discountAmount: nullableDecimal,
    vatAmount: nullableDecimal,
    grossAmount: nullableDecimal,
    amountPaid: nullableDecimal,
    amountDue: nullableDecimal,
  }).strict(),
  vatBreakdown: z.array(vatBreakdownSchema),
  confidence: z.object({
    overall: z.number().min(0).max(1).nullable(),
    fields: z.record(z.string(), z.number().min(0).max(1).nullable()),
  }).strict(),
  warnings: z.array(z.string()),
  validationStatus: z.enum(["pending", "valid", "needs_review", "failed"]),
}).strict();

export type NormalizedInvoice = z.infer<typeof normalizedInvoiceSchema>;
export type InvoiceLineItemData = z.infer<typeof invoiceLineItemSchema>;
export type VatBreakdownData = z.infer<typeof vatBreakdownSchema>;

export type FieldEvidence = {
  fieldPath: string;
  valueText: string | null;
  pageNumber: number | null;
  bbox: unknown | null;
  confidence: number | null;
};

export type ReaderResult = {
  provider: "deterministic" | "mistral" | "azure";
  model: string | null;
  invoice: NormalizedInvoice;
  rawText: string;
  rawResponse: unknown;
  evidence: FieldEvidence[];
  pagesProcessed: number;
  costMicros: number | null;
};

export type ValidationResult = {
  status: "valid" | "needs_review" | "failed";
  warnings: string[];
  errors: string[];
  differences: Record<string, string>;
};

export const emptyInvoice = (): NormalizedInvoice => ({
  documentType: "unknown",
  documentLanguage: null,
  documentStatus: null,
  supplier: {
    name: null,
    address: null,
    postalCode: null,
    city: null,
    countryCode: null,
    vatNumber: null,
    registrationNumber: null,
    email: null,
    phone: null,
    iban: null,
    bic: null,
  },
  buyer: {
    name: null,
    address: null,
    postalCode: null,
    city: null,
    countryCode: null,
    vatNumber: null,
    registrationNumber: null,
  },
  invoiceNumber: null,
  purchaseOrderNumber: null,
  deliveryNoteNumber: null,
  supplyPlace: null,
  issueDate: null,
  serviceDate: null,
  dueDate: null,
  paymentReference: null,
  paymentTerms: null,
  shippingMethod: null,
  currency: null,
  lineItems: [],
  totals: {
    amountBeforeDiscount: null,
    netAmount: null,
    discountAmount: null,
    vatAmount: null,
    grossAmount: null,
    amountPaid: null,
    amountDue: null,
  },
  vatBreakdown: [],
  confidence: { overall: null, fields: {} },
  warnings: [],
  validationStatus: "pending",
});

export const invoiceJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "documentType", "documentLanguage", "documentStatus", "supplier", "buyer", "invoiceNumber",
    "purchaseOrderNumber", "deliveryNoteNumber", "supplyPlace", "issueDate", "serviceDate", "dueDate", "paymentReference",
    "paymentTerms", "shippingMethod", "currency", "lineItems", "totals", "vatBreakdown", "confidence",
    "warnings", "validationStatus",
  ],
  properties: {
    documentType: { type: "string", enum: ["invoice", "credit_note", "receipt", "proforma", "unknown"] },
    documentLanguage: nullableStringJsonSchema,
    documentStatus: nullableStringJsonSchema,
    supplier: partyJsonSchema(true),
    buyer: partyJsonSchema(false),
    invoiceNumber: nullableStringJsonSchema,
    purchaseOrderNumber: nullableStringJsonSchema,
    deliveryNoteNumber: nullableStringJsonSchema,
    supplyPlace: nullableStringJsonSchema,
    issueDate: nullableStringJsonSchema,
    serviceDate: nullableStringJsonSchema,
    dueDate: nullableStringJsonSchema,
    paymentReference: nullableStringJsonSchema,
    paymentTerms: nullableStringJsonSchema,
    shippingMethod: nullableStringJsonSchema,
    currency: nullableStringJsonSchema,
    lineItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["productCode", "description", "quantity", "unit", "unitPriceBeforeDiscount", "unitPriceNet", "discountPercent", "discountAmount", "vatRate", "netAmount", "vatAmount", "grossAmount"],
        properties: {
          ...Object.fromEntries([
          "productCode", "description", "quantity", "unit", "unitPriceBeforeDiscount", "unitPriceNet", "discountPercent", "discountAmount",
          "vatRate", "netAmount", "vatAmount", "grossAmount",
          ].map((key) => [key, nullableStringJsonSchema])),
          unitPriceBeforeDiscount: { ...nullableStringJsonSchema, description: "Printed unit price EXCLUDING VAT before discount. Null if only a VAT-inclusive retail price is printed; never copy a price including VAT here." },
          unitPriceNet: { ...nullableStringJsonSchema, description: "Printed unit price EXCLUDING VAT after discount, for one unit. Null when no net unit price is printed. Never put a VAT-inclusive price here." },
          netAmount: { ...nullableStringJsonSchema, description: "Printed line total WITHOUT VAT for the entire quantity after discounts. Null if only the VAT-inclusive line total is printed. Do not treat retail receipt prices as net or add VAT to them." },
          vatAmount: { ...nullableStringJsonSchema, description: "VAT amount printed for this line, not the VAT percentage or document VAT total. Null if no line VAT amount is printed; do not invent tax by applying a rate to a VAT-inclusive price." },
          grossAmount: { ...nullableStringJsonSchema, description: "Printed line total WITH VAT INCLUDED for the entire quantity after discounts. Retail receipt item totals are usually already VAT-inclusive. Preserve that total exactly; never add VAT again. This is not the unit price when quantity exceeds one." },
        },
      },
    },
    totals: {
      type: "object",
      additionalProperties: false,
      required: ["amountBeforeDiscount", "netAmount", "discountAmount", "vatAmount", "grossAmount", "amountPaid", "amountDue"],
      properties: {
        ...Object.fromEntries([
        "amountBeforeDiscount", "netAmount", "discountAmount", "vatAmount", "grossAmount", "amountPaid", "amountDue",
        ].map((key) => [key, nullableStringJsonSchema])),
        netAmount: { ...nullableStringJsonSchema, description: "Printed full-document total WITHOUT VAT after discounts; use the taxable base from the printed VAT summary on retail receipts." },
        vatAmount: { ...nullableStringJsonSchema, description: "Printed full-document VAT amount. The net total plus this VAT amount must equal the VAT-inclusive gross total." },
        grossAmount: { ...nullableStringJsonSchema, description: "Printed full-document total WITH VAT INCLUDED. 'Končna vsota vsebuje DDV', 'Skupaj z DDV', and 'Total incl. VAT' already include tax. Never add VAT again or replace this total with a zero unpaid balance." },
        amountPaid: { ...nullableStringJsonSchema, description: "Amount actually paid toward this invoice. Cash tender alone is not the amount paid: subtract printed change. Null without explicit payment evidence." },
        amountDue: { ...nullableStringJsonSchema, description: "Printed remaining unpaid balance, including zero for a fully paid invoice. Separate from the full VAT-inclusive invoice total; null when absent." },
      },
    },
    vatBreakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["vatRate", "taxableAmount", "vatAmount", "grossAmount"],
        properties: Object.fromEntries([
          "vatRate", "taxableAmount", "vatAmount", "grossAmount",
        ].map((key) => [key, nullableStringJsonSchema])),
      },
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["overall", "fields"],
      properties: {
        overall: { type: ["number", "null"], minimum: 0, maximum: 1 },
        fields: { type: "object", additionalProperties: { type: ["number", "null"], minimum: 0, maximum: 1 } },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
    validationStatus: { type: "string", enum: ["pending", "valid", "needs_review", "failed"] },
  },
} as const;
