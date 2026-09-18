import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { getStatus } from "@/lib/subscription";
import { BULK_PDF_GATEWAY_URL, BULK_PDF_MAX_BYTES } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";

const schema = z.object({
  objectKey: z.string().min(1).max(1024),
  filename: z.string().min(1).max(255),
  byteSize: z.number().int().positive().max(BULK_PDF_MAX_BYTES),
  companyId: z.number().int().positive().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = schema.parse(await req.json());
    if (!input.objectKey.startsWith(`bulk/${userId}/`) || !/\.pdf$/i.test(input.filename)) {
      return NextResponse.json({ error: "Neveljaven bulk PDF." }, { status: 400 });
    }
    const status = await getStatus(userId);
    if (!status.canSend) return NextResponse.json({ error: "Paket ni aktiven.", code: "subscription_required" }, { status: 402 });

    const db = getDb();
    if (input.companyId) {
      const [company] = await db.select({ id: companies.id }).from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.clerkUserId, userId))).limit(1);
      if (!company) return NextResponse.json({ error: "Podjetje ni bilo najdeno." }, { status: 404 });
    }

    const sql = bulkSql();
    const [counts, globalCounts] = await Promise.all([
      sql`SELECT count(*)::int AS count FROM "bulkInvoiceJobs" WHERE "clerkUserId"=${userId} AND "status"='processing'`,
      sql`SELECT count(*)::int AS count FROM "bulkInvoiceJobs" WHERE "status"='processing'`,
    ]);
    if (Number(counts[0]?.count ?? 0) >= 2) return NextResponse.json({ error: "Hkrati lahko obdelujete največ 2 velika PDF paketa.", code: "bulk_backpressure" }, { status: 429 });
    if (Number(globalCounts[0]?.count ?? 0) >= 120) return NextResponse.json({ error: "Sistem trenutno obdeluje veliko bulk PDF-jev. Poskusite ponovno čez nekaj minut.", code: "bulk_backpressure" }, { status: 429 });

    const token = await getToken();
    if (!token) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });
    const signed = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-download`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key: input.objectKey }),
      signal: AbortSignal.timeout(15_000),
    });
    const signedBody = await signed.json().catch(() => ({}));
    if (!signed.ok || !signedBody.url) throw new Error("Naloženega PDF-ja ni mogoče preveriti.");
    const probe = await fetch(String(signedBody.url), { headers: { Range: "bytes=0-3" }, signal: AbortSignal.timeout(20_000) });
    if (!probe.ok && probe.status !== 206) throw new Error("PDF ni dosegljiv v zasebni shrambi.");
    const header = Buffer.from(await probe.arrayBuffer()).subarray(0, 4).toString();
    if (header !== "%PDF") throw new Error("Naložena datoteka ni veljaven PDF.");
    const range = probe.headers.get("content-range");
    const storedSize = range?.match(/\/(\d+)$/)?.[1] ? Number(range.match(/\/(\d+)$/)![1]) : input.byteSize;
    if (storedSize !== input.byteSize) throw new Error("Velikost naloženega PDF-ja se ne ujema.");

    const filename = sanitize(input.filename);
    const rows = await sql`
      INSERT INTO "bulkInvoiceJobs" ("clerkUserId","companyId","objectKey","filename","byteSize","status","stage","createdAt","updatedAt")
      VALUES (${userId},${input.companyId ?? null},${input.objectKey},${filename},${input.byteSize},'processing','uploaded',now(),now())
      ON CONFLICT ("clerkUserId","objectKey") DO UPDATE SET "updatedAt"=now()
      RETURNING "id","stage","status"
    `;
    return NextResponse.json({ success: true, job: rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bulk upload ni uspel." }, { status: 400 });
  }
}
function sanitize(v:string){return v.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g,"").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g,"_").slice(0,255)||"bulk.pdf";}
