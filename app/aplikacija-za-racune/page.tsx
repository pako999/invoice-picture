import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Smartphone, Camera, ScanText, Archive, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Aplikacija za račune z OCR: skeniranje in ekstrakcija podatkov",
  description: "Aplikacija za račune za slovenska podjetja: fotografirajte ali naložite PDF, OCR prebere podatke računa, jih preveri in pripravi za računovodski program, UBL, eSLOG ali API.",
  alternates: { canonical: "/aplikacija-za-racune" },
  openGraph: {
    title: "Aplikacija za račune z OCR – Slikaj Račun",
    description: "Skeniranje, OCR ekstrakcija, validacija in pošiljanje prejetih računov v računovodski workflow.",
    url: "https://www.posljiracun.si/aplikacija-za-racune",
    type: "website",
  },
};

const faq = [
  { q: "Kaj naredi aplikacija za račune Slikaj Račun?", a: "Aplikacija zajame ali sprejme prejeti račun, lahko izvede OCR ekstrakcijo računovodskih podatkov, preveri ključne vrednosti in dokument oziroma potrjene podatke pošlje v nastavljen računovodski workflow." },
  { q: "Ali aplikacija zna sama prebrati račun?", a: "Da. Pri OCR obdelavi prebere med drugim številko računa, datume, dobavitelja, DDV številko, IBAN, neto, DDV, bruto znesek in postavke." },
  { q: "Ali aplikacija deluje za slovenske in angleške račune?", a: "Da. OCR workflow je namenjen računom v slovenščini in angleščini ter pogostim mednarodnim oznakam." },
  { q: "Ali potrebujem nov računovodski program?", a: "Ne. Slikaj Račun dopolnjuje program, ki ga že uporabljate. Original ali potrjene strukturirane podatke pošljete naprej v obstoječi proces." },
  { q: "Ali lahko naložim več računov?", a: "Da. Aplikacija podpira množični upload več dokumentov in upravljanje več podjetij, odvisno od paketa." },
];

export default function AplikacijaZaRacunePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["sl-SI", "en"],
    url: "https://www.posljiracun.si/aplikacija-za-racune",
    featureList: ["skeniranje računov", "OCR računov", "ekstrakcija podatkov", "validacija DDV in IBAN", "UBL", "eSLOG", "API"],
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />

      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800"><Smartphone className="h-4 w-4" /> Aplikacija za prejete račune</div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Aplikacija za račune z OCR: slikaj, preberi in pošlji</h1>
            <p className="mb-8 text-xl leading-relaxed text-slate-600">Prejeti račun fotografirate ali naložite kot PDF. Slikaj Račun lahko podatke samodejno prebere, jih validira in pripravi za pregled oziroma nadaljnjo dostavo v računovodski program.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800">Preizkusi aplikacijo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/ocr-racunov" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">Kako deluje OCR</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<Camera className="h-7 w-7" />} title="Slikaj ali naloži" text="PDF, JPG, PNG ali WEBP račun lahko naložite iz telefona ali računalnika." />
          <Feature icon={<ScanText className="h-7 w-7" />} title="OCR prebere podatke" text="Številka računa, datumi, dobavitelj, DDV, IBAN, zneski in postavke." />
          <Feature icon={<ShieldCheck className="h-7 w-7" />} title="Preveri napake" text="Validacija zneskov, DDV, IBAN, ključnih polj in možnih duplikatov." />
          <Feature icon={<Archive className="h-7 w-7" />} title="Pošlji in arhiviraj" text="Original ali strukturirane podatke pošljite naprej in ohranite sled dokumenta." />
        </div>
      </section>

      <article className="prose prose-slate prose-lg mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2>Aplikacija za skeniranje računov ni isto kot OCR</h2>
        <p>Klasična aplikacija za skeniranje dokument spremeni v sliko ali PDF. To je koristno za arhiv, ne reši pa prepisovanja podatkov. Slikaj Račun ima poleg zajema tudi <Link href="/ocr-racunov">OCR računov</Link>, zato lahko iz dokumenta pripravi strukturirane računovodske podatke.</p>

        <h2>Katere podatke aplikacija prebere?</h2>
        <p>OCR lahko prebere številko računa, datum izdaje, datum storitve, rok plačila, dobavitelja, kupca, davčne številke, IBAN, BIC, sklic, valuto, neto znesek, DDV, bruto znesek, DDV razčlenitev in postavke.</p>
        <p>Če podatki niso dovolj zanesljivi, dokument ne gre slepo naprej. Uporabnik ga odpre v pregledu, kjer primerja original z izluščenimi podatki in račun potrdi ali popravi.</p>

        <h2>Aplikacija za račune v slovenščini in angleščini</h2>
        <p>Podjetja v Sloveniji pogosto prejemajo lokalne in tuje račune. Sistem zato podpira slovenske in angleške račune ter običajne računovodske oznake v obeh jezikih.</p>

        <h2>Aplikacija za račune in računovodski program</h2>
        <p>Slikaj Račun ne nadomešča programa za izdajo računov. Za fakturiranje in knjiženje še naprej uporabljate svoj sistem. Slikaj Račun poskrbi za vhodni del: zajem, OCR, pregled in dostavo prejetega računa. Oglejte si <Link href="/integracije">integracije z računovodskimi programi</Link>.</p>

        <h2>Originalni email, UBL, eSLOG ali API</h2>
        <p>Najenostavneje je originalni PDF ali sliko poslati na uvozni email. Pri strukturiranem workflowu pa je mogoče potrjene podatke uporabiti za UBL 2.1, eSLOG 2.0 ali JSON API dostavo.</p>

        <h2>Za podjetnike in računovodske servise</h2>
        <p>Posamezno podjetje lahko z aplikacijo obdeluje svoje prejete račune, računovodski servis pa lahko z višjim paketom upravlja več podjetij iz enega uporabniškega računa. Vsako podjetje ima lahko svoj ciljni email oziroma način dostave.</p>

        <h2>Primerjava aplikacij za skeniranje računov</h2>
        <p>Če primerjate Microsoft Lens, Adobe Scan, mednarodne receipt-capture rešitve in specializiran OCR za računovodstvo, preberite naš vodič <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">aplikacija za skeniranje računov + OCR</Link>.</p>

        <h2>Pogosta vprašanja</h2>
        {faq.map((item) => <section key={item.q}><h3>{item.q}</h3><p>{item.a}</p></section>)}
      </article>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 text-blue-700">{icon}</div><h2 className="mb-2 text-lg font-bold text-slate-950">{title}</h2><p className="text-slate-600">{text}</p></div>;
}
