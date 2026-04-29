"use client";
import { useState } from "react";
import Link from "next/link";

const basicFeatures = [
  "Neomejeno fotografiranje računov",
  "Pošiljanje na kateri koli email",
  "Deluje z Minimax, Birokrat, Pantheon, SAOP, E-računi, Eurofaktura",
  "OCR obdelava v vašem računovodskem programu",
  "Arhiv poslanih računov s predogledom",
  "Status pošiljanja v realnem času",
  "Podpora JPG, PNG, WEBP in PDF",
  "Mobilno optimizirana aplikacija",
  "Varen dostop prek Clerk avtentikacije",
  "Shramba zgodovine brez omejitev",
];

const proFeatures = [
  "Vse iz osnovnega paketa",
  "Upravljanje neomejeno podjetij",
  "Ločen OCR email za vsako podjetje",
  "Hitri preklop med podjetji pri skeniranju",
  "En račun — vsa podjetja na enem mestu",
  "Arhiv računov ločen po podjetjih",
  "Mobilno optimizirana aplikacija",
  "Varen dostop prek Clerk avtentikacije",
  "Prednostna podpora",
];

function FeatureList({ items, light, violet }: { items: string[]; light?: boolean; violet?: boolean }) {
  const check = violet ? "text-violet-400" : light ? "text-blue-300" : "text-green-500";
  const text = light ? "text-blue-100" : violet ? "text-slate-300" : "text-gray-600 dark:text-slate-300";
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((f) => (
        <li key={f} className={`flex items-start gap-2.5 text-sm ${text}`}>
          <span className={`${check} mt-0.5 flex-shrink-0`}>✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const basicMonthly = 9.90;
  const proMonthly = 19.90;
  const basicYearly = +(basicMonthly * 12 * 0.8).toFixed(2);   // 95.04
  const proYearly   = +(proMonthly   * 12 * 0.8).toFixed(2);   // 191.04
  const basicPerMonth = +(basicMonthly * 0.8).toFixed(2);       // 7.92
  const proPerMonth   = +(proMonthly   * 0.8).toFixed(2);       // 15.92

  function fmt(n: number) { return n.toFixed(2).replace(".", ","); }

  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest text-center mb-3 uppercase">Cenik</p>
        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-4">
          Začnite danes
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-center mb-8 max-w-xl mx-auto text-lg">
          Prihranite dragoceni čas pri ročnem vnosu računov. En klik nadomesti minute tipkanja.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-semibold transition-colors ${!yearly ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}>
            Mesečno
          </span>
          <button
            onClick={() => setYearly(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
            aria-label="Preklopi na letno"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${yearly ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}>
            Letno
          </span>
          {yearly && (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
              prihrani 20 %
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Basic */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col gap-6">
            <div>
              <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Osnovno</div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  {yearly ? fmt(basicPerMonth) : fmt(basicMonthly)}
                </span>
                <span className="text-gray-500 dark:text-slate-400 mb-1.5">€ / mesec</span>
              </div>
              {yearly ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  <span className="line-through">{fmt(basicMonthly * 12)} €</span>
                  {" → "}
                  <strong className="text-gray-700 dark:text-white">{fmt(basicYearly)} € / leto</strong> — enkratno
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Mesečna obnova, kadarkoli odpoveš.</p>
              )}
            </div>
            <FeatureList items={basicFeatures} />
            <Link
              href="/sign-up"
              className="mt-auto w-full text-center bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors"
            >
              {yearly ? `Začni letno — prihrani ${fmt(basicMonthly * 12 - basicYearly)} € →` : "Začni mesečno →"}
            </Link>
          </div>

          {/* PRO */}
          <div className="relative bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 flex flex-col gap-6 border border-slate-700 shadow-2xl shadow-slate-300 dark:shadow-none">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <div className="bg-violet-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
                🏢 PRO · Računovodstvo
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PRO</div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white">
                  {yearly ? fmt(proPerMonth) : fmt(proMonthly)}
                </span>
                <span className="text-slate-400 mb-1.5">€ / mesec</span>
              </div>
              {yearly ? (
                <p className="text-sm text-slate-400 mt-1">
                  <span className="line-through text-slate-500">{fmt(proMonthly * 12)} €</span>
                  {" → "}
                  <strong className="text-violet-400">{fmt(proYearly)} € / leto</strong> — enkratno
                </p>
              ) : (
                <p className="text-sm text-slate-400 mt-1">Mesečna obnova, kadarkoli odpoveš.</p>
              )}
            </div>
            <FeatureList items={proFeatures} violet />
            <Link
              href="/sign-up"
              className="mt-auto w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors"
            >
              {yearly ? `Začni PRO letno — prihrani ${fmt(proMonthly * 12 - proYearly)} € →` : "Začni PRO →"}
            </Link>
          </div>

        </div>

        <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-8">
          Brez skritih stroškov · Brez vezave · Odpoveš kadarkoli
        </p>
      </div>
    </section>
  );
}
