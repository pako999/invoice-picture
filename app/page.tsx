"use client";
import { useState } from "react";
import Link from "next/link";
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
  ArrowRight,
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
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

  // Prices match the App Store / Play Store tiers; yearly is set
  // explicitly (not computed) so it lines up with the chosen store tier.
  const basicMonthly = 6.99;
  const basicYearly  = 66.90;  // explicit store tier
  const proMonthly   = 17.99;
  const proYearly    = 171.99; // explicit store tier

  const basicPrice = (isYearly ? basicYearly : basicMonthly).toFixed(2);
  const proPrice   = (isYearly ? proYearly   : proMonthly).toFixed(2);
  const basicMonthlySavings = (basicMonthly * 12 - basicYearly).toFixed(2);
  const proMonthlySavings   = (proMonthly * 12 - proYearly).toFixed(2);

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
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
      {/* Redesigned product hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-32 top-0 h-[30rem] w-[30rem] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                <Sparkles className="h-4 w-4" />
                Najhitrejša pot od računa do računovodstva
              </div>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Račun poslikate.
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mi ga pošljemo naprej.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Fotografirajte ali naložite PDF in ga z enim klikom pošljite neposredno v Minimax, Birokrat, Pantheon ali na kateri koli računovodski e-poštni naslov.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/scan" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Začni brezplačno <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="#za-racunovodstva" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                  Rešitev za računovodstva
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> 3 računi mesečno brezplačno</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-500" /> Brez podatkov kartice</span>
                <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> JPG, PNG in PDF</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 blur-2xl opacity-20" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-slate-900/20">
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs font-semibold text-slate-400">posljiracun.si/scan</span>
                </div>
                <div className="rounded-[1.4rem] bg-white p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Nov račun</p><h3 className="mt-1 text-xl font-black text-slate-900">Pošlji v računovodstvo</h3></div>
                    <div className="rounded-xl bg-blue-50 p-3"><FileText className="h-6 w-6 text-blue-600" /></div>
                  </div>
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-6 py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Camera className="h-7 w-7" /></div>
                    <p className="mt-4 font-bold text-slate-800">Fotografiraj ali naloži dokumente</p>
                    <p className="mt-1 text-sm text-slate-500">Tudi do 500 PDF računov naenkrat</p>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><Building2 className="h-5 w-5 text-green-700" /></div>
                      <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Pošlji za podjetje</p><p className="truncate font-bold text-slate-900">Sport Group d.o.o.</p></div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Izbrano</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-white">
                    <div><p className="text-xs text-slate-400">Ciljni OCR naslov</p><p className="text-sm font-bold">uvoz@racunovodstvo.si</p></div>
                    <Send className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-green-200 bg-white p-4 shadow-xl sm:flex">
                <div className="rounded-full bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-xs text-slate-500">Status</p><p className="text-sm font-bold text-slate-900">Račun uspešno poslan</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated accounting-firm hero */}
      <section id="za-racunovodstva" className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.28),transparent_38%),radial-gradient(circle_at_85%_70%,rgba(79,70,229,.22),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">
              <Users className="h-4 w-4" /> Za računovodske servise
            </div>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              En račun za vsa podjetja, ki jih vodite.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Ne potrebujete ločene prijave za vsako stranko. V enem uporabniškem računu dodate vsa podjetja, vsakemu določite njegov OCR e-poštni naslov in pri pošiljanju samo izberete pravo podjetje.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Neomejeno podjetij", "Vse stranke upravljate iz ene prijave."],
                ["Ločen OCR naslov", "Vsak račun vedno prispe v pravo podjetje."],
                ["Hiter preklop", "Pred pošiljanjem izberete podjetje z enim klikom."],
                ["Ločeni arhivi", "Pregled računov in statusov za vsako podjetje."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
            <Link href="#cenik" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:bg-blue-50">
              Poglej paket PRO <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="rounded-2xl bg-white p-5 text-slate-900 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Moja podjetja</p><h3 className="mt-1 text-xl font-black">12 aktivnih podjetij</h3></div>
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">+ Dodaj podjetje</button>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Sport Group d.o.o.", "uvoz@sportgroup.si", "38 računov"],
                  ["ABC Trgovina d.o.o.", "ocr@abctrgovina.si", "21 računov"],
                  ["Studio Kovač s.p.", "racuni@studiokovac.si", "14 računov"],
                ].map(([company, email, count], index) => (
                  <div key={company} className={`flex items-center gap-3 rounded-xl border p-4 ${index === 0 ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><Building2 className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold">{company}</p><p className="truncate text-xs text-slate-500">{email}</p></div>
                    <span className="text-xs font-semibold text-slate-500">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xl font-black">12</p><p className="text-[11px] text-slate-500">podjetij</p></div>
                <div className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xl font-black">186</p><p className="text-[11px] text-slate-500">ta mesec</p></div>
                <div className="rounded-xl bg-green-50 p-3 text-center"><p className="text-xl font-black text-green-700">100%</p><p className="text-[11px] text-green-700">dostavljeno</p></div>
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
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">Brezplačen</CardTitle>
                <CardDescription>Za občasno rabo</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">0 €</span>
                  <span className="text-slate-600"> / mesec</span>
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
                  {[
                    { text: "Do 3 računi na mesec", ok: true },
                    { text: "1 podjetje", ok: true },
                    { text: "Pošiljanje na kateri koli email", ok: true },
                    { text: "Deluje z Minimax, Birokrat, Pantheon…", ok: true },
                    { text: "Arhiv poslanih računov s predogledom", ok: true },
                    { text: "Neomejeno pošiljanje računov", ok: false },
                    { text: "Več podjetij", ok: false },
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
                <Badge className="bg-blue-600 text-white border-0">Najbolj priljubljen</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Osnovni</CardTitle>
                <CardDescription>
                  {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{basicPrice} €</span>
                  <span className="text-slate-600"> / {isYearly ? "leto" : "mesec"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Prihranek: {basicMonthlySavings} € letno</p>
                )}
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
                  {[
                    "Neomejeno pošiljanje računov",
                    "Pošiljanje na kateri koli email",
                    "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka",
                    "OCR obdelava v vašem računovodskem programu",
                    "Arhiv poslanih računov s predogledom",
                    "Status pošiljanja v realnem času",
                    "Podpora JPG, PNG, WEBP in PDF",
                    "Mobilno optimizirana aplikacija",
                    "1 podjetje",
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
                  🏢 PRO · Računovodstvo
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">PRO</CardTitle>
                <CardDescription>
                  {isYearly ? "Letna obnova, kadarkoli odpoveš" : "Mesečna obnova, kadarkoli odpoveš"}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{proPrice} €</span>
                  <span className="text-slate-600"> / {isYearly ? "leto" : "mesec"}</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-green-600 mt-2">Prihranek: {proMonthlySavings} € letno</p>
                )}
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
                  {[
                    "Vse iz osnovnega paketa",
                    "Upravljanje neomejeno podjetij",
                    "Ločen OCR email za vsako podjetje",
                    "Hitri preklop med podjetji pri skeniranju",
                    "En račun — vsa podjetja na enem mestu",
                    "Arhiv računov ločen po podjetjih",
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
