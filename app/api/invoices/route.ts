import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { backfillInvoiceCompanyIds } from "@/lib/backfill-invoice-company";

const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

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

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = bulkDeleteSchema.parse(await req.json());
    const ids = [...new Set(body.ids)];
    const db = getDb();
    const deleted = await db
      .delete(invoices)
      .where(and(eq(invoices.clerkUserId, userId), inArray(invoices.id, ids)))
      .returning({ id: invoices.id });

    return NextResponse.json({ success: true, deleted: deleted.length });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid invoice selection. Choose between 1 and 100 invoices." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to delete invoices." }, { status: 500 });
  }
}
