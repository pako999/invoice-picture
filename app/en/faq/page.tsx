import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "15 answers to the most common questions: how the app works, supported programs, data security, pricing, OCR processing, supported formats, cancellation.",
  slug: "pogosta-vprasanja",
  locale: "en",
});

const faqs = [
  { question: "How does Slikaj Račun work?", answer: "The app lets you photograph paper invoices with your phone and automatically sends them to your accounting program's email address. Your program then OCRs the data and posts it into your books." },
  { question: "Do I need a specific accounting program?", answer: "No. The app works with any accounting program that supports email-based invoice import. We've verified Minimax, Birokrat, Pantheon, SAOP, E-računi and Metakocka — at minimum." },
  { question: "Who performs the OCR?", answer: "The OCR (reading data from the image) is performed by your accounting program, not by our app. We just make sure the image arrives at the correct email address inside your program." },
  { question: "Do I need any special hardware?", answer: "No. You only need a smartphone with a camera and an internet connection. The app runs in the browser or as a mobile app." },
  { question: "How many invoices can I send?", answer: "On the Basic plan you can send unlimited invoices per month. There's no cap on the number of sends." },
  { question: "What's included in PRO?", answer: "PRO is built for accountants and businesses with multiple legal entities. It supports unlimited companies, separate OCR email per company, quick switching between companies and a per-company archive." },
  { question: "Can I cancel anytime?", answer: "Yes. You can cancel your subscription at any time, with no commitment or hidden fees. The plan stays active until the end of the paid period." },
  { question: "How secure is the app?", answer: "The app uses Clerk authentication for secure access. Invoice images are sent over secure channels directly to your accounting program's email. We don't store sensitive financial data." },
  { question: "What if my accounting program doesn't support email import?", answer: "Check the program's settings or contact the vendor. Most modern accounting programs already support this — it may just need to be activated in settings." },
  { question: "Which image formats are supported?", answer: "The app supports JPG, PNG, WEBP and PDF. That includes both photographs and digital documents." },
  { question: "How long are invoices kept in the archive?", answer: "All sent invoices are stored in the archive without any time limits. You can access them any time." },
  { question: "Can I use the app for multiple companies?", answer: "Yes. The Basic plan supports one company. For multiple companies you need the PRO plan, which lets you manage unlimited entities." },
  { question: "What if an invoice wasn't recognised correctly?", answer: "OCR quality depends on your accounting program and the image quality. Make sure the photo has good lighting and is sharp. If the issue persists, contact your accounting software vendor." },
  { question: "Is there a free trial?", answer: "Yes — every new user gets a 7-day free trial without entering a credit card. After it ends you can upgrade to Basic (€6.99/month) or PRO (€17.99/month)." },
  { question: "How do I get support?", answer: "Reach out via the contact page or email our support team. We're happy to help with setup and troubleshooting." },
];

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
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Got questions? Here are the answers.</h1>
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
