import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getResend } from "@/lib/resend";

const schema = z.object({
  name: z.string().min(2, "Ime mora vsebovati vsaj 2 znaka."),
  email: z.string().email("Vnesite veljaven email naslov."),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Sporočilo mora vsebovati vsaj 10 znakov."),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const resend = getResend();
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

    const subjectLine = data.subject?.trim()
      ? `Kontakt — ${data.subject.trim()} · ${data.name}`
      : `Kontaktni obrazec — ${data.name}${data.company ? ` (${data.company})` : ""}`;

    const { error: sendError } = await resend.emails.send({
      from,
      to: "info@posljiracun.si",
      replyTo: data.email,
      subject: subjectLine,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <span style="font-size:22px">🧾</span>
            <span style="font-size:20px;font-weight:700;color:#111">Slikaj Račun</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 24px">Novo sporočilo</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:120px">Ime:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.email}</td></tr>
            ${data.company ? `<tr><td style="padding:8px 0;color:#666">Podjetje:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.company}</td></tr>` : ""}
            ${data.subject ? `<tr><td style="padding:8px 0;color:#666">Zadeva:</td><td style="padding:8px 0;color:#111;font-weight:600">${data.subject}</td></tr>` : ""}
          </table>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:15px;color:#374151;line-height:1.6;white-space:pre-wrap">${data.message}</div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0" />
          <p style="color:#9ca3af;font-size:12px;margin:0">Slikaj Račun · Sport Group d.o.o.</p>
        </div>
      `,
    });

    if (sendError) throw new Error(sendError.message ?? "Napaka pri pošiljanju.");

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      const friendly = err.issues.map((i) => i.message).join(" ");
      return NextResponse.json({ success: false, error: friendly }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Napaka pri pošiljanju.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
