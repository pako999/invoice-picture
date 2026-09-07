import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("invoice_status", ["pending", "sent", "failed"]);
export const planEnum = pgEnum("subscription_plan", ["trial", "basic", "pro", "expired", "canceled", "free"]);
export const processingStatusEnum = pgEnum("invoice_processing_status", [
  "uploaded",
  "queued",
  "processing",
  "needs_review",
  "approved",
  "failed",
]);
export const validationStatusEnum = pgEnum("invoice_validation_status", ["pending", "valid", "needs_review", "failed"]);
export const ocrProviderEnum = pgEnum("invoice_ocr_provider", ["deterministic", "mistral", "azure", "manual"]);
export const processingJobStatusEnum = pgEnum("invoice_processing_job_status", ["queued", "processing", "completed", "failed"]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull().unique(),
  plan: planEnum("plan").default("trial").notNull(),
  trialStartedAt: timestamp("trialStartedAt").defaultNow().notNull(),
  trialEndsAt: timestamp("trialEndsAt").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  paddleCustomerId: varchar("paddleCustomerId", { length: 64 }),
  paddleSubscriptionId: varchar("paddleSubscriptionId", { length: 64 }),
  googlePlayPurchaseToken: text("googlePlayPurchaseToken"),
  googlePlayProductId: varchar("googlePlayProductId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

export const userSettings = pgTable("userSettings", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull().unique(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  companyId: integer("companyId"),
  subject: varchar("subject", { length: 255 }).notNull().default("Račun"),
  imageData: text("imageData"),
  imageMime: varchar("imageMime", { length: 64 }).default("image/jpeg"),
  filename: varchar("filename", { length: 255 }).notNull(),
  status: statusEnum("status").default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Private source document + current processing state. Original file bytes stay
 * server-side in Postgres and are only served through an authorized/signed route. */
export const invoiceDocuments = pgTable("invoiceDocuments", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  companyId: integer("companyId").references(() => companies.id, { onDelete: "set null" }),
  sourceInvoiceId: integer("sourceInvoiceId").references(() => invoices.id, { onDelete: "set null" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 96 }).notNull(),
  originalBase64: text("originalBase64").notNull(),
  originalValueMetadataJson: text("originalValueMetadataJson"),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  byteSize: integer("byteSize").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull(),
  status: processingStatusEnum("status").default("uploaded").notNull(),
  documentType: varchar("documentType", { length: 32 }),
  documentLanguage: varchar("documentLanguage", { length: 24 }),
  provider: ocrProviderEnum("provider"),
  model: varchar("model", { length: 128 }),
  rawText: text("rawText"),
  rawProviderResponse: text("rawProviderResponse"),
  normalizedJson: text("normalizedJson"),
  approvedJson: text("approvedJson"),
  overallConfidenceBps: integer("overallConfidenceBps"),
  validationStatus: validationStatusEnum("validationStatus").default("pending").notNull(),
  warningsJson: text("warningsJson"),
  processingCostMicros: integer("processingCostMicros"),
  processingStartedAt: timestamp("processingStartedAt"),
  processedAt: timestamp("processedAt"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  retentionUntil: timestamp("retentionUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  idempotencyUnique: uniqueIndex("invoiceDocuments_idempotency_unique").on(t.idempotencyKey),
  ownerCreatedIdx: index("invoiceDocuments_owner_created_idx").on(t.clerkUserId, t.createdAt),
  checksumIdx: index("invoiceDocuments_checksum_idx").on(t.clerkUserId, t.sha256),
  statusIdx: index("invoiceDocuments_status_idx").on(t.status),
}));

export const invoiceLineItems = pgTable("invoiceLineItems", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description"),
  quantity: varchar("quantity", { length: 64 }),
  unit: varchar("unit", { length: 32 }),
  unitPriceNet: varchar("unitPriceNet", { length: 64 }),
  discountPercent: varchar("discountPercent", { length: 64 }),
  discountAmount: varchar("discountAmount", { length: 64 }),
  vatRate: varchar("vatRate", { length: 64 }),
  netAmount: varchar("netAmount", { length: 64 }),
  vatAmount: varchar("vatAmount", { length: 64 }),
  grossAmount: varchar("grossAmount", { length: 64 }),
}, (t) => ({ documentIdx: index("invoiceLineItems_document_idx").on(t.documentId, t.position) }));

export const invoiceVatBreakdown = pgTable("invoiceVatBreakdown", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  vatRate: varchar("vatRate", { length: 64 }),
  taxableAmount: varchar("taxableAmount", { length: 64 }),
  vatAmount: varchar("vatAmount", { length: 64 }),
  grossAmount: varchar("grossAmount", { length: 64 }),
}, (t) => ({ documentIdx: index("invoiceVatBreakdown_document_idx").on(t.documentId, t.position) }));

export const invoiceFieldEvidence = pgTable("invoiceFieldEvidence", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  fieldPath: varchar("fieldPath", { length: 255 }).notNull(),
  valueText: text("valueText"),
  pageNumber: integer("pageNumber"),
  bboxJson: text("bboxJson"),
  confidenceBps: integer("confidenceBps"),
  provider: ocrProviderEnum("provider").notNull(),
}, (t) => ({ fieldIdx: index("invoiceFieldEvidence_field_idx").on(t.documentId, t.fieldPath) }));

export const invoiceValidationResults = pgTable("invoiceValidationResults", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  status: validationStatusEnum("status").notNull(),
  warningsJson: text("warningsJson").notNull().default("[]"),
  errorsJson: text("errorsJson").notNull().default("[]"),
  differencesJson: text("differencesJson").notNull().default("{}"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({ documentIdx: index("invoiceValidationResults_document_idx").on(t.documentId, t.createdAt) }));

export const invoiceProcessingAttempts = pgTable("invoiceProcessingAttempts", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  provider: ocrProviderEnum("provider").notNull(),
  model: varchar("model", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull(),
  errorCode: varchar("errorCode", { length: 96 }),
  errorMessage: text("errorMessage"),
  durationMs: integer("durationMs"),
  pagesProcessed: integer("pagesProcessed"),
  costMicros: integer("costMicros"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (t) => ({ documentIdx: index("invoiceProcessingAttempts_document_idx").on(t.documentId, t.startedAt) }));

export const invoiceProcessingJobs = pgTable("invoiceProcessingJobs", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  status: processingJobStatusEnum("status").default("queued").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("maxAttempts").default(4).notNull(),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  lockedAt: timestamp("lockedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  documentUnique: uniqueIndex("invoiceProcessingJobs_document_unique").on(t.documentId),
  queueIdx: index("invoiceProcessingJobs_queue_idx").on(t.status, t.availableAt),
}));

export const invoiceCorrections = pgTable("invoiceCorrections", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  fieldPath: varchar("fieldPath", { length: 255 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({ documentIdx: index("invoiceCorrections_document_idx").on(t.documentId, t.createdAt) }));

export const supplierMappings = pgTable("supplierMappings", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  supplierKey: varchar("supplierKey", { length: 320 }).notNull(),
  fieldPath: varchar("fieldPath", { length: 255 }).notNull(),
  sourceValue: text("sourceValue"),
  correctedValue: text("correctedValue").notNull(),
  occurrences: integer("occurrences").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({ mappingUnique: uniqueIndex("supplierMappings_unique").on(t.clerkUserId, t.supplierKey, t.fieldPath) }));

export const invoiceDuplicateRelations = pgTable("invoiceDuplicateRelations", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  duplicateOfDocumentId: integer("duplicateOfDocumentId").notNull().references(() => invoiceDocuments.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({ relationUnique: uniqueIndex("invoiceDuplicateRelations_unique").on(t.documentId, t.duplicateOfDocumentId) }));

export const invoiceAuditLogs = pgTable("invoiceAuditLogs", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").references(() => invoiceDocuments.id, { onDelete: "set null" }),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({ ownerIdx: index("invoiceAuditLogs_owner_idx").on(t.clerkUserId, t.createdAt) }));

/** Persistent fail-closed OCR usage buckets. Provider pages are reserved before
 * any paid API call so concurrent cron runs cannot overspend the configured caps. */
export const invoiceOcrUsageBuckets = pgTable("invoiceOcrUsageBuckets", {
  id: serial("id").primaryKey(),
  scopeKey: varchar("scopeKey", { length: 320 }).notNull(),
  bucketType: varchar("bucketType", { length: 16 }).notNull(),
  bucketStart: timestamp("bucketStart").notNull(),
  reservedPages: integer("reservedPages").default(0).notNull(),
  estimatedCostMicros: integer("estimatedCostMicros").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  bucketUnique: uniqueIndex("invoiceOcrUsageBuckets_unique").on(t.scopeKey, t.bucketType, t.bucketStart),
  bucketIdx: index("invoiceOcrUsageBuckets_bucket_idx").on(t.bucketType, t.bucketStart),
}));

export type UserSettings = typeof userSettings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InvoiceDocument = typeof invoiceDocuments.$inferSelect;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InvoiceVatRow = typeof invoiceVatBreakdown.$inferSelect;