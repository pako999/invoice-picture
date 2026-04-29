import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255),
  recipientEmail: z.string().email(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const data = schema.parse(await req.json());
    const db = getDb();
    const [row] = await db.update(companies).set(data)
      .where(and(eq(companies.id, Number(id)), eq(companies.clerkUserId, userId)))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    const msg = err instanceof z.ZodError ? "Neveljavni podatki." : "Napaka.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(companies).where(and(eq(companies.id, Number(id)), eq(companies.clerkUserId, userId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Napaka." }, { status: 500 });
  }
}
