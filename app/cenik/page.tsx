"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { PaddleCheckoutButton } from "@/components/paddle-checkout";

const freeFeatures = [
  { text: "Do 3 računi na mesec", included: true },
  { text: "1 podjetje", included: true },
  { text: "Pošiljanje na kateri koli email", included: true },
  { text: "Deluje z Minimax, Birokrat, Pantheon…", included: true },
  { text: "Arhiv poslanih računov s predogledom", included: true },
  { text: "Neomejeno pošiljanje računov", included: false },
  { text: "Več podjetij", included: false },
];

const basicFeatures = [
  "Neomejeno pošiljanje računov",
  "Pošiljanje na kateri koli email",
  "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
  "OCR obdelava v vašem računovodskem programu",
  "Arhiv poslanih računov s predogledom",
  "Status pošiljanja v realnem času",
  "Podpora JPG, PNG, WEBP in PDF",
  "Mobilno optimizirana aplikacija",
  "Varen dostop prek Clerk avtentikacije",
  "1 podjetje",
];

const proFeatures = [
  "Vse iz osnovnega paketa",
  "Upravljanje neomejeno podjetij",
  "Ločen OCR email za vsako podjetje",
  "Hitri preklop med podjetji pri skeniranju",
  "En račun — vsa podjetja na enem mestu",
  "Arhiv računov ločen po podjetjih",
  "Prednostna podpora",
];

export default function Cenik() {
  const [isYearly, setIsYearly] = useState(false);

  const basicMonthly = 6.9;
  const proMonthly = 17.9;
  const yearlyDiscount = 0.2;

  const basicPrice = isYearly ? (basicMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : basicMonthly.toFixed(2);
  const proPrice = isYearly ? (proMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : proMonthly.toFixed(2);
  const basicMonthlySavings = (basicMonthly * 12 * yearlyDiscount).toFixed(2);
  const proMonthlySavings = (proMonthly * 12 * yearlyDiscount).toFixed(2);

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Cenik</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Preprosto in transparentno</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            Začnite brezplačno. Nadgradite, ko boste pripravljeni. Brez skritih stroškov, brez vezave.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${!isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Mesečno</span>
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
            <span className={`text-lg ${isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Letno</span>
            {isYearly && <Badge className="bg-green-100 text-green-700 border-green-200 border">-20% prihranek</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl">Brezplačen</CardTitle>
              <CardDescription className="text-base">Za občasno rabo</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">0 €</span>
                <span className="text-slate-600 text-xl"> / mesec</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Za vedno brezplačno</p>
            </CardHeader>
            <CardContent>
              <Link
                href="/sign-up"
                className="w-full mb-6 flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Začni brezplačno →
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
              <Badge className="bg-blue-600 text-white border-0">Najbolj priljubljen</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Osnovni</CardTitle>
              <CardDescription className="text-base">
                {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{basicPrice} €</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "leto" : "mesec"}</span>
              </div>
              {isYearly && <p className="text-sm text-green-600 mt-2">Prihranek: {basicMonthlySavings} € letno</p>}
            </CardHeader>
            <CardContent>
              <PaddleCheckoutButton
                tier="basic"
                billing={isYearly ? "yearly" : "monthly"}
                className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Začni 7-dnevno preizkušnjo →
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
                🏢 PRO · Računovodstvo
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">PRO</CardTitle>
              <CardDescription className="text-base">
                {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{proPrice} €</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "leto" : "mesec"}</span>
              </div>
              {isYearly && <p className="text-sm text-green-600 mt-2">Prihranek: {proMonthlySavings} € letno</p>}
            </CardHeader>
            <CardContent>
              <PaddleCheckoutButton
                tier="pro"
                billing={isYearly ? "yearly" : "monthly"}
                className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Začni 7-dnevno preizkušnjo →
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
          <p className="text-slate-600">Brez skritih stroškov · Brez vezave · Odpoveš kadarkoli</p>
          <p className="text-sm text-slate-500">
            Imate vprašanja o ceniku?{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Kontaktirajte nas
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
