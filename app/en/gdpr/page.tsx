import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "GDPR compliance",
  description:
    "Slikaj Račun GDPR compliance statement. Data controller, lawful bases for processing, data subject rights, retention, international transfers and security measures.",
  slug: "gdpr",
  locale: "en",
});

export default function Gdpr() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">GDPR — Personal Data Protection Statement</h1>
          <p className="text-lg text-slate-600">Last updated: May 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Data Controller</h2>
            <p className="text-slate-700">The controller of your personal data is:</p>
            <p className="text-slate-700 mt-3">
              <strong>Sport Group d.o.o.</strong><br />
              Osojnikova 4, 2000 Maribor, Slovenia<br />
              VAT ID: SI72133449<br />
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a><br />
              Phone: +386 41 580 250
            </p>
            <p className="text-slate-700 mt-3">
              This statement explains how we process personal data in accordance with the General Data Protection Regulation (Regulation (EU) 2016/679 — &ldquo;GDPR&rdquo;) and the Slovenian Personal Data Protection Act (ZVOP-2).
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Categories of personal data processed</h2>
            <p className="text-slate-700 mb-3">We process the following categories of personal data:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Identification data:</strong> first name, last name, email address</li>
              <li><strong>Authentication data:</strong> hashed password, sign-in history (via Clerk)</li>
              <li><strong>Company contact data:</strong> company names and OCR email addresses of accounting programs</li>
              <li><strong>Document content:</strong> photos and PDFs of invoices you upload</li>
              <li><strong>Technical data:</strong> IP address, device type, browser, access timestamps</li>
              <li><strong>Payment data:</strong> processed via Apple In-App Purchase or Paddle (we never store card numbers ourselves)</li>
              <li><strong>Statistical data:</strong> number of sent invoices, delivery status, monthly usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Lawful bases for processing (Art. 6 GDPR)</h2>
            <p className="text-slate-700 mb-3">We process your personal data on the following lawful bases:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>
                <strong>Performance of a contract (Art. 6(1)(b)):</strong> processing is necessary to deliver the service you subscribed to — account registration, invoice forwarding, archiving, billing.
              </li>
              <li>
                <strong>Legal obligation (Art. 6(1)(c)):</strong> tax and accounting laws require us to retain certain data (e.g. issued invoices for 5–10 years).
              </li>
              <li>
                <strong>Legitimate interests (Art. 6(1)(f)):</strong> service security (preventing abuse, fraud detection), product improvement, and user communication.
              </li>
              <li>
                <strong>Consent (Art. 6(1)(a)):</strong> for marketing communications and non-essential cookies (analytics). You may withdraw consent at any time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Purposes of processing</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Providing the service of forwarding invoices to accounting software</li>
              <li>Managing user accounts and authentication</li>
              <li>Processing subscription payments and issuing receipts</li>
              <li>Customer support and communication</li>
              <li>System security and abuse prevention</li>
              <li>Compliance with legal obligations (tax law)</li>
              <li>Anonymous analytics for product improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Retention periods</h2>
            <p className="text-slate-700 mb-3">We keep your data only as long as necessary:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>User account and settings:</strong> for as long as your account is active. Upon account deletion, data is purged within 30 days.</li>
              <li><strong>Invoice images and PDFs in your archive:</strong> until you delete them yourself or request account deletion.</li>
              <li><strong>Payment records:</strong> 10 years (Slovenian tax law).</li>
              <li><strong>Security logs:</strong> at most 12 months.</li>
              <li><strong>Marketing consent:</strong> until you withdraw consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Sharing data with third parties</h2>
            <p className="text-slate-700 mb-3">
              We share your data only with contractual processors bound by data-processing agreements:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Clerk Inc. (USA):</strong> authentication and user management</li>
              <li><strong>Neon Inc. (EU):</strong> database hosting (PostgreSQL in EU region)</li>
              <li><strong>Vercel Inc. (USA / EU):</strong> application hosting, CDN</li>
              <li><strong>Resend Inc. (USA):</strong> email delivery (invoices, system emails)</li>
              <li><strong>Apple Inc. (USA):</strong> payment processing in the iOS app (In-App Purchase)</li>
              <li><strong>Paddle.com Market Ltd (UK):</strong> payment processing on the website</li>
              <li><strong>Your accounting program:</strong> we forward the invoice image to the email address you configured (e.g. <code>import@minimax.si</code>)</li>
            </ul>
            <p className="text-slate-700 mt-3">
              <strong>We do not sell your data</strong> to third parties for marketing. We may share it only when explicitly required by law, in response to lawful requests from competent state authorities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. International data transfers</h2>
            <p className="text-slate-700">
              Some of our processors are located outside the EU/EEA (e.g. USA). In such cases we ensure an adequate level of protection through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>European Commission Standard Contractual Clauses (SCCs)</li>
              <li>EU-US Data Privacy Framework (where the processor is certified)</li>
              <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Your rights (Art. 15–22 GDPR)</h2>
            <p className="text-slate-700 mb-3">As a data subject you have the following rights:</p>
            <ul className="list-disc list-inside space-y-3 text-slate-700">
              <li><strong>Right of access (Art. 15):</strong> the right to know whether we process your personal data and to receive a copy.</li>
              <li><strong>Right to rectification (Art. 16):</strong> the right to request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to erasure (Art. 17, &ldquo;right to be forgotten&rdquo;):</strong> the right to request deletion of your personal data.</li>
              <li><strong>Right to restriction of processing (Art. 18):</strong> the right to ask us to restrict processing (e.g. while accuracy is being verified).</li>
              <li><strong>Right to data portability (Art. 20):</strong> the right to receive your data in a structured, commonly used, machine-readable format.</li>
              <li><strong>Right to object (Art. 21):</strong> the right to object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Right to withdraw consent:</strong> where processing is based on consent, you may withdraw it at any time.</li>
              <li><strong>Right not to be subject to automated decision-making (Art. 22):</strong> we do not use automated decision-making with legal effects.</li>
            </ul>
            <p className="text-slate-700 mt-4">
              To exercise these rights, write to <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>. We will respond within 30 days (extendable by a further 2 months in complex cases — we will let you know).
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Right to lodge a complaint</h2>
            <p className="text-slate-700">
              If you believe we are infringing data protection rules, you have the right to lodge a complaint with the supervisory authority:
            </p>
            <p className="text-slate-700 mt-3">
              <strong>Information Commissioner of the Republic of Slovenia</strong><br />
              Dunajska 22, 1000 Ljubljana, Slovenia<br />
              Phone: +386 (0)1 230 97 30<br />
              Email: <a href="mailto:gp.ip@ip-rs.si" className="text-blue-600 hover:underline">gp.ip@ip-rs.si</a><br />
              Website: <a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.ip-rs.si</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Technical and organisational security measures</h2>
            <p className="text-slate-700 mb-3">To protect your data we use:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Encrypted connections (HTTPS / TLS 1.2 or higher)</li>
              <li>Encryption of data at rest (AES-256)</li>
              <li>Strictly limited database access (authenticated only)</li>
              <li>Authentication via Clerk with two-factor support</li>
              <li>Regular security updates and code reviews</li>
              <li>Separated environments (development, staging, production)</li>
              <li>Access auditing and monitoring of suspicious activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">11. Cookies and tracking</h2>
            <p className="text-slate-700">
              Details about the cookies we use are available in the separate{" "}
              <a href="/en/cookies" className="text-blue-600 hover:underline">cookie policy</a>. We do not use marketing cookies or third-party advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">12. Children</h2>
            <p className="text-slate-700">
              The service is intended for business use and is not marketed to children. We do not knowingly collect personal data from anyone under 16. If you become aware that a child has created an account, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">13. Changes to this statement</h2>
            <p className="text-slate-700">
              We may update this statement from time to time. We will notify you by email or in-app of material changes at least 30 days in advance. The date at the top of this page reflects the last update.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">14. Data protection contact</h2>
            <p className="text-slate-700">
              For all questions related to the processing of your personal data, contact us:
            </p>
            <p className="text-slate-700 mt-3">
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a><br />
              Sport Group d.o.o.<br />
              Osojnikova 4, 2000 Maribor, Slovenia
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
