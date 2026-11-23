import Link from "next/link";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo";
import { ArrowRight, Camera, ScanText, ShieldCheck, Building2 } from "lucide-react";

// Consolidated page for "program za račune" / "programi za račune".
// /program-za-racune permanently redirects here (next.config.ts) so the two
// near-duplicate URLs stop competing for the same queries.
const TITLE = "Program za račune 2026: primerjava slovenskih programov";
const DESCRIPTION = "Program za izdajanje računov ali za prejete račune? Primerjava Minimax, Birokrat, Pantheon, SAOP, e-računi in Metakocka ter kako prejete račune obdelate z OCR.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/programi-za-racune", languages: { "sl-SI": "/programi-za-racune", "x-default": "/programi-za-racune" } },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.posljiracun.si/programi-za-racune",
    type: "article",
    locale: "sl_SI",
    siteName: "Slikaj Račun",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [DEFAULT_TWITTER_IMAGE] },
};

const rows = [
  ["Minimax", "Spletno računovodstvo in izdaja računov", "Da – email uvoz z OCR", "Odvisno od paketa", "Mala in srednja podjetja, računovodski servisi"],
  ["Birokrat", "Poslovanje, fakturiranje in računovodstvo", "Da – OCR uvoz", "Odvisno od paketa", "Podjetja in računovodstva"],
  ["Pantheon", "ERP in računovodstvo", "Da – eBooks OCR", "Da", "Podjetja z zahtevnejšimi procesi"],
  ["SAOP", "Računovodstvo in poslovanje", "Digitalni uvoz dokumentov", "Da", "Podjetja in javni sektor"],
  ["e-računi", "Spletno fakturiranje in računovodstvo", "Digitalni uvoz / OCR", "Da", "Podjetniki in podjetja"],
  ["Metakocka", "ERP / spletna prodaja", "Digitalni uvoz", "Da", "Spletne trgovine in podjetja"],
  ["Slikaj Račun", "Samo prejeti računi: zajem, OCR in pošiljanje", "Da – AI OCR, eSLOG 2.0, UBL 2.1", "Da (paketi PRO in Računovodstvo)", "Dopolnilo kateremukoli programu zgoraj"],
];

const steps = [
  { Icon: Camera, title: "1. Zajem računa", text: "Račun fotografirate s telefonom ali naložite PDF, sliko oziroma XML." },
  { Icon: ScanText, title: "2. OCR prebere podatke", text: "Dobavitelj, številka računa, datumi, DDV, zneski, IBAN in postavke." },
  { Icon: ShieldCheck, title: "3. Pregled in potrditev", text: "Zneski in IBAN se preverijo; negotovi računi gredo v ročni pregled." },
  { Icon: Building2, title: "4. Pošiljanje v program", text: "Original na uvozni email ali potrjeni podatki kot eSLOG, UBL ali prek API." },
];

const faq = [
  ["Kateri program za račune potrebujem?", "Če račune izdajate, potrebujete fakturirni ali računovodski program, za gotovinske račune pa tudi davčno potrjevanje. Če želite hitreje obdelati prejete račune dobaviteljev, potrebujete zajem in OCR prejetih računov. Večina podjetij uporablja obe vrsti rešitve skupaj."],
  ["Ali Slikaj Račun izdaja račune?", "Ne. Slikaj Račun je namenjen samo prejetim računom: zajemu, OCR branju, preverjanju in pošiljanju v računovodstvo. Za izdajo izhodnih računov še naprej uporabljate svoj računovodski ali fakturirni program."],
  ["Kakšen program potrebujem za vodenje prejetih računov?", "Prejete račune knjižite v računovodskem programu. Slikaj Račun pred tem poskrbi, da račun pride tja hitro in pravilno: s telefona ali iz PDF-ja, s prebranimi in preverjenimi podatki ter v pravo podjetje."],
  ["Ali obstaja brezplačen program za račune?", "Nekateri fakturirni programi imajo brezplačne ali preizkusne pakete z omejitvami. Slikaj Račun ima brezplačen paket za prejete račune (3 računi in 10 OCR strani mesečno), plačljivi paketi pa se začnejo pri 16,50 € mesečno."],
  ["Kateri programi se lahko povežejo s Slikaj Račun?", "Najpogostejši so Minimax, Birokrat, Pantheon, SAOP, e-računi in Metakocka. Original lahko pošljete na njihov uvozni email, potrjene podatke pa pripravite kot UBL 2.1, eSLOG 2.0 ali JSON za API."],
];

