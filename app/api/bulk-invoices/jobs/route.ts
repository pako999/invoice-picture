import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = bulkSql();
  const rows = await sql`
    SELECT "id","filename","byteSize","status","stage","pageCount","ocrNextPage",
           "boundaryReviewRequired","totalInvoices","processedInvoices","lastError","createdAt","updatedAt","completedAt"
    FROM "bulkInvoiceJobs" WHERE "clerkUserId"=${userId}
    ORDER BY "createdAt" DESC LIMIT 100
  `;
  return NextResponse.json({ jobs: rows }, { headers: { "Cache-Control": "no-store" } });
}
