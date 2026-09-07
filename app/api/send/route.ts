import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices, userSettings, companies } from "@/lib/schema";
import { sendInvoiceEmail } from "@/lib/resend";
import { FREE_MONTHLY_LIMIT, getStatus } from "@/lib/subscription";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { enqueueInvoiceDocument } from "@/lib/invoice-intelligence/queue";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import type { DeliveryMode, XmlDeliveryFormat } from "@/lib/invoice-intelligence/delivery-format";
import { appendEslogBatchSource } from "@/lib/invoice-intelligence/eslog-batch";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/xml",
  "text/xml",
]);

const schema = z.object({
  subject: z.string().min(1).max(255).default("Račun"),
  imageBase64: z.string().min(1).max(14 * 1024 * 1024),
  filename: z.string().min(1).max(255),
  mime: z.string().max(96).default("image/jpeg"),
  companyId: z.number().int().positive().optional(),
  messageBody: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getStatus(userId);
  if (!status.canSend) {
    return NextResponse.json(
      { success: false, error: "Trial expired — upgrade to keep sending invoices.", code: "subscription_required", plan: status.plan },
      { status: 402 },
    );
  }

  if (status.isFree && status.monthlyUsage >= FREE_MONTHLY_LIMIT) {
    return NextResponse.json(
      { success: false, error: "Monthly limit of 3 invoices reached on the Free plan.", code: "free_limit_reached" },
      { status: 403 },
    );
  }

  try {
    const data = schema.parse(await req.json());
    const bytes = Buffer.from(data.imageBase64, "base64");
    if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: "Invalid file or file is larger than 10 MB." }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(data.mime)) {
      return NextResponse.json({ success: false, error: "Unsupported file type." }, { status: 415 });
    }
    if (data.mime === "application/pdf" && bytes.subarray(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ success: false, error: "Invalid PDF file." }, { status: 400 });
    }

    const db = getDb();
    let recipientEmail: string | null | undefined;
    let deliveryMode: DeliveryMode = "email_ocr";
    let xmlFormat: XmlDeliveryFormat = "ubl_2_1";

    if (data.companyId) {
      const [company] = await db.select().from(companies)
        .where(and(eq(companies.id, data.companyId), eq(companies.clerkUserId, userId)))
        .limit(1);
      recipientEmail = company?.recipientEmail;
      if (company) {
        const delivery = await getCompanyDeliverySettings(company.id, userId);
        deliveryMode = delivery.mode;
        xmlFormat = delivery.xmlFormat;
      }
    } else {
      const [settings] = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
      recipientEmail = settings?.recipientEmail;
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: "Set a recipient email in Settings.", code: "no_recipient" },
        { status: 422 },
      );
    }

    const filename = sanitizeFilename(data.filename);
    const [result] = await db.insert(invoices).values({
      clerkUserId: userId,
      recipientEmail,
      companyId: data.companyId ?? null,
      subject: data.subject,
      imageData: data.imageBase64,
      imageMime: data.mime,
      filename,
      status: "pending",
    }).returning({ id: invoices.id });

    // XML/eSLOG is a batch workflow. Files uploaded within the same scan action are
    // collected into one batch, invoices are separated by page boundaries, then a
    // single ZIP containing one eSLOG 2.0 XML per detected invoice is emailed.
    if (deliveryMode === "xml_email") {
      if (!data.companyId) {
        await db.update(invoices).set({ status: "failed", errorMessage: "eSLOG batch export requires a selected company" }).where(eq(invoices.id, result.id));
        return NextResponse.json({ success: false, error: "Select a company for eSLOG batch export." }, { status: 422 });
      }
      try {
        const batch = await appendEslogBatchSource({
          clerkUserId: userId,
          companyId: data.companyId,
          recipientEmail,
          sourceInvoiceId: result.id,
          filename,
          mimeType: data.mime,
          base64: data.imageBase64,
        });
        return NextResponse.json({
          success: true,
          id: result.id,
          deliveryMode,
          queuedForEslogBatch: true,
          eslogBatchKey: batch.batchKey,
          eslogBatchSourceOrder: batch.sourceOrder,
        });
      } catch (batchError) {
        const msg = batchError instanceof Error ? batchError.message : String(batchError);
        await db.update(invoices).set({ status: "failed", errorMessage: msg }).where(eq(invoices.id, result.id));
        return NextResponse.json({ success: false, error: msg, deliveryMode }, { status: 500 });
      }
    }

    let processingDocumentId: number | null = null;
    let queueErrorMessage: string | null = null;
    try {
      processingDocumentId = await enqueueInvoiceDocument({
        clerkUserId: userId,
        companyId: data.companyId ?? null,
        sourceInvoiceId: result.id,
        filename,
        mimeType: data.mime,
        base64: data.imageBase64,
        metadata: {
          deliveryModeAtUpload: deliveryMode,
          xmlFormatAtUpload: xmlFormat,
        },
      });
    } catch (queueError) {
      queueErrorMessage = queueError instanceof Error ? queueError.message : "unknown";
      console.error("invoice_reader_enqueue_failed", queueErrorMessage);
    }

    if (deliveryMode === "api_json") {
      if (!processingDocumentId) {
        await db.update(invoices).set({ status: "failed", errorMessage: `Structured delivery could not be queued: ${queueErrorMessage || "unknown error"}` }).where(eq(invoices.id, result.id));
        return NextResponse.json({ success: false, error: "Structured invoice processing could not be queued.", deliveryMode }, { status: 500 });
      }
      return NextResponse.json({ success: true, id: result.id, processingDocumentId, deliveryMode, queuedForStructuredDelivery: true });
    }

    try {
      await sendInvoiceEmail({
        to: recipientEmail,
        subject: data.subject,
        imageBase64: data.imageBase64,
        filename,
        mime: data.mime,
        messageBody: data.messageBody,
      });
      await db.update(invoices).set({ status: "sent", sentAt: new Date() }).where(eq(invoices.id, result.id));
      return NextResponse.json({ success: true, id: result.id, processingDocumentId, deliveryMode });
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      await db.update(invoices).set({ status: "failed", errorMessage: msg }).where(eq(invoices.id, result.id));
      return NextResponse.json({ success: false, error: msg, processingDocumentId, deliveryMode }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "invoice";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255);
}
