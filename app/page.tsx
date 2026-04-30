import Image from "next/image";
import { HeroButtons } from "@/components/hero-buttons";
import { PricingSection } from "@/components/pricing-section";

const integrations = [
  {
    name: "Minimax",
    logo: null,
    domain: "minimax.si",
    color: "#F26522",
    bg: "#FFF4ED",
    desc: "Email uvoz + OCR",
    href: "https://minimax.si",
  },
  {
    name: "Birokrat",
    logo: "/logos/birokrat.png",
    domain: "birokrat.si",
    color: "#1E5FA6",
    bg: "#EEF4FB",
    desc: "Email uvoz + OCR",
    href: "https://birokrat.si",
  },
  {
    name: "Pantheon",
    logo: "/logos/pantheon.png",
    domain: "datalab.si",
    color: "#4B5563",
    bg: "#F3F4F6",
    desc: "eBooks OCR storitev",
    href: "https://datalab.si",
  },
  {
    name: "SAOP",
    logo: null,
    domain: "saop.si",
    color: "#009B77",
    bg: "#EDFAF6",
    desc: "API uvoz računov",
    href: "https://saop.si",
  },
  {
    name: "E-računi",
    logo: "/logos/eracuni.png",
    domain: "e-racuni.si",
    color: "#0066CC",
    bg: "#EEF5FF",
    desc: "Email + DigiBox OCR",
    href: "https://e-racuni.si",
  },
  {
    name: "Metakocka",
    logo: "/logos/metakocka.png",
    domain: "metakocka.si",
    color: "#6B7280",
    bg: "#F9FAFB",
    desc: "Email uvoz računov",
    href: "https://metakocka.si",
  },
];

const steps = [
  {
    icon: "⚙️",
    color: "bg-blue-600",
    shadow: "shadow-blue-200 dark:shadow-none",
    title: "Enkrat nastavi email",
    desc: "V nastavitvah vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov (npr. uvoz@minimax.si). To storite samo enkrat.",
  },
  {
    icon: "📱",
    color: "bg-indigo-500",
    shadow: "shadow-indigo-200 dark:shadow-none",
    title: "Fotografirajte račun",
    desc: "Odprite aplikacijo in s telefonom poslikajte papirnat račun. Podpira JPG, PNG, WEBP in PDF.",
  },
  {
    icon: "📤",
    color: "bg-emerald-500",
    shadow: "shadow-emerald-200 dark:shadow-none",
    title: "En klik — poslano",
    desc: "Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi. OCR obdelava poteka v programu — ne pri nas.",
  },
];

const features = [
  {
    icon: "📷",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    title: "En klik — račun poslan",
    desc: "Poslikajte papirnat račun in pritisnite Pošlji. Nič tipkanja, nič prenašanja datotek. Optimizirano za mobilne naprave.",
  },
  {
    icon: "📧",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    title: "Posredovanje na vaš program",
    desc: "App pošlje sliko na email, ki ga nastavi vaš računovodski program. OCR obdelavo opravi program — Minimax, Birokrat, Pantheon in drugi.",
  },
  {
    icon: "📋",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    title: "Arhiv vseh pošiljanj",
    desc: "Vsi poslani računi so shranjeni z datumom, statusom dostave in predogledom. Kadarkoli preverite, ali je bil račun poslan.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
          🇸🇮 Narejen za slovensko računovodstvo
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6">
          Slikaj račun in ga pošlji{" "}
          <span className="text-blue-600 dark:text-blue-400">z enim klikom</span>
        </h1>

        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Fotografirajte fizični račun, aplikacija pa ga samodejno pošlje na OCR&nbsp;email
          vašega računovodskega programa. Brez ročnega vnosa, brez kompliciranja.
        </p>

        {/* Warning badge */}
        <div className="inline-flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm px-5 py-3.5 rounded-2xl mb-10 max-w-xl mx-auto text-left">
          <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <span>
            <strong>Pogoj za uporabo:</strong> V vašem računovodskem programu mora biti vklopljeno
            sprejemanje računov po emailu z OCR obdelavo.
          </span>
        </div>

        <HeroButtons />

        {/* Flow steps */}
        <div id="kako-deluje" className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap mt-4">
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

      {/* ── INTEGRATIONS ── */}
      <section id="integracije" className="bg-gray-50 dark:bg-slate-800/50 border-t border-b border-gray-200 dark:border-slate-700 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">
            Integracije
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
            Deluje z vašim programom
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-3 max-w-xl mx-auto">
            App posreduje sliko računa na email vašega programa. OCR obdelavo opravi
            vaš računovodski program.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-12 font-medium">
            ⚠️ V programu mora biti vklopljena funkcija sprejemanja računov po emailu z OCR obdelavo.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2"
                  style={{ background: p.bg }}
                >
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={48}
                      height={48}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <Image
                      src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=64`}
                      alt={p.name}
                      width={32}
                      height={32}
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                </div>
                <div
                  className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
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

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">
            Kako deluje
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
            3 preprosti koraki
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-14 max-w-lg mx-auto">
            Nastavite enkrat, uporabljajte vsak dan. Ni potrebno nobeno tehničko znanje.
          </p>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector lines on desktop */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gray-200 dark:bg-slate-700 z-0" />

            {steps.map((s, i) => (
              <div key={i} className="relative text-center flex flex-col items-center gap-4 z-10">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl ${s.color} text-3xl flex items-center justify-center shadow-lg ${s.shadow} bg-opacity-100`}>
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center shadow-sm">
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

      {/* ── FEATURES ── */}
      <section id="funkcionalnosti" className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">
            Funkcionalnosti
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
            Vse kar potrebuješ
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-14 max-w-lg mx-auto">
            Preprosta in hitra rešitev za posredovanje računov v vaš računovodski program.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-7 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center text-2xl`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <div id="cenik">
        <PricingSection />
      </div>

    </div>
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
    <svg
      className="text-gray-300 dark:text-slate-600 flex-shrink-0"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M4 10h12M12 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
