import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Mail, Building2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Program za račune: hitrejše pošiljanje računov v računovodstvo | Slikaj Račun",
  description: "Iščete program za račune? Slikaj Račun fotografira papirnat račun in ga pošlje neposredno v Minimax, Birokrat, Pantheon, SAOP, E-računi ali drug računovodski program.",
  alternates: { canonical: "/program-za-racune" },
  openGraph: {
    title: "Program za račune – fotografiraj in pošlji v računovodstvo",
    description: "Mobilna rešitev za hitro pošiljanje prejetih računov v računovodski program brez ročnega prepisovanja.",
    url: "https://www.posljiracun.si/program-za-racune",
    type: "website",
  },
};

const faq = [
  { q: "Kaj je program za račune?", a: "Program za račune lahko pomeni program za izdajanje računov ali orodje za obdelavo prejetih računov. Slikaj Račun je namenjen predvsem zajemu prejetih papirnatih računov in njihovemu hitremu pošiljanju v računovodski program." },
  { q: "Ali Slikaj Račun izdaja račune?", a: "Ne. Slikaj Račun dopolnjuje vaš obstoječi računovodski program. Račun fotografirate, aplikacija pa ga pošlje na email naslov za uvoz dokumentov v vašem računovodstvu." },
  { q: "S katerimi računovodskimi programi deluje?", a: "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka in drugimi programi, ki omogočajo sprejem dokumentov po emailu." },
  { q: "Ali lahko uporabljam več podjetij?", a: "Da. Paket za računovodstva omogoča upravljanje več podjetij iz enega uporabniškega računa in ločene ciljne email naslove za vsako podjetje." },
];

const steps = [
  { Icon: Camera, title: "1. Fotografiraj račun", text: "Odpri aplikacijo in fotografiraj papirnat račun ali dokument." },
  { Icon: Building2, title: "2. Izberi podjetje", text: "Pri več podjetjih izbereš pravo podjetje in njegov računovodski program." },
  { Icon: Mail, title: "3. Pošlji", text: "Slika se pošlje na nastavljeni email za OCR oziroma uvoz dokumentov." },
];

export default function ProgramZaRacunePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-4">Program za račune</p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 mb-6">
            Program za račune, ki papirnat račun pošlje naravnost v računovodstvo
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-8">
            Ne prepisujte podatkov in ne sestavljajte emailov. Račun samo fotografirate, izberete podjetje in Slikaj Račun ga pošlje na pravi naslov za uvoz v vaš računovodski program.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-white font-semibold hover:bg-slate-800">
              Preizkusi aplikacijo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/integracije" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              Poglej integracije
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="w-8 h-8 text-blue-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">{title}</h2>
              <p className="text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 prose prose-slate prose-lg max-w-none">
        <h2>Kateri program za račune potrebujete?</h2>
        <p>
          Če želite <strong>izdajati račune</strong>, potrebujete računovodski oziroma fakturirni program. Če pa želite <strong>prejete račune hitro spraviti v računovodstvo</strong>, je Slikaj Račun namenjen prav temu drugemu koraku. Deluje kot mobilni most med papirnatim računom in programom, ki ga že uporabljate.
        </p>

        <h2>Program za račune za Minimax, Birokrat, Pantheon in druge</h2>
        <p>
          Slikaj Račun je narejen tako, da ne zahteva menjave računovodskega sistema. Poveže se z obstoječim procesom preko email naslova za uvoz dokumentov. Preverite <Link href="/integracije">podprte računovodske programe in integracije</Link> ali preberite naš <Link href="/blog/minimax-email-uvoz-racunov">vodnik za Minimax email uvoz</Link>.
        </p>

        <h2>Zakaj je mobilni program za prejete račune hitrejši?</h2>
        <ul>
          <li>račun uredite takoj ob prejemu, še preden se izgubi ali založi,</li>
          <li>ni ročnega tipkanja email naslova pri vsakem pošiljanju,</li>
          <li>pri več podjetjih lahko uporabljate ločene nastavitve,</li>
          <li>računovodstvo dobi dokument hitreje in v enakem postopku kot prej.</li>
        </ul>

        <h2>Program za račune za računovodske servise</h2>
        <p>
          Računovodski servis lahko iz enega uporabniškega računa upravlja več podjetij. Za vsako podjetje nastavite njegov ciljni email in nato dokumente pošiljate na pravo mesto brez ločenih prijav za vsako stranko.
        </p>

        <h2>Pogosta vprašanja</h2>
        {faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
