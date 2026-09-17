import Link from "next/link";
import type { Metadata } from "next";
import { Camera, ScanText, Building2, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Program za račune z OCR za prejete račune | Slikaj Račun",
  description: "Program za prejete račune: fotografirajte ali naložite PDF, OCR prebere podatke, sistem jih preveri in račun pošlje v računovodski workflow. Za slovenske in angleške račune.",
  alternates: { canonical: "/program-za-racune" },
  openGraph: {
    title: "Program za račune z OCR – Slikaj Račun",
    description: "Zajem, OCR ekstrakcija, validacija in pošiljanje prejetih računov brez menjave računovodskega sistema.",
    url: "https://www.posljiracun.si/program-za-racune",
    type: "website",
  },
};

const faq = [
  { q: "Kaj je program za račune?", a: "Izraz lahko pomeni program za izdajanje računov ali rešitev za obdelavo prejetih računov. Slikaj Račun je namenjen predvsem prejetim računom: zajemu, OCR ekstrakciji, validaciji in dostavi v računovodski proces." },
  { q: "Ali Slikaj Račun izdaja račune?", a: "Ne. Za izdajanje izhodnih računov še naprej uporabljate fakturirni ali računovodski program. Slikaj Račun skrbi za vhodni proces prejetih računov." },
  { q: "Ali zna program sam prebrati račun?", a: "Da. Pri OCR obdelavi prebere številko računa, datume, dobavitelja, DDV številko, IBAN, zneske, DDV razčlenitev in postavke ter ključna polja validira." },
  { q: "Ali lahko uporabljam več podjetij?", a: "Da. Višji paketi omogočajo več podjetij v enem uporabniškem računu in ločene destinacije oziroma načine dostave za posamezno podjetje." },
];

const steps = [
  { Icon: Camera, title: "1. Naloži račun", text: "Fotografiraj dokument ali naloži PDF, sliko oziroma podprti XML." },
  { Icon: ScanText, title: "2. OCR prebere podatke", text: "Sistem izlušči ključna računovodska polja iz slovenskega ali angleškega računa." },
  { Icon: ShieldCheck, title: "3. Preveri in potrdi", text: "Zneski, DDV, IBAN in druga polja se validirajo; negotovi računi gredo v pregled." },
  { Icon: Building2, title: "4. Pošlji naprej", text: "Original ali potrjene podatke usmeri v pravo podjetje in računovodski workflow." },
];

export default function ProgramZaRacunePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-700">Program za prejete račune</p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Program za račune z OCR: od dokumenta do preverjenih podatkov</h1>
          <p className="mb-8 text-xl leading-relaxed text-slate-600">Slikaj Račun ni klasičen program za izdajanje računov. Namenjen je prejetim računom: dokument naložite, OCR ga prebere, sistem podatke preveri in račun pripravi za nadaljnji računovodski proces.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800">Preizkusi OCR <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/programi-za-racune" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">Primerjaj programe za račune</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, text }) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="mb-4 h-8 w-8 text-blue-600" /><h2 className="mb-2 text-xl font-bold">{title}</h2><p className="text-slate-600">{text}</p></div>)}
        </div>
      </section>

      <article className="prose prose-slate prose-lg mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2>Program za izdajanje računov ali program za prejete račune?</h2>
        <p>To sta dva različna procesa. Za ponudbe, predračune in izhodne račune potrebujete fakturirni ali računovodski program. Za dokumente, ki jih prejmete od dobaviteljev, potrebujete zajem, OCR, validacijo in zanesljivo dostavo v računovodski sistem.</p>
        <p>Če želite pregled različnih kategorij programske opreme, obiščite <Link href="/programi-za-racune">primerjavo programov za račune</Link>.</p>

        <h2>OCR računov namesto ročnega prepisovanja</h2>
        <p>Pri AI OCR workflowu Slikaj Račun iz PDF-ja ali slike prebere številko računa, datume, dobavitelja, kupca, DDV številke, IBAN, valuto, neto, DDV, bruto znesek in postavke. Podrobnosti so na strani <Link href="/ocr-racunov">OCR računov</Link>.</p>

        <h2>Validacija pred pošiljanjem</h2>
        <p>Računovodski podatki morajo biti preverjeni, ne samo prebrani. Sistem zato primerja neto, DDV in bruto zneske, preverja IBAN, obvezna polja in možne duplikate. Dokumenti z nizko zanesljivostjo se označijo za ročni pregled.</p>

        <h2>Program za račune za Minimax, Birokrat, Pantheon in druge</h2>
        <p>Slikaj Račun ne zahteva menjave računovodskega sistema. Originalni dokument lahko pošljete na uvozni email, potrjene podatke pa vključite v UBL, eSLOG ali API workflow. Oglejte si <Link href="/integracije">integracije z računovodskimi programi</Link>.</p>

        <h2>Program za račune za računovodske servise</h2>
        <p>Računovodski servis lahko vodi več podjetij iz enega uporabniškega računa. Vsako podjetje ima lahko svojo destinacijo in način dostave, dokumenti pa ostanejo ločeno sledljivi.</p>

        <h2>Slovenski in angleški računi</h2>
        <p>OCR workflow je primeren za slovenske in angleške račune, zato lahko v istem procesu obdelate domače in tuje dobavitelje brez ločene aplikacije za vsak jezik.</p>

        <h2>Pogosta vprašanja</h2>
        {faq.map((item) => <section key={item.q}><h3>{item.q}</h3><p>{item.a}</p></section>)}
      </article>
    </main>
  );
}