export default function ProgramiZaRacunePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: "https://www.posljiracun.si/" },
      { "@type": "ListItem", position: 2, name: "Program za račune", item: "https://www.posljiracun.si/programi-za-racune" },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-700">Programi za račune · primerjava 2026</p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Program za račune: izdajanje ali prejeti računi?</h1>
        <p className="mb-8 max-w-4xl text-xl leading-relaxed text-slate-600">Pri iskanju <strong>programa za račune</strong> se mešata dve različni potrebi: <strong>izdajanje računov</strong> kupcem in <strong>obdelava prejetih računov</strong> dobaviteljev. Spodaj je primerjava slovenskih programov in razlaga, kateri del procesa pokrije kateri.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/blog/program-za-izdajanje-racunov" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800">Program za izdajanje računov <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/blog/program-za-vodenje-prejetih-racunov" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">Program za prejete račune</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">Primerjava programov za račune v Sloveniji</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-100 text-slate-900"><tr>{["Program", "Glavni namen", "OCR / uvoz prejetih računov", "Več podjetij", "Najbolj primeren za"].map((h) => <th key={h} scope="col" className="p-4 text-left font-bold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={r[0]} className={i % 2 ? "bg-slate-50" : "bg-white"}>{r.map((c, j) => <td key={`${r[0]}-${j}`} className={`border-t border-slate-200 p-4 ${j === 0 ? "font-semibold text-slate-950" : "text-slate-600"}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">Funkcije in paketi se spreminjajo. Pred odločitvijo preverite aktualno ponudbo pri posameznem ponudniku.</p>
      </section>

      <article className="prose prose-slate prose-lg mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2>1. Program za izdajanje računov</h2>
        <p>Za ponudbe, predračune in izhodne račune potrebujete fakturirni ali računovodski program. Pri gotovinskih računih mora program podpirati tudi davčno potrjevanje računov pri FURS, od 1. 1. 2028 pa bodo morala podjetja med seboj izmenjevati e-račune. Podroben vodnik po izbiri je v članku <Link href="/blog/program-za-izdajanje-racunov">program za izdajanje računov</Link>.</p>
        <p><strong>Slikaj Račun ni program za izdajanje računov.</strong> Namenjen je drugi strani procesa: prejetim računom, ki jih je treba zajeti, prebrati in poslati v računovodstvo.</p>

        <h2>2. Program za prejete račune in OCR</h2>
        <p>Prejeti račun je treba zajeti, prebrati, preveriti in poslati v pravo podjetje. Ročno prepisovanje zneskov in DDV-ja je počasno in vodi v napake, zato ta korak avtomatizira OCR. Kako voditi prejete račune od nabiralnika do knjiženja, opisuje vodnik <Link href="/blog/program-za-vodenje-prejetih-racunov">program za vodenje prejetih računov</Link>.</p>
      </article>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, text }) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="mb-4 h-8 w-8 text-blue-600" /><h3 className="mb-2 text-xl font-bold">{title}</h3><p className="text-slate-600">{text}</p></div>)}
        </div>
      </section>

      <article className="prose prose-slate prose-lg mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <p>Na strani <Link href="/ocr-racunov">OCR računov</Link> je podrobno opisano, kaj Slikaj Račun prebere iz PDF-ja ali fotografije. Če je zanesljivost visoka in so ključna polja pravilna, je račun lahko samodejno potrjen. Če ni, gre v pregled, kjer vidite original in prebrane podatke drug ob drugem.</p>

        <h2>3. Program za račune ali aplikacija za skeniranje?</h2>
        <p>Scanner aplikacija ustvari samo sliko ali PDF. OCR rešitev iz dokumenta pripravi podatke za računovodstvo. Za mobilni zajem si oglejte <Link href="/aplikacija-za-racune">aplikacijo za račune</Link>, za primerjavo pristopov pa <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">aplikacije za skeniranje računov</Link>.</p>

        <h2>4. Računovodski program in integracija</h2>
        <p>Slikaj Račun ne zahteva menjave računovodskega programa. Originalni PDF pošljete na uvozni email programa, potrjene podatke pa pripravite kot UBL 2.1, eSLOG 2.0 ali JSON za API. Več na strani <Link href="/integracije">integracije z računovodskimi programi</Link>. Za izbiro samega računovodskega programa preberite <Link href="/blog/racunovodska-programska-oprema-slovenija">računovodska programska oprema v Sloveniji</Link>.</p>

        <h2>5. Program za račune za računovodske servise</h2>
        <p>Računovodski servis pogosto ne potrebuje novega računovodskega programa, ampak boljši vhodni proces. Slikaj Račun omogoča več podjetij v enem uporabniškem računu, ločeno usmerjanje dokumentov in množični zajem več računov naenkrat.</p>

        <h2>6. Minimax, Birokrat in Pantheon OCR</h2>
        <ul>
          <li><Link href="/blog/minimax-email-uvoz-racunov">Minimax OCR in email uvoz računov</Link></li>
          <li><Link href="/blog/birokrat-ocr-uvoz-racunov">Birokrat OCR in uvoz računov</Link></li>
          <li><Link href="/blog/pantheon-ebooks-ocr-vodnik">Pantheon eBooks OCR</Link></li>
          <li><Link href="/blog/pdf-racun-v-xml-eslog">PDF račun v XML eSLOG</Link></li>
        </ul>

        <h2>Pogosta vprašanja</h2>
        {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

        <div className="not-prose mt-12 rounded-2xl bg-slate-950 p-8 text-white">
          <h2 className="mb-3 text-2xl font-bold">Želite hitreje obdelati prejete račune?</h2>
          <p className="mb-5 text-slate-300">Obdržite program za izdajanje računov, ki ga že uporabljate, Slikaj Račun pa uporabite za zajem, OCR, pregled in pošiljanje prejetih računov. Brezplačno: 3 računi in 10 OCR strani mesečno.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Začnite brezplačno <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/cenik" className="inline-flex items-center rounded-xl border border-slate-500 px-5 py-3 font-semibold text-white">Cenik</Link>
          </div>
        </div>
      </article>
    </main>
  );
}
