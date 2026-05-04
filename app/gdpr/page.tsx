import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "GDPR skladnost",
  description:
    "GDPR izjava o skladnosti aplikacije Slikaj Račun. Upravljavec osebnih podatkov, pravne podlage obdelave, pravice posameznikov, hramba in mednarodni prenosi podatkov.",
  slug: "gdpr",
});

export default function Gdpr() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">Pravno</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">GDPR — Izjava o varstvu osebnih podatkov</h1>
          <p className="text-lg text-slate-600">Zadnja posodobitev: maj 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <section>
            <h2 className="text-2xl mb-4 font-semibold">1. Upravljavec osebnih podatkov</h2>
            <p className="text-slate-700">
              Upravljavec vaših osebnih podatkov je:
            </p>
            <p className="text-slate-700 mt-3">
              <strong>Sport Group d.o.o.</strong><br />
              Osojnikova 4, 2000 Maribor, Slovenija<br />
              ID za DDV: SI72133449<br />
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a><br />
              Telefon: +386 41 580 250
            </p>
            <p className="text-slate-700 mt-3">
              V tej izjavi pojasnjujemo, kako obdelujemo osebne podatke v skladu s Splošno uredbo o varstvu podatkov (Uredba (EU) 2016/679 — &ldquo;GDPR&rdquo;) in slovenskim Zakonom o varstvu osebnih podatkov (ZVOP-2).
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">2. Vrste osebnih podatkov, ki jih obdelujemo</h2>
            <p className="text-slate-700 mb-3">Obdelujemo naslednje kategorije osebnih podatkov:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Identifikacijski podatki:</strong> ime in priimek, email naslov</li>
              <li><strong>Avtentikacijski podatki:</strong> uporabniško geslo (šifrirano), zgodovina prijav (preko Clerk)</li>
              <li><strong>Kontaktni podatki podjetij:</strong> imena podjetij in OCR email naslovi računovodskih programov</li>
              <li><strong>Vsebina dokumentov:</strong> fotografije in PDF-ji računov, ki jih naložite</li>
              <li><strong>Tehnični podatki:</strong> IP naslov, vrsta naprave, brskalnik, časovni žigi dostopa</li>
              <li><strong>Plačilni podatki:</strong> obdelava preko Apple In-App Purchase ali Paddle (mi sami številk kartic ne shranjujemo)</li>
              <li><strong>Statistični podatki:</strong> število poslanih računov, status pošiljanja, mesečna poraba</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">3. Pravne podlage obdelave (čl. 6 GDPR)</h2>
            <p className="text-slate-700 mb-3">Vaše osebne podatke obdelujemo na naslednjih pravnih podlagah:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>
                <strong>Pogodbena obveznost (čl. 6(1)(b)):</strong> obdelava je nujna za izvajanje storitve, na katero ste se naročili — registracija računa, posredovanje računov, arhiv, obračunavanje naročnine.
              </li>
              <li>
                <strong>Zakonska obveznost (čl. 6(1)(c)):</strong> davčni in računovodski predpisi nas obvezujejo k hrambi določenih podatkov (npr. izdani računi 5–10 let).
              </li>
              <li>
                <strong>Zakoniti interes (čl. 6(1)(f)):</strong> varnost storitve (preprečevanje zlorab, prepoznavanje goljufij), izboljšava aplikacije in komunikacija s uporabniki.
              </li>
              <li>
                <strong>Privolitev (čl. 6(1)(a)):</strong> za marketinška sporočila in neobvezne piškotke (analitika). Privolitev lahko kadarkoli prekličete.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">4. Nameni obdelave</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Zagotavljanje storitve pošiljanja računov v računovodske programe</li>
              <li>Upravljanje uporabniškega računa in avtentikacija</li>
              <li>Obdelava plačil naročnin in izdaja računov</li>
              <li>Tehnična podpora in komunikacija</li>
              <li>Varnost sistema in preprečevanje zlorab</li>
              <li>Izpolnjevanje zakonskih obveznosti (davčni predpisi)</li>
              <li>Anonimna analitika za izboljšave aplikacije</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">5. Roki hrambe</h2>
            <p className="text-slate-700 mb-3">Podatke hranimo le toliko časa, kolikor je potrebno:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Uporabniški račun in nastavitve:</strong> dokler imate aktiven račun. Po izbrisu računa se podatki izbrišejo v 30 dneh.</li>
              <li><strong>Slike in PDF-ji računov v arhivu:</strong> dokler jih sami ne izbrišete ali zaprosite za izbris računa.</li>
              <li><strong>Plačilna evidenca:</strong> 10 let (slovenski davčni predpisi).</li>
              <li><strong>Varnostni dnevniki (logi):</strong> največ 12 mesecev.</li>
              <li><strong>Marketinška privolitev:</strong> dokler privolitev ne prekličete.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">6. Posredovanje podatkov tretjim osebam</h2>
            <p className="text-slate-700 mb-3">
              Vaše podatke posredujemo izključno pogodbenim obdelovalcem, ki so vezani s pogodbo o obdelavi osebnih podatkov:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li><strong>Clerk Inc. (ZDA):</strong> avtentikacija in upravljanje uporabnikov</li>
              <li><strong>Neon Inc. (EU):</strong> gostovanje baze podatkov (PostgreSQL v EU regiji)</li>
              <li><strong>Vercel Inc. (ZDA / EU):</strong> gostovanje aplikacije, CDN</li>
              <li><strong>Resend Inc. (ZDA):</strong> pošiljanje emailov (računi, sistemski emaili)</li>
              <li><strong>Apple Inc. (ZDA):</strong> obdelava plačil v iOS aplikaciji (In-App Purchase)</li>
              <li><strong>Paddle.com Market Ltd (UK):</strong> obdelava plačil na spletni strani</li>
              <li><strong>Vaš računovodski program:</strong> sliko računa posredujemo na email naslov, ki ste ga sami nastavili (npr. uvoz@minimax.si)</li>
            </ul>
            <p className="text-slate-700 mt-3">
              <strong>Vaših podatkov ne prodajamo</strong> tretjim osebam za marketinške namene. Posredujemo jih lahko samo še na zahtevo pristojnih državnih organov, kadar to izrecno zahteva zakonodaja.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">7. Mednarodni prenosi podatkov</h2>
            <p className="text-slate-700">
              Nekateri naši pogodbeni obdelovalci se nahajajo zunaj EU/EGP (npr. ZDA). V teh primerih zagotavljamo ustrezno raven zaščite podatkov skozi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mt-3">
              <li>Standardna pogodbena določila Evropske komisije (Standard Contractual Clauses, SCC)</li>
              <li>EU-US Data Privacy Framework (kjer je obdelovalec certificiran)</li>
              <li>Šifriranje pri prenosu (TLS 1.2+) in v mirovanju (AES-256)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">8. Vaše pravice (čl. 15–22 GDPR)</h2>
            <p className="text-slate-700 mb-3">Kot posameznik, na katerega se nanašajo osebni podatki, imate naslednje pravice:</p>
            <ul className="list-disc list-inside space-y-3 text-slate-700">
              <li><strong>Pravica do dostopa (čl. 15):</strong> pravica izvedeti, ali obdelujemo vaše osebne podatke, in dobiti njihovo kopijo.</li>
              <li><strong>Pravica do popravka (čl. 16):</strong> pravica zahtevati popravek netočnih ali nepopolnih podatkov.</li>
              <li><strong>Pravica do izbrisa (čl. 17, &ldquo;pravica do pozabe&rdquo;):</strong> pravica zahtevati izbris vaših osebnih podatkov.</li>
              <li><strong>Pravica do omejitve obdelave (čl. 18):</strong> pravica zahtevati, da omejimo obdelavo (npr. dokler preverjate točnost podatkov).</li>
              <li><strong>Pravica do prenosljivosti (čl. 20):</strong> pravica prejeti svoje podatke v strukturiranem, splošno uporabljanem strojno berljivem formatu.</li>
              <li><strong>Pravica do ugovora (čl. 21):</strong> pravica ugovarjati obdelavi na podlagi zakonitega interesa ali za neposredno trženje.</li>
              <li><strong>Pravica preklicati privolitev:</strong> kadar je obdelava temeljila na vaši privolitvi, jo lahko kadarkoli prekličete.</li>
              <li><strong>Pravica do nediskriminacije pri avtomatiziranem odločanju (čl. 22):</strong> ne uporabljamo avtomatiziranega odločanja, ki bi imelo pravne učinke za vas.</li>
            </ul>
            <p className="text-slate-700 mt-4">
              Te pravice uveljavljate s pisno zahtevo na <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>. Odgovorili vam bomo najkasneje v 30 dneh (lahko podaljšano za nadaljnja 2 meseca v zapletenih primerih, o čemer vas obvestimo).
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">9. Pravica do pritožbe</h2>
            <p className="text-slate-700">
              Če menite, da kršimo predpise o varstvu osebnih podatkov, imate pravico vložiti pritožbo pri nadzornem organu:
            </p>
            <p className="text-slate-700 mt-3">
              <strong>Informacijski pooblaščenec Republike Slovenije</strong><br />
              Dunajska 22, 1000 Ljubljana<br />
              Telefon: +386 (0)1 230 97 30<br />
              Email: <a href="mailto:gp.ip@ip-rs.si" className="text-blue-600 hover:underline">gp.ip@ip-rs.si</a><br />
              Spletna stran: <a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.ip-rs.si</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">10. Tehnični in organizacijski ukrepi varnosti</h2>
            <p className="text-slate-700 mb-3">Za zaščito vaših podatkov uporabljamo:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Šifriranje povezav (HTTPS / TLS 1.2 ali novejše)</li>
              <li>Šifriranje podatkov v mirovanju (AES-256)</li>
              <li>Strogo omejen dostop do baze podatkov (samo na podlagi avtentikacije)</li>
              <li>Avtentikacija prek sistema Clerk z dvostopenjsko zaščito</li>
              <li>Redne varnostne posodobitve in pregledi kode</li>
              <li>Ločena okolja (razvojno, testno, produkcijsko)</li>
              <li>Varnostni nadzor dostopov in beleženje sumljivih dejavnosti</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">11. Piškotki in sledenje</h2>
            <p className="text-slate-700">
              Podrobnosti o piškotkih, ki jih uporabljamo, najdete v ločeni{" "}
              <a href="/piskotki" className="text-blue-600 hover:underline">politiki piškotkov</a>. Ne uporabljamo trženjskih piškotkov ali sledilcev tretjih oseb za oglaševanje.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">12. Otroci</h2>
            <p className="text-slate-700">
              Storitev je namenjena poslovni rabi in je ne tržimo otrokom. Osebnih podatkov mlajših od 16 let zavestno ne zbiramo. Če izveste, da je otrok ustvaril račun pri nas, nas prosim kontaktirajte za izbris.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">13. Spremembe te izjave</h2>
            <p className="text-slate-700">
              Izjavo lahko občasno posodobimo. O bistvenih spremembah vas bomo obvestili po emailu ali znotraj aplikacije najmanj 30 dni vnaprej. Datum zadnje posodobitve je naveden na vrhu te strani.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-semibold">14. Kontakt za vprašanja o varstvu podatkov</h2>
            <p className="text-slate-700">
              Za vsa vprašanja v zvezi z obdelavo vaših osebnih podatkov nas kontaktirajte:
            </p>
            <p className="text-slate-700 mt-3">
              Email: <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a><br />
              Sport Group d.o.o.<br />
              Osojnikova 4, 2000 Maribor, Slovenija
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
