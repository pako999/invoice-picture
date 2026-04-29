import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db.select().from(invoices).where(eq(invoices.clerkUserId, userId)).orderBy(desc(invoices.createdAt)).limit(100);
  return NextResponse.json(rows);
}
