import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Politika zasebnosti — SlikajRačun" };

export default function Zasebnost() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pravno</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Politika zasebnosti</h1>
          <p className="text-lg text-slate-600">Zadnja posodobitev: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Uvod</h2>
            <p className="text-slate-700">
              Aplikacija Računi spoštuje vašo zasebnost in je zavezana k zaščiti vaših osebnih podatkov. Ta politika zasebnosti vas seznanja s tem, kako zbiramo, uporabljamo, shranjujemo in varujemo vaše podatke.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Zbiranje podatkov</h2>
            <p className="text-slate-700 mb-3">Zbiramo naslednje vrste podatkov:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Identifikacijski podatki:</strong> Ime, priimek, email naslov</li>
              <li><strong>Tehnični podatki:</strong> IP naslov, podatki o napravi, brskalnik</li>
              <li><strong>Podatki o uporabi:</strong> Zgodovina poslanih računov, časovni žigi, status pošiljanja</li>
              <li><strong>Slike računov:</strong> Fotografije ali skenogrami dokumentov, ki jih pošljete</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Uporaba podatkov</h2>
            <p className="text-slate-700 mb-3">Vaše podatke uporabljamo za naslednje namene:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Zagotavljanje storitev pošiljanja računov</li>
              <li>Upravljanje uporabniškega računa</li>
              <li>Obdelava plačil in izdajanje računov</li>
              <li>Tehnična podpora in komunikacija z uporabniki</li>
              <li>Izboljšave storitve in analiza uporabe</li>
              <li>Zagotavljanje varnosti in preprečevanje zlorab</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Shranjevanje podatkov</h2>
            <p className="text-slate-700">
              Slike računov so shranjene v vašem arhivu in so dostopne samo vam. Shranjevanje je brez časovnih omejitev, dokler ne izbrišete računa ali zahtevate izbris podatkov. Tehnični podatki o pošiljanju se shranjujejo 5 let iz davčnih razlogov.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Posredovanje podatkov tretjim osebam</h2>
            <p className="text-slate-700 mb-3">
              Slike računov posredujemo na email naslov vašega računovodskega programa, ki ste ga nastavili v aplikaciji. Poleg tega lahko vaše podatke delimo z:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Ponudniki storitev:</strong> Gostovanje, plačilni sistem, email storitve</li>
              <li><strong>Pravni zahtevki:</strong> Če to zahteva zakon ali pravni postopek</li>
            </ul>
            <p className="text-slate-700 mt-3">Vaših podatkov ne prodajamo tretjim osebam za trženjske namene.</p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Varnost podatkov</h2>
            <p className="text-slate-700">
              Uporabljamo sodobne varnostne tehnologije za zaščito vaših podatkov, vključno z:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Šifrirana povezava (HTTPS/SSL)</li>
              <li>Varna avtentikacija prek Clerk sistema</li>
              <li>Redne varnostne posodobitve</li>
              <li>Omejen dostop do podatkov</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Vaše pravice</h2>
            <p className="text-slate-700 mb-3">V skladu z GDPR imate naslednje pravice:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Pravica do dostopa do vaših podatkov</li>
              <li>Pravica do popravka netočnih podatkov</li>
              <li>Pravica do izbrisa podatkov (&quot;pravica do pozabe&quot;)</li>
              <li>Pravica do omejitve obdelave</li>
              <li>Pravica do prenosljivosti podatkov</li>
              <li>Pravica do ugovora obdelavi</li>
            </ul>
            <p className="text-slate-700 mt-3">
              Za uveljavljanje teh pravic nas kontaktirajte na{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Piškotki</h2>
            <p className="text-slate-700">
              Naša spletna stran uporablja piškotke za izboljšanje uporabniške izkušnje. Več informacij najdete v naši{" "}
              <Link href="/piskotki" className="text-blue-600 hover:underline">politiki piškotkov</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Spremembe politike</h2>
            <p className="text-slate-700">
              Pridržujemo si pravico do spremembe te politike zasebnosti. O pomembnih spremembah vas bomo obvestili po emailu. Priporočamo, da redno preverjate to stran za morebitne posodobitve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Kontakt</h2>
            <p className="text-slate-700">Za vprašanja v zvezi z zasebnostjo nas kontaktirajte:</p>
            <p className="text-slate-700 mt-3">
              Email:{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
              <br />
              Naslov: Sport Group d.o.o., Ljubljana, Slovenija
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
