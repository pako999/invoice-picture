import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments } from "@/lib/schema";
import { verifyDocumentSignature } from "@/lib/invoice-intelligence/signing";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documentId = Number((await params).id);
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyDocumentSignature(documentId, userId, exp, sig)) {
    return NextResponse.json({ error: "Invalid or expired document URL" }, { status: 403 });
  }

  const db = getDb();
  const [document] = await db.select({
    id: invoiceDocuments.id,
    filename: invoiceDocuments.filename,
    mimeType: invoiceDocuments.mimeType,
    originalBase64: invoiceDocuments.originalBase64,
  }).from(invoiceDocuments).where(and(eq(invoiceDocuments.id, documentId), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = Buffer.from(document.originalBase64, "base64");
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: userId, action: "download", metadataJson: JSON.stringify({ inline: true }) });
  const inline = document.mimeType === "application/pdf" || document.mimeType.startsWith("image/");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiFilename(document.filename)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
    },
  });
}

function asciiFilename(filename: string) {
  return filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").slice(0, 180);
}
