"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
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

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", desc: "Email uvoz + OCR", href: "https://www.vasco.si/minimax" },
  { name: "Birokrat", logo: "/logos/birokrat.png", desc: "Email uvoz + OCR", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", desc: "eBooks OCR storitev", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: "/logos/vasco.png", desc: "API uvoz računov", href: "https://www.vasco.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", desc: "Email + DigiBox OCR", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", desc: "Email uvoz + OCR", href: "https://www.metakocka.si" },
];

export default function Home() {
  const [isYearly, setIsYearly] = useState(false);

  const basicMonthly = 9.9;
  const proMonthly = 19.9;
  const yearlyDiscount = 0.2;

  const basicPrice = isYearly ? (basicMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : basicMonthly.toFixed(2);
  const proPrice = isYearly ? (proMonthly * 12 * (1 - yearlyDiscount)).toFixed(2) : proMonthly.toFixed(2);
  const basicMonthlySavings = (basicMonthly * 12 * yearlyDiscount).toFixed(2);
  const proMonthlySavings = (proMonthly * 12 * yearlyDiscount).toFixed(2);

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SlikajRačun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Fotografiraj papirnat račun in ga z enim klikom pošlji na email računovodskega programa. Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.",
    url: "https://www.posljiracun.si",
    inLanguage: "sl-SI",
    offers: [
      {
        "@type": "Offer",
        name: "Osnovno",
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
        name: "PRO Računovodstvo",
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
      "Fotografiranje papirnatih računov z mobilno kamero",
      "Pošiljanje na email računovodskega programa z enim klikom",
      "Arhiv vseh poslanih računov s predogledom",
      "Status pošiljanja v realnem času",
      "Podpora za JPG, PNG, WEBP in PDF",
      "Upravljanje več podjetij (PRO)",
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
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
              🇸🇮 Narejen za slovensko računovodstvo
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent font-bold">
              Slikaj račun in ga pošlji z enim klikom
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Z enim klikom fotografirate fizični račun, aplikacija pa ga samodejno pošlje na vaš e-mail ali neposredno na OCR e-mail, kjer ga vaš računovodski program obdela naprej.
            </p>
            <p className="text-lg text-slate-700 mb-8">
              Brez ročnega vnosa, brez kompliciranja — <strong>hitro, enostavno in učinkovito</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg h-12 px-8 rounded-lg font-medium transition-colors"
              >
                📷 Začni skenirati
              </Link>
              <Link
                href="/kako-deluje"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-lg h-12 px-8 rounded-lg font-medium transition-colors"
              >
                Več o aplikaciji
              </Link>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <strong>Pogoj za uporabo:</strong> V vašem računovodskem programu mora biti vklopljeno sprejemanje računov po emailu z OCR obdelavo. Preverite nastavitve pri Minimax, Birokrat, Pantheon ali vašem programu.
                </div>
              </div>
            </div>
          </div>

          {/* Process Flow */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent blur-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                {[
                  { Icon: FileText, color: "bg-blue-100 text-blue-600", emoji: "🧾", label: "Papirnat račun" },
                  { Icon: Camera, color: "bg-green-100 text-green-600", emoji: "📱", label: "Fotografiraš" },
                  { Icon: Send, color: "bg-purple-100 text-purple-600", emoji: "📤", label: "Pošlješ" },
                  { Icon: Bot, color: "bg-orange-100 text-orange-600", emoji: "🤖", label: "OCR obdela" },
                  { Icon: CheckCircle, color: "bg-teal-100 text-teal-600", emoji: "✅", label: "Knjiženo!" },
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

      {/* Integrations Section */}
      <section id="integracije" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integracije</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Deluje z vašim programom</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              App posreduje sliko računa na email vašega programa. OCR obdelavo — branje zneskov, datumov in dobaviteljev — opravi vaš računovodski program.
            </p>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  V programu mora biti vklopljena funkcija sprejemanja računov po emailu z OCR obdelavo.
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
                      ✓ podprt
                    </Badge>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>

          <p className="text-center mt-8 text-slate-600">
            + kateri koli drug program, ki sprejema račune po emailu
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section id="kako-deluje" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Kako deluje</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">3 preprosti koraki</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚙️</span>
                  <CardTitle>1. Enkrat nastavi email</CardTitle>
                </div>
                <CardDescription>
                  V nastavitvah vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov (npr. uvoz@minimax.si). To storite samo enkrat.
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
                  <CardTitle>2. Fotografirajte račun</CardTitle>
                </div>
                <CardDescription>
                  Odprite aplikacijo in s telefonom poslikajte papirnat račun. Podpira JPG, PNG in WEBP.
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
                  <CardTitle>3. En klik — poslano</CardTitle>
                </div>
                <CardDescription>
                  Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi. OCR obdelava poteka v programu — ne pri nas.
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
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Funkcionalnosti</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Vse kar potrebuješ</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>📷 En klik — račun poslan</CardTitle>
                <CardDescription>
                  Poslikajte papirnat račun in pritisnite Pošlji. Nič tipkanja, nič prenašanja datotek. Optimizirano za mobilne naprave.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>📧 Posredovanje na vaš program</CardTitle>
                <CardDescription>
                  App pošlje sliko na email, ki ga nastavi vaš računovodski program. OCR obdelavo opravi program — Minimax, Birokrat, Pantheon in drugi.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Archive className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>📋 Arhiv vseh pošiljanj</CardTitle>
                <CardDescription>
                  Vsi poslani računi so shranjeni z datumom, statusom dostave in predogledom. Kadarkoli preverite, ali je bil račun poslan.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="cenik" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Cenik</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Začnite danes</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Prihranite dragoceni čas pri ročnem vnosu računov. En klik nadomesti minute tipkanja.
            </p>

            {/* Pricing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-lg ${!isYearly ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                Mesečno
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
                Letno
              </span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-700 border-green-200 border">
                  -20% prihranek
                </Badge>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Osnovno</CardTitle>
                <CardDescription>
                  {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl">{basicPrice} €</span>
                  <span className="text-slate-600"> / {isYearly ? "leto" : "mesec"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Prihranek: {basicMonthlySavings} € letno</p>
                )}
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full mb-6">
                  Začni mesečno →
                </Button>
                <ul className="space-y-3">
                  {[
                    "Neomejeno fotografiranje računov",
                    "Pošiljanje na kateri koli email",
                    "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
                    "OCR obdelava v vašem računovodskem programu",
                    "Arhiv poslanih računov s predogledom",
                    "Status pošiljanja v realnem času",
                    "Podpora JPG, PNG, WEBP in PDF",
                    "Mobilno optimizirana aplikacija",
                    "Varen dostop prek Clerk avtentikacije",
                    "Shramba zgodovine brez omejitev",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                  🏢 PRO · Računovodstvo
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>PRO</CardTitle>
                <CardDescription>
                  {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl">{proPrice} €</span>
                  <span className="text-slate-600"> / {isYearly ? "leto" : "mesec"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Prihranek: {proMonthlySavings} € letno</p>
                )}
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Začni PRO →
                </Button>
                <ul className="space-y-3">
                  {[
                    "Vse iz osnovnega paketa",
                    "Upravljanje neomejeno podjetij",
                    "Ločen OCR email za vsako podjetje",
                    "Hitri preklop med podjetji pri skeniranju",
                    "En račun — vsa podjetja na enem mestu",
                    "Arhiv računov ločen po podjetjih",
                    "Mobilno optimizirana aplikacija",
                    "Varen dostop prek Clerk avtentikacije",
                    "Prednostna podpora",
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
            Brez skritih stroškov · Brez vezave · Odpoveš kadarkoli
          </p>
        </div>
      </section>
    </div>
  );
}
