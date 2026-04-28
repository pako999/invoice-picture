import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(invoices).where(eq(invoices.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
