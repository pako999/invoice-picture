"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Kaj potrebujem za uporabo aplikacije?",
    a: "Potrebujete aktiven račun pri enem od podprtih računovodskih programov (Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka ali drug program) in vklopljeno funkcijo sprejemanja računov po emailu z OCR obdelavo.",
  },
  {
    q: "Ali aplikacija sama bere podatke iz računa (OCR)?",
    a: "Ne. SlikajRačun pošlje sliko računa na email vašega računovodskega programa. OCR obdelavo — branje zneskov, datumov in dobaviteljev — opravi vaš program, ne mi.",
  },
  {
    q: "Kateri formati datotek so podprti?",
    a: "Podprti so JPG, PNG, WEBP in PDF.",
  },
  {
    q: "Ali lahko uporabljam aplikacijo za več podjetij?",
    a: "Da, z PRO paketom lahko dodate neomejeno podjetij, vsako s svojim OCR email naslovom. Pri skeniranju izberete podjetje, ki mu račun pripada.",
  },
  {
    q: "Kje najdem email naslov za uvoz računov?",
    a: "Email naslov za uvoz računov najdete v nastavitvah vašega računovodskega programa. Npr. pri Minimaxu je to v Nastavitve → Uvoz dokumentov → Email uvoz.",
  },
  {
    q: "Ali so moji računi varni?",
    a: "Slike računov se pošljejo neposredno na email vašega programa in niso shranjene na naših strežnikih. Shranjujemo le metapodatke (datum, status, ime datoteke) za arhiv.",
  },
  {
    q: "Kako odpovem naročnino?",
    a: "Naročnino lahko odpoveste kadarkoli v nastavitvah računa. Dostop ostane aktiven do konca plačanega obdobja.",
  },
  {
    q: "Ali deluje aplikacija na iPhone in Android?",
    a: "Aplikacija je optimizirana za mobilne brskalnike in deluje na vseh napravah. iOS aplikacija je v razvoju.",
  },
];

export default function PogostVprasanjaPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Pogosta vprašanja</h1>
      <p className="text-gray-500 mb-12 text-lg">Odgovori na najpogostejša vprašanja o aplikaciji SlikajRačun.</p>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <span className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}
