import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs, invoices } from "@/lib/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const restoreSchema = z.object({
  imageBase64: z.string().min(1).max(14 * 1024 * 1024),
  filename: z.string().min(1).max(255),
  mime: z.literal("application/pdf"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)))
    .limit(1);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [document] = await db
    .select({
      id: invoiceDocuments.id,
      status: invoiceDocuments.status,
      warningsJson: invoiceDocuments.warningsJson,
      originalBase64: invoiceDocuments.originalBase64,
      storageObjectKey: invoiceDocuments.storageObjectKey,
    })
    .from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.sourceInvoiceId, invoice.id), eq(invoiceDocuments.clerkUserId, userId)))
    .orderBy(desc(invoiceDocuments.id))
    .limit(1);

  const [processingJob] = document
    ? await db.select({
        status: invoiceProcessingJobs.status,
        attempts: invoiceProcessingJobs.attempts,
        maxAttempts: invoiceProcessingJobs.maxAttempts,
        lastError: invoiceProcessingJobs.lastError,
      }).from(invoiceProcessingJobs).where(eq(invoiceProcessingJobs.documentId, document.id)).limit(1)
    : [];

  const terminalOcrFailure = invoice.status === "pending"
    && document?.status === "failed"
    && processingJob?.status === "failed"
    && processingJob.attempts >= processingJob.maxAttempts;
  const previewAvailable = Boolean(invoice.imageData || document?.originalBase64 || document?.storageObjectKey);
  return NextResponse.json({
    ...invoice,
    status: terminalOcrFailure ? "failed" : invoice.status,
    errorMessage: invoice.errorMessage || (terminalOcrFailure ? friendlyOcrError(processingJob?.lastError, document?.warningsJson) : null),
    documentId: document?.id ?? null,
    previewUrl: previewAvailable ? `/api/invoices/${invoice.id}/file` : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = restoreSchema.parse(await req.json());
    const pdf = Buffer.from(data.imageBase64, "base64");
    if (pdf.length > MAX_PDF_BYTES || pdf.subarray(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ error: "Invalid PDF or file is larger than 10 MB." }, { status: 400 });
    }

    const { id } = await params;
    const db = getDb();
    const [updated] = await db
      .update(invoices)
      .set({ imageData: data.imageBase64, imageMime: data.mime, filename: data.filename })
      .where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)))
      .returning({ id: invoices.id });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  await db.delete(invoices).where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)));
  return NextResponse.json({ success: true });
}


function friendlyOcrError(lastError: string | null | undefined, warningsJson: string | null | undefined) {
  let fallback: unknown = lastError;
  if (!fallback && warningsJson) {
    try {
      const warnings = JSON.parse(warningsJson);
      fallback = Array.isArray(warnings) ? warnings[0] : null;
    } catch {
      fallback = null;
    }
  }
  if (typeof fallback === "string" && /(?:429|rate limit)/i.test(fallback)) {
    return "OCR storitev je trenutno preobremenjena. Samodejni poskusi so bili izčrpani; izberite Ponovno obdelaj.";
  }
  return typeof fallback === "string" ? fallback : "OCR obdelava ni uspela. Izberite Ponovno obdelaj.";
}
