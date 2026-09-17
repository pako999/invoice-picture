import Link from "next/link";
import { CheckCircle2, FileSearch, Languages, ShieldCheck, Workflow, ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "OCR računov: avtomatsko branje prejetih računov",
  description: "OCR računov za slovenska podjetja in računovodstva. Samodejno prebere PDF ali sliko računa, preveri DDV, IBAN in zneske ter pripravi podatke za UBL, eSLOG ali API.",
  slug: "ocr-racunov",
  altPaths: { sl: "/ocr-racunov", en: "/en/invoice-ocr-slovenia" },
});

const faq = [
  ["Kaj pomeni OCR računov?", "OCR računov pretvori PDF ali fotografijo računa v strukturirane podatke. Slikaj Račun iz dokumenta prebere ključna računovodska polja, jih validira in račun po potrebi pošlje v ročni pregled."],
  ["Katere podatke zna Slikaj Račun prebrati?", "Med drugim številko računa, datum izdaje in zapadlosti, dobavitelja in kupca, DDV številke, IBAN, valuto, neto znesek, DDV, bruto znesek, DDV razčlenitev in postavke."],
  ["Ali OCR deluje za slovenske in angleške račune?", "Da. Sistem je namenjen računom v slovenščini in angleščini ter zna obdelati tudi pogosto uporabljene mednarodne oznake na računih."],
  ["Katere datoteke so podprte?", "Podprti so PDF, JPG, PNG, WEBP ter strukturirani XML dokumenti. Pri strukturiranem XML se podatki uporabijo neposredno, brez nepotrebnega OCR klica."],
  ["Kaj se zgodi, če OCR ni dovolj zanesljiv?", "Račun se označi za pregled. Uporabnik vidi originalni dokument in prebrane podatke, popravi napako ter račun potrdi. Sistem beleži revizijsko sled sprememb."],
  ["Kako lahko podatke pošljem v računovodski program?", "Original lahko pošljete na OCR email računovodskega programa, potrjene podatke pa je mogoče pripraviti kot UBL 2.1, eSLOG 2.0 ali strukturiran JSON za API integracijo, odvisno od nastavljenega paketa in načina dostave."],
];

const fields = [
  "številka računa in naročilnica",
  "datum izdaje, storitve in rok plačila",
  "dobavitelj, kupec, naslov in davčne številke",
  "IBAN, BIC, sklic in plačilni pogoji",
  "neto, DDV, bruto in znesek za plačilo",
  "DDV razčlenitev po stopnjah",
  "postavke, količina, cena, popusti in DDV",
  "valuta in tip dokumenta",
];

