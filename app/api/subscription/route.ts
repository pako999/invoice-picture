import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStatus } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getStatus(userId);
  return NextResponse.json(status);
}
