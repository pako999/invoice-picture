import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Politika vračil",
  description: "30-dnevna garancija vračila denarja. Kako zahtevati vračilo, kdaj je vračilo mogoče in kako preklicati naročnino na Slikaj Račun.",
  slug: "vracila",
});

export default function Vracila() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pravno</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Politika vračil</h1>
          <p className="text-lg text-slate-600">Zadnja posodobitev: Maj 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Uvod</h2>
            <p className="text-slate-700">
              V aplikaciji Računi si prizadevamo za vašo popolno zadovoljnost. Če z našo storitvijo niste zadovoljni, vam nudimo 30-dnevno garancijo vračila denarja brez vprašanj. Ta politika opisuje pogoje in postopek za zahtevo vračila.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. 30-dnevna garancija vračila</h2>
            <p className="text-slate-700">
              Vsem novim plačljivim naročnikom nudimo <strong>30-dnevno garancijo vračila denarja</strong>. Če v prvih 30 dneh od začetka plačljive naročnine niste zadovoljni z nашo storitvijo, vam brez kakršnih koli vprašanj vrnemo celoten znesek plačila.
            </p>
            <p className="text-slate-700 mt-3">
              Garancija velja za:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-2">
              <li>Mesečne naročnine — v roku 30 dni od prve naročnine</li>
              <li>Letne naročnine — v roku 30 dni od začetka naročnine</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Kako zahtevati vračilo</h2>
            <p className="text-slate-700 mb-3">Vračilo lahko zahtevate na dva načina:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>
                <strong>Po emailu:</strong> Pišite nam na{" "}
                <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>{" "}
                z zadevo &quot;Zahteva za vračilo&quot; in navedite vaš email naslov ter razlog za vračilo.
              </li>
              <li>
                <strong>Prek obrazca:</strong> Izpolnite{" "}
                <Link href="/contact" className="text-blue-600 hover:underline">kontaktni obrazec</Link>{" "}
                in v sporočilu navedite, da zahtevate vračilo.
              </li>
            </ul>
            <p className="text-slate-700 mt-3">
              Po prejemu vaše zahteve vas bomo kontaktirali v roku 1 delovnega dne za potrditev.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Rok obdelave vračila</h2>
            <p className="text-slate-700">
              Po odobritvi zahteve za vračilo bo znesek vrnjen na vaš originalni plačilni način v roku <strong>5–7 delovnih dni</strong>. Čas knjiženja je odvisen od vaše banke ali kartičnega ponudnika.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Brezplačni paket</h2>
            <p className="text-slate-700">
              Uporabniki brezplačnega paketa ne potrebujejo vračila, saj storitev ne zahteva plačila. Brezplačni paket vam omogoča pošiljanje do 3 računov mesečno brez kakršnih koli stroškov.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Preklic naročnine</h2>
            <p className="text-slate-700">
              Naročnino lahko kadarkoli preklicite brez vprašanj neposredno v nastavitvah svojega računa. Po preklicu:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Dostop do plačljivih funkcij ostane aktiven do konca plačanega obdobja</li>
              <li>Samodejno podaljšanje naročnine bo ustavljeno takoj</li>
              <li>Za plačano obdobje po preklicu vračila ne izvajamo (razen v okviru 30-dnevne garancije)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Sorazmerna vračila</h2>
            <p className="text-slate-700">
              V izjemnih primerih, ko pride do tehničnih težav na naši strani, ki so onemogočile uporabo storitve, obravnavamo zahteve za <strong>sorazmerno (prorated) vračilo</strong> za neuporabljeni del naročninskega obdobja. Takšne zahteve obravnavamo individualno na podlagi dokumentiranih prekinitev storitve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Izjeme</h2>
            <p className="text-slate-700 mb-3">Vračila niso mogoča v naslednjih primerih:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Zahteva je vložena po preteku 30-dnevnega garancijskega obdobja</li>
              <li>Račun je bil začasno ali trajno prekinjen zaradi kršitve{" "}
                <Link href="/pogoji-uporabe" className="text-blue-600 hover:underline">pogojev uporabe</Link>
              </li>
              <li>Storitve so bile dejansko in v celoti koriščene</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Kontakt</h2>
            <p className="text-slate-700">Za vprašanja v zvezi z vračili nas kontaktirajte:</p>
            <p className="text-slate-700 mt-3">
              Email:{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>
              <br />
              Sport Group d.o.o.<br />
              Osojnikova 4, 2000 Maribor, Slovenija<br />
              ID za DDV: SI72133449
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
