import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { bulkInvoiceGroups, invoices } from "@/lib/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { backfillInvoiceCompanyIds } from "@/lib/backfill-invoice-company";

const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    // Split-PDF delivery predates its archive link. This idempotent insert
    // restores already delivered child PDFs and also covers interrupted jobs.
    await db.execute(sql`
      INSERT INTO "invoices" (
        "clerkUserId", "recipientEmail", "companyId", "subject", "imageMime",
        "filename", "bulkGroupId", "status", "errorMessage", "sentAt", "createdAt"
      )
      SELECT
        j."clerkUserId", j."recipientEmail", j."companyId",
        'Račun ' || (g."groupIndex" + 1)::text || '/' || greatest(j."totalInvoices", 1)::text || ' · ' || j."filename",
        'application/pdf',
        regexp_replace(j."filename", '\\.pdf$', '', 'i') || '-racun-' || lpad((g."groupIndex" + 1)::text, 3, '0') || '.pdf',
        g."id",
        CASE WHEN g."deliveryStatus" = 'completed' THEN 'sent'::invoice_status ELSE 'failed'::invoice_status END,
        g."deliveryError",
        CASE WHEN g."deliveryStatus" = 'completed' THEN g."updatedAt" ELSE NULL END,
        g."createdAt"
      FROM "bulkInvoiceGroups" g
      JOIN "bulkInvoiceJobs" j ON j."id" = g."jobId"
      WHERE j."clerkUserId" = ${userId}
        AND j."deliveryMode" = 'split_pdf_email'
        AND j."recipientEmail" IS NOT NULL
        AND g."deliveryStatus" IN ('completed', 'failed')
        AND g."archiveHidden" = false
      ON CONFLICT ("bulkGroupId") DO NOTHING
    `);
    // One-time-per-server company association for older archive entries.
    await backfillInvoiceCompanyIds();
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
        status: sql<"sent" | "pending" | "failed">`
          case
            when ${invoices.status} = 'pending' and exists (
              select 1
              from "invoiceDocuments" d
              join "invoiceProcessingJobs" j on j."documentId" = d."id"
              where d."sourceInvoiceId" = ${invoices.id}
                and d."status" = 'failed'
                and j."status" = 'failed'
                and j."attempts" >= j."maxAttempts"
            ) then 'failed'::invoice_status
            else ${invoices.status}
          end
        `,
        errorMessage: sql<string | null>`
          coalesce(
            ${invoices.errorMessage},
            (
              select j."lastError"
              from "invoiceDocuments" d
              join "invoiceProcessingJobs" j on j."documentId" = d."id"
              where d."sourceInvoiceId" = ${invoices.id}
                and j."status" = 'failed'
                and j."attempts" >= j."maxAttempts"
              order by d."id" desc
              limit 1
            )
          )
        `,
        documentId: sql<number | null>`
          (
            select d."id"
            from "invoiceDocuments" d
            where d."sourceInvoiceId" = ${invoices.id}
            order by d."id" desc
            limit 1
          )
        `,
        documentStatus: sql<string | null>`
          (
            select d."status"::text
            from "invoiceDocuments" d
            where d."sourceInvoiceId" = ${invoices.id}
            order by d."id" desc
            limit 1
          )
        `,
        sentAt: invoices.sentAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.clerkUserId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(100);
    return NextResponse.json(rows.map((row) => ({
      ...row,
      previewUrl: `/api/invoices/${row.id}/file`,
    })));
  } catch (error) {
    console.error("invoice_archive_load_failed", error);
    return NextResponse.json({ error: "Arhiva računov ni bilo mogoče naložiti." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = bulkDeleteSchema.parse(await req.json());
    const ids = [...new Set(body.ids)];
    const db = getDb();
    const linkedGroups = await db.select({ id: invoices.bulkGroupId }).from(invoices)
      .where(and(eq(invoices.clerkUserId, userId), inArray(invoices.id, ids)));
    const bulkGroupIds = linkedGroups.flatMap((row) => row.id == null ? [] : [row.id]);
    if (bulkGroupIds.length) {
      await db.update(bulkInvoiceGroups).set({ archiveHidden: true })
        .where(inArray(bulkInvoiceGroups.id, bulkGroupIds));
    }
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
