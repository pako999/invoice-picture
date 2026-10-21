import Link from "next/link";
import { OcrLearningLinks } from "@/components/ocr-learning-links";
import { HomeHero } from "@/components/home-hero";
import { HomeBusinessHero } from "@/components/home-business-hero";
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

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", desc: "Email uvoz + OCR", href: "https://www.vasco.si/minimax" },
  { name: "Birokrat", logo: "/logos/birokrat.png", desc: "Email uvoz + OCR", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", desc: "eBooks OCR storitev", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: "/logos/vasco.png", desc: "API uvoz računov", href: "https://www.vasco.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", desc: "Email + DigiBox OCR", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", desc: "Email uvoz + OCR", href: "https://www.metakocka.si" },
];

export default function Home() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI OCR računov iz fotografij in PDF-jev: zajem, pregled podatkov, razdelitev PDF-ja z več računi ter izvoz eSLOG, UBL ali pošiljanje originala v računovodstvo.",
    url: "https://www.posljiracun.si",
    inLanguage: "sl-SI",
    offers: PAID_PLANS.map(code => ({
      "@type": "Offer", name: PLAN_CONFIGS[code].nameSl,
      price: PLAN_CONFIGS[code].monthlyPrice!.toFixed(2), priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: PLAN_CONFIGS[code].monthlyPrice!.toFixed(2), priceCurrency: "EUR", unitText: "MONTH", valueAddedTaxIncluded: false },
    })),
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
      <HomeHero locale="sl" />
      <HomeBusinessHero />

      {/* Integrations Section */}
      <section id="integracije" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integracije</Badge>
            <h2 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">Deluje z vašim programom</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Slikaj Račun z AI OCR prebere podatke iz računa. Original ali pregledane podatke nato pošljete v računovodski proces v formatu, ki ga vaš program podpira.
            </p>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Za pošiljanje originala potrebujete ustrezen prejemni email. Za strukturirane podatke preverite podprt XML ali API uvoz računovodskega programa.
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
                  Preverite OCR podatke in potrdite dokument. Original ali strukturirani izvoz pošljite v nastavljeno računovodstvo ter preverite stanje dostave.
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
                  Aplikacija omogoča lastni AI OCR, pregled podatkov in dostavo originala, XML ali podatkov na API. Podprt način uvoza preverite v svojem računovodskem programu.
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

      <OcrLearningLinks locale="sl" />

      {/* Current commercial pricing */}
      <section id="cenik" className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto mb-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 border-0 bg-blue-100 text-blue-700 hover:bg-blue-200">Cenik</Badge>
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Izberite OCR kapaciteto, ki jo potrebujete</h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Neomejeno pošiljanje originalnih računov v vseh plačljivih paketih. AI OCR v plačljivih paketih šteje samo obdelane strani, brez ločene omejitve računov.
          </p>
        </div>
        <CommercialPricingGrid locale="sl" compact />
      </section>


    </div>
  );
}
