import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Integracija z računovodskim programom: Minimax, Birokrat, Pantheon in več",
  description: "Integracija z računovodskim programom za hitro pošiljanje prejetih računov. Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka in drugimi sistemi z email uvozom.",
  slug: "integracije",
});

const integrations = [
  { name: "Minimax", logo: "/logos/minimax.svg", short: "Email uvoz + OCR obdelava", long: "Minimax omogoča uvoz računov preko email naslova z avtomatsko OCR obdelavo in knjiženjem v sistem.", href: "https://www.vasco.si/minimax" },
  { name: "Birokrat", logo: "/logos/birokrat.png", short: "Email uvoz + OCR obdelava", long: "Birokrat ponuja email uvoz z OCR tehnologijo za avtomatsko razpoznavo podatkov na računih.", href: "https://www.birokrat.si" },
  { name: "Pantheon", logo: "/logos/pantheon.png", short: "eBooks OCR storitev", long: "Pantheon uporablja eBooks OCR storitev za digitalizacijo in avtomatsko obdelavo dokumentov.", href: "https://www.datalab.si/pantheon" },
  { name: "SAOP", logo: "/logos/vasco.png", short: "Uvoz dokumentov", long: "SAOP podpira digitalne procese za uvoz in obdelavo dokumentov v računovodstvu.", href: "https://www.saop.si" },
  { name: "E-računi", logo: "/logos/eracuni.png", short: "Email + OCR", long: "E-računi omogoča digitalno obdelavo in upravljanje dokumentov ter uvoz v računovodski proces.", href: "https://www.eracuni.com" },
  { name: "Metakocka", logo: "/logos/metakocka.png", short: "Email uvoz + OCR obdelava", long: "Metakocka omogoča digitalni uvoz računov in avtomatizacijo procesov z dokumenti.", href: "https://www.metakocka.si" },
];

const faq = [
  { q: "Kaj pomeni integracija z računovodskim programom?", a: "Slikaj Račun poveže zajem računa na telefonu z vašim obstoječim računovodskim procesom. Dokument pošlje na nastavljeni email naslov za uvoz oziroma OCR obdelavo." },
  { q: "Ali moram zamenjati računovodski program?", a: "Ne. Slikaj Račun je dodatek k obstoječemu programu in ne nadomešča Minimax, Birokrat, Pantheon ali druge računovodske rešitve." },
  { q: "Kateri računovodski programi so podprti?", a: "Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka in drugi programi, ki omogočajo sprejem dokumentov po emailu." },
  { q: "Ali lahko računovodski servis uporablja več podjetij?", a: "Da. Paket za računovodstva omogoča več podjetij v enem uporabniškem računu in ločen ciljni email za vsako podjetje." },
];

export default function Integracije() {
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
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Računovodske integracije</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Integracija z računovodskim programom brez menjave sistema</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
            Slikaj Račun poveže telefon z vašim obstoječim računovodskim programom. Fotografijo računa pošlje na pravi email za uvoz dokumentov, OCR in nadaljnjo obdelavo v sistemu, ki ga že uporabljate.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-3xl mx-auto">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900"><strong>Pogoj za uporabo:</strong> računovodski program mora omogočati sprejem dokumentov po emailu oziroma ustrezen uvoz dokumentov.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl mb-8 font-semibold">Podprti računovodski programi</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((p) => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105">
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt={`${p.name} računovodski program`} className="h-10 object-contain" />
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-xl">{p.name}<Check className="w-5 h-5 text-green-600" /></CardTitle>
                  <CardDescription className="mt-2">{p.short}</CardDescription>
                  <Badge variant="outline" className="w-fit mt-3 bg-green-50 text-green-700 border-green-200">✓ podprt</Badge>
                  <p className="text-sm text-slate-600 mt-3">{p.long}</p>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-950 mb-4">Kako deluje integracija računovodskega programa?</h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>V računovodskem programu ali pri računovodskem servisu pridobite email naslov, namenjen uvozu dokumentov. Ta naslov enkrat vnesete v Slikaj Račun. Od takrat naprej pri novem računu samo fotografirate dokument in izberete pošiljanje.</p>
            <p>Če uporabljate Minimax, si oglejte naš <Link href="/blog/minimax-email-uvoz-racunov" className="text-blue-700 font-medium hover:underline">vodnik za Minimax email uvoz</Link>. Za Birokrat imamo <Link href="/blog/birokrat-ocr-uvoz-racunov" className="text-blue-700 font-medium hover:underline">Birokrat OCR vodnik</Link>, za Pantheon pa <Link href="/blog/pantheon-ebooks-ocr-vodnik" className="text-blue-700 font-medium hover:underline">Pantheon eBooks OCR vodnik</Link>.</p>
            <p>Če šele iščete primerno rešitev, poglejte še strani <Link href="/program-za-racune" className="text-blue-700 font-medium hover:underline">program za račune</Link> in <Link href="/aplikacija-za-racune" className="text-blue-700 font-medium hover:underline">aplikacija za račune</Link>.</p>
          </div>

          <h2 className="text-3xl font-bold text-slate-950 mt-10 mb-4">Integracija za računovodske servise in več podjetij</h2>
          <p className="text-slate-700 leading-relaxed">Računovodski servis lahko iz enega računa upravlja več podjetij. Vsako podjetje ima svoj ciljni email, zato ni treba ustvarjati ločenega uporabniškega računa za vsako stranko. To je posebej uporabno pri večjem številu prejetih računov in standardizaciji procesa.</p>

          <h2 className="text-3xl font-bold text-slate-950 mt-10 mb-4">Pogosta vprašanja</h2>
          <div className="space-y-6">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="font-bold text-lg text-slate-950 mb-2">{item.q}</h3>
                <p className="text-slate-700">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-slate-600 mb-4">+ kateri koli drug računovodski program, ki sprejema račune po emailu</p>
          <Link href="/sign-up" className="inline-flex rounded-xl bg-slate-950 px-6 py-3 text-white font-semibold hover:bg-slate-800">Preizkusi Slikaj Račun</Link>
        </div>
      </div>
    </div>
  );
}
