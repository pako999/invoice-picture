import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });

  try {
    const db = getDb();
    const [row] = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
    return NextResponse.json({ recipientEmail: row?.recipientEmail ?? "" }, { headers: NO_STORE });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ recipientEmail: "", error: "db_error" }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });

  try {
    const { recipientEmail } = z.object({ recipientEmail: z.string().email() }).parse(await req.json());
    const db = getDb();

    const existing = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(userSettings).set({ recipientEmail }).where(eq(userSettings.clerkUserId, userId));
    } else {
      await db.insert(userSettings).values({ clerkUserId: userId, recipientEmail });
    }
    return NextResponse.json({ success: true, recipientEmail }, { headers: NO_STORE });
  } catch (err) {
    const isValidation = err instanceof z.ZodError;
    const detail = JSON.stringify(err, Object.getOwnPropertyNames(err));
    console.error("[settings PUT]", detail);
    const msg = isValidation ? "Vnesite veljaven email naslov." : `Napaka: ${detail}`;
    return NextResponse.json({ error: msg }, { status: isValidation ? 400 : 500, headers: NO_STORE });
  }
}
