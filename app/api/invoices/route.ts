import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { backfillInvoiceCompanyIds } from "@/lib/backfill-invoice-company";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // One-time-per-server backfill so old invoices show up in the new
  // company-folder UI. Idempotent + cheap after the first call.
  await backfillInvoiceCompanyIds();

  try {
    const db = getDb();
    const rows = await db.select().from(invoices).where(eq(invoices.clerkUserId, userId)).orderBy(desc(invoices.createdAt)).limit(100);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
