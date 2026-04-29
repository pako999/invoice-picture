import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  // DB check
  const url = process.env.DATABASE_URL;
  let dbOk = false;
  let tableExists = false;
  try {
    const sql = neon(url!);
    const result = await sql`SELECT to_regclass('public."userSettings"') as exists`;
    dbOk = true;
    tableExists = result[0]?.exists !== null;
  } catch {}

  // Auth check
  const { userId } = await auth();

  return NextResponse.json({
    db: dbOk,
    tableExists,
    clerkUserId: userId ?? null,
    hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  });
}
