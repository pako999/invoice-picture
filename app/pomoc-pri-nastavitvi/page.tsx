import Link from "next/link";

const programs = [
  {
    name: "Minimax",
    color: "bg-orange-50 border-orange-200",
    icon: "🟠",
    steps: [
      "Prijavite se v Minimax",
      "Pojdite na Nastavitve → Uvoz dokumentov",
      "Vklopite Email uvoz računov",
      "Kopirajte email naslov (npr. uvoz-xxx@minimax.si)",
      "Vnesite ta email v SlikajRačun → Nastavitve",
    ],
  },
  {
    name: "Birokrat",
    color: "bg-blue-50 border-blue-200",
    icon: "🔵",
    steps: [
      "Prijavite se v Birokrat",
      "Pojdite na Administracija → Email uvoz",
      "Aktivirajte sprejem računov po emailu",
      "Zabeležite email naslov za uvoz",
      "Vnesite ta email v SlikajRačun → Nastavitve",
    ],
  },
  {
    name: "Pantheon",
    color: "bg-gray-50 border-gray-200",
    icon: "⚫",
    steps: [
      "Prijavite se v Pantheon",
      "Pojdite na eBooks → Nastavitve",
      "Aktivirajte OCR storitev",
      "Pridobite email naslov za uvoz",
      "Vnesite ta email v SlikajRačun → Nastavitve",
    ],
  },
  {
    name: "SAOP",
    color: "bg-green-50 border-green-200",
    icon: "🟢",
    steps: [
      "Prijavite se v SAOP iCenter",
      "Pojdite na Nastavitve → API uvoz",
      "Pridobite email naslov za uvoz računov",
      "Vnesite ta email v SlikajRačun → Nastavitve",
    ],
  },
];

export default function PomocPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Pomoč pri nastavitvi</h1>
      <p className="text-gray-500 mb-12 text-lg">
        Navodila za nastavitev email uvoza računov v priljubljenih računovodskih programih.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 flex gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <strong className="text-amber-800">Pomembno:</strong>
          <span className="text-amber-700"> Funkcija sprejemanja računov po emailu mora biti vklopljena v vašem programu, preden pošljete prvi račun.</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {programs.map((p) => (
          <div key={p.name} className={`border rounded-2xl p-6 ${p.color}`}>
            <h2 className="font-bold text-xl text-gray-900 mb-4">{p.icon} {p.name}</h2>
            <ol className="flex flex-col gap-2.5">
              {p.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 mb-4">Vaš program ni na seznamu ali potrebujete dodatno pomoč?</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors"
        >
          📨 Kontaktirajte nas
        </Link>
      </div>
    </div>
  );
}
