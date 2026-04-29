import Link from "next/link";
import Image from "next/image";
import { HeroButtons } from "@/components/hero-buttons";

const integrations = [
  {
    name: "Minimax",
    domain: "minimax.si",
    color: "#F26522",
    bg: "#FFF4ED",
    desc: "Email uvoz + OCR",
    href: "https://minimax.si",
  },
  {
    name: "Birokrat",
    domain: "birokrat.si",
    color: "#1E5FA6",
    bg: "#EEF4FB",
    desc: "Email uvoz + OCR",
    href: "https://birokrat.si",
  },
  {
    name: "Pantheon",
    domain: "datalab.si",
    color: "#003087",
    bg: "#EEF1F8",
    desc: "eBooks OCR storitev",
    href: "https://datalab.si",
  },
  {
    name: "SAOP",
    domain: "saop.si",
    color: "#009B77",
    bg: "#EDFAF6",
    desc: "API uvoz računov",
    href: "https://saop.si",
  },
  {
    name: "E-računi",
    domain: "e-racuni.si",
    color: "#0066CC",
    bg: "#EEF5FF",
    desc: "Email + DigiBox OCR",
    href: "https://e-racuni.si",
  },
  {
    name: "Eurofaktura",
    domain: "eurofaktura.com",
    color: "#6B21A8",
    bg: "#F5F0FF",
    desc: "Email + API uvoz",
    href: "https://eurofaktura.com",
  },
];

const steps = [
  {
    icon: "⚙️",
    title: "Enkrat nastavi email",
    desc: "V nastavitvah vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov (npr. uvoz@minimax.si). To storite samo enkrat.",
  },
  {
    icon: "📱",
    title: "Fotografirajte račun",
    desc: "Odprite aplikacijo in s telefonom poslikajte papirnat račun. Podpira JPG, PNG in WEBP.",
  },
  {
    icon: "📤",
    title: "En klik — poslano",
    desc: "Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi. OCR obdelava poteka v programu — ne pri nas.",
  },
];

