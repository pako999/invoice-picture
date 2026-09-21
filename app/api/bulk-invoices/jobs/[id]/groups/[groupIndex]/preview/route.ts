import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BULK_PDF_GATEWAY_URL } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; groupIndex: string }> },
) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const values = await params;
  const jobId = Number(values.id);
  const groupIndex = Number(values.groupIndex);
  if (!Number.isInteger(jobId) || jobId <= 0 || !Number.isInteger(groupIndex) || groupIndex < 0) {
    return NextResponse.json({ error: "Invalid invoice group" }, { status: 400 });
  }

  const sql = bulkSql();
  const rows = await sql`
    SELECT g."objectKey"
    FROM "bulkInvoiceGroups" g
    INNER JOIN "bulkInvoiceJobs" j ON j."id" = g."jobId"
    WHERE g."jobId" = ${jobId}
      AND g."groupIndex" = ${groupIndex}
      AND j."clerkUserId" = ${userId}
    LIMIT 1
  `;
  const objectKey = rows[0]?.objectKey;
  if (typeof objectKey !== "string" || !objectKey) {
    return NextResponse.json({ error: "Predogled še ni pripravljen." }, { status: 404 });
  }

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });
  const signed = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-download`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key: objectKey }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await signed.json().catch(() => ({})) as { url?: unknown; error?: unknown };
  if (!signed.ok || typeof body.url !== "string") {
    return NextResponse.json({ error: String(body.error ?? "Predogleda ni mogoče odpreti.") }, { status: 502 });
  }

  return NextResponse.json({ fileUrl: body.url }, { headers: { "Cache-Control": "private, no-store" } });
}
