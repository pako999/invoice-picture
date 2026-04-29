import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { invoices, userSettings } from "@/lib/schema";
import { sendInvoiceEmail } from "@/lib/resend";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(1).default("Račun"),
  imageBase64: z.string().min(1),
  filename: z.string().min(1),
  mime: z.string().default("image/jpeg"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = schema.parse(await req.json());
    const db = getDb();

    const [settings] = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, userId)).limit(1);
    const recipientEmail = settings?.recipientEmail;
    if (!recipientEmail) {
      return NextResponse.json({ success: false, error: "Nastavi email prejemnika v Nastavitvah." }, { status: 422 });
    }

    const thumbData = data.imageBase64.length > 88000 ? data.imageBase64.slice(0, 88000) : data.imageBase64;

    const [result] = await db.insert(invoices).values({
      clerkUserId: userId,
      recipientEmail,
      subject: data.subject,
      imageData: thumbData,
      imageMime: data.mime,
      filename: data.filename,
      status: "pending",
    }).returning({ id: invoices.id });

    try {
      await sendInvoiceEmail({ to: recipientEmail, subject: data.subject, imageBase64: data.imageBase64, filename: data.filename, mime: data.mime });
      await db.update(invoices).set({ status: "sent", sentAt: new Date() }).where(eq(invoices.id, result.id));
      return NextResponse.json({ success: true, id: result.id });
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      await db.update(invoices).set({ status: "failed", errorMessage: msg }).where(eq(invoices.id, result.id));
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
