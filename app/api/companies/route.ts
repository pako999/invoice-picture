import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };

const schema = z.object({
  name: z.string().min(1).max(255),
  recipientEmail: z.string().email(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  try {
    const db = getDb();
    const rows = await db.select().from(companies).where(eq(companies.clerkUserId, userId)).orderBy(desc(companies.createdAt));
    return NextResponse.json(rows, { headers: NO_STORE });
  } catch (err) {
    console.error("[companies GET]", err);
    return NextResponse.json([], { headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  try {
    const status = await getStatus(userId);
    const isPro = status.plan === "pro" && status.paid;
    if (!isPro) {
      const db = getDb();
      const existing = await db.select({ id: companies.id }).from(companies).where(eq(companies.clerkUserId, userId));
      if (existing.length >= 1) {
        return NextResponse.json({ error: "Multiple companies available on Pro plan only" }, { status: 403, headers: NO_STORE });
      }
    }
    const data = schema.parse(await req.json());
    const db = getDb();
    const [row] = await db.insert(companies).values({ clerkUserId: userId, ...data }).returning();
    return NextResponse.json(row, { headers: NO_STORE });
  } catch (err) {
    const msg = err instanceof z.ZodError ? "Neveljavni podatki." : "Napaka pri shranjevanju.";
    return NextResponse.json({ error: msg }, { status: 400, headers: NO_STORE });
  }
}
