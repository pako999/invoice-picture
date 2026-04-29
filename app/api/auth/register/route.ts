import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users, userSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import { COOKIE } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Geslo mora imeti vsaj 6 znakov"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const db = getDb();

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email je že v uporabi" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [result] = await db.insert(users).values({
      email: body.email,
      passwordHash,
      name: body.name ?? null,
    }).returning({ id: users.id });

    await db.insert(userSettings).values({ userId: result.id, recipientEmail: null });

    const token = await signToken({ userId: result.id, email: body.email });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
