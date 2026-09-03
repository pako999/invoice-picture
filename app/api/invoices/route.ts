import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import { backfillInvoiceCompanyIds } from "@/lib/backfill-invoice-company";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // One-time-per-server backfill so old invoices show up in the new
  // company-folder UI. Idempotent + cheap after the first call.
  await backfillInvoiceCompanyIds();

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: invoices.id,
        clerkUserId: invoices.clerkUserId,
        recipientEmail: invoices.recipientEmail,
        companyId: invoices.companyId,
        subject: invoices.subject,
        // Images are already compressed thumbnails. PDF data can be much
        // larger, so it is fetched only when the user hovers or opens it.
        imageData: sql<string | null>`case when ${invoices.imageMime} = 'application/pdf' then null else ${invoices.imageData} end`,
        imageMime: invoices.imageMime,
        filename: invoices.filename,
        status: invoices.status,
        errorMessage: invoices.errorMessage,
        sentAt: invoices.sentAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.clerkUserId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(100);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
