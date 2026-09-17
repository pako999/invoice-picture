import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs } from "@/lib/schema";
import { assertOcrDocumentQuota } from "@/lib/invoice-intelligence/quota";

export async function enqueueInvoiceDocument(input: {
  clerkUserId: string;
  companyId: number | null;
  sourceInvoiceId: number | null;
  filename: string;
  mimeType: string;
  base64: string;
}) {
  const bytes = Buffer.from(input.base64, "base64");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const idempotencyKey = createHash("sha256")
    .update(`${input.clerkUserId}:${input.sourceInvoiceId ?? "upload"}:${sha256}`)
    .digest("hex");
  const retentionDays = Number(process.env.INVOICE_RETENTION_DAYS ?? 365);
  const retentionUntil = Number.isFinite(retentionDays) && retentionDays > 0
    ? new Date(Date.now() + retentionDays * 86_400_000)
    : null;
  const readerConfigured = Boolean(process.env.MISTRAL_API_KEY) || /xml/i.test(input.mimeType) || /\.xml$/i.test(input.filename);
  const db = getDb();

  const [existing] = await db.select({ id: invoiceDocuments.id })
    .from(invoiceDocuments)
    .where(eq(invoiceDocuments.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existing) return existing.id;

  // Commercial OCR limits apply only to creation of a new AI-processing document.
  // The legacy /api/send route catches this error and still sends the original file
  // for email_ocr delivery, so paid users never lose ordinary document forwarding.
  if (readerConfigured) await assertOcrDocumentQuota(input.clerkUserId);

  const [document] = await db.insert(invoiceDocuments).values({
    clerkUserId: input.clerkUserId,
    companyId: input.companyId,
    sourceInvoiceId: input.sourceInvoiceId,
    filename: sanitizeFilename(input.filename),
    mimeType: input.mimeType,
    originalBase64: input.base64,
    sha256,
    byteSize: bytes.length,
    idempotencyKey,
    status: readerConfigured ? "queued" : "uploaded",
    retentionUntil,
  }).onConflictDoNothing({ target: invoiceDocuments.idempotencyKey }).returning({ id: invoiceDocuments.id });

  const documentId = document?.id ?? (await db.select({ id: invoiceDocuments.id })
    .from(invoiceDocuments)
    .where(eq(invoiceDocuments.idempotencyKey, idempotencyKey))
    .limit(1))[0]?.id;

  if (!documentId) return null;
  if (readerConfigured) {
    await db.insert(invoiceProcessingJobs).values({ documentId, status: "queued" }).onConflictDoNothing();
  }
  return documentId;
}

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "invoice";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255);
}
