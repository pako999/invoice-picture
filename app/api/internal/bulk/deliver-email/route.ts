import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  bulkInvoiceGroups,
  bulkInvoiceJobs,
  companies,
  invoiceAuditLogs,
  invoiceDocuments,
  invoices,
} from "@/lib/schema";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { splitPdfFilename } from "@/lib/bulk-invoices/page-split";
import { normalizeDeliveryMode } from "@/lib/invoice-intelligence/delivery-format";
import { sendInvoiceEmail } from "@/lib/resend";

const schema = z.object({
  jobId: z.number().int().positive(),
  groupIndex: z.number().int().min(0),
  objectUrl: z.string().url(),
});

export async function POST(req: Request) {
  if (!verifyBulkInternalSecret(req.headers.get("x-bulk-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = schema.parse(await req.json());
  const db = getDb();
  const [job] = await db.select().from(bulkInvoiceJobs).where(eq(bulkInvoiceJobs.id, data.jobId)).limit(1);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const [group] = await db.select().from(bulkInvoiceGroups).where(and(
    eq(bulkInvoiceGroups.jobId, data.jobId),
    eq(bulkInvoiceGroups.groupIndex, data.groupIndex),
  )).limit(1);
  if (!group) return NextResponse.json({ error: "Bulk child not found" }, { status: 404 });
  if (group.deliveryStatus === "completed" || group.deliveryStatus === "not_required") {
    return NextResponse.json({ success: true, duplicate: true });
  }

  const mode = normalizeDeliveryMode(job.deliveryMode);
  if (mode !== "email_ocr" && mode !== "split_pdf_email") {
    await db.update(bulkInvoiceGroups).set({
      deliveryStatus: "not_required",
      deliveryError: null,
      updatedAt: new Date(),
    }).where(eq(bulkInvoiceGroups.id, group.id));
    return NextResponse.json({ success: true, skipped: true });
  }

  let documentId: number | null = null;
  let sourceInvoiceId: number | null = null;
  let recipientEmail = job.recipientEmail;
  let subject = `Račun ${data.groupIndex + 1}/${job.pageCount ?? data.groupIndex + 1} · ${job.filename}`;
  let filename = splitPdfFilename(job.filename, data.groupIndex);

  if (mode === "email_ocr") {
    if (!group.documentId) return NextResponse.json({ error: "Bulk child is not extracted yet" }, { status: 409 });
    const [doc] = await db.select().from(invoiceDocuments).where(eq(invoiceDocuments.id, group.documentId)).limit(1);
    if (!doc?.sourceInvoiceId) return NextResponse.json({ error: "Source invoice missing" }, { status: 409 });
    const [source] = await db.select().from(invoices).where(eq(invoices.id, doc.sourceInvoiceId)).limit(1);
    if (!source) return NextResponse.json({ error: "Invoice archive row missing" }, { status: 409 });
    documentId = doc.id;
    sourceInvoiceId = source.id;
    recipientEmail = source.recipientEmail;
    subject = source.subject;
    filename = doc.filename;
  } else if (!recipientEmail && job.companyId) {
    const [company] = await db.select({ recipientEmail: companies.recipientEmail }).from(companies).where(and(
      eq(companies.id, job.companyId),
      eq(companies.clerkUserId, job.clerkUserId),
    )).limit(1);
    recipientEmail = company?.recipientEmail ?? null;
  }

  if (!recipientEmail) return NextResponse.json({ error: "Recipient email is not configured" }, { status: 409 });

  const claimed = await db.update(bulkInvoiceGroups).set({
    deliveryStatus: "sending",
    deliveryError: null,
    updatedAt: new Date(),
  }).where(and(
    eq(bulkInvoiceGroups.id, group.id),
    inArray(bulkInvoiceGroups.deliveryStatus, ["pending", "failed"]),
  )).returning({ id: bulkInvoiceGroups.id });
  if (!claimed.length) return NextResponse.json({ success: true, duplicate: true });

  try {
    const url = new URL(data.objectUrl);
    if (!url.hostname.endsWith(".storage.c-3.eu-central-1.aws.neon.tech")) {
      throw new Error("Invalid private storage URL");
    }
    const response = await fetch(data.objectUrl, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Child PDF download failed (${response.status})`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 25 * 1024 * 1024) throw new Error("Child PDF exceeds the 25 MB email delivery safety limit");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 25 * 1024 * 1024) throw new Error("Child PDF exceeds the 25 MB email delivery safety limit");

    const sent = await sendInvoiceEmail({
      to: recipientEmail,
      subject,
      imageBase64: bytes.toString("base64"),
      filename,
      mime: "application/pdf",
      idempotencyKey: `bulk-pdf/${data.jobId}/${data.groupIndex}`,
    });
    if (sent.error) throw new Error(sent.error.message);

    if (sourceInvoiceId) {
      await db.update(invoices).set({ status: "sent", sentAt: new Date(), errorMessage: null })
        .where(eq(invoices.id, sourceInvoiceId));
    }
    await db.update(bulkInvoiceGroups).set({
      deliveryStatus: "completed",
      deliveryError: null,
      updatedAt: new Date(),
    }).where(eq(bulkInvoiceGroups.id, group.id));

    if (documentId) {
      await db.insert(invoiceAuditLogs).values({
        documentId,
        clerkUserId: job.clerkUserId,
        action: "bulk_original_email_sent",
        metadataJson: JSON.stringify({ bulkJobId: data.jobId, groupIndex: data.groupIndex, to: recipientEmail }),
      });
    }

    const all = await db.select({ deliveryStatus: bulkInvoiceGroups.deliveryStatus })
      .from(bulkInvoiceGroups).where(eq(bulkInvoiceGroups.jobId, data.jobId));
    if (all.length > 0 && all.every((item) => item.deliveryStatus === "completed" || item.deliveryStatus === "not_required")) {
      await db.update(bulkInvoiceJobs).set({
        status: "completed",
        stage: "completed",
        processedInvoices: all.length,
        completedAt: new Date(),
        lockedAt: null,
        lastError: null,
        updatedAt: new Date(),
      }).where(eq(bulkInvoiceJobs.id, data.jobId));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(bulkInvoiceGroups).set({
      deliveryStatus: "failed",
      deliveryError: message.slice(0, 2000),
      updatedAt: new Date(),
    }).where(eq(bulkInvoiceGroups.id, group.id));
    if (sourceInvoiceId) {
      await db.update(invoices).set({ status: "failed", errorMessage: message.slice(0, 2000) })
        .where(eq(invoices.id, sourceInvoiceId));
    }
    await db.update(bulkInvoiceJobs).set({
      status: "failed",
      stage: "failed",
      lockedAt: null,
      lastError: `E-mail delivery failed: ${message}`.slice(0, 2000),
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(bulkInvoiceJobs.id, data.jobId));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
