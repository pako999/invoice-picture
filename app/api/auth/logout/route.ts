import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
