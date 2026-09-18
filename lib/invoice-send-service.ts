import { getDb } from "@/lib/db";
import { invoices, userSettings, companies } from "@/lib/schema";
import { sendInvoiceEmail } from "@/lib/resend";
import { FREE_MONTHLY_LIMIT, getStatus } from "@/lib/subscription";
import { getPlanConfig } from "@/lib/plans";
import { eq, and } from "drizzle-orm";
import { enqueueInvoiceDocument } from "@/lib/invoice-intelligence/queue";
import { OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import type { DeliveryMode } from "@/lib/invoice-intelligence/delivery-format";

export const MAX_INVOICE_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_INVOICE_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/xml",
  "text/xml",
]);

export type InvoiceSendPayload = {
  subject: string;
  imageBase64: string;
  filename: string;
  mime: string;
  companyId?: number;
  messageBody?: string;
};

export type InvoiceSendResult = {
  status: number;
  body: Record<string, unknown>;
};

export async function sendInvoiceForUser(userId: string, data: InvoiceSendPayload): Promise<InvoiceSendResult> {
  const status = await getStatus(userId);
  const cfg = getPlanConfig(status.commercialPlan);

  if (!status.canSend) {
    return {
      status: 402,
      body: { success: false, error: "Paket ni aktiven. Nadgradite paket za nadaljevanje.", code: "subscription_required", plan: status.commercialPlan },
    };
  }

  if (status.isFree && status.monthlyUsage >= FREE_MONTHLY_LIMIT) {
    return {
      status: 403,
      body: { success: false, error: "Dosežena je mesečna omejitev 3 računov na brezplačnem paketu.", code: "free_limit_reached" },
    };
  }

  const bytes = Buffer.from(data.imageBase64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_INVOICE_FILE_BYTES) {
    return { status: 400, body: { success: false, error: "Neveljavna datoteka ali datoteka večja od 10 MB." } };
  }
  if (!ALLOWED_INVOICE_MIME.has(data.mime)) {
    return { status: 415, body: { success: false, error: "Nepodprt tip datoteke." } };
  }
  if (data.mime === "application/pdf" && bytes.subarray(0, 4).toString() !== "%PDF") {
    return { status: 400, body: { success: false, error: "Neveljaven PDF." } };
  }

  const db = getDb();
  let recipientEmail: string | null | undefined;
  let deliveryMode: DeliveryMode = "email_ocr";

  if (data.companyId) {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.id, data.companyId), eq(companies.clerkUserId, userId)))
      .limit(1);
    recipientEmail = company?.recipientEmail;
    if (company) deliveryMode = (await getCompanyDeliverySettings(company.id, userId)).mode;
  } else {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
    recipientEmail = settings?.recipientEmail;
  }

  if (!recipientEmail) {
    return { status: 422, body: { success: false, error: "V Nastavitvah določite prejemni e-mail.", code: "no_recipient" } };
  }

  if (deliveryMode === "xml_email" && !cfg.structuredDelivery) {
    return { status: 403, body: { success: false, error: "XML/eSLOG pošiljanje ni vključeno v vaš paket.", code: "feature_not_in_plan", upgradeUrl: "/cenik" } };
  }
  if (deliveryMode === "api_json" && !cfg.apiDelivery) {
    return { status: 403, body: { success: false, error: "JSON API pošiljanje ni vključeno v vaš paket.", code: "feature_not_in_plan", upgradeUrl: "/cenik" } };
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

  let processingDocumentId: number | null = null;
  let queueErrorMessage: string | null = null;
  let quotaError: OcrCommercialQuotaError | null = null;
  try {
    processingDocumentId = await enqueueInvoiceDocument({
      clerkUserId: userId,
      companyId: data.companyId ?? null,
      sourceInvoiceId: result.id,
      filename,
      mimeType: data.mime,
      base64: data.imageBase64,
    });
  } catch (error) {
    queueErrorMessage = error instanceof Error ? error.message : "unknown";
    if (error instanceof OcrCommercialQuotaError) quotaError = error;
    console.error("invoice_reader_enqueue_failed", queueErrorMessage);
  }

  if (deliveryMode !== "email_ocr") {
    if (!processingDocumentId) {
      await db.update(invoices).set({
        status: "failed",
        errorMessage: `Structured delivery could not be queued: ${queueErrorMessage || "unknown error"}`,
      }).where(eq(invoices.id, result.id));

      if (quotaError) {
        return {
          status: 402,
          body: { success: false, error: quotaError.message, code: quotaError.code, quotaType: quotaError.quotaType, plan: quotaError.plan, upgradeUrl: "/cenik" },
        };
      }
      return { status: 500, body: { success: false, error: "Strukturirane obdelave ni bilo mogoče uvrstiti v čakalno vrsto." } };
    }

    return {
      status: 200,
      body: { success: true, id: result.id, processingDocumentId, deliveryMode, queuedForStructuredDelivery: true },
    };
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
    return {
      status: 200,
      body: {
        success: true,
        id: result.id,
        processingDocumentId,
        deliveryMode,
        ocrQueued: Boolean(processingDocumentId),
        ocrLimitReached: Boolean(quotaError),
        ocrMessage: quotaError?.message ?? null,
        ocrPlan: quotaError?.plan ?? null,
      },
    };
  } catch (emailErr) {
    const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
    await db.update(invoices).set({ status: "failed", errorMessage: msg }).where(eq(invoices.id, result.id));
    return { status: 500, body: { success: false, error: msg, processingDocumentId, deliveryMode } };
  }
}

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "invoice";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255);
}
