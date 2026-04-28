import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireSession();
    const { id } = await params;
    const db = getDb();
    // Only delete if invoice belongs to this user
    await db.delete(invoices).where(and(eq(invoices.id, Number(id)), eq(invoices.userId, userId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
