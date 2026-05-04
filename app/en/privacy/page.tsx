import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How we collect, use and protect your data. GDPR rights, security (HTTPS, Clerk), invoice storage and third-party sharing.",
  slug: "zasebnost",
  locale: "en",
});

export default function Privacy() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Privacy Policy</h1>
          <p className="text-lg text-slate-600">Last updated: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Introduction</h2>
            <p className="text-slate-700">
              SlikajRačun respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, store and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Data we collect</h2>
            <p className="text-slate-700 mb-3">We collect the following types of data:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Identification data:</strong> first name, last name, email address</li>
              <li><strong>Technical data:</strong> IP address, device information, browser</li>
              <li><strong>Usage data:</strong> history of sent invoices, timestamps, delivery status</li>
              <li><strong>Invoice images:</strong> photographs or scans of documents you submit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. How we use your data</h2>
            <p className="text-slate-700 mb-3">We use your data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Providing the invoice-forwarding service</li>
              <li>Managing your user account</li>
              <li>Processing payments and issuing receipts</li>
              <li>Customer support and communication</li>
              <li>Service improvements and usage analytics</li>
              <li>Securing the service and preventing abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Data retention</h2>
            <p className="text-slate-700">
              Invoice images are stored in your archive and accessible only to you. They are kept indefinitely until you delete them or request data erasure. Technical delivery records are retained for 5 years for tax purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Sharing with third parties</h2>
            <p className="text-slate-700 mb-3">
              Invoice images are forwarded to the email address of the accounting program you have configured in the app. In addition, we may share your data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Service providers:</strong> hosting, payment processor, email delivery</li>
              <li><strong>Legal obligations:</strong> when required by law or legal process</li>
            </ul>
            <p className="text-slate-700 mt-3">We do not sell your data to third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Security</h2>
            <p className="text-slate-700">We use modern security technologies to protect your data, including:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Encrypted connections (HTTPS / SSL)</li>
              <li>Secure authentication via Clerk</li>
              <li>Regular security updates</li>
              <li>Restricted data access on a need-to-know basis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Your rights</h2>
            <p className="text-slate-700 mb-3">Under GDPR you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Right to access your data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&ldquo;right to be forgotten&rdquo;)</li>
              <li>Right to restriction of processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            <p className="text-slate-700 mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Cookies</h2>
            <p className="text-slate-700">
              Our website uses cookies to improve user experience. More information is available in our{" "}
              <Link href="/en/cookies" className="text-blue-600 hover:underline">cookie policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Changes to this policy</h2>
            <p className="text-slate-700">
              We reserve the right to update this privacy policy. We will notify you of material changes by email. Please review this page regularly for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Contact</h2>
            <p className="text-slate-700">For privacy-related questions, contact us:</p>
            <p className="text-slate-700 mt-3">
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
              <br />
              Sport Group d.o.o.<br />
              Osojnikova 4, 2000 Maribor, Slovenia<br />
              VAT ID: SI72133449
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
