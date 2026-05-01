"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { PaddleCheckoutButton } from "@/components/paddle-checkout";

const basicFeatures = [
  "Neomejeno pošiljanje računov",
  "Pošiljanje na kateri koli email",
  "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
  "Arhiv s predogledom in iskanjem",
  "Status pošiljanja v realnem času",
  "Podpora za JPG, PNG, WEBP in PDF",
  "Mobilno optimizirana aplikacija",
];

const proFeatures = [
  "Vse iz osnovnega paketa",
  "Upravljanje neomejeno podjetij",
  "Ločen OCR email za vsako podjetje",
  "Hitri preklop med podjetji",
  "Arhiv ločen po podjetjih",
  "Prednostna podpora",
];

interface SubStatus {
  plan: string;
  daysRemaining: number;
  trialActive: boolean;
  canSend: boolean;
}

export default function UpgradePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [status, setStatus] = useState<SubStatus | null>(null);

  useEffect(() => {
    fetch("/api/subscription").then((r) => (r.ok ? r.json() : null)).then(setStatus);
  }, []);

  const basicMonthly = 9.9;
  const proMonthly = 19.9;
  const yearlyDiscount = 0.2;
  const basicPrice = isYearly ? (basicMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : basicMonthly.toFixed(2);
  const proPrice = isYearly ? (proMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : proMonthly.toFixed(2);

  const trialExpired = status && !status.canSend;
  const trialActive = status?.trialActive;

  return (
    <div className="py-16 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Nadgradi paket</Badge>
          {trialExpired ? (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
                Vaša preizkusna doba je potekla
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Da bi nadaljevali s pošiljanjem računov, izberite paket spodaj. Vaš arhiv ostane dostopen.
              </p>
            </>
          ) : trialActive ? (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
                Nadgradite že med preizkusno dobo
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Preostali še {status.daysRemaining} dni preizkusne dobe. Z nadgradnjo se izognete prekinitvi storitve.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Izberite paket</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Brez vezave · Odpoveš kadarkoli · Brez skritih stroškov
              </p>
            </>
          )}
        </div>

        {/* Yearly toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-base ${!isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Mesečno</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isYearly ? "bg-blue-600" : "bg-slate-300"
            }`}
            aria-label="Preklopi obračunsko obdobje"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isYearly ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-base ${isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>Letno</span>
          {isYearly && <Badge className="bg-green-100 text-green-700 border border-green-200">−20 % prihranek</Badge>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl">Osnovno</CardTitle>
              <CardDescription>{isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{basicPrice} €</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "leto" : "mesec"}</span>
              </div>
            </CardHeader>
            <CardContent>
              <PaddleCheckoutButton
                tier="basic"
                billing={isYearly ? "yearly" : "monthly"}
                className="w-full mb-6"
                variant="outline"
              >
                Izberi Osnovno →
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

          {/* PRO */}
          <Card className="border-2 border-blue-600 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                🏢 PRO · Računovodstvo
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">PRO</CardTitle>
              <CardDescription>{isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{proPrice} €</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "leto" : "mesec"}</span>
              </div>
            </CardHeader>
            <CardContent>
              <PaddleCheckoutButton
                tier="pro"
                billing={isYearly ? "yearly" : "monthly"}
                className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Izberi PRO →
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

        <div className="mt-10 text-center text-sm text-slate-500">
          <p>Imate vprašanje pred nakupom? <Link href="/contact" className="text-blue-600 hover:underline">Kontaktirajte nas</Link></p>
        </div>
      </div>
    </div>
  );
}
