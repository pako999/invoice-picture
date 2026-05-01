import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Camera, Send, FileText, Mail, CheckCircle } from "lucide-react";

export const metadata = { title: "Kako deluje — SlikajRačun" };

export default function KakoDeluje() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Kako deluje</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">
            3 preprosti koraki do avtomatizirane obdelave računov
          </h1>
          <p className="text-xl text-slate-600">
            Aplikacija je zasnovana za hitro in enostavno uporabo. Sledite tem korakom za začetek.
          </p>
        </div>

        <div className="space-y-12">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">1. Enkrat nastavi email</CardTitle>
                  <CardDescription>Postavite osnovno konfiguracijo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                V nastavitvah aplikacije vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov. To je email naslov, ki ga uporablja vaš program za sprejem in avtomatsko obdelavo računov z OCR tehnologijo.
              </p>
              <p className="text-slate-700">
                Primer email naslova: <code className="bg-slate-100 px-2 py-1 rounded">uvoz@minimax.si</code>
              </p>
              <p className="text-sm text-slate-600">
                <strong>Pomembno:</strong> To storite samo enkrat. Email naslov se shrani in ga ni potrebno vnašati ob vsakem pošiljanju računa.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">2. Fotografirajte račun</CardTitle>
                  <CardDescription>Poslikajte papirnat dokument</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Odprite aplikacijo in uporabite kamero na vašem telefonu za fotografiranje papirnatega računa. Aplikacija podpira različne formate slik:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>JPG / JPEG format</li>
                <li>PNG format</li>
                <li>WEBP format</li>
                <li>PDF dokumenti</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Namig:</strong> Poskrbite za dobro osvetlitev in poskusite zajeti celoten račun v kadru. Kvalitetnejša slika omogoča boljšo OCR obdelavo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">3. En klik — poslano</CardTitle>
                  <CardDescription>Pošljite račun v obdelavo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Ko ste zadovoljni s fotografijo, pritisnite gumb &quot;Pošlji&quot;. Aplikacija bo sliko takoj poslala na vaš nastavljen email naslov.
              </p>
              <p className="text-slate-700">
                Račun prispe na email vašega računovodskega programa v sekundi. Od tam naprej vaš program prevzame in:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>Prebere zneske s slike z OCR tehnologijo</li>
                <li>Razpozna datum računa</li>
                <li>Identificira dobavitelja</li>
                <li>Izvleče vse relevantne podatke</li>
                <li>Knjiži račun v vaš sistem</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Pomembno:</strong> OCR obdelava se izvaja v vašem računovodskem programu, ne v naši aplikaciji. Mi samo posredujemo sliko na pravo mesto.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-6 text-center font-semibold">Celoten proces</h2>
          <div className="flex flex-wrap justify-center gap-4 items-center text-center">
            <div className="flex-1 min-w-[120px]">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Papirnat račun</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Camera className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Fotografiranje</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Send className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Pošiljanje</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Mail className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium">OCR obdelava</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Knjiženo!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
