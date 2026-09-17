import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOcrUsageSummary } from "@/lib/invoice-intelligence/quota";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = await getOcrUsageSummary(userId);
    return NextResponse.json(summary, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("ocr_usage_summary_failed", error);
    return NextResponse.json({ error: "OCR usage is temporarily unavailable." }, { status: 500 });
  }
}
