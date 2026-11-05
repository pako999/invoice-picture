import { Badge } from "@/components/ui/badge";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pogoji uporabe",
  description: "Pogoji uporabe aplikacije Slikaj Račun: opis storitve, plačilni pogoji, odpoved naročnine, omejitve odgovornosti, intelektualna lastnina.",
  slug: "pogoji-uporabe",
});

export default function Pogoji() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pravno</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Pogoji uporabe</h1>
          <p className="text-lg text-slate-600">Zadnja posodobitev: April 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Sprejem pogojev</h2>
            <p className="text-slate-700">
              Z dostopom do aplikacije Računi in njeno uporabo se strinjate s temi pogoji uporabe. Če se s pogoji ne strinjate, prosimo, da aplikacije ne uporabljate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Opis storitve</h2>
            <p className="text-slate-700">
              Aplikacija Računi omogoča fotografiranje papirnatih računov in njihovo pošiljanje na email naslov računovodskega programa, ki ga uporabnik določi. Aplikacija deluje kot posredniška storitev in ne izvaja OCR obdelave računov.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Uporabniški račun</h2>
            <p className="text-slate-700 mb-3">Za uporabo storitve morate ustvariti uporabniški račun. Pri tem se zavezujete:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Zagotoviti točne in resnične podatke</li>
              <li>Ohraniti tajnost gesla in dostopnih podatkov</li>
              <li>Takoj obvestiti o morebitnem nepooblaščenem dostopu</li>
              <li>Uporabljati račun v skladu z veljavno zakonodajo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Plačilni pogoji</h2>
            <p className="text-slate-700">
              Storitev se obračunava mesečno ali letno, odvisno od izbranega paketa. Cene so navedene na spletni strani in vključujejo DDV. Plačilo se izvede vnaprej za tekoče obračunsko obdobje. Neuspešno plačilo lahko privede do začasne prekinitve storitve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Odpoved naročnine</h2>
            <p className="text-slate-700">
              Naročnino lahko odpoveste kadarkoli. Odpoved začne veljati ob koncu tekočega plačanega obdobja. Plačano obdobje ni mogoče vrniti. Po odpovedi ohranite dostop do storitve do konca plačanega obdobja.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Uporaba storitve</h2>
            <p className="text-slate-700 mb-3">Storitev lahko uporabljate samo za zakonite namene. Prepovedano je:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Pošiljanje nezakonitih ali škodljivih vsebin</li>
              <li>Zloraba storitve za pošiljanje neželene pošte (spam)</li>
              <li>Poskusi nepooblaščenega dostopa do sistemov</li>
              <li>Obremenjevanje sistema z avtomatiziranimi zahtevki</li>
              <li>Kršenje pravic tretjih oseb</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Omejitve odgovornosti</h2>
            <p className="text-slate-700 mb-3">Storitev je na voljo &quot;kot je&quot;. Ne odgovarjamo za:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Kakovost OCR obdelave, ki jo izvaja vaš računovodski program</li>
              <li>Izgube podatkov zaradi tehničnih težav pri tretjih osebah</li>
              <li>Prekinitve storitve zaradi vzdrževanja ali višje sile</li>
              <li>Napake v delovanju računovodskih programov</li>
              <li>Posredne, naključne ali posledične škode</li>
            </ul>
            <p className="text-slate-700 mt-3">
              Naša odgovornost je omejena na znesek, ki ste ga plačali za storitev v zadnjih 12 mesecih.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Intelektualna lastnina</h2>
            <p className="text-slate-700">
              Vsa programska oprema, oblika, dizajn in vsebina aplikacije so zaščiteni z avtorskimi pravicami. Brez pisnega dovoljenja jih ni dovoljeno kopirati, distribuirati ali spreminjati. Slike računov, ki jih naložite, ostanejo vaša lastnina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Prenehanje storitve</h2>
            <p className="text-slate-700">
              Pridržujemo si pravico do prekinitve ali prenehanja zagotavljanja storitve brez predhodnega obvestila v primeru kršitve teh pogojev ali zaradi drugih utemeljenih razlogov. V primeru prenehanja storitve vam bomo vrnili sorazmerni del plačila za neizkoriščeno obdobje.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Spremembe pogojev</h2>
            <p className="text-slate-700">
              Pridržujemo si pravico do spremembe teh pogojev. O pomembnih spremembah vas bomo obvestili po emailu 30 dni vnaprej. Nadaljevanje uporabe storitve po uveljavitvi sprememb pomeni, da sprejmete nove pogoje.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">11. Reševanje sporov</h2>
            <p className="text-slate-700">
              Za morebitne spore je pristojno slovensko pravo. Trudimo se za sporazumno rešitev nesoglasij. V primeru spora je pristojno sodišče v Ljubljani.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">12. Kontakt</h2>
            <p className="text-slate-700">Za vprašanja v zvezi s pogoji uporabe nas kontaktirajte:</p>
            <p className="text-slate-700 mt-3">
              Email:{" "}
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">
                info@posljiracun.si
              </a>
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
