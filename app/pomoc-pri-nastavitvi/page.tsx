import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, BookOpen, Video, Phone } from "lucide-react";

export const metadata = { title: "Pomoč pri nastavitvi — SlikajRačun" };

export default function Pomoc() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-200 border-0">Pomoč pri nastavitvi</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Pomagamo vam pri začetku</h1>
          <p className="text-xl text-slate-600">
            Če potrebujete pomoč pri nastavitvi ali imate težave, smo tukaj za vas
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Pomoč pri osnovni nastavitvi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">Če ne veste, kako začeti, vam bomo pomagali:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Registracija in prijava v aplikacijo</li>
                <li>Iskanje pravega OCR email naslova za vaš računovodski program</li>
                <li>Vnos nastavitev in konfiguracija aplikacije</li>
                <li>Prvi test pošiljanja računa</li>
                <li>Preverjanje, ali račun prispe v vaš program</li>
              </ul>
              <p className="text-sm text-slate-600 mt-4">
                Kontaktirajte nas na{" "}
                <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">
                  info@posljiracun.si
                </a>{" "}
                in dogovorimo se za video klic ali vam pošljemo podrobna navodila.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Navodila za posamezne programe</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">Za najbolj razširjene računovodske programe imamo pripravljene posebne vodnike:</p>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">Minimax</h3>
                  <p className="text-sm text-slate-600">
                    Navodila za aktivacijo email uvoza in OCR obdelave v programu Minimax
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold">Birokrat</h3>
                  <p className="text-sm text-slate-600">
                    Korak-za-korakom vodič za nastavitev Birokrat računovodstva
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold">Pantheon</h3>
                  <p className="text-sm text-slate-600">
                    Aktivacija eBooks OCR storitve in povezava z našo aplikacijo
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold">SAOP</h3>
                  <p className="text-sm text-slate-600">Nastavitev API dostopa in email uvoza v SAOP sistemu</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Pišite nam za podrobna navodila za vaš računovodski program.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Video tutoriali</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">Oglejte si naše video tutoriale, ki vas vodijo skozi celoten proces:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Kako začeti z aplikacijo (5 min)</li>
                <li>Nastavitev OCR email naslova (3 min)</li>
                <li>Fotografiranje in pošiljanje prvega računa (2 min)</li>
                <li>Uporaba arhiva in zgodovina pošiljanj (4 min)</li>
                <li>Napredne funkcije PRO paketa (6 min)</li>
              </ul>
              <p className="text-sm text-slate-600 mt-4">Kmalu na voljo na našem YouTube kanalu.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Osebna pomoč</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">Za naročnike PRO paketa nudimo osebno telefonsko ali video podporo:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Prednostna podpora</li>
                <li>Dogovorjen video klic za nastavitev</li>
                <li>Individualna prilagoditev potreb</li>
                <li>Pomoč pri integraciji z več podjetji</li>
              </ul>
              <Link
                href="/cenik"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Poglej PRO paket
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-4 font-semibold">Še vedno potrebujete pomoč?</h2>
          <p className="text-slate-600 mb-6">
            Kontaktirajte našo podporo in z veseljem vam bomo pomagali pri nastavitvi.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kontaktirajte podporo
          </Link>
        </div>
      </div>
    </div>
  );
}
