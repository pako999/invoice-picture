import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Refund Policy",
  description:
    "30-day money-back guarantee. How to request a refund, when refunds are available, and how to cancel your Slikaj Račun subscription.",
  slug: "vracila",
  locale: "en",
});

export default function Refunds() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Refund Policy</h1>
          <p className="text-lg text-slate-600">Last updated: May 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Introduction</h2>
            <p className="text-slate-700">
              At Slikaj Račun we strive for your complete satisfaction. If you are not happy with our service, we offer a 30-day money-back guarantee, no questions asked. This policy describes the conditions and procedure for requesting a refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. 30-day money-back guarantee</h2>
            <p className="text-slate-700">
              We offer all new paying subscribers a <strong>30-day money-back guarantee</strong>. If you are not satisfied with our service within the first 30 days of your paid subscription, we will refund the full amount with no questions asked.
            </p>
            <p className="text-slate-700 mt-3">The guarantee covers:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-2">
              <li>Monthly subscriptions — within 30 days of the first paid subscription</li>
              <li>Yearly subscriptions — within 30 days of the start of the subscription</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. How to request a refund</h2>
            <p className="text-slate-700 mb-3">You can request a refund in two ways:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>
                <strong>By email:</strong> write to{" "}
                <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>{" "}
                with the subject &ldquo;Refund request&rdquo; and include your account email and the reason for the refund.
              </li>
              <li>
                <strong>Via the form:</strong> fill out the{" "}
                <Link href="/en/contact" className="text-blue-600 hover:underline">contact form</Link>{" "}
                and mention in the message that you are requesting a refund.
              </li>
            </ul>
            <p className="text-slate-700 mt-3">
              Once we receive your request we will reach out within 1 business day to confirm.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Refund processing time</h2>
            <p className="text-slate-700">
              Once a refund is approved, the amount is returned to your original payment method within <strong>5–7 business days</strong>. The actual posting time depends on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Free plan</h2>
            <p className="text-slate-700">
              Free-plan users do not need a refund — the service is free. The free plan lets you send up to 3 invoices per month at no cost.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Cancelling your subscription</h2>
            <p className="text-slate-700">
              You can cancel your subscription at any time, no questions asked, directly from your account settings. After cancellation:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Access to paid features remains active until the end of the paid period</li>
              <li>Auto-renewal is stopped immediately</li>
              <li>The paid period after cancellation is not refunded (except under the 30-day guarantee)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Prorated refunds</h2>
            <p className="text-slate-700">
              In exceptional cases of technical issues on our side that prevented you from using the service, we consider <strong>prorated refunds</strong> for the unused part of the billing period. Such requests are handled individually based on documented service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Exceptions</h2>
            <p className="text-slate-700 mb-3">Refunds are not available in the following cases:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>The request is filed after the 30-day guarantee window has passed</li>
              <li>The account was suspended or terminated for breach of the{" "}
                <Link href="/en/terms" className="text-blue-600 hover:underline">terms of use</Link>
              </li>
              <li>Services have been actually and fully used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Contact</h2>
            <p className="text-slate-700">For refund-related questions, contact us:</p>
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
