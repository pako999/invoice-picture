import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await requireSession();
    const db = getDb();
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return NextResponse.json({ recipientEmail: row?.recipientEmail ?? "" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const { recipientEmail } = z.object({ recipientEmail: z.string().email() }).parse(await req.json());
    const db = getDb();

    const existing = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(userSettings).set({ recipientEmail }).where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({ userId, recipientEmail });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
