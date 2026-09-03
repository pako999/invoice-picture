type BrandedEmailOptions = {
  preheader: string;
  eyebrow?: string;
  title: string;
  introHtml: string;
  contentHtml?: string;
  noticeHtml?: string;
  cta?: { label: string; url: string };
};

export function brandedEmail({
  preheader,
  eyebrow,
  title,
  introHtml,
  contentHtml = "",
  noticeHtml = "",
  cta,
}: BrandedEmailOptions) {
  return `<!doctype html>
  <html lang="sl">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9">
        <tr><td align="center" style="padding:32px 12px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.08)">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:24px 32px">
                <a href="https://www.posljiracun.si" style="text-decoration:none">
                  <img src="https://www.posljiracun.si/logo-dark.svg" width="200" height="50" alt="Slikaj Račun" style="display:block;width:200px;max-width:100%;height:auto;border:0">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 32px">
                ${eyebrow ? `<p style="margin:0 0 10px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${eyebrow}</p>` : ""}
                <h1 style="margin:0 0 16px;color:#0f172a;font-size:30px;line-height:1.2;letter-spacing:-.02em">${title}</h1>
                <div style="color:#475569;font-size:16px;line-height:1.7">${introHtml}</div>
                ${contentHtml}
                ${noticeHtml ? `<div style="margin-top:24px;padding:16px 18px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-size:15px;line-height:1.6">${noticeHtml}</div>` : ""}
                ${cta ? `<div style="margin-top:28px"><a href="${cta.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:10px;font-size:15px;font-weight:700">${cta.label}</a></div>` : ""}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;color:#64748b;font-size:12px;line-height:1.7">
                <strong style="color:#334155">Sport Group d.o.o.</strong><br>
                Osojnikova ulica 4, 2000 Maribor, Slovenija · ID za DDV: SI72133449<br>
                <a href="mailto:info@posljiracun.si" style="color:#2563eb;text-decoration:none">info@posljiracun.si</a>
                &nbsp;·&nbsp;
                <a href="https://www.posljiracun.si" style="color:#2563eb;text-decoration:none">www.posljiracun.si</a>
                <p style="margin:12px 0 0;color:#94a3b8">Sporočilo je bilo poslano samodejno prek storitve Slikaj Račun.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}
