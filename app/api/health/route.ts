import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ ok: false, error: "DATABASE_URL not set" });
  try {
    const sql = neon(url);
    const result = await sql`SELECT to_regclass('public."userSettings"') as exists`;
    return NextResponse.json({ ok: true, tableExists: result[0]?.exists !== null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
