import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Programi za račune v Sloveniji 2026: primerjava in izbira",
  description: "Primerjava programov za račune v Sloveniji: Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka in Slikaj Račun. Kaj izbrati za izdajo, OCR in pošiljanje prejetih računov.",
  alternates: { canonical: "/programi-za-racune" },
  openGraph: {
    title: "Programi za račune v Sloveniji 2026 – primerjava",
    description: "Primerjajte programe za izdajanje računov, računovodstvo, OCR in zajem prejetih računov.",
    url: "https://www.posljiracun.si/programi-za-racune",
    type: "article",
  },
};

const rows = [
  ["Slikaj Račun", "Zajem in pošiljanje prejetih računov", "Da – prek OCR emaila", "Da", "Podjetniki in računovodstva"],
  ["Minimax", "Računovodstvo in izdaja računov", "Da", "Odvisno od paketa", "Mala in srednja podjetja"],
  ["Birokrat", "Poslovanje in računovodstvo", "Da", "Odvisno od paketa", "Podjetja in računovodstva"],
  ["Pantheon", "ERP in računovodstvo", "Da – eBooks OCR", "Da", "Podjetja z zahtevnejšimi procesi"],
  ["SAOP", "Računovodstvo in poslovanje", "Da", "Da", "Podjetja in javni sektor"],
  ["E-računi", "Spletno računovodstvo", "Da", "Da", "Podjetniki in podjetja"],
  ["Metakocka", "ERP / spletna prodaja", "Da", "Da", "Spletne trgovine in podjetja"],
];

const faq = [
  ["Kateri program za račune je najboljši?", "Odvisno od namena. Za izdajo računov in računovodstvo izberite računovodski program. Za hitro fotografiranje in pošiljanje prejetih papirnatih računov v obstoječi sistem je namenjen Slikaj Račun."],
  ["Ali potrebujem nov računovodski program?", "Ne. Slikaj Račun dopolnjuje program, ki ga že uporabljate, in dokument pošlje na njegov email za uvoz oziroma OCR."],
  ["Kateri programi podpirajo OCR računov?", "Med pogosto uporabljenimi slovenskimi rešitvami OCR oziroma digitalni uvoz dokumentov podpirajo Minimax, Birokrat, Pantheon, SAOP, E-računi in drugi. Natančna funkcionalnost je odvisna od paketa ponudnika."],
  ["Kaj je razlika med programom za izdajo računov in aplikacijo za prejete račune?", "Program za izdajo računov ustvarja izhodne račune. Aplikacija za prejete račune pa pomaga dokument zajeti, digitalizirati in poslati računovodstvu."],
];

export default function ProgramiZaRacunePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-4">Primerjava 2026</p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 mb-6">Programi za račune v Sloveniji: kateri je pravi za vas?</h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-4xl">
          Izraz <strong>programi za račune</strong> pokriva več različnih potreb: izdajo računov, računovodstvo, OCR obdelavo ter zajem prejetih papirnatih računov. Spodaj je praktična primerjava najpogosteje uporabljenih rešitev in razlaga, kdaj potrebujete katero.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>{["Program", "Glavni namen", "OCR / uvoz", "Več podjetij", "Najbolj primeren za"].map((h) => <th key={h} className="p-4 text-left font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r[0]} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  {r.map((c, j) => <td key={c} className={`p-4 border-t border-slate-200 ${j === 0 ? "font-semibold text-slate-950" : "text-slate-650"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-slate prose-lg max-w-none">
        <h2>1. Program za izdajanje računov</h2>
        <p>Če morate ustvarjati ponudbe, predračune in izhodne račune, potrebujete klasičen fakturirni oziroma računovodski program. Med znanimi možnostmi so Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.</p>

        <h2>2. Program za prejete račune in OCR</h2>
        <p>Prejeti računi so drug proces. Papirnat račun je treba najprej digitalizirati in spraviti v računovodstvo. Tu OCR prebere podatke dokumenta, <Link href="/aplikacija-za-racune">aplikacija za račune</Link> pa lahko zajem in pošiljanje bistveno pospeši.</p>

        <h2>3. Najhitrejši način za papirnate račune</h2>
        <p>Slikaj Račun ne poskuša zamenjati vašega računovodskega programa. Deluje kot mobilni vhod: fotografirate račun, izberete podjetje in dokument se pošlje na nastavljeni OCR oziroma uvozni email.</p>
        <ul>
          <li><Check className="inline w-4 h-4" /> brez ročnega tipkanja prejemnika,</li>
          <li><Check className="inline w-4 h-4" /> podpora več podjetjem,</li>
          <li><Check className="inline w-4 h-4" /> deluje z obstoječim računovodskim programom,</li>
          <li><Check className="inline w-4 h-4" /> dokument lahko pošljete takoj ob prejemu.</li>
        </ul>

        <h2>Programi za račune in integracije</h2>
        <p>Če vaš računovodski program sprejema dokumente po emailu ali ima OCR vhod, ga lahko vključite v isti proces. Oglejte si našo stran <Link href="/integracije">integracije z računovodskimi programi</Link>, kjer so posebej opisani Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka.</p>

        <h2>Minimax OCR in email uvoz</h2>
        <p>Za uporabnike Minimaxa imamo ločen <Link href="/blog/minimax-email-uvoz-racunov">vodnik za Minimax email uvoz računov</Link>. To je trenutno tudi ena izmed najbolje uvrščenih vsebin na naši strani.</p>

        <h2>Aplikacija za skeniranje računov</h2>
        <p>Če iščete predvsem mobilni zajem, preberite primerjavo <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">najboljših aplikacij za skeniranje računov</Link>. Tako lahko ločite običajen scanner od rešitve, ki račun tudi pošlje neposredno v računovodstvo.</p>

        <h2>Pogosta vprašanja</h2>
        {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

        <div className="not-prose mt-12 rounded-2xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-bold mb-3">Želite samo fotografirati in poslati račun?</h2>
          <p className="text-slate-300 mb-5">Preizkusite Slikaj Račun in obdržite računovodski program, ki ga že uporabljate.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Ustvari račun <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </article>
    </main>
  );
}
