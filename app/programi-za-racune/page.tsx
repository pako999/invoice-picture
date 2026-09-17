import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Programi za račune 2026: izdaja, OCR in prejeti računi",
  description: "Programi za račune v Sloveniji: primerjava izdaje računov, spletnega računovodstva, OCR prejetih računov in integracij z Minimax, Birokrat, Pantheon, SAOP ter drugimi sistemi.",
  alternates: { canonical: "/programi-za-racune" },
  openGraph: {
    title: "Programi za račune v Sloveniji 2026: kaj dejansko potrebujete?",
    description: "Primerjajte program za izdajanje računov, računovodski program in OCR rešitev za prejete račune.",
    url: "https://www.posljiracun.si/programi-za-racune",
    type: "article",
  },
};

const rows = [
  ["Slikaj Račun", "Prejeti računi, OCR in pošiljanje", "Da – lastna OCR ekstrakcija + email", "Da", "Podjetja in računovodski servisi"],
  ["Minimax", "Računovodstvo in izdaja računov", "Da", "Odvisno od paketa", "Mala in srednja podjetja"],
  ["Birokrat", "Poslovanje in računovodstvo", "Da", "Odvisno od paketa", "Podjetja in računovodstva"],
  ["Pantheon", "ERP in računovodstvo", "Da – eBooks OCR", "Da", "Podjetja z zahtevnejšimi procesi"],
  ["SAOP", "Računovodstvo in poslovanje", "Digitalni uvoz dokumentov", "Da", "Podjetja in javni sektor"],
  ["E-računi", "Spletno računovodstvo", "Digitalni uvoz / OCR", "Da", "Podjetniki in podjetja"],
  ["Metakocka", "ERP / spletna prodaja", "Digitalni uvoz", "Da", "Spletne trgovine in podjetja"],
];

const faq = [
  ["Kateri program za račune potrebujem?", "Če izdajate račune, potrebujete fakturirni ali računovodski program. Če želite avtomatsko zajeti in obdelati prejete račune, potrebujete OCR oziroma vhodni dokumentni workflow. Pogosto uporabljate obe vrsti rešitve skupaj."],
  ["Ali Slikaj Račun izdaja račune?", "Ne. Slikaj Račun je namenjen zajemu, OCR ekstrakciji, preverjanju in pošiljanju prejetih računov. Za izdajo izhodnih računov še naprej uporabljate svoj računovodski ali fakturirni program."],
  ["Kaj je OCR računov?", "OCR računov prebere podatke iz PDF-ja ali slike računa. Slikaj Račun zna med drugim prebrati številko računa, datume, dobavitelja, DDV, IBAN, zneske in postavke ter podatke validirati pred nadaljnjo uporabo."],
  ["Kateri programi se lahko povežejo s Slikaj Račun?", "Najpogostejši so Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka. Originalni dokument lahko pošljete na njihov uvozni email, potrjene strukturirane podatke pa je mogoče vključiti tudi v UBL, eSLOG ali API workflow."],
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
      { "@type": "ListItem", position: 2, name: "Programi za račune", item: "https://www.posljiracun.si/programi-za-racune" },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-700">Programi za račune · vodič 2026</p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Programi za račune: izdaja, računovodstvo ali OCR?</h1>
        <p className="max-w-4xl text-xl leading-relaxed text-slate-600">Pri iskanju <strong>programa za račune</strong> se pogosto mešajo tri različne potrebe: izdajanje računov, vodenje računovodstva in obdelava prejetih računov. Prava izbira je odvisna od tega, kateri del procesa želite avtomatizirati.</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-100 text-slate-900"><tr>{["Program", "Glavni namen", "OCR / uvoz", "Več podjetij", "Najbolj primeren za"].map((h) => <th key={h} className="p-4 text-left font-bold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={r[0]} className={i % 2 ? "bg-slate-50" : "bg-white"}>{r.map((c, j) => <td key={`${r[0]}-${j}`} className={`border-t border-slate-200 p-4 ${j === 0 ? "font-semibold text-slate-950" : "text-slate-650"}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <article className="prose prose-slate prose-lg mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2>1. Program za izdajanje računov</h2>
        <p>Če morate ustvarjati ponudbe, predračune in izhodne račune, potrebujete klasičen fakturirni ali računovodski program. Med pogostimi slovenskimi rešitvami so Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.</p>
        <p><strong>Slikaj Račun ni program za izdajanje računov.</strong> Namenjen je drugi strani procesa: prejetim računom, njihovemu zajemu, OCR ekstrakciji in dostavi v računovodski workflow.</p>

        <h2>2. Program za prejete račune in OCR</h2>
        <p>Prejeti račun je treba najprej zajeti, prebrati, preveriti in pravilno usmeriti. Na strani <Link href="/ocr-racunov">OCR računov</Link> je podrobno opisano, kako Slikaj Račun iz PDF-ja ali fotografije prebere številko računa, dobavitelja, datume, DDV številko, IBAN, neto, DDV, bruto znesek in postavke.</p>
        <p>Po ekstrakciji se podatki validirajo. Če je confidence dovolj visok in so ključna polja pravilna, je dokument lahko avtomatsko potrjen. Če nekaj ni dovolj zanesljivo, gre račun v pregled, kjer uporabnik vidi original in prebrane podatke drug ob drugem.</p>

        <h2>3. Program za račune ali aplikacija za skeniranje?</h2>
        <p>Scanner aplikacija samo ustvari sliko ali PDF. OCR rešitev iz dokumenta pripravi podatke za nadaljnjo uporabo. Če želite primerjavo različnih pristopov, preberite <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">aplikacije za skeniranje računov</Link>.</p>

        <h2>4. Spletni računovodski program in integracija</h2>
        <p>Pri spletnem računovodskem programu je ključno, kako prejeti dokument pride v sistem. Originalni PDF lahko pošljete na namenski uvozni email. Pri naprednejšem workflowu pa lahko potrjene podatke pripravite kot UBL 2.1, eSLOG 2.0 ali JSON za API. Več je opisano na strani <Link href="/integracije">integracija z računovodskim programom</Link>.</p>

        <h2>5. Program za računovodstvo pri več podjetjih</h2>
        <p>Računovodski servis pogosto ne potrebuje novega računovodskega programa, ampak boljši vhodni proces. Slikaj Račun omogoča upravljanje več podjetij iz enega uporabniškega računa, ločeno usmerjanje dokumentov in množični zajem več računov naenkrat.</p>

        <h2>6. Minimax, Birokrat in Pantheon OCR</h2>
        <p>Za tri pogosto iskane sisteme imamo ločene praktične vodiče:</p>
        <ul>
          <li><Link href="/blog/minimax-email-uvoz-racunov">Minimax OCR in email uvoz računov</Link></li>
          <li><Link href="/blog/birokrat-ocr-uvoz-racunov">Birokrat OCR in uvoz računov</Link></li>
          <li><Link href="/blog/pantheon-ebooks-ocr-vodnik">Pantheon eBooks OCR</Link></li>
        </ul>

        <h2>Pogosta vprašanja</h2>
        {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

        <div className="not-prose mt-12 rounded-2xl bg-slate-950 p-8 text-white">
          <h2 className="mb-3 text-2xl font-bold">Želite avtomatsko obdelati prejete račune?</h2>
          <p className="mb-5 text-slate-300">Obdržite program za izdajanje računov, ki ga že uporabljate, Slikaj Račun pa uporabite za OCR, pregled in dostavo prejetih računov.</p>
          <Link href="/ocr-racunov" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Poglej OCR računov <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </article>
    </main>
  );
}
