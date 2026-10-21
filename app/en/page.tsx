import Link from "next/link";
import { OcrLearningLinks } from "@/components/ocr-learning-links";
import { HomeHero } from "@/components/home-hero";
import { PAID_PLANS, PLAN_CONFIGS } from "@/lib/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommercialPricingGrid } from "@/components/commercial-pricing-grid";
import {
  Check,
  X,
  FileText,
  Camera,
  Mail,
  Send,
  Bot,
  CheckCircle,
  Settings,
  Archive,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// Slovenian accounting programs — names stay the same in English (proper nouns)
const integrations = [
  { name: "Minimax",   logo: "/logos/minimax.svg",    desc: "Email import + OCR",   href: "https://www.vasco.si/minimax" },
  { name: "Birokrat",  logo: "/logos/birokrat.png",   desc: "Email import + OCR",   href: "https://www.birokrat.si" },
  { name: "Pantheon",  logo: "/logos/pantheon.png",   desc: "eBooks OCR service",   href: "https://www.datalab.si/pantheon" },
  { name: "SAOP",      logo: "/logos/vasco.png",      desc: "API invoice import",   href: "https://www.vasco.si" },
  { name: "E-računi",  logo: "/logos/eracuni.png",    desc: "Email + DigiBox OCR",  href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png",  desc: "Email import + OCR",   href: "https://www.metakocka.si" },
];

export default function HomeEn() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI invoice OCR for photos and PDFs: extract and review fields, split multi-invoice PDFs, then export eSLOG or UBL or send the original to accounting.",
    url: "https://www.posljiracun.si/en",
    inLanguage: "en",
    offers: PAID_PLANS.map(code => ({
      "@type": "Offer", name: PLAN_CONFIGS[code].nameEn,
      price: PLAN_CONFIGS[code].monthlyPrice!.toFixed(2), priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: PLAN_CONFIGS[code].monthlyPrice!.toFixed(2), priceCurrency: "EUR", unitText: "MONTH", valueAddedTaxIncluded: false },
    })),
    featureList: [
      "Photograph paper invoices with your phone camera",
      "Send to your accounting software's email in one click",
      "Archive of every sent invoice with preview",
      "Real-time delivery status",
      "Supports JPG, PNG, WEBP and PDF",
      "Multi-company management (PRO)",
    ],
    publisher: {
      "@type": "Organization",
      name: "Sport Group d.o.o.",
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <HomeHero locale="en" />

      {/* Integrations */}
      <section id="integracije" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integrations</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Works with your accounting program</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Slikaj Račun extracts invoice fields with AI OCR. Send the original or reviewed structured data through an import method supported by your accounting software.
            </p>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Original forwarding needs a receiving email. For structured fields, check the XML or API import supported by your accounting software.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                      <img src={p.logo} alt={p.name} className="h-8 object-contain" />
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {p.name}
                      <Check className="w-5 h-5 text-green-600" />
                    </CardTitle>
                    <CardDescription>{p.desc}</CardDescription>
                    <Badge variant="outline" className="w-fit mt-2 bg-green-50 text-green-700 border-green-200">
                      ✓ supported
                    </Badge>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>

          <p className="text-center mt-8 text-slate-600">
            + any other program that accepts invoices by email
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section id="kako-deluje" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">How it works</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">3 simple steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚙️</span>
                  <CardTitle>1. Set up your email once</CardTitle>
                </div>
                <CardDescription>
                  In Settings, paste the import email address that your accounting program assigns you (e.g. <em>uvoz@minimax.si</em>). You only do this once.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <CardTitle>2. Photograph the invoice</CardTitle>
                </div>
                <CardDescription>
                  Open the app and snap a paper invoice with your phone. Supports JPG, PNG and WEBP.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📤</span>
                  <CardTitle>3. One click — sent</CardTitle>
                </div>
                <CardDescription>
                  Review the OCR fields, approve the document and send the original or structured export to your configured accounting destination. Check delivery status afterwards.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funkcionalnosti" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Features</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Everything you need</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>📷 One tap — invoice sent</CardTitle>
                <CardDescription>
                  Photograph a paper invoice and tap Send. No typing, no file shuffling. Optimised for mobile.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>📧 Forwarded to your program</CardTitle>
                <CardDescription>
                  The app provides AI OCR, review and delivery of original documents, XML or API data. Confirm the receiving program’s supported import method.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Archive className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>📋 Archive of every send</CardTitle>
                <CardDescription>
                  Every sent invoice is preserved with date, delivery status and preview. Verify at any time whether an invoice was sent.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>🏢 Multiple companies (PRO)</CardTitle>
                <CardDescription>
                  Manage several companies in one place. Each gets its own import email — switch with one tap.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>🤖 AI invoice OCR</CardTitle>
                <CardDescription>
                  We don't read the invoice — your accounting program does. That means the data stays in their certified pipeline.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-rose-600" />
                </div>
                <CardTitle>🔒 GDPR compliant</CardTitle>
                <CardDescription>
                  All invoices are encrypted in transit and at rest. Hosted in the EU. Aligned with GDPR and Slovenian VAT law.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <OcrLearningLinks locale="en" />

      {/* Current commercial pricing */}
      <section id="cenik" className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto mb-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 border-0 bg-blue-100 text-blue-700 hover:bg-blue-200">Pricing</Badge>
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Choose the OCR capacity you need</h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Unlimited original-invoice sending on every paid plan. Paid AI OCR plans count processed pages, with no separate invoice limit.
          </p>
        </div>
        <CommercialPricingGrid locale="en" compact />
      </section>


    </div>
  );
}
