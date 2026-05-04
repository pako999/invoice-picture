import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

/** First time a signed-in user opens Settings, pre-fill the default
 *  recipient email with their Clerk primary email — same as the
 *  user.created webhook does for new sign-ups, but covers existing
 *  users who signed up before this feature shipped. Idempotent: only
 *  writes on the first call when the column is empty. */
async function lazySeedDefaultEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find((e) => e.id === primaryId)
      ?? user.emailAddresses[0];
    const email = primary?.emailAddress ?? null;
    if (!email) return null;

    const db = getDb();
    await db.insert(userSettings).values({
      clerkUserId: userId,
      recipientEmail: email,
    });
    return email;
  } catch (e) {
    console.warn("[settings GET] lazy seed failed:", e);
    return null;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    const [row] = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);

    // No row at all → first time opening settings on an existing
    // pre-feature account. Pre-fill from the Clerk primary email.
    if (!row) {
      const email = await lazySeedDefaultEmail(userId);
      return NextResponse.json({ recipientEmail: email ?? "" });
    }

    return NextResponse.json({ recipientEmail: row.recipientEmail ?? "" });
  } catch {
    return NextResponse.json({ recipientEmail: "" });
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { recipientEmail } = z.object({ recipientEmail: z.string().email() }).parse(await req.json());
    const db = getDb();

    const existing = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(userSettings).set({ recipientEmail }).where(eq(userSettings.clerkUserId, userId));
    } else {
      await db.insert(userSettings).values({ clerkUserId: userId, recipientEmail });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const isValidation = err instanceof z.ZodError;
    const detail = JSON.stringify(err, Object.getOwnPropertyNames(err));
    console.error("[settings PUT]", detail);
    const msg = isValidation ? "Vnesite veljaven email naslov." : `Napaka: ${detail}`;
    return NextResponse.json({ error: msg }, { status: isValidation ? 400 : 500 });
  }
}
