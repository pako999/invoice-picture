import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await requireSession();
    const db = getDb();
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(100);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
