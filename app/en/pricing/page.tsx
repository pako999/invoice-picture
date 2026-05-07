"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { PaddleCheckoutButton } from "@/components/paddle-checkout";

const freeFeatures = [
  { text: "Up to 3 invoices per month", included: true },
  { text: "1 company", included: true },
  { text: "Send to any email", included: true },
  { text: "Works with Minimax, Birokrat, Pantheon…", included: true },
  { text: "Sent-invoice archive with preview", included: true },
  { text: "Unlimited invoice sending", included: false },
  { text: "Multiple companies", included: false },
];

const basicFeatures = [
  "Unlimited invoice sending",
  "Send to any email",
  "Works with Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
  "OCR processing in your accounting program",
  "Sent-invoice archive with preview",
  "Real-time delivery status",
  "JPG, PNG, WEBP and PDF support",
  "Mobile-optimised app",
  "Secure access via Clerk authentication",
  "1 company",
];

const proFeatures = [
  "Everything in Basic",
  "Manage unlimited companies",
  "Separate OCR email per company",
  "Quick company switching when scanning",
  "One account — all your companies in one place",
  "Archive separated by company",
  "Priority support",
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const basicMonthly = 6.99;
  const basicYearly  = 66.90;
  const proMonthly   = 17.99;
  const proYearly    = 171.99;

  const basicPrice = (isYearly ? basicYearly : basicMonthly).toFixed(2);
  const proPrice   = (isYearly ? proYearly   : proMonthly).toFixed(2);
  const basicMonthlySavings = (basicMonthly * 12 - basicYearly).toFixed(2);
  const proMonthlySavings   = (proMonthly * 12 - proYearly).toFixed(2);

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Simple and transparent</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            Start free. Upgrade when you&rsquo;re ready. No hidden fees, no lock-in.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${!isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Monthly</span>
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
            <span className={`text-lg ${isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Yearly</span>
            {isYearly && <Badge className="bg-green-100 text-green-700 border-green-200 border">Save 20%</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription className="text-base">For occasional use</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">€0</span>
                <span className="text-slate-600 text-xl"> / month</span>
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
                {freeFeatures.map((f) => (
                  <li key={f.text} className="flex items-start gap-2">
                    {f.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${f.included ? "" : "text-slate-400"}`}>{f.text}</span>
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
              <CardDescription className="text-base">
                {isYearly ? "Yearly renewal, cancel anytime" : "Monthly renewal, cancel anytime"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">€{basicPrice}</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "year" : "month"}</span>
              </div>
              {isYearly && <p className="text-sm text-green-600 mt-2">Save €{basicMonthlySavings} per year</p>}
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
                {basicFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{f}</span>
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
              <CardDescription className="text-base">
                {isYearly ? "Yearly renewal, cancel anytime" : "Monthly renewal, cancel anytime"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">€{proPrice}</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "year" : "month"}</span>
              </div>
              {isYearly && <p className="text-sm text-green-600 mt-2">Save €{proMonthlySavings} per year</p>}
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
                {proFeatures.map((f, i) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{i === 0 ? <strong>{f}</strong> : f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center space-y-4">
          <p className="text-slate-600">No hidden fees · No lock-in · Cancel anytime</p>
          <p className="text-sm text-slate-500">
            Have pricing questions?{" "}
            <Link href="/en/contact" className="text-blue-600 hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
