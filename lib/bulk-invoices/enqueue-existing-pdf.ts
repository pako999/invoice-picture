import { getDb } from "@/lib/db";
import { bulkInvoiceJobs, companies } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import type { DeliveryMode } from "@/lib/invoice-intelligence/delivery-format";
import { BULK_PDF_GATEWAY_URL, BULK_PDF_MAX_BYTES } from "@/lib/bulk-invoices/config";
import { assertBulkJobAdmission } from "@/lib/bulk-invoices/admission";
import { dispatchBulkJob } from "./dispatch";

type EnqueueExistingPdfArgs = {
  clerkToken: string;
  clerkUserId: string;
  companyId: number | null;
  sourceInvoiceId: number | null;
  recipientEmail: string | null;
  filename: string;
  base64: string;
};

/** Moves a legacy Postgres-backed PDF into the current bulk pipeline so it can
 * be OCR'd page-by-page, classified and split into individual invoice files. */
export async function enqueueExistingPdfAsBulkJob(args: EnqueueExistingPdfArgs) {
  const bytes = Buffer.from(args.base64, "base64");
  if (!bytes.length || bytes.length > BULK_PDF_MAX_BYTES || bytes.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("Obstoječi dokument ni veljaven PDF za ponovno razdelitev.");
  }

  await assertBulkJobAdmission(args.clerkUserId);

  const db = getDb();
  let deliveryMode: DeliveryMode = "email_ocr";
  let recipientEmail = args.recipientEmail;
  if (args.companyId != null) {
    const [company] = await db.select({ recipientEmail: companies.recipientEmail }).from(companies)
      .where(and(eq(companies.id, args.companyId), eq(companies.clerkUserId, args.clerkUserId)))
      .limit(1);
    if (!company) throw new Error("Podjetje ni bilo najdeno.");
    recipientEmail = company.recipientEmail;
    deliveryMode = (await getCompanyDeliverySettings(args.companyId, args.clerkUserId)).mode;
  }

  const filename = sanitizeFilename(args.filename);
  const signed = await requestUploadTarget(args.clerkToken, args.clerkUserId, filename, bytes.length);
  const uploadHeaders = normalizeHeaders(signed.headers);
  if (!Object.keys(uploadHeaders).some((key) => key.toLowerCase() === "content-type")) {
    uploadHeaders["Content-Type"] = "application/pdf";
  }

  const upload = await fetch(signed.url, {
    method: signed.method,
    headers: uploadHeaders,
    body: bytes,
    signal: AbortSignal.timeout(120_000),
  });
  if (!upload.ok) throw new Error(`Ponovni prenos PDF-ja ni uspel (${upload.status}).`);

  const [job] = await db.insert(bulkInvoiceJobs).values({
    clerkUserId: args.clerkUserId,
    companyId: args.companyId,
    sourceInvoiceId: args.sourceInvoiceId,
    recipientEmail,
    deliveryMode,
    objectKey: signed.objectKey,
    filename,
    byteSize: bytes.length,
    status: "processing",
    stage: "queued",
  }).returning({ id: bulkInvoiceJobs.id });
  if (!job) throw new Error("PDF paketa ni bilo mogoče ustvariti.");
  dispatchBulkJob(job.id, args.clerkUserId, args.clerkToken);
  return job.id;
}

async function requestUploadTarget(clerkToken: string, ownerId: string, filename: string, byteSize: number) {
  const attempts = [
    { filename, byteSize, mimeType: "application/pdf" },
    { filename, size: byteSize, contentType: "application/pdf" },
  ];
  let lastStatus = 502;
  let lastMessage = "Bulk storage upload ni na voljo.";

  for (const payload of attempts) {
    const response = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${clerkToken}`, "x-workspace-owner": ownerId, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    lastStatus = response.status;
    lastMessage = String(body.error ?? body.message ?? lastMessage);

    if (response.ok) {
      const url = body.url ?? body.uploadUrl;
      const objectKey = body.objectKey ?? body.key;
      if (typeof url !== "string" || typeof objectKey !== "string") {
        throw new Error("Shramba ni vrnila veljavnega cilja za PDF.");
      }
      return {
        url,
        objectKey,
        method: typeof body.method === "string" ? body.method : "PUT",
        headers: body.headers,
      };
    }
    if (response.status !== 400 && response.status !== 422) break;
  }

  throw new Error(`${lastMessage} (${lastStatus})`);
}

function normalizeHeaders(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function sanitizeFilename(value: string) {
  return value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255) || "racuni.pdf";
}

