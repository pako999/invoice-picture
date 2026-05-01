import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Integracije z računovodskimi programi",
  description: "Deluje z vsem slovenskim računovodstvom: Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka. Email uvoz + OCR obdelava brez ročnega vnosa.",
  path: "/integracije",
});

const integrations = [
  {
    name: "Minimax",
    logo: "/logos/minimax.svg",
    short: "Email uvoz + OCR obdelava",
    long: "Minimax omogoča uvoz računov preko email naslova z avtomatsko OCR obdelavo in knjiženje v sistem.",
    href: "https://www.vasco.si/minimax",
  },
  {
    name: "Birokrat",
    logo: "/logos/birokrat.png",
    short: "Email uvoz + OCR obdelava",
    long: "Birokrat ponuja email uvoz z OCR tehnologijo za avtomatsko razpoznavo podatkov na računih.",
    href: "https://www.birokrat.si",
  },
  {
    name: "Pantheon",
    logo: "/logos/pantheon.png",
    short: "eBooks OCR storitev",
    long: "Pantheon uporablja eBooks OCR storitev za digitalizacijo in avtomatsko obdelavo dokumentov.",
    href: "https://www.datalab.si/pantheon",
  },
  {
    name: "SAOP",
    logo: "/logos/vasco.png",
    short: "API uvoz računov",
    long: "SAOP omogoča uvoz računov preko API vmesnika z naprednimi možnostmi avtomatizacije.",
    href: "https://www.vasco.si",
  },
  {
    name: "E-računi",
    logo: "/logos/eracuni.png",
    short: "Email + DigiBox OCR",
    long: "E-računi uporablja DigiBox OCR tehnologijo za obdelavo in upravljanje z dokumenti.",
    href: "https://www.eracuni.com",
  },
  {
    name: "Metakocka",
    logo: "/logos/metakocka.png",
    short: "Email uvoz + OCR obdelava",
    long: "Metakocka omogoča email uvoz računov z avtomatsko OCR tehnologijo in integracijo v sistem.",
    href: "https://www.metakocka.si",
  },
];

export default function Integracije() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Integracije</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Deluje z vašim računovodskim programom</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            Aplikacija Računi posreduje sliko računa na email naslov vašega računovodskega programa. OCR obdelavo — branje zneskov, datumov in dobaviteljev — opravi vaš računovodski program.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Pogoj za uporabo:</strong> V vašem računovodskem programu mora biti vklopljena funkcija sprejemanja računov po emailu z OCR obdelavo.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl mb-8 font-semibold">Podprti računovodski programi</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <img src={p.logo} alt={p.name} className="h-10 object-contain" />
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-xl">
                    {p.name}
                    <Check className="w-5 h-5 text-green-600" />
                  </CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <Badge variant="outline" className="w-fit mt-3 bg-green-50 text-green-700 border-green-200">
                    ✓ podprt
                  </Badge>
                  <p className="text-sm text-slate-600 mt-3">{p.long}</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-slate-600 mb-4">
            + kateri koli drug računovodski program, ki sprejema račune po emailu
          </p>
          <p className="text-slate-500">
            Če vaš program podpira uvoz dokumentov preko emaila, bo deloval z našo aplikacijo. Za več informacij kontaktirajte svojega ponudnika računovodskega programa.
          </p>
        </div>
      </div>
    </div>
  );
}
