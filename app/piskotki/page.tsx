import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Politika piškotkov — SlikajRačun" };

export default function Piskotki() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pravno</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Politika piškotkov</h1>
          <p className="text-lg text-slate-600">Zadnja posodobitev: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Kaj so piškotki?</h2>
            <p className="text-slate-700">
              Piškotki so majhne besedilne datoteke, ki se shranijo na vašo napravo, ko obiščete spletno stran. Omogočajo, da spletna stran prepozna vašo napravo in si zapomni določene informacije o vaši uporabi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Kako uporabljamo piškotke?</h2>
            <p className="text-slate-700 mb-4">
              Na naši spletni strani uporabljamo različne vrste piškotkov za različne namene:
            </p>

            <div className="grid gap-4 not-prose">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Nujno potrebni piškotki</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    Ti piškotki so nujno potrebni za delovanje spletne strani in jih ni mogoče onemogočiti. Vključujejo piškotke za prijavo, preverjanje pristnosti in osnovne varnostne funkcije.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Primeri:</strong> Seja prijave, preverjanje avtentikacije, varnostni žetoni
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Funkcionalni piškotki</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    Ti piškotki omogočajo izboljšano funkcionalnost in prilagoditev. Lahko jih nastavi naša stran ali tretje osebe, katerih storitve uporabljamo.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Primeri:</strong> Jezikovne nastavitve, uporabniške preference
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Analitični piškotki</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    Ti piškotki nam pomagajo razumeti, kako obiskovalci uporabljajo našo spletno stran, in izboljšati uporabniško izkušnjo. Vsi podatki so anonimizirani.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    <strong>Primeri:</strong> Google Analytics, statistika obiskov
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Trženjski piškotki</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">
                    Ti piškotki se uporabljajo za prikaz relevantnih oglasov in merjenje učinkovitosti oglaševalskih kampanj. Trenutno ne uporabljamo trženjskih piškotkov.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Piškotki tretjih oseb</h2>
            <p className="text-slate-700 mb-3">
              Naša spletna stran uporablja storitve tretjih oseb, ki lahko nastavijo svoje piškotke:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Clerk:</strong> Sistem za avtentikacijo in upravljanje uporabnikov</li>
              <li><strong>Google Analytics:</strong> Analiza uporabe spletne strani (če je omogočena)</li>
              <li><strong>Stripe:</strong> Obdelava plačil (samo pri plačilu)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Trajanje piškotkov</h2>
            <p className="text-slate-700 mb-3">Piškotki se lahko razlikujejo glede na trajanje:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Sejni piškotki:</strong> Se izbrišejo, ko zaprete brskalnik</li>
              <li><strong>Trajni piškotki:</strong> Ostanejo na napravi določeno časovno obdobje (običajno do 1 leta)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Kako upravljati piškotke?</h2>
            <p className="text-slate-700 mb-3">Piškotke lahko upravljate ali blokirate na naslednje načine:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Nastavitve brskalnika:</strong> Večina brskalnikov omogoča blokiranje ali brisanje piškotkov</li>
              <li><strong>Nastavitve piškotkov:</strong> Kliknite gumb &quot;Nastavitve piškotkov&quot; na dnu strani</li>
              <li><strong>Onemogočanje analitike:</strong> Onemogočite analitične piškotke v nastavitvah</li>
            </ul>
            <p className="text-sm text-slate-600 mt-3">
              <strong>Opomba:</strong> Če blokirate nujno potrebne piškotke, nekatere funkcije spletne strani morda ne bodo delovale pravilno.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Spremembe politike</h2>
            <p className="text-slate-700">
              Pridržujemo si pravico do spremembe te politike piškotkov. Vse spremembe bodo objavljene na tej strani z novo datum posodobitve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Kontakt</h2>
            <p className="text-slate-700">Za vprašanja v zvezi s piškotki nas kontaktirajte:</p>
            <p className="text-slate-700 mt-3">
              Email:{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">
                info@posljiracun.si
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
