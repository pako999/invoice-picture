import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSql } from "@/lib/bulk-invoices/service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobId = Number((await params).id);
  if (!Number.isInteger(jobId) || jobId <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const sql = bulkSql();
  const jobs = await sql`SELECT "id" FROM "bulkInvoiceJobs" WHERE "id"=${jobId} AND "clerkUserId"=${userId} LIMIT 1`;
  if (!jobs.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const retried = await sql`
    UPDATE "bulkInvoiceGroups"
    SET "deliveryStatus"='pending',"deliveryError"=NULL,"updatedAt"=now()
    WHERE "jobId"=${jobId} AND "deliveryStatus"='failed' AND "documentId" IS NOT NULL
    RETURNING "id"
  `;
  if (!retried.length) return NextResponse.json({ error: "No failed email deliveries to retry" }, { status: 409 });

  await sql`
    UPDATE "bulkInvoiceJobs"
    SET "status"='processing',"stage"='extract',"lockedAt"=NULL,"lastError"=NULL,"completedAt"=NULL,"updatedAt"=now()
    WHERE "id"=${jobId}
  `;
  return NextResponse.json({ success: true, retried: retried.length });
}
