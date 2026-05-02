"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  { text: "Neomejeno pošiljanje računov", included: false },
  { text: "Več podjetij", included: false },
];

const basicFeatures = [
  "Neomejeno pošiljanje računov",
  "Pošiljanje na kateri koli email",
  "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
  "Arhiv s predogledom in iskanjem",
  "Status pošiljanja v realnem času",
  "Podpora za JPG, PNG, WEBP in PDF",
  "Mobilno optimizirana aplikacija",
  "1 podjetje",
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
  isFree: boolean;
  monthlyUsage: number;
  monthlyLimit: number | null;
}

function UpgradePageInner() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan"); // "basic" | "pro"
  const billingFromUrl = searchParams.get("billing"); // "monthly" | "yearly"

  const [isYearly, setIsYearly] = useState(billingFromUrl === "yearly");
  const [status, setStatus] = useState<SubStatus | null>(null);

  useEffect(() => {
    fetch("/api/subscription").then((r) => (r.ok ? r.json() : null)).then(setStatus);
  }, []);

  const basicMonthly = 6.9;
  const proMonthly = 17.9;
  const yearlyDiscount = 0.2;
  const basicPrice = isYearly ? (basicMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : basicMonthly.toFixed(2);
  const proPrice = isYearly ? (proMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : proMonthly.toFixed(2);
  const basicSavings = (basicMonthly * 12 * yearlyDiscount).toFixed(2);
  const proSavings = (proMonthly * 12 * yearlyDiscount).toFixed(2);

  const trialExpired = status && !status.canSend;
  const trialActive = status?.trialActive;
  const isFree = status?.isFree;
  const freeAtLimit = isFree && status?.monthlyLimit !== null && (status?.monthlyUsage ?? 0) >= (status?.monthlyLimit ?? 0);

  return (
    <div className="py-16 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
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
          ) : freeAtLimit ? (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
                Mesečna omejitev dosežena
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Dosegli ste {status?.monthlyUsage}/{status?.monthlyLimit} računov ta mesec. Nadgradite za neomejeno obdelavo.
              </p>
            </>
          ) : trialActive ? (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
                Nadgradite že med preizkusno dobo
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Preostali še {status!.daysRemaining} dni preizkusne dobe. Z nadgradnjo se izognete prekinitvi storitve.
              </p>
            </>
          ) : isFree ? (
            <>
              <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Izberite paket</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Trenutno ste na brezplačnem paketu. Nadgradite za neomejeno obdelavo računov.
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

        {planFromUrl && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center text-sm text-blue-800">
            Registracija uspešna! Kliknite gumb spodaj za dokončanje naročnine.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <Card className={`relative ${isFree ? "border-slate-300 bg-slate-50" : "border-slate-200"}`}>
            {isFree && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-slate-600 text-white border-0">Vaš trenutni paket</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">Brezplačen</CardTitle>
              <CardDescription>Za občasno rabo</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">0 €</span>
                <span className="text-slate-600 text-xl"> / mesec</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Za vedno brezplačno</p>
            </CardHeader>
            <CardContent>
              {isFree ? (
                <div className="w-full mb-6 flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-sm font-semibold cursor-default">
                  ✓ Aktivni paket
                </div>
              ) : (
                <Link
                  href="/scan"
                  className="w-full mb-6 flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors"
                >
                  Nadaljuj brezplačno →
                </Link>
              )}
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
          <Card className={`relative ${planFromUrl === "basic" || (!planFromUrl && !isFree) ? "border-2 border-blue-600 shadow-xl" : "border-slate-200"}`}>
            {(planFromUrl === "basic" || (!planFromUrl && !isFree && !trialExpired)) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white border-0">
                  {planFromUrl === "basic" ? "✓ Vaša izbira" : "Najbolj priljubljen"}
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">Osnovni</CardTitle>
              <CardDescription>{isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">{basicPrice} €</span>
                <span className="text-slate-600 text-xl"> / {isYearly ? "leto" : "mesec"}</span>
              </div>
              {isYearly && <p className="text-sm text-green-600 mt-1">Prihranek: {basicSavings} € letno</p>}
            </CardHeader>
            <CardContent>
              <PaddleCheckoutButton
                tier="basic"
                billing={isYearly ? "yearly" : "monthly"}
                className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Izberi Osnovni →
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
          <Card className={`relative ${planFromUrl === "pro" ? "border-2 border-indigo-600 shadow-xl" : "border-slate-200"}`}>
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
              {isYearly && <p className="text-sm text-green-600 mt-1">Prihranek: {proSavings} € letno</p>}
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

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageInner />
    </Suspense>
  );
}
