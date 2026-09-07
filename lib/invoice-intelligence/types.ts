import { z } from "zod";

const nullableText = z.string().nullable();
const nullableDecimal = z.string().nullable();

export const invoiceLineItemSchema = z.object({
  description: nullableText,
  quantity: nullableDecimal,
  unit: nullableText,
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
  issueDate: nullableText,
  serviceDate: nullableText,
  dueDate: nullableText,
  paymentReference: nullableText,
  paymentTerms: nullableText,
  currency: nullableText,
  lineItems: z.array(invoiceLineItemSchema),
  totals: z.object({
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
  issueDate: null,
  serviceDate: null,
  dueDate: null,
  paymentReference: null,
  paymentTerms: null,
  currency: null,
  lineItems: [],
  totals: {
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
    "documentType", "documentLanguage", "supplier", "buyer", "invoiceNumber",
    "purchaseOrderNumber", "issueDate", "serviceDate", "dueDate", "paymentReference",
    "paymentTerms", "currency", "lineItems", "totals", "vatBreakdown", "confidence",
    "warnings", "validationStatus",
  ],
  properties: {
    documentType: { type: "string", enum: ["invoice", "credit_note", "receipt", "proforma", "unknown"] },
    documentLanguage: { type: ["string", "null"] },
    supplier: partyJsonSchema(true),
    buyer: partyJsonSchema(false),
    invoiceNumber: nullableStringJsonSchema,
    purchaseOrderNumber: nullableStringJsonSchema,
    issueDate: nullableStringJsonSchema,
    serviceDate: nullableStringJsonSchema,
    dueDate: nullableStringJsonSchema,
    paymentReference: nullableStringJsonSchema,
    paymentTerms: nullableStringJsonSchema,
    currency: nullableStringJsonSchema,
    lineItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "quantity", "unit", "unitPriceNet", "discountPercent", "discountAmount", "vatRate", "netAmount", "vatAmount", "grossAmount"],
        properties: Object.fromEntries([
          "description", "quantity", "unit", "unitPriceNet", "discountPercent",
          "discountAmount", "vatRate", "netAmount", "vatAmount", "grossAmount",
        ].map((key) => [key, nullableStringJsonSchema])),
      },
    },
    totals: {
      type: "object",
      additionalProperties: false,
      required: ["netAmount", "discountAmount", "vatAmount", "grossAmount", "amountPaid", "amountDue"],
      properties: Object.fromEntries([
        "netAmount", "discountAmount", "vatAmount", "grossAmount", "amountPaid", "amountDue",
      ].map((key) => [key, nullableStringJsonSchema])),
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
