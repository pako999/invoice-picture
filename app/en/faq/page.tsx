import { ocrFaq } from "@/lib/ocr-faq";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Invoice OCR and scanning: frequently asked questions",
  description:
    "15 answers to the most common questions: how the app works, supported programs, data security, pricing, OCR processing, supported formats, cancellation.",
  slug: "pogosta-vprasanja",
  locale: "en",
});

const faqs = ocrFaq("en");

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "en",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FAQ() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">FAQ</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Frequently asked questions about invoice OCR</h1>
          <p className="text-xl text-slate-600">Answers to the most common questions about Slikaj Račun</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-4 font-semibold">Didn&rsquo;t find what you were looking for?</h2>
          <p className="text-slate-600 mb-6">Contact our support team — we&rsquo;re happy to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/en/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Contact us
            </Link>
            <Link href="/en/setup-help"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              Setup help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
