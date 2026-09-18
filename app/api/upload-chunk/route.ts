import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const MAX_CHUNK_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_CHUNKS = 8;

const schema = z.object({
  uploadId: z.string().uuid(),
  chunkIndex: z.number().int().min(0).max(MAX_TOTAL_CHUNKS - 1),
  totalChunks: z.number().int().min(1).max(MAX_TOTAL_CHUNKS),
  data: z.string().min(1).max(3 * 1024 * 1024),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = schema.parse(await req.json());
    if (input.chunkIndex >= input.totalChunks) {
      return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 });
    }

    const bytes = Buffer.from(input.data, "base64");
    if (!bytes.length || bytes.length > MAX_CHUNK_BYTES) {
      return NextResponse.json({ error: "Chunk is too large" }, { status: 413 });
    }

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const sql = neon(url);

    await sql`DELETE FROM "invoiceUploadChunks"
      WHERE "clerkUserId" = ${userId}
        AND "createdAt" < now() - interval '2 hours'`;

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
      ? "Invalid upload chunk"
      : error instanceof Error ? error.message : "Chunk upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
