import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs } from "@/lib/schema";

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

  const [existing] = await db.select({ id: invoiceDocuments.id, status: invoiceDocuments.status })
    .from(invoiceDocuments)
    .where(invoiceDocuments.idempotencyKey.eq?.(idempotencyKey) as never)
    .limit(1)
    .catch(() => [] as Array<{ id: number; status: string }>);
  if (existing) return existing.id;

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

  if (!document) {
    const [row] = await db.select({ id: invoiceDocuments.id }).from(invoiceDocuments)
      .where(invoiceDocuments.idempotencyKey.eq?.(idempotencyKey) as never)
      .limit(1);
    return row?.id ?? null;
  }

  if (readerConfigured) {
    await db.insert(invoiceProcessingJobs).values({ documentId: document.id, status: "queued" }).onConflictDoNothing();
  }
  return document.id;
}

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "invoice";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255);
}
