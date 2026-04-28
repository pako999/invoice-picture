import Link from "next/link";

const features = [
  {
    icon: "📷",
    title: "Fotografiraj ali naloži",
    desc: "Poslikaj papirnat račun z mobilnim telefonom ali naloži obstoječo sliko iz naprave. Podpira JPG, PNG, WEBP.",
  },
  {
    icon: "📧",
    title: "Pošlji z emailom",
    desc: "Račun se pošlje na nastavljeni email prek Resend storitve z visoko dostavljenostjo v sekundi.",
  },
  {
    icon: "📋",
    title: "Admin pregled",
    desc: "Vsi poslani računi na enem mestu — thumbnail, status, datum, prejemnik. Briši arhiv kadarkoli.",
  },
];

const steps = [
  { n: "1", title: "Nastavi email", desc: "V nastavitvah vnesi email naslov, na katerega želiš prejemati račune." },
  { n: "2", title: "Slikaj račun", desc: "Odpri zavihek Skeniraj, izberi ali fotografiraj sliko računa." },
  { n: "3", title: "Pošlji", desc: "Pritisni Pošlji. Email prispe v sekundi, račun se shrani v arhiv." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
          ✦ Brezplačno · Open Source
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6">
          Pošlji račune{" "}
          <span className="text-blue-600 dark:text-blue-400">v sekundi</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Fotografirajte papirnat račun in ga pošljite na email s pritiskom enega gumba. Brez skeniranja, brez čakanja.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            📷 Začni skenirati
          </Link>
          <a
            href="https://github.com/pako999/invoice-picture"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold px-8 py-4 rounded-2xl text-base transition-colors"
          >
            GitHub →
          </a>
        </div>

        {/* Mock UI preview */}
        <div className="mt-16 max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-2xl shadow-gray-100 dark:shadow-none bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-400 dark:text-slate-500">invoice-picture.vercel.app/scan</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row gap-5">
            <div className="flex-1 h-44 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500">
              <span className="text-3xl">📄</span>
              <span className="text-sm">Slika računa</span>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</div>
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                  racuni@podjetje.si
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Zadeva</div>
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                  Račun
                </div>
              </div>
              <div className="mt-1 bg-blue-600 text-white text-sm font-bold text-center py-2.5 rounded-xl">
                📤 Pošlji račun
              </div>
            </div>
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
                <span className="text-4xl">{f.icon}</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Kako deluje</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-14">
            3 preprosti koraki
          </h2>
          <div className="flex flex-col gap-0">
            {steps.map((s, i) => (
              <div key={s.n} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {s.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 h-10 bg-gray-200 dark:bg-slate-700 my-1" />
                  )}
                </div>
                <div className={`pb-${i < steps.length - 1 ? "10" : "0"} pt-1`}>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{s.title}</h3>
                  <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Pripravljeni?</h2>
          <p className="text-blue-100 text-lg mb-8">Začnite pošiljati račune zdaj. Brez registracije.</p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors"
          >
            📷 Odpri aplikacijo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
        🧾 Invoice Picture · © 2026 · Zgrajeno z Next.js + Resend + Drizzle
      </footer>
    </div>
  );
}
