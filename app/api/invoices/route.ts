import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(100);
    return NextResponse.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
