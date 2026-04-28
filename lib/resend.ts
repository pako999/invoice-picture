import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendInvoiceEmail({
  to,
  subject,
  imageBase64,
  filename,
  mime = "image/jpeg",
}: {
  to: string;
  subject: string;
  imageBase64: string;
  filename: string;
  mime?: string;
}) {
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  return getResend().emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
          <span style="font-size:22px">🧾</span>
          <span style="font-size:20px;font-weight:700;color:#111">Invoice Picture</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;color:#111;margin:0 0 8px">${subject}</h1>
        <p style="color:#666;margin:0 0 28px;font-size:15px">Priložena je slika računa.</p>
        <img src="cid:invoice" style="width:100%;max-width:560px;border-radius:12px;border:1px solid #e5e7eb" />
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0" />
        <p style="color:#9ca3af;font-size:12px;margin:0">Poslano z <strong>Invoice Picture</strong></p>
      </div>
    `,
    attachments: [{ filename, content: imageBase64, contentType: mime }],
  });
}
