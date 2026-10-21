import { ocrFaq } from "@/lib/ocr-faq";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "OCR in skeniranje računov: pogosta vprašanja",
  description: "15 odgovorov na najpogostejša vprašanja: kako deluje aplikacija, podprti programi, varnost podatkov, cena, OCR obdelava, podprti formati, odpoved.",
  slug: "pogosta-vprasanja",
});

const faqs = ocrFaq("sl");

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

export default function PogostaPrasanja() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">Pogosta vprašanja</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Pogosta vprašanja o OCR in skeniranju računov</h1>
          <p className="text-xl text-slate-600">Odgovori na najpogostejša vprašanja o aplikaciji Računi</p>
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
          <h2 className="text-2xl mb-4 font-semibold">Niste našli odgovora na vaše vprašanje?</h2>
          <p className="text-slate-600 mb-6">Kontaktirajte našo podporo in z veseljem vam bomo pomagali.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kontaktirajte nas
            </Link>
            <Link
              href="/pomoc-pri-nastavitvi"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Pomoč pri nastavitvi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
