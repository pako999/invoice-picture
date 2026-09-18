import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { sendInvoiceEmail } from "@/lib/resend";
import { enqueueInvoiceDocument } from "@/lib/invoice-intelligence/queue";
import { OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";

type UploadJob = {
  id: number;
  uploadId: string;
  clerkUserId: string;
  invoiceId: number;
  filename: string;
  mimeType: string;
  subject: string;
  companyId: number | null;
  messageBody: string | null;
  deliveryMode: "email_ocr" | "api_json" | "xml_email";
  totalChunks: number;
  byteSize: number;
  attempts: number;
  maxAttempts: number;
};

export async function runQueuedUploadJobs(limit = 20, concurrency = 5) {
  const sql = rawDb();

  await recoverAndCleanUploadQueue();

  const rows = await sql`
    SELECT
      "id", "uploadId", "clerkUserId", "invoiceId", "filename", "mimeType",
      "subject", "companyId", "messageBody", "deliveryMode",
      "totalChunks", "byteSize", "attempts", "maxAttempts"
    FROM "invoiceUploadJobs"
    WHERE "status" IN ('queued','failed')
      AND "availableAt" <= now()
      AND "attempts" < "maxAttempts"
    ORDER BY "availableAt" ASC, "id" ASC
    LIMIT ${Math.max(1, Math.min(50, limit))}
  ` as unknown as UploadJob[];

  const pending = [...rows];
  const results: Array<{ jobId: number; invoiceId: number; ok: boolean; error?: string }> = [];
  const workerCount = Math.max(1, Math.min(5, concurrency, pending.length || 1));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (pending.length) {
      const row = pending.shift();
      if (!row) return;
      const result = await processOneUploadJob(row);
      results.push(result);
    }
  }));

  return results;
}

