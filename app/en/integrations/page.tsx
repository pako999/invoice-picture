import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Invoice OCR & Accounting Integrations in Slovenia",
  description: "Connect invoice OCR with accounting workflows in Slovenia. Forward original PDFs or deliver approved data through UBL, eSLOG or JSON API for Minimax, Birokrat, Pantheon and other systems.",
  slug: "integracije",
  locale: "en",
});

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", short: "Invoice import and accounting workflow", href: "https://www.minimax.si" },
  { name: "Birokrat", logo: "/logos/birokrat.png", short: "Document import and accounting workflow", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", short: "Document and OCR workflow", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: null, short: "Digital document workflows", href: "https://www.saop.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", short: "Online accounting and document import", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", short: "ERP and digital document import", href: "https://www.metakocka.si" },
];

const faq = [
  ["What is an accounting software integration?", "It connects invoice capture and approved invoice data with the accounting workflow you already use. The delivery can be the original PDF by email, a UBL/eSLOG XML file or structured JSON through an API."],
  ["Do I need to replace my accounting software?", "No. Slikaj Račun complements the system you already use for bookkeeping and invoicing."],
  ["Does Slikaj Račun perform invoice OCR itself?", "Yes. With AI OCR enabled, Slikaj Račun extracts invoice fields from PDFs or images, validates key values and sends uncertain documents to review before structured delivery."],
  ["Can accounting firms manage multiple companies?", "Yes. Higher plans support multiple companies under one user account with separate destinations and delivery settings."],
  ["Are UBL and eSLOG supported?", "Yes. Approved invoice data can be used in UBL 2.1 or eSLOG 2.0 XML workflows, as well as JSON API delivery."],
];

export default function Integrations() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Badge className="mb-4 border-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Accounting integrations</Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Invoice OCR and accounting software integrations in Slovenia</h1>
          <p className="mx-auto mb-6 max-w-4xl text-xl text-slate-600">Slikaj Račun connects incoming invoice capture with your existing accounting process. Forward the original invoice to an import email, or extract and validate fields before structured delivery.</p>
          <div className="mx-auto max-w-3xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
            <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p className="text-sm text-blue-950"><strong>Flexible delivery:</strong> the exact import method depends on your accounting provider and plan. Slikaj Račun supports original-document email forwarding, UBL/eSLOG XML and JSON API workflows.</p></div>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-semibold">Accounting software used in Slovenian workflows</h2>
        <p className="mb-6 text-slate-600">Common platforms that can be part of an invoice import or document-processing workflow. Exact capabilities depend on the provider configuration.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-[1.02]">
              <Card className="h-full border-slate-200 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    {p.logo ? <img src={p.logo} alt={`${p.name} accounting software`} className="h-10 object-contain" /> : <div className="flex h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-black text-slate-700">SAOP</div>}
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-xl">{p.name}<Check className="h-5 w-5 text-green-600" /></CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <p className="mt-3 text-xs text-slate-500">Import options depend on the accounting provider and subscription.</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <article className="prose prose-slate prose-lg mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 max-w-none">
          <h2>How an accounting integration works</h2>
          <p>The simplest workflow is email import: configure a destination for each company, then forward the original invoice PDF or image. For automation, the invoice can first go through <Link href="/en/invoice-ocr-slovenia">invoice OCR and data extraction</Link>.</p>
          <p>After extraction, Slikaj Račun can validate totals, VAT, IBAN and other key fields. Low-confidence documents are moved to a review queue instead of being sent downstream blindly.</p>

          <h2>Three delivery models</h2>
          <h3>1. Original invoice by email</h3>
          <p>Forward the original PDF or image to the configured accounting or bookkeeping import address.</p>
          <h3>2. UBL 2.1 or eSLOG 2.0</h3>
          <p>Use approved OCR data in a structured XML workflow for systems that accept UBL or eSLOG documents.</p>
          <h3>3. JSON API</h3>
          <p>Send approved structured invoice data to your own ERP or integration endpoint over HTTPS.</p>

          <h2>Multi-company workflow for accounting firms</h2>
          <p>Accounting firms can manage multiple client companies under one user account. Each company can have its own destination and delivery configuration, while bulk-uploaded invoices remain individually traceable.</p>

          <h2>Frequently asked questions</h2>
          {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}
        </article>

        <div className="mt-12 text-center">
          <Link href="/en/invoice-ocr-slovenia" className="inline-flex rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800">Explore invoice OCR in Slovenia</Link>
        </div>
      </div>
    </div>
  );
}
