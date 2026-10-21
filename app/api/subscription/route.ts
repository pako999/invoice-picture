import { NextResponse } from "next/server";
import { workspaceAuth as auth } from "@/lib/workspace";
import { getStatus } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getStatus(userId);
  return NextResponse.json(status);
}
