import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getResend } from "@/lib/resend";

const orderSchema = z.object({
  tier: z.enum(["basic", "pro"]),
  billing: z.enum(["monthly", "yearly"]),
  customerType: z.enum(["private", "company"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  streetAddress: z.string().trim().min(3).max(180),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  companyName: z.string().trim().max(180).optional(),
  taxNumber: z.string().trim().max(40).optional(),
  note: z.string().trim().max(1000).optional(),
  acceptedTerms: z.literal(true),
  locale: z.enum(["sl", "en"]).default("sl"),
  website: z.string().max(0).optional(),
}).superRefine((data, ctx) => {
  if (data.customerType !== "company") return;
  if (!data.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required" });
  if (!data.taxNumber) ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "Tax number is required" });
});

const prices = {
  basic: { monthly: "6,99 € / mesec", yearly: "66,90 € / leto" },
  pro: { monthly: "17,99 € / mesec", yearly: "171,99 € / leto" },
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const data = orderSchema.parse(await req.json());
    const { userId } = await auth();
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
    const price = prices[data.tier][data.billing];
    const plan = data.tier === "basic" ? "Osnovni" : "PRO";
    const customer = data.customerType === "company" ? "Podjetje" : "Fizična oseba";

    const row = (label: string, value: string) => `
      <tr><td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>`;

    const adminResult = await getResend().emails.send({
      from,
      to: "info@posljiracun.si",
      replyTo: data.email,
      subject: `Novo naročilo po predračunu – ${plan} – ${data.fullName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a">
          <h1>Novo naročilo po predračunu</h1>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0">
            ${row("Paket", `${plan} – ${price}`)}
            ${row("Tip stranke", customer)}
            ${row("Ime in priimek", data.fullName)}
            ${row("E-pošta", data.email)}
            ${row("Telefon", data.phone)}
            ${row("Naslov", data.streetAddress)}
            ${row("Pošta in kraj", `${data.postalCode} ${data.city}`)}
            ${row("Država", data.country)}
            ${data.customerType === "company" ? row("Podjetje", data.companyName ?? "") + row("Davčna številka", data.taxNumber ?? "") : ""}
            ${data.note ? row("Opomba", data.note) : ""}
            ${row("Clerk uporabnik", userId ?? "ni prijavljen")}
          </table>
          <p style="margin-top:20px">Odgovorite neposredno na to sporočilo in pošljite stranki predračun.</p>
        </div>`,
    });

    if (adminResult.error) throw new Error(adminResult.error.message);

    await getResend().emails.send({
      from,
      to: data.email,
      subject: data.locale === "en" ? "We received your pro forma invoice request" : "Prejeli smo vaše naročilo za predračun",
      html: data.locale === "en"
        ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1>Thank you for your order</h1><p>We received your request for the <strong>${plan} – ${price}</strong> plan. We will prepare and email your pro forma invoice shortly.</p><p>Slikaj Račun</p></div>`
        : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1>Hvala za naročilo</h1><p>Prejeli smo naročilo za paket <strong>${plan} – ${price}</strong>. Predračun bomo pripravili in vam ga v kratkem poslali po e-pošti.</p><p>Slikaj Račun</p></div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