const features = [
  {
    icon: "📷",
    title: "En klik — račun poslan",
    desc: "Poslikajte papirnat račun in pritisnite Pošlji. Nič tipkanja, nič prenašanja datotek. Optimizirano za mobilne naprave.",
  },
  {
    icon: "📧",
    title: "Posredovanje na vaš program",
    desc: "App pošlje sliko na email, ki ga nastavi vaš računovodski program. OCR obdelavo opravi program — Minimax, Birokrat, Pantheon in drugi.",
  },
  {
    icon: "📋",
    title: "Arhiv vseh pošiljanj",
    desc: "Vsi poslani računi so shranjeni z datumom, statusom dostave in predogledom. Kadarkoli preverite, ali je bil račun poslan.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
          🇸🇮 Narejen za slovensko računovodstvo
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6">
          Slikaj račun in ga pošlji{" "}
          <span className="text-blue-600 dark:text-blue-400">z enim klikom</span>
        </h1>

        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed">
          Naš app je preprost most med papirnatim računom in vašim računovodskim programom.
          Samo nastavite email za posredovanje — vse ostalo naredite z enim fotografiranjem.
        </p>

        <div className="inline-flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm px-5 py-3.5 rounded-2xl mb-10 max-w-xl mx-auto text-left">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <span>
            <strong>Pogoj za uporabo:</strong> V vašem računovodskem programu mora biti vklopljeno sprejemanje računov po emailu z OCR obdelavo. Preverite nastavitve pri Minimax, Birokrat, Pantheon ali vašem programu.
          </span>
        </div>

        <HeroButtons />

        {/* Flow diagram */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
          <FlowStep icon="🧾" label="Papirnat račun" color="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700" />
          <Arrow />
          <FlowStep icon="📱" label="Fotografiraš" color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" />
          <Arrow />
          <FlowStep icon="📤" label="Pošlješ" color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" />
          <Arrow />
          <FlowStep icon="🤖" label="OCR obdela" color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700" />
          <Arrow />
          <FlowStep icon="✅" label="Knjiženo!" color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700" />
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Integracije</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
            Deluje z vašim programom
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-4 max-w-xl mx-auto">
            App posreduje sliko računa na email vašega programa. OCR obdelavo — branje zneskov, datumov in dobaviteljev — opravi vaš računovodski program.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-12 font-medium">
            ⚠️ V programu mora biti vklopljena funkcija sprejemanja računov po emailu z OCR obdelavo.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: p.bg }}
                >
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=64`}
                    alt={p.name}
                    width={32}
                    height={32}
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                </div>
                <div
                  className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ color: p.color, background: p.bg }}
                >
                  ✓ podprt
                </div>
              </a>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-8">
            + kateri koli drug program, ki sprejema račune po emailu
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Kako deluje</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-14">
            3 preprosti koraki
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-3xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Funkcionalnosti</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-14">
            Vse kar potrebuješ
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-7 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Cenik</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
            Začnite danes
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-12 max-w-xl mx-auto text-lg">
            Prihranite dragoceni čas pri ročnem vnosu računov. En klik nadomesti minute tipkanja.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col gap-6">
              <div>
                <div className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mesečno</div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">9,90</span>
                  <span className="text-gray-500 dark:text-slate-400 mb-1.5">EUR / mesec</span>
                </div>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Mesečno obnovitev, kadarkoli odpoveš.</p>
              </div>
              <PricingFeatures />
              <Link
                href="/sign-up"
                className="mt-auto w-full text-center bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors"
              >
                Začni mesečno →
              </Link>
            </div>

            {/* Yearly — highlighted */}
            <div className="relative bg-blue-600 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl shadow-blue-200 dark:shadow-none">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <div className="bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
                  ✦ PRIPOROČAMO · prihrani 20 %
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Letno</div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-white">7,92</span>
                  <span className="text-blue-200 mb-1.5">EUR / mesec</span>
                </div>
                <p className="text-sm text-blue-200 mt-1">
                  <span className="line-through text-blue-300">118,80 EUR</span>
                  {" "}→{" "}
                  <strong className="text-white">95,04 EUR / leto</strong> — enkratno plačilo
                </p>
              </div>
              <PricingFeaturesLight />
              <Link
                href="/sign-up"
                className="mt-auto w-full text-center bg-white hover:bg-blue-50 text-blue-600 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors"
              >
                Začni letno — prihrani 23,76 EUR →
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-8">
            Brez skritih stroškov · Brez vezave · Odpoveš kadarkoli
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 pb-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-gray-500 dark:text-slate-400 mb-4">Imate vprašanje ali potrebujete pomoč pri nastavitvi?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-2xl text-sm transition-colors"
          >
            📨 Kontaktirajte nas
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
        🧾 Invoice Picture · © 2026 · Created by{" "}
        <a href="https://futurecode.si" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors">
          futurecode.si
        </a>
      </footer>
    </div>
  );
}

const pricingFeatures = [
  "Neomejeno fotografiranje računov",
  "Pošiljanje na kateri koli email",
  "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Eurofaktura",
  "OCR obdelava v vašem računovodskem programu",
  "Arhiv vseh poslanih računov s predogledom",
  "Status pošiljanja v realnem času",
  "Podpora JPG, PNG, WEBP formatov",
  "Mobilno optimizirana aplikacija",
  "Varen dostop prek Clerk avtentikacije",
  "Shramba zgodovine brez omejitev",
];

function PricingFeatures() {
  return (
    <ul className="flex flex-col gap-2.5">
      {pricingFeatures.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-300">
          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function PricingFeaturesLight() {
  return (
    <ul className="flex flex-col gap-2.5">
      {pricingFeatures.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-sm text-blue-100">
          <span className="text-blue-200 mt-0.5 flex-shrink-0">✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function FlowStep({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border ${color}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">{label}</span>
    </div>
  );
}

function Arrow() {
  return (
    <svg className="text-gray-300 dark:text-slate-600 flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
