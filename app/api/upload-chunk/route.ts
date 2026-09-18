import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { MAX_PDF_UPLOAD_CHUNKS, PDF_UPLOAD_CHUNK_BYTES } from "@/lib/pdf-upload-limits";

const MAX_ACTIVE_UPLOADS_PER_USER = 3;
const MAX_ACTIVE_UPLOADS_GLOBAL = 300;

const schema = z.object({
  uploadId: z.string().uuid(),
  chunkIndex: z.number().int().min(0).max(MAX_PDF_UPLOAD_CHUNKS - 1),
  totalChunks: z.number().int().min(1).max(MAX_PDF_UPLOAD_CHUNKS),
  data: z.string().min(1).max(750_000),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = schema.parse(await req.json());
    if (input.chunkIndex >= input.totalChunks) {
      return NextResponse.json({ error: "Neveljaven del datoteke." }, { status: 400 });
    }

    const bytes = Buffer.from(input.data, "base64");
    if (!bytes.length || bytes.length > PDF_UPLOAD_CHUNK_BYTES) {
      return NextResponse.json({ error: "Del datoteke je prevelik." }, { status: 413 });
    }

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const sql = neon(url);

    if (input.chunkIndex === 0) {
      await sql`DELETE FROM "invoiceUploadChunks"
        WHERE "createdAt" < now() - interval '2 hours'
          AND NOT EXISTS (
            SELECT 1 FROM "invoiceUploadJobs" j
            WHERE j."uploadId" = "invoiceUploadChunks"."uploadId"
              AND j."clerkUserId" = "invoiceUploadChunks"."clerkUserId"
              AND j."status" IN ('queued','processing','failed')
          )`;

      const [userRows, globalRows, existingRows] = await Promise.all([
        sql`SELECT count(DISTINCT "uploadId")::int AS count
            FROM "invoiceUploadChunks"
            WHERE "clerkUserId" = ${userId}
              AND "createdAt" >= now() - interval '2 hours'`,
        sql`SELECT count(DISTINCT "uploadId")::int AS count
            FROM "invoiceUploadChunks"
            WHERE "createdAt" >= now() - interval '2 hours'`,
        sql`SELECT 1 FROM "invoiceUploadChunks"
            WHERE "uploadId" = ${input.uploadId} AND "clerkUserId" = ${userId}
            LIMIT 1`,
      ]);

      if (!existingRows.length && Number(userRows[0]?.count ?? 0) >= MAX_ACTIVE_UPLOADS_PER_USER) {
        return NextResponse.json({
          error: "Preveč aktivnih uploadov. Počakajte, da se trenutni zaključijo.",
          code: "upload_backpressure",
        }, { status: 429, headers: { "Retry-After": "10" } });
      }

      if (!existingRows.length && Number(globalRows[0]?.count ?? 0) >= MAX_ACTIVE_UPLOADS_GLOBAL) {
        return NextResponse.json({
          error: "Sistem trenutno obdeluje veliko dokumentov. Poskusite ponovno čez nekaj sekund.",
          code: "upload_backpressure",
        }, { status: 429, headers: { "Retry-After": "15" } });
      }
    }

    await sql`
      INSERT INTO "invoiceUploadChunks"
        ("uploadId", "clerkUserId", "chunkIndex", "totalChunks", "data", "createdAt")
      VALUES
        (${input.uploadId}, ${userId}, ${input.chunkIndex}, ${input.totalChunks}, ${input.data}, now())
      ON CONFLICT ("uploadId", "clerkUserId", "chunkIndex")
      DO UPDATE SET
        "totalChunks" = EXCLUDED."totalChunks",
        "data" = EXCLUDED."data",
        "createdAt" = now()
    `;

    return NextResponse.json({ success: true, chunkIndex: input.chunkIndex });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Neveljaven upload."
      : error instanceof Error ? error.message : "Upload ni uspel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
