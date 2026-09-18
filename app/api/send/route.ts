import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sendInvoiceForUser } from "@/lib/invoice-send-service";

const schema = z.object({
  subject: z.string().min(1).max(255).default("Račun"),
  imageBase64: z.string().min(1).max(14 * 1024 * 1024),
  filename: z.string().min(1).max(255),
  mime: z.string().max(96).default("image/jpeg"),
  companyId: z.number().int().positive().optional(),
  messageBody: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = schema.parse(await req.json());
    const result = await sendInvoiceForUser(userId, data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    const message = err instanceof z.ZodError
      ? "Neveljavni podatki za pošiljanje računa."
      : err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
