import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { BULK_PDF_GATEWAY_URL } from "@/lib/bulk-invoices/config";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoices } from "@/lib/schema";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoiceId = Number((await params).id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  }

  const db = getDb();
  const [invoice] = await db.select({
    filename: invoices.filename,
    mimeType: invoices.imageMime,
    imageData: invoices.imageData,
  }).from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.clerkUserId, userId)))
    .limit(1);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [document] = await db.select({
    filename: invoiceDocuments.filename,
    mimeType: invoiceDocuments.mimeType,
    originalBase64: invoiceDocuments.originalBase64,
    storageObjectKey: invoiceDocuments.storageObjectKey,
  }).from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.sourceInvoiceId, invoiceId), eq(invoiceDocuments.clerkUserId, userId)))
    .orderBy(desc(invoiceDocuments.id))
    .limit(1);

  if (document?.storageObjectKey) {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: "Session expired" }, { status: 401 });
    const signed = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-download`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key: document.storageObjectKey }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await signed.json().catch(() => ({})) as { url?: unknown };
    if (!signed.ok || typeof body.url !== "string") {
      return NextResponse.json({ error: "Could not open private document" }, { status: 502 });
    }
    return NextResponse.redirect(body.url, 307);
  }

  const base64 = document?.originalBase64 || invoice.imageData;
  const mimeType = document?.mimeType || invoice.mimeType || "application/pdf";
  const filename = document?.filename || invoice.filename || "invoice.pdf";
  if (!base64) return NextResponse.json({ error: "Document content is unavailable" }, { status: 404 });
  const bytes = Buffer.from(base64, "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${asciiFilename(filename)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function asciiFilename(filename: string) {
  return filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").slice(0, 180);
}
