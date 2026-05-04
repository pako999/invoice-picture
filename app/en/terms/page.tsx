import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of use for SlikajRačun: service description, payment terms, subscription cancellation, liability limits, intellectual property.",
  slug: "pogoji-uporabe",
  locale: "en",
});

export default function Terms() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Terms of Use</h1>
          <p className="text-lg text-slate-600">Last updated: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Acceptance of terms</h2>
            <p className="text-slate-700">
              By accessing and using SlikajRačun, you agree to these terms of use. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Service description</h2>
            <p className="text-slate-700">
              SlikajRačun lets you photograph paper invoices and forward them to the email address of an accounting program of your choice. The app acts as a delivery service and does not perform OCR processing of the invoices itself.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. User account</h2>
            <p className="text-slate-700 mb-3">To use the service you must create a user account. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Provide accurate and truthful information</li>
              <li>Keep your password and access credentials confidential</li>
              <li>Notify us immediately of any unauthorised access</li>
              <li>Use the account in accordance with applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Payment terms</h2>
            <p className="text-slate-700">
              The service is billed monthly or yearly depending on the plan you choose. Prices are listed on the website and include VAT. Payment is taken in advance for the current billing period. Failed payments may result in temporary service suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Subscription cancellation</h2>
            <p className="text-slate-700">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current paid period. Paid periods are non-refundable. After cancellation you retain access to the service until the end of the paid period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Acceptable use</h2>
            <p className="text-slate-700 mb-3">You may use the service only for lawful purposes. The following are prohibited:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Sending illegal or harmful content</li>
              <li>Abusing the service to send spam</li>
              <li>Attempts at unauthorised access to systems</li>
              <li>Overloading the service with automated requests</li>
              <li>Infringing third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Limitation of liability</h2>
            <p className="text-slate-700 mb-3">The service is provided &ldquo;as is&rdquo;. We are not responsible for:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Quality of the OCR processing performed by your accounting program</li>
              <li>Data loss caused by third-party technical issues</li>
              <li>Service interruptions due to maintenance or force majeure</li>
              <li>Defects in third-party accounting programs</li>
              <li>Indirect, incidental or consequential damages</li>
            </ul>
            <p className="text-slate-700 mt-3">
              Our liability is capped at the amount you have paid for the service in the last 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Intellectual property</h2>
            <p className="text-slate-700">
              All software, layout, design and content of the application are protected by copyright. Reproduction, distribution or modification without written consent is prohibited. Invoice images you upload remain your property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Service termination</h2>
            <p className="text-slate-700">
              We reserve the right to suspend or terminate the service without prior notice in case of breach of these terms or for other justified reasons. In case of termination on our side, we will refund the proportional amount for the unused period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Changes to these terms</h2>
            <p className="text-slate-700">
              We reserve the right to update these terms. Material changes will be communicated by email at least 30 days in advance. Continued use of the service after the changes take effect constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">11. Disputes</h2>
            <p className="text-slate-700">
              These terms are governed by Slovenian law. We aim to resolve disagreements amicably. The competent court for disputes is in Ljubljana, Slovenia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">12. Contact</h2>
            <p className="text-slate-700">For questions about these terms of use, contact us:</p>
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
