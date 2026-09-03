import { Resend } from "resend";
import { brandedEmail } from "./email-template";

let _resend: Resend | null = null;

export function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

/** Lightweight HTML escape for user-supplied text — we never want raw user
 *  input in the email body to break out of the surrounding tags. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInvoiceEmail({
  to,
  subject,
  imageBase64,
  filename,
  mime = "image/jpeg",
  messageBody,
}: {
  to: string;
  subject: string;
  imageBase64: string;
  filename: string;
  mime?: string;
  messageBody?: string;
}) {
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  // If the user added a personal note, render it as its own block above the
  // invoice image. Newlines become <br> so multi-line notes survive transit.
  const noteBlock = messageBody?.trim()
    ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;white-space:pre-wrap">${escapeHtml(messageBody.trim()).replace(/\n/g, "<br>")}</div>
      `
    : "";

  return getResend().emails.send({
    from,
    to,
    subject,
    html: brandedEmail({
      preheader: subject,
      eyebrow: "Nov dokument",
      title: escapeHtml(subject),
      introHtml: "<p style=\"margin:0\">V priponki je račun, poslan prek aplikacije Slikaj Račun.</p>",
      contentHtml: `${noteBlock}<div style="margin-top:20px"><img src="cid:invoice" alt="Predogled računa" style="display:block;width:100%;max-width:560px;border-radius:12px;border:1px solid #e5e7eb" /></div>`,
    }),
    attachments: [{ filename, content: imageBase64, contentType: mime }],
  });
}
