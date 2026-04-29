import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResend } from "@/lib/resend";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const resend = getResend();
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

    await resend.emails.send({
      from,
      to: "info@futurecode.si",
      replyTo: data.email,
      subject: `Kontaktni obrazec — ${data.name}${data.company ? ` (${data.company})` : ""}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <span style="font-size:22px">🧾</span>
            <span style="font-size:20px;font-weight:700;color:#111">Invoice Picture</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 24px">Novo sporočilo</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:120px">Ime:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.email}</td></tr>
            ${data.company ? `<tr><td style="padding:8px 0;color:#666">Podjetje:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.company}</td></tr>` : ""}
          </table>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:15px;color:#374151;line-height:1.6;white-space:pre-wrap">${data.message}</div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0" />
          <p style="color:#9ca3af;font-size:12px;margin:0">Invoice Picture · Sport Group d.o.o.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Napaka";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
