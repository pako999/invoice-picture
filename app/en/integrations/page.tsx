import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Accounting Software Integrations: OCR & Email Invoice Import",
  description: "Connect invoice scanning with accounting software that supports OCR or email import. Works with Minimax, Birokrat, Pantheon and compatible global accounting platforms.",
  slug: "integracije",
  locale: "en",
});

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", short: "Email import + OCR", long: "Minimax supports invoice import via an email address with automatic OCR processing and bookkeeping into the system.", href: "https://www.vasco.si/minimax" },
  { name: "Birokrat", logo: "/logos/birokrat.png", short: "Email import + OCR", long: "Birokrat offers email-based import with OCR for automatic recognition of invoice data.", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", short: "eBooks OCR service", long: "Pantheon uses the eBooks OCR service to digitise and automatically process documents.", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: "/logos/vasco.png", short: "API invoice import", long: "SAOP supports invoice import through an API with advanced automation options.", href: "https://www.vasco.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", short: "Email + DigiBox OCR", long: "E-računi uses DigiBox OCR technology for document processing and management.", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", short: "Email import + OCR", long: "Metakocka supports email-based invoice import with automatic OCR and integration into the system.", href: "https://www.metakocka.si" },
];

const globalIntegrations = [
  { name: "QuickBooks", short: "Receipt capture + email-in", href: "https://quickbooks.intuit.com/receipt-snap/" },
  { name: "Xero", short: "Built-in Hubdoc OCR", href: "https://www.xero.com/" },
  { name: "Sage", short: "AutoEntry OCR + email import", href: "https://www.sage.com/" },
  { name: "FreshBooks", short: "Bill capture by email", href: "https://www.freshbooks.com/" },
  { name: "Zoho Books", short: "Email-in + document scanning", href: "https://www.zoho.com/books/" },
  { name: "NetSuite", short: "AP automation with OCR", href: "https://www.netsuite.com/" },
  { name: "Dext", short: "Receipt OCR platform", href: "https://dext.com/" },
  { name: "Hubdoc", short: "Document capture + OCR", href: "https://www.hubdoc.com/" },
  { name: "Bill.com", short: "AP automation + email-in", href: "https://www.bill.com/" },
  { name: "DATEV", short: "Document upload workflows", href: "https://www.datev.de/" },
];

const faq = [
  ["What is an accounting software integration?", "It connects invoice capture with the accounting system where documents are processed. Slikaj Račun forwards the invoice image to the configured import address."],
  ["Does it require a direct API integration?", "Not necessarily. If your accounting software accepts invoice documents by email, Slikaj Račun can use that workflow without replacing your accounting system."],
  ["Does Slikaj Račun perform the OCR itself?", "The accounting software performs the OCR in the standard workflow described on this page. Slikaj Račun focuses on fast capture and delivery of the document."],
];

export default function Integrations() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Accounting software integrations</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Accounting software integrations for OCR and email invoice import</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            Slikaj Račun forwards the invoice photo to your accounting software&rsquo;s configured import email. OCR processing is then handled by the accounting program, so you keep your existing accounting workflow.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900"><strong>Prerequisite:</strong> your accounting program must support a compatible document-import workflow such as email-based invoice import.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl mb-3 font-semibold">Global accounting platforms</h2>
        <p className="text-slate-600 mb-6">Examples of platforms with document capture, OCR or accounts-payable automation workflows.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {globalIntegrations.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-1"><span className="font-bold text-slate-900">{p.name}</span><Check className="w-4 h-4 text-green-600" /></div>
              <p className="text-xs text-slate-500">{p.short}</p>
            </a>
          ))}
        </div>

        <h2 className="text-2xl mb-3 font-semibold">Slovenian accounting programs</h2>
        <p className="text-slate-600 mb-6">Common Slovenian accounting systems used with invoice import and OCR workflows.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105">
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3"><img src={p.logo} alt={p.name} className="h-10 object-contain" /><ExternalLink className="w-4 h-4 text-slate-400" /></div>
                  <CardTitle className="flex items-center justify-between text-xl">{p.name}<Check className="w-5 h-5 text-green-600" /></CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <Badge variant="outline" className="w-fit mt-3 bg-green-50 text-green-700 border-green-200">✓ supported workflow</Badge>
                  <p className="text-sm text-slate-600 mt-3">{p.long}</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-14 max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-6">
            {faq.map(([q, a]) => <div key={q}><h3 className="font-semibold text-lg mb-2">{q}</h3><p className="text-slate-600">{a}</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
