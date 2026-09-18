import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { MAX_INVOICE_FILE_BYTES, sendInvoiceForUser } from "@/lib/invoice-send-service";

const schema = z.object({
  uploadId: z.string().uuid(),
  subject: z.string().min(1).max(255).default("Račun"),
  filename: z.string().min(1).max(255),
  mime: z.string().max(96).default("application/pdf"),
  companyId: z.number().int().positive().optional(),
  messageBody: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const sql = neon(url);
  let uploadId: string | null = null;

  try {
    const input = schema.parse(await req.json());
    uploadId = input.uploadId;

    const rows = await sql`
      SELECT "chunkIndex", "totalChunks", "data"
      FROM "invoiceUploadChunks"
      WHERE "uploadId" = ${input.uploadId}
        AND "clerkUserId" = ${userId}
      ORDER BY "chunkIndex" ASC
    ` as Array<{ chunkIndex: number; totalChunks: number; data: string }>;

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "Upload ni bil najden. Poskusite ponovno." }, { status: 404 });
    }

    const totalChunks = Number(rows[0].totalChunks);
    const complete = rows.length === totalChunks
      && rows.every((row, index) => Number(row.chunkIndex) === index && Number(row.totalChunks) === totalChunks);
    if (!complete) {
      return NextResponse.json({ success: false, error: "Upload ni popoln. Poskusite ponovno." }, { status: 409 });
    }

    const bytes = Buffer.concat(rows.map((row) => Buffer.from(row.data, "base64")));
    if (!bytes.length || bytes.length > MAX_INVOICE_FILE_BYTES) {
      return NextResponse.json({ success: false, error: "Datoteka je večja od 10 MB." }, { status: 400 });
    }

    const result = await sendInvoiceForUser(userId, {
      subject: input.subject,
      imageBase64: bytes.toString("base64"),
      filename: input.filename,
      mime: input.mime,
      companyId: input.companyId,
      messageBody: input.messageBody,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Neveljavni podatki za zaključek uploada."
      : error instanceof Error ? error.message : "Napaka pri zaključku uploada.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  } finally {
    if (uploadId) {
      await sql`DELETE FROM "invoiceUploadChunks"
        WHERE "uploadId" = ${uploadId}
          AND "clerkUserId" = ${userId}`.catch(() => undefined);
    }
  }
}
