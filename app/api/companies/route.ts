import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255),
  recipientEmail: z.string().email(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select().from(companies).where(eq(companies.clerkUserId, userId)).orderBy(desc(companies.createdAt));
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const db = getDb();
    const [row] = await db.insert(companies).values({ clerkUserId: userId, ...data }).returning();
    return NextResponse.json(row);
  } catch (err) {
    const msg = err instanceof z.ZodError ? "Neveljavni podatki." : "Napaka pri shranjevanju.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
