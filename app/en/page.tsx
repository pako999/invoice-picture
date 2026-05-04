"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaddleCheckoutButton } from "@/components/paddle-checkout";
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
  const [isYearly, setIsYearly] = useState(false);

  const basicMonthly = 6.9;
  const proMonthly = 17.9;
  const yearlyDiscount = 0.2;

  const basicPrice = isYearly ? (basicMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : basicMonthly.toFixed(2);
  const proPrice = isYearly ? (proMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : proMonthly.toFixed(2);
  const basicMonthlySavings = (basicMonthly * 12 * yearlyDiscount).toFixed(2);
  const proMonthlySavings = (proMonthly * 12 * yearlyDiscount).toFixed(2);

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Photograph a paper invoice and send it to your accounting software's email in one click. Works with Minimax, Birokrat, Pantheon, SAOP, E-računi and Metakocka.",
    url: "https://www.posljiracun.si/en",
    inLanguage: "en",
    offers: [
      {
        "@type": "Offer",
        name: "Basic",
        price: basicMonthly.toFixed(2),
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: basicMonthly.toFixed(2),
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: "PRO Accounting",
        price: proMonthly.toFixed(2),
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: proMonthly.toFixed(2),
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
    ],
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            <div className="text-center lg:text-left">
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                Works with any accounting app that supports OCR email import
              </Badge>
              <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent font-bold">
                Photograph an invoice and send it in one click
              </h1>
              <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                In a single tap you photograph a physical invoice, and the app automatically delivers it to your email or directly to your OCR import address — where your accounting software takes over.
              </p>
              <p className="text-lg text-slate-700 mb-8">
                No manual entry, no fuss — <strong>fast, simple and reliable</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center mb-6">
                <Link
                  href="/scan"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg h-12 px-8 rounded-lg font-medium transition-colors"
                >
                  📷 Start scanning
                </Link>
                <Link
                  href="/en/how-it-works"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-lg h-12 px-8 rounded-lg font-medium transition-colors"
                >
                  Learn more
                </Link>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto lg:mx-0">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <strong>Prerequisite:</strong> your accounting software must accept invoices via email with OCR processing enabled. Check the import settings in Minimax, Birokrat, Pantheon or your program of choice.
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
              <div className="relative h-full flex items-center">
                <Image
                  src="/hero-app.webp"
                  alt="Slikaj Račun mobile app — invoice send screen"
                  width={420}
                  height={860}
                  priority
                  sizes="(min-width: 1024px) 50vw, 90vw"
                  className="w-auto max-w-full h-auto lg:h-full lg:max-h-[700px] object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Process Flow */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent blur-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                {[
                  { Icon: FileText,    color: "bg-blue-100 text-blue-600",     emoji: "🧾", label: "Paper invoice" },
                  { Icon: Camera,      color: "bg-green-100 text-green-600",   emoji: "📱", label: "Photograph it" },
                  { Icon: Send,        color: "bg-purple-100 text-purple-600", emoji: "📤", label: "Send" },
                  { Icon: Bot,         color: "bg-orange-100 text-orange-600", emoji: "🤖", label: "OCR processes" },
                  { Icon: CheckCircle, color: "bg-teal-100 text-teal-600",     emoji: "✅", label: "Booked!" },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${step.color}`}>
                      <step.Icon className="w-8 h-8" />
                    </div>
                    <p className="text-2xl mb-1">{step.emoji}</p>
                    <p className="text-sm">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integracije" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integrations</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Works with your accounting program</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              The app forwards the invoice photo to your program's import email. The OCR work — reading amounts, dates, and suppliers — is done by your accounting program itself.
            </p>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Your accounting program must have email-based invoice import with OCR enabled.
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
                  Tap Send. The invoice arrives at your program's email in seconds. OCR happens in your accounting program — not on our servers.
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
                  The app delivers the photo to the email assigned by your accounting software. OCR is performed by the program — Minimax, Birokrat, Pantheon and others.
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
                <CardTitle>🤖 OCR in your program</CardTitle>
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

      {/* Pricing */}
      <section id="cenik" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Start today</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
              Save valuable time on manual invoice entry. One click replaces minutes of typing.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-lg ${!isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  isYearly ? "bg-blue-600" : "bg-slate-300"
                }`}
                aria-label="Toggle pricing period"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isYearly ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-lg ${isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-700 border-green-200 border">
                  Save 20%
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>For occasional use</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">€0</span>
                  <span className="text-slate-600"> / month</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Free forever</p>
              </CardHeader>
              <CardContent>
                <Link
                  href="/sign-up"
                  className="w-full mb-6 flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors"
                >
                  Start free →
                </Link>
                <ul className="space-y-3">
                  {[
                    { text: "Up to 3 invoices per month", ok: true },
                    { text: "1 company", ok: true },
                    { text: "Send to any email", ok: true },
                    { text: "Works with Minimax, Birokrat, Pantheon…", ok: true },
                    { text: "Sent-invoice archive with preview", ok: true },
                    { text: "Unlimited invoice sending", ok: false },
                    { text: "Multiple companies", ok: false },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-2">
                      {f.ok
                        ? <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        : <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />}
                      <span className={`text-sm ${f.ok ? "" : "text-slate-400"}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Basic */}
            <Card className="border-2 border-blue-600 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white border-0">Most popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>
                  {isYearly ? "Yearly renewal, cancel anytime" : "Monthly renewal, cancel anytime"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">€{basicPrice}</span>
                  <span className="text-slate-600"> / {isYearly ? "year" : "month"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Save €{basicMonthlySavings} per year</p>
                )}
              </CardHeader>
              <CardContent>
                <PaddleCheckoutButton
                  tier="basic"
                  billing={isYearly ? "yearly" : "monthly"}
                  className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start 7-day trial →
                </PaddleCheckoutButton>
                <ul className="space-y-3">
                  {[
                    "Unlimited invoice sending",
                    "Send to any email",
                    "Works with Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
                    "OCR in your accounting program",
                    "Sent-invoice archive with preview",
                    "Real-time delivery status",
                    "JPG, PNG, WEBP and PDF support",
                    "Mobile-optimised app",
                    "1 company",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-slate-200 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                  🏢 PRO · For accountants
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">PRO</CardTitle>
                <CardDescription>
                  {isYearly ? "Yearly renewal, cancel anytime" : "Monthly renewal, cancel anytime"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">€{proPrice}</span>
                  <span className="text-slate-600"> / {isYearly ? "year" : "month"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Save €{proMonthlySavings} per year</p>
                )}
              </CardHeader>
              <CardContent>
                <PaddleCheckoutButton
                  tier="pro"
                  billing={isYearly ? "yearly" : "monthly"}
                  className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Start 7-day trial →
                </PaddleCheckoutButton>
                <ul className="space-y-3">
                  {[
                    "Everything in Basic",
                    "Manage unlimited companies",
                    "Separate OCR email per company",
                    "Quick company switching when scanning",
                    "One account — all your companies",
                    "Archive separated by company",
                    "Priority support",
                  ].map((feat, i) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{i === 0 ? <strong>{feat}</strong> : feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mt-8 text-slate-600">
            No hidden fees · No lock-in · Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
