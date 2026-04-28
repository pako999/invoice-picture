import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { sendInvoiceEmail } from "@/lib/resend";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1).default("Račun"),
  imageBase64: z.string().min(1),
  filename: z.string().min(1),
  mime: z.string().default("image/jpeg"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const db = getDb();

    // Store a small thumbnail (first 64KB of base64 is ~48KB image — enough for preview)
    const thumbData = data.imageBase64.length > 88000
      ? data.imageBase64.slice(0, 88000)
      : data.imageBase64;

    const [result] = await db.insert(invoices).values({
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      imageData: thumbData,
      imageMime: data.mime,
      filename: data.filename,
      status: "pending",
    }).$returningId();

    const id = result.id;

    try {
      await sendInvoiceEmail({
        to: data.recipientEmail,
        subject: data.subject,
        imageBase64: data.imageBase64,
        filename: data.filename,
        mime: data.mime,
      });

      await db.update(invoices)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(invoices.id, id));

      return NextResponse.json({ success: true, id });
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      await db.update(invoices)
        .set({ status: "failed", errorMessage: msg })
        .where(eq(invoices.id, id));
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
