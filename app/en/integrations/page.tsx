import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Integrations with accounting programs",
  description:
    "Works with the biggest accounting platforms that support OCR / email import — QuickBooks, Xero, Sage, FreshBooks, Zoho Books, NetSuite, Dext, Hubdoc, plus Slovenian programs like Minimax, Birokrat and Pantheon. No manual entry.",
  slug: "integracije",
  locale: "en",
});

// We have direct experience and email-formatting tested with the
// Slovenian programs below. Slikaj Račun forwards images by email,
// so it works with any of the bigger global tools too — those are
// listed separately as "globally supported".
const integrations = [
  {
    name: "Minimax",
    logo: "/logos/minimax.svg",
    short: "Email import + OCR",
    long: "Minimax supports invoice import via an email address with automatic OCR processing and bookkeeping into the system.",
    href: "https://www.vasco.si/minimax",
  },
  {
    name: "Birokrat",
    logo: "/logos/birokrat.png",
    short: "Email import + OCR",
    long: "Birokrat offers email-based import with OCR for automatic recognition of invoice data.",
    href: "https://www.birokrat.si",
  },
  {
    name: "Pantheon",
    logo: "/logos/pantheon.png",
    short: "eBooks OCR service",
    long: "Pantheon uses the eBooks OCR service to digitise and automatically process documents.",
    href: "https://www.datalab.si/pantheon",
  },
  {
    name: "SAOP",
    logo: "/logos/vasco.png",
    short: "API invoice import",
    long: "SAOP supports invoice import through an API with advanced automation options.",
    href: "https://www.vasco.si",
  },
  {
    name: "E-računi",
    logo: "/logos/eracuni.png",
    short: "Email + DigiBox OCR",
    long: "E-računi uses DigiBox OCR technology for document processing and management.",
    href: "https://www.eracuni.com",
  },
  {
    name: "Metakocka",
    logo: "/logos/metakocka.png",
    short: "Email import + OCR",
    long: "Metakocka supports email-based invoice import with automatic OCR and integration into the system.",
    href: "https://www.metakocka.si",
  },
];

// Major global accounting platforms that support email-based receipt /
// invoice import with OCR. Slikaj Račun delivers the photo to whatever
// import address they assign you — no special integration required.
const globalIntegrations = [
  { name: "QuickBooks",   short: "Receipt capture + email-in",    href: "https://quickbooks.intuit.com/receipt-snap/" },
  { name: "Xero",         short: "Built-in Hubdoc OCR",            href: "https://www.xero.com/" },
  { name: "Sage",         short: "AutoEntry OCR + email import",   href: "https://www.sage.com/" },
  { name: "FreshBooks",   short: "Bill capture by email",          href: "https://www.freshbooks.com/" },
  { name: "Zoho Books",   short: "Email-in + document scanning",   href: "https://www.zoho.com/books/" },
  { name: "NetSuite",     short: "AP automation with OCR",         href: "https://www.netsuite.com/" },
  { name: "Dext",         short: "Leading receipt OCR platform",   href: "https://dext.com/" },
  { name: "Hubdoc",       short: "Document capture + OCR (Xero)",  href: "https://www.hubdoc.com/" },
  { name: "Bill.com",     short: "AP automation + email-in",       href: "https://www.bill.com/" },
  { name: "DATEV",        short: "Belegtransfer email upload",     href: "https://www.datev.de/" },
];

export default function Integrations() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integrations</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Works with the world&rsquo;s biggest accounting platforms</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            Slikaj Račun forwards the invoice photo to your accounting program&rsquo;s email. OCR processing — reading amounts, dates and suppliers — is performed by the program. That means it works with anything from QuickBooks and Xero to Sage, FreshBooks, NetSuite and Dext, plus every Slovenian program below.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Prerequisite:</strong> your accounting program must have email-based invoice import with OCR enabled.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl mb-3 font-semibold">Major global platforms</h2>
        <p className="text-slate-600 mb-6">
          Any platform that lets you forward documents to an inbox and OCR them — works out of the box.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {globalIntegrations.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{p.name}</span>
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-slate-500">{p.short}</p>
            </a>
          ))}
        </div>

        <h2 className="text-2xl mb-3 font-semibold">Slovenian accounting programs</h2>
        <p className="text-slate-600 mb-6">
          Verified end-to-end with the Slovenian programs most local businesses use.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-transform hover:scale-105"
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt={p.name} className="h-10 object-contain" />
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-xl">
                    {p.name}
                    <Check className="w-5 h-5 text-green-600" />
                  </CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <Badge variant="outline" className="w-fit mt-3 bg-green-50 text-green-700 border-green-200">
                    ✓ supported
                  </Badge>
                  <p className="text-sm text-slate-600 mt-3">{p.long}</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-slate-600 mb-4">
            + any other accounting program that accepts invoices by email
          </p>
          <p className="text-slate-500">
            If your program supports document import via email, it will work with our app. Contact your accounting software vendor for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
