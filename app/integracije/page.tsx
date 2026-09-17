import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Integracija računovodski program + OCR računov",
  description: "Integracija z računovodskim programom za prejete račune: OCR, email uvoz, UBL, eSLOG in API. Povežite Slikaj Račun z Minimax, Birokrat, Pantheon, SAOP in drugimi sistemi.",
  slug: "integracije",
});

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", short: "Email uvoz in računovodski workflow", href: "https://www.minimax.si" },
  { name: "Birokrat", logo: "/logos/birokrat.png", short: "Uvoz dokumentov in računovodski workflow", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", short: "Dokumentni in OCR workflow", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: "/logos/saop.png", short: "Digitalni dokumentni procesi", href: "https://www.saop.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", short: "Spletno računovodstvo in uvoz dokumentov", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", short: "ERP in digitalni uvoz dokumentov", href: "https://www.metakocka.si" },
];

const faq = [
  { q: "Kaj pomeni integracija z računovodskim programom?", a: "Pomeni, da se dokument ali potrjeni podatki računa iz Slikaj Račun prenesejo v vaš obstoječi računovodski workflow. To je lahko email uvoz originalnega dokumenta, UBL/eSLOG datoteka ali API integracija." },
  { q: "Ali moram zamenjati računovodski program?", a: "Ne. Slikaj Račun dopolnjuje obstoječi program. Za izdajo računov in knjiženje še naprej uporabljate sistem, ki ga že imate." },
  { q: "Ali Slikaj Račun sam prebere podatke računa?", a: "Da. Pri AI OCR paketih sistem iz PDF-ja ali slike prebere ključne podatke računa, jih validira in dokument po potrebi pošlje v ročni pregled pred strukturirano dostavo." },
  { q: "Ali lahko računovodski servis uporablja več podjetij?", a: "Da. Višji paketi omogočajo upravljanje več podjetij iz enega uporabniškega računa in ločen način dostave za vsako podjetje." },
  { q: "Ali sta podprta UBL in eSLOG?", a: "Da. Potrjene podatke je mogoče pripraviti za strukturirano XML dostavo v UBL 2.1 ali eSLOG 2.0 workflowu, poleg JSON API načina." },
];

export default function Integracije() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: "https://www.posljiracun.si/" },
      { "@type": "ListItem", position: 2, name: "Integracije", item: "https://www.posljiracun.si/integracije" },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Badge className="mb-4 border-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">Računovodske integracije</Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Integracija z računovodskim programom in OCR računov</h1>
          <p className="mx-auto mb-6 max-w-4xl text-xl text-slate-600">Slikaj Račun poveže zajem prejetega računa z vašim obstoječim računovodskim procesom. Originalni dokument lahko pošljete na uvozni email, pri AI OCR pa se podatki preberejo, preverijo in pripravijo za strukturirano dostavo.</p>
          <div className="mx-auto max-w-3xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
            <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p className="text-sm text-blue-950"><strong>Pomembno:</strong> natančen način uvoza je odvisen od funkcij in paketa vašega računovodskega ponudnika. Slikaj Račun zato podpira več poti: originalni dokument po emailu, UBL/eSLOG XML ali JSON API.</p></div>
          </div>
        </div>

        <h2 className="mb-8 text-2xl font-semibold">Računovodski programi, ki jih lahko vključite v workflow</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-[1.02]">
              <Card className="h-full border-slate-200 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt={`${p.name} računovodski program`} className="h-10 object-contain" />
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-xl">{p.name}<Check className="h-5 w-5 text-green-600" /></CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <p className="mt-3 text-xs text-slate-500">Način povezave je odvisen od nastavitev in paketa pri ponudniku.</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <article className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 prose prose-slate prose-lg max-w-none">
          <h2>Kako deluje integracija računovodskega programa?</h2>
          <p>Pri prejetih računih ni samo enega načina integracije. Najbolj enostaven je <strong>email uvoz</strong>: za podjetje nastavite ciljni naslov, Slikaj Račun pa dokument pošlje tja. To je primerno, kadar računovodski program ali servis že uporablja namenski uvozni email.</p>
          <p>Pri naprednejšem procesu lahko račun najprej obdela <Link href="/ocr-racunov">OCR računov</Link>. Sistem prebere ključna polja, preveri neto/DDV/bruto zneske, IBAN in druge podatke ter dokument po potrebi pošlje v ročni pregled.</p>

          <h2>Tri načini dostave prejetih računov</h2>
          <h3>1. Originalni PDF ali slika po emailu</h3>
          <p>Najpreprostejši način. Originalni dokument se pošlje neposredno na nastavljen email za izbrano podjetje. Ta tok lahko ostane ločen od AI OCR obdelave.</p>
          <h3>2. UBL 2.1 ali eSLOG 2.0</h3>
          <p>Ko so OCR podatki preverjeni, se lahko pripravijo v strukturiran XML format. To zmanjša potrebo po ponovnem prepisovanju podatkov in je primerno za sisteme, ki sprejemajo UBL ali eSLOG.</p>
          <h3>3. JSON API</h3>
          <p>Za lastne ERP ali integracijske rešitve se lahko potrjeni podatki pošljejo kot strukturiran JSON na vaš HTTPS endpoint.</p>

          <h2>Integracija za računovodske servise</h2>
          <p>Računovodski servis lahko vodi več podjetij v enem uporabniškem računu. Vsako podjetje ima lahko svojo ciljno destinacijo in svoj način dostave. Pri večjem številu dokumentov lahko uporabnik naloži več računov naenkrat, vsak dokument pa ostane ločeno sledljiv.</p>

          <h2>Minimax, Birokrat in Pantheon</h2>
          <p>Za pogosto iskane slovenske programe imamo dodatne vodiče:</p>
          <ul>
            <li><Link href="/blog/minimax-email-uvoz-racunov">Minimax OCR in email uvoz računov</Link></li>
            <li><Link href="/blog/birokrat-ocr-uvoz-racunov">Birokrat OCR in uvoz računov</Link></li>
            <li><Link href="/blog/pantheon-ebooks-ocr-vodnik">Pantheon eBooks OCR</Link></li>
          </ul>

          <h2>Pogosta vprašanja</h2>
          {faq.map((item) => <section key={item.q}><h3>{item.q}</h3><p>{item.a}</p></section>)}
        </article>

        <div className="mt-12 text-center">
          <p className="mb-4 text-lg text-slate-600">Želite najprej preveriti, katere podatke OCR prebere iz vašega računa?</p>
          <Link href="/ocr-racunov" className="inline-flex rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800">Poglej OCR računov</Link>
        </div>
      </div>
    </div>
  );
}
