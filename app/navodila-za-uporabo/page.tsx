import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Settings, Camera, Send, CheckCircle } from "lucide-react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Navodila za uporabo",
  description: "Vodnik po aplikaciji SlikajRačun: nastavitev OCR emaila, nasveti za fotografiranje, postopek pošiljanja, arhiv in zgodovina, podprti formati.",
  path: "/navodila-za-uporabo",
});

export default function Navodila() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Navodila za uporabo</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Vodnik po aplikaciji Računi</h1>
          <p className="text-xl text-slate-600">Podrobna navodila za učinkovito uporabo aplikacije</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Začetna nastavitev</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">1. Registracija in prijava</h3>
              <p className="text-slate-700">
                Po obisku spletne strani se registrirajte z email naslovom. Sistem Clerk bo poslal potrditveno email sporočilo. Kliknite na povezavo v emailu za aktivacijo računa.
              </p>

              <h3 className="font-semibold mt-4">2. Nastavitev OCR email naslova</h3>
              <p className="text-slate-700">
                Po prijavi pojdite v nastavitve in vnesite email naslov, ki vam ga je priskrbel vaš računovodski program za uvoz računov. Primeri:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Minimax: <code className="bg-slate-100 px-2 py-1 rounded text-sm">uvoz@minimax.si</code></li>
                <li>Birokrat: <code className="bg-slate-100 px-2 py-1 rounded text-sm">racuni@birokrat.si</code></li>
                <li>Pantheon: <code className="bg-slate-100 px-2 py-1 rounded text-sm">ebooks@pantheon.si</code></li>
              </ul>
              <p className="text-sm text-slate-600 mt-2">
                <strong>Opomba:</strong> Točen email naslov preverite v nastavitvah vašega računovodskega programa ali pri ponudniku storitve.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Fotografiranje računov</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Nasveti za najboljše rezultate:</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Poskrbite za dobro osvetlitev — naravna svetloba je najboljša</li>
                <li>Postavite račun na ravno površino</li>
                <li>Zajemite celoten račun v kadru</li>
                <li>Poskrbite, da je slika ostra (počakajte, da se kamera fokusira)</li>
                <li>Izogibajte se senčenju ali odsevom</li>
              </ul>

              <h3 className="font-semibold mt-4">Podprti formati:</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>JPG / JPEG</li>
                <li>PNG</li>
                <li>WEBP</li>
                <li>PDF (če imate digitalni račun)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Pošiljanje računa</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Korak po korak:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                <li>Odprite aplikacijo in pritisnite gumb &quot;Nova slika&quot; ali ikono kamere</li>
                <li>Fotografirajte račun ali izberite obstoječo sliko iz galerije</li>
                <li>Preglejte sliko in se prepričajte, da je berljiva</li>
                <li>Pritisnite gumb &quot;Pošlji&quot;</li>
                <li>Počakajte na potrditev dostave (običajno manj kot 2 sekundi)</li>
              </ol>

              <p className="text-sm text-slate-600 mt-4">
                <strong>Status pošiljanja:</strong> Takoj po kliku na &quot;Pošlji&quot; se prikaže status pošiljanja. Ko je račun dostavljen, se prikaže zelena kljukica s potrditvijo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Arhiv in zgodovina</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Vsi poslani računi so samodejno shranjeni v arhiv. Do njih lahko dostopate kadarkoli:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Pritisnite na zavihek &quot;Arhiv&quot; ali &quot;Zgodovina&quot;</li>
                <li>Preglejte vse poslane račune s časovnim žigom</li>
                <li>Kliknite na račun za ogled predogleda</li>
                <li>Preverite status dostave (Poslano / Dostavljeno / Napaka)</li>
              </ul>

              <p className="text-sm text-slate-600 mt-4">
                <strong>Iskanje:</strong> Uporabite funkcijo iskanja za hitro najdenje specifičnega računa po datumu ali drugim podatkom.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <CardTitle className="text-xl">Pogosta vprašanja in težave</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Račun ni bil dostavljen?</h3>
              <p className="text-slate-700">
                Preverite, ali ste pravilno vnesli OCR email naslov v nastavitvah. Prav tako preverite, ali je v vašem računovodskem programu vklopljena funkcija sprejemanja računov po emailu.
              </p>

              <h3 className="font-semibold mt-4">Slaba kvaliteta OCR branja?</h3>
              <p className="text-slate-700">
                OCR obdelavo opravi vaš računovodski program, ne naša aplikacija. Poskusite poslati bolj kvalitetno sliko (boljša osvetlitev, ostrejša fotografija). Če težava ostane, kontaktirajte ponudnika vašega računovodskega programa.
              </p>

              <h3 className="font-semibold mt-4">Potrebujete dodatno pomoč?</h3>
              <p className="text-slate-700">
                Obiščite stran{" "}
                <Link href="/pomoc-pri-nastavitvi" className="text-blue-600 hover:underline">
                  Pomoč pri nastavitvi
                </Link>{" "}
                ali{" "}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  kontaktirajte našo podporo
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