async function processOneUploadJob(job: UploadJob) {
  const sql = rawDb();
  const locked = await sql`
    UPDATE "invoiceUploadJobs"
    SET "status" = 'processing',
        "attempts" = "attempts" + 1,
        "lockedAt" = now(),
        "updatedAt" = now()
    WHERE "id" = ${job.id}
      AND "status" IN ('queued','failed')
    RETURNING "attempts", "maxAttempts"
  `;

  if (!locked.length) {
    return { jobId: job.id, invoiceId: job.invoiceId, ok: false, error: "Job already locked" };
  }

  const attempt = Number(locked[0].attempts);
  const maxAttempts = Number(locked[0].maxAttempts);

  try {
    const chunks = await sql`
      SELECT "chunkIndex", "totalChunks", "data"
      FROM "invoiceUploadChunks"
      WHERE "uploadId" = ${job.uploadId}
        AND "clerkUserId" = ${job.clerkUserId}
      ORDER BY "chunkIndex" ASC
    ` as Array<{ chunkIndex: number; totalChunks: number; data: string }>;

    const complete =
      chunks.length === job.totalChunks &&
      chunks.every((chunk, index) =>
        Number(chunk.chunkIndex) === index &&
        Number(chunk.totalChunks) === job.totalChunks
      );
    if (!complete) throw new Error("PDF upload chunks are incomplete");

    const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.data, "base64")));
    if (bytes.length !== job.byteSize || bytes.length <= 0 || bytes.length > 10 * 1024 * 1024) {
      throw new Error("PDF size validation failed");
    }
    if (job.mimeType === "application/pdf" && bytes.subarray(0, 4).toString() !== "%PDF") {
      throw new Error("Invalid PDF file");
    }

    const db = getDb();
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, job.invoiceId)).limit(1);
    if (!invoice || invoice.clerkUserId !== job.clerkUserId) {
      throw new Error("Invoice placeholder not found");
    }

    const base64 = bytes.toString("base64");
    await db.update(invoices).set({
      imageData: base64,
      imageMime: job.mimeType,
      filename: job.filename,
      errorMessage: null,
    }).where(eq(invoices.id, job.invoiceId));

    let processingDocumentId: number | null = null;
    let quotaError: OcrCommercialQuotaError | null = null;
    try {
      processingDocumentId = await enqueueInvoiceDocument({
        clerkUserId: job.clerkUserId,
        companyId: job.companyId,
        sourceInvoiceId: job.invoiceId,
        filename: job.filename,
        mimeType: job.mimeType,
        base64,
      });
    } catch (error) {
      if (error instanceof OcrCommercialQuotaError) {
        quotaError = error;
      } else {
        throw error;
      }
    }

    if (job.deliveryMode !== "email_ocr") {
      if (!processingDocumentId) {
        throw quotaError ?? new Error("Structured processing could not be queued");
      }
    } else if (invoice.status !== "sent") {
      const mailResult = await sendInvoiceEmail({
        to: invoice.recipientEmail,
        subject: job.subject,
        imageBase64: base64,
        filename: job.filename,
        mime: job.mimeType,
        messageBody: job.messageBody ?? undefined,
      });
      if (mailResult.error) throw new Error(`Email delivery failed: ${mailResult.error.message}`);

      await db.update(invoices).set({
        status: "sent",
        sentAt: new Date(),
        errorMessage: quotaError ? quotaError.message : null,
      }).where(eq(invoices.id, job.invoiceId));
    }

    await sql`
      UPDATE "invoiceUploadJobs"
      SET "status" = 'completed',
          "lockedAt" = NULL,
          "lastError" = NULL,
          "updatedAt" = now()
      WHERE "id" = ${job.id}
    `;
    await sql`
      DELETE FROM "invoiceUploadChunks"
      WHERE "uploadId" = ${job.uploadId}
        AND "clerkUserId" = ${job.clerkUserId}
    `;

    return { jobId: job.id, invoiceId: job.invoiceId, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const terminal = attempt >= maxAttempts;
    const delayMinutes = Math.min(60, 2 ** Math.min(attempt, 6));

    await sql`
      UPDATE "invoiceUploadJobs"
      SET "status" = 'failed',
          "lockedAt" = NULL,
          "lastError" = ${message.slice(0, 2000)},
          "availableAt" = now() + (${delayMinutes} || ' minutes')::interval,
          "updatedAt" = now()
      WHERE "id" = ${job.id}
    `;

    const db = getDb();
    if (terminal) {
      await db.update(invoices).set({
        status: "failed",
        errorMessage: message.slice(0, 2000),
      }).where(eq(invoices.id, job.invoiceId));
      await sql`
        DELETE FROM "invoiceUploadChunks"
        WHERE "uploadId" = ${job.uploadId}
          AND "clerkUserId" = ${job.clerkUserId}
      `;
    } else {
      await db.update(invoices).set({
        status: "pending",
        errorMessage: `Začasna napaka, ponovni poskus je načrtovan: ${message.slice(0, 500)}`,
      }).where(eq(invoices.id, job.invoiceId));
    }

    return { jobId: job.id, invoiceId: job.invoiceId, ok: false, error: message };
  }
}

export async function recoverAndCleanUploadQueue() {
  const sql = rawDb();

  await sql`
    UPDATE "invoiceUploadJobs"
    SET "status" = 'failed',
        "lockedAt" = NULL,
        "lastError" = coalesce("lastError", 'Worker timeout; safely requeued'),
        "availableAt" = now(),
        "updatedAt" = now()
    WHERE "status" = 'processing'
      AND "lockedAt" < now() - interval '15 minutes'
  `;

  await sql`
    DELETE FROM "invoiceUploadChunks" c
    WHERE c."createdAt" < now() - interval '2 hours'
      AND NOT EXISTS (
        SELECT 1 FROM "invoiceUploadJobs" j
        WHERE j."uploadId" = c."uploadId"
          AND j."clerkUserId" = c."clerkUserId"
          AND j."status" IN ('queued','processing','failed')
          AND j."attempts" < j."maxAttempts"
      )
  `;

  await sql`
    DELETE FROM "invoiceUploadJobs"
    WHERE "status" = 'completed'
      AND "updatedAt" < now() - interval '24 hours'
  `;
}

function rawDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}