export default function OcrRacunovPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["sl-SI", "en"],
    description: "OCR prejetih računov z ekstrakcijo podatkov, validacijo in izvozom v računovodske procese.",
    url: "https://www.posljiracun.si/ocr-racunov",
    featureList: ["OCR računov", "ekstrakcija računovodskih podatkov", "validacija DDV in IBAN", "pregled in potrditev", "UBL 2.1", "eSLOG 2.0", "JSON API"],
    publisher: { "@type": "Organization", name: "Sport Group d.o.o." },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: "https://www.posljiracun.si/" },
      { "@type": "ListItem", position: 2, name: "OCR računov", item: "https://www.posljiracun.si/ocr-racunov" },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-700">AI OCR za prejete račune</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">OCR računov za slovenska podjetja in računovodstva</h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-600">Naložite PDF ali fotografijo računa. Slikaj Račun prebere ključne podatke, preveri zneske, DDV in IBAN ter pripravi račun za potrditev ali avtomatsko nadaljnjo obdelavo. OCR podpira <strong>slovenske in angleške račune</strong>.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Preizkusi OCR računov <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/integracije" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">Poglej integracije</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <Feature icon={<FileSearch className="h-6 w-6" />} title="Prebere račun" text="PDF, fotografija ali XML se pretvori v strukturirane računovodske podatke." />
        <Feature icon={<ShieldCheck className="h-6 w-6" />} title="Preveri podatke" text="Validacija zneskov, DDV, IBAN, podvojenih računov in obveznih polj." />
        <Feature icon={<Languages className="h-6 w-6" />} title="SL + EN" text="Ekstrakcija slovenskih in angleških računov ter mednarodnih oznak." />
        <Feature icon={<Workflow className="h-6 w-6" />} title="Pošlje naprej" text="Originalni dokument, UBL, eSLOG ali JSON API glede na vaš workflow." />
      </section>

      <article className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8 prose prose-slate prose-lg max-w-none">
        <h2>Kaj OCR računa samodejno prebere?</h2>
        <p>Klasičen scanner samo ustvari sliko ali PDF. <strong>OCR računov</strong> gre korak dlje: iz dokumenta izlušči podatke, ki jih računovodja ali računovodski program dejansko potrebuje. Pri Slikaj Račun so med ključnimi polji:</p>
        <ul>{fields.map((field) => <li key={field}><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />{field}</li>)}</ul>

        <h2>OCR prejetih računov: od dokumenta do preverjenih podatkov</h2>
        <p>Po nalaganju dokument najprej preverimo, ali že vsebuje strukturirane podatke. Če je na voljo uporaben XML ali podatkovni sloj, ga uporabimo pred plačljivim OCR klicem. Za slikovne dokumente in običajne PDF-je se izvede OCR ekstrakcija.</p>
        <ol>
          <li><strong>Nalaganje.</strong> Uporabnik izbere podjetje in naloži enega ali več računov.</li>
          <li><strong>Ekstrakcija.</strong> Sistem prebere račun in normalizira podatke v enoten podatkovni model.</li>
          <li><strong>Validacija.</strong> Preverijo se matematični zneski, DDV, IBAN, obvezna polja in možni duplikati.</li>
          <li><strong>Potrditev.</strong> Zanesljiv račun je lahko potrjen avtomatsko; negotovi podatki gredo v pregled.</li>
          <li><strong>Dostava.</strong> Potrjeni podatki se pošljejo v izbrani računovodski workflow.</li>
        </ol>

        <h2>Slovenski OCR računov in angleški računi</h2>
        <p>Slovenska podjetja pogosto prejemajo račune iz Slovenije in tujine. Zato je pomembno, da aplikacija razume tako slovenske izraze, kot so <em>davčna številka, rok plačila, sklic, znesek brez DDV</em>, kot angleške oznake, na primer <em>invoice number, due date, VAT, net amount, total amount</em>.</p>
        <p>Slikaj Račun je zato uporaben tudi za podjetja, ki prejemajo račune dobaviteljev iz EU ali drugih trgov, ne da bi morali imeti ločen postopek za slovenski in angleški dokument.</p>

        <h2>Validacija je pomembnejša od samega OCR</h2>
        <p>Pri računih ni dovolj, da model samo prebere besedilo. Sistem mora preveriti, ali se podatki med seboj ujemajo. Zato preverjamo na primer, ali je bruto znesek skladen z neto zneskom in DDV, ali je IBAN veljaven, ali se DDV razčlenitev ujema s skupnim DDV ter ali je bil isti račun morda že naložen.</p>
        <p>Če confidence ali validacija nista dovolj dobra, se dokument ne pošlje slepo naprej. Uporabnik ga odpre v <strong>OCR pregledu</strong>, kjer sta originalni račun in prebrani podatki prikazana drug ob drugem.</p>

        <h2>UBL, eSLOG in API namesto ponovnega tipkanja</h2>
        <p>Ko so podatki potrjeni, jih lahko uporabite za nadaljnjo avtomatizacijo. Slikaj Račun podpira pošiljanje originalnega dokumenta na OCR email računovodskega programa ter strukturirano dostavo prek <strong>UBL 2.1, eSLOG 2.0 ali JSON API</strong>. Več o povezovanju najdete na strani <Link href="/integracije">integracija z računovodskim programom</Link>.</p>

        <h2>OCR računov za računovodske servise</h2>
        <p>Računovodski servis lahko vodi več podjetij iz enega uporabniškega računa. Vsako podjetje ima lahko svoj ciljni email ali način dostave. To zmanjša možnost, da dokument konča pri napačni stranki, in poenostavi množični zajem več računov naenkrat.</p>

        <h2>OCR računov ali aplikacija za skeniranje?</h2>
        <p>Če potrebujete samo lep PDF, je običajna scanner aplikacija dovolj. Če pa želite podatke iz računa uporabiti naprej, potrebujete OCR, validacijo in povezavo z računovodskim procesom. Oglejte si tudi primerjavo <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">aplikacij za skeniranje računov</Link> ter pregled <Link href="/programi-za-racune">programov za račune v Sloveniji</Link>.</p>

        <h2>Pogosta vprašanja o OCR računov</h2>
        {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

        <div className="not-prose mt-12 rounded-2xl bg-blue-700 p-8 text-white">
          <h2 className="text-2xl font-black">Preizkusite OCR na svojem računu</h2>
          <p className="mt-2 text-blue-100">Naložite PDF ali fotografijo in preverite, katere podatke sistem prebere, še preden jih pošljete v računovodski proces.</p>
          <Link href="/sign-up" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-800">Ustvari račun <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </article>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p></div>;
}
