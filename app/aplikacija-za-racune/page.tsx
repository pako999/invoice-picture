import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Smartphone, Camera, Send, Archive } from "lucide-react";

export const metadata: Metadata = {
  title: "Aplikacija za račune: slikaj in pošlji račun v računovodstvo",
  description: "Mobilna aplikacija za račune za iPhone in Android. Fotografirajte prejeti račun in ga v nekaj sekundah pošljite v Minimax, Birokrat, Pantheon ali drug računovodski program.",
  alternates: { canonical: "/aplikacija-za-racune" },
  openGraph: {
    title: "Aplikacija za račune – Slikaj Račun",
    description: "Fotografirajte prejeti račun in ga hitro pošljite v svoj računovodski program.",
    url: "https://www.posljiracun.si/aplikacija-za-racune",
    type: "website",
  },
};

const faq = [
  { q: "Kaj naredi aplikacija za račune Slikaj Račun?", a: "Aplikacija zajame fotografijo prejetega računa in jo pošlje na nastavljeni email naslov računovodskega programa oziroma računovodskega servisa." },
  { q: "Ali aplikacija deluje na telefonu?", a: "Da. Namenjena je hitremu delu na telefonu, zato lahko račun uredite takoj, ko ga prejmete." },
  { q: "Ali potrebujem nov računovodski program?", a: "Ne. Slikaj Račun je dodatek k programu, ki ga že uporabljate, na primer Minimax, Birokrat ali Pantheon." },
  { q: "Ali lahko skeniram več računov?", a: "Da. Aplikacija je namenjena rednemu zajemu in pošiljanju prejetih računov, plačljivi paketi pa omogočajo večji obseg in uporabo za več podjetij." },
];

export default function AplikacijaZaRacunePage() {
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
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 mb-5">
              <Smartphone className="w-4 h-4" /> Mobilna aplikacija za račune
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 mb-6">
              Aplikacija za račune: fotografiraj, pošlji, končano
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              Prejeti račun fotografirate s telefonom in ga pošljete neposredno v računovodski program. Brez ročnega prepisovanja, brez iskanja pravega email naslova in brez kupov papirja v denarnici.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800">
                Preizkusi brezplačno <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/kako-deluje" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                Kako deluje
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Feature icon={<Camera className="w-7 h-7" />} title="Slikaj račun" text="Račun zajameš s kamero na telefonu takoj ob prejemu." />
          <Feature icon={<Send className="w-7 h-7" />} title="Pošlji v računovodstvo" text="Dokument gre na prednastavljeni naslov za uvoz ali OCR." />
          <Feature icon={<Archive className="w-7 h-7" />} title="Ohrani pregled" text="Ni več ugibanja, kateri račun si že poslal in katerega še nisi." />
          <Feature icon={<Smartphone className="w-7 h-7" />} title="Vedno pri roki" text="Postopek opraviš na telefonu, kjerkoli račun prejmeš." />
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 prose prose-slate prose-lg max-w-none">
        <h2>Aplikacija za skeniranje in pošiljanje računov</h2>
        <p>
          Klasična aplikacija za skeniranje dokument spremeni v sliko ali PDF. Slikaj Račun naredi še naslednji korak: dokument pošlje na pravo mesto v računovodskem procesu. Če primerjate različna orodja, preberite tudi našo <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov">primerjavo najboljših aplikacij za skeniranje računov</Link>.
        </p>

        <h2>Aplikacija za račune in Minimax</h2>
        <p>
          Pri Minimaxu lahko uporabite email uvoz dokumentov. V Slikaj Račun nastavite ciljni naslov, nato pa pri vsakem naslednjem računu samo fotografirate in pošljete. Podrobnosti so v vodiču <Link href="/blog/minimax-email-uvoz-racunov">Minimax email uvoz računov</Link>.
        </p>

        <h2>Deluje tudi z drugimi računovodskimi programi</h2>
        <p>
          Na enak način lahko rešitev uporabljate z Birokratom, Pantheonom in drugimi sistemi, ki sprejemajo dokumente po emailu. Oglejte si <Link href="/integracije">integracije z računovodskimi programi</Link>.
        </p>

        <h2>Za podjetnike in računovodske servise</h2>
        <p>
          Samostojni podjetnik lahko aplikacijo uporablja za svoje račune, računovodski servis pa lahko z ustreznim paketom upravlja več podjetij iz enega uporabniškega računa. Tako ni treba ustvarjati ločene prijave za vsako podjetje.
        </p>

        <h2>Pogosta vprašanja</h2>
        {faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </article>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-blue-700 mb-4">{icon}</div>
      <h2 className="text-lg font-bold text-slate-950 mb-2">{title}</h2>
      <p className="text-slate-600">{text}</p>
    </div>
  );
}
