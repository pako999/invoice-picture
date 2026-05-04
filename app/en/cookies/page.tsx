import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie Policy",
  description:
    "Which cookies we use on Slikaj Račun: strictly necessary, functional, analytics, marketing. How to manage them in your browser.",
  slug: "piskotki",
  locale: "en",
});

export default function Cookies() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Cookie Policy</h1>
          <p className="text-lg text-slate-600">Last updated: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. What are cookies?</h2>
            <p className="text-slate-700">
              Cookies are small text files saved on your device when you visit a website. They allow the website to recognise your device and remember information about your usage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. How we use cookies</h2>
            <p className="text-slate-700 mb-4">We use several types of cookies for different purposes:</p>

            <div className="grid gap-4 not-prose">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Strictly necessary cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    These cookies are essential for the website to function and cannot be disabled. They include cookies for sign-in, authentication and basic security features.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Examples:</strong> sign-in session, authentication checks, security tokens
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Functional cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    These cookies enable enhanced functionality and personalisation. They may be set by us or by third parties whose services we use.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Examples:</strong> language preference, user preferences
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Analytics cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    These cookies help us understand how visitors use the website and improve the experience. All data is anonymised.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Examples:</strong> Google Analytics, visit statistics
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Marketing cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    These are used to display relevant ads and measure ad campaign effectiveness. We currently do not use marketing cookies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Third-party cookies</h2>
            <p className="text-slate-700 mb-3">Our website uses third-party services that may set their own cookies:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Clerk:</strong> authentication and user-management system</li>
              <li><strong>Google Analytics:</strong> usage analytics (when enabled)</li>
              <li><strong>Stripe:</strong> payment processing (only during checkout)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Cookie duration</h2>
            <p className="text-slate-700 mb-3">Cookies vary in duration:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Session cookies:</strong> deleted when you close the browser</li>
              <li><strong>Persistent cookies:</strong> remain on the device for a set period (typically up to 1 year)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. How to manage cookies</h2>
            <p className="text-slate-700 mb-3">You can manage or block cookies in the following ways:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Browser settings:</strong> most browsers let you block or delete cookies</li>
              <li><strong>Cookie settings:</strong> click the &ldquo;Cookie settings&rdquo; button at the bottom of the page</li>
              <li><strong>Disable analytics:</strong> opt out of analytics cookies in settings</li>
            </ul>
            <p className="text-sm text-slate-600 mt-3">
              <strong>Note:</strong> if you block strictly necessary cookies, some features of the website may not work correctly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Changes to this policy</h2>
            <p className="text-slate-700">
              We reserve the right to update this cookie policy. Changes will be published on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Contact</h2>
            <p className="text-slate-700">For questions related to cookies, contact us:</p>
            <p className="text-slate-700 mt-3">
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
