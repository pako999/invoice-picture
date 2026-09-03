import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const restoreSchema = z.object({
  imageBase64: z.string().min(1).max(14 * 1024 * 1024),
  filename: z.string().min(1).max(255),
  mime: z.literal("application/pdf"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)))
    .limit(1);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = restoreSchema.parse(await req.json());
    const pdf = Buffer.from(data.imageBase64, "base64");
    if (pdf.length > MAX_PDF_BYTES || pdf.subarray(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ error: "Invalid PDF or file is larger than 10 MB." }, { status: 400 });
    }

    const { id } = await params;
    const db = getDb();
    const [updated] = await db
      .update(invoices)
      .set({ imageData: data.imageBase64, imageMime: data.mime, filename: data.filename })
      .where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)))
      .returning({ id: invoices.id });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  await db.delete(invoices).where(and(eq(invoices.id, Number(id)), eq(invoices.clerkUserId, userId)));
  return NextResponse.json({ success: true });
}
