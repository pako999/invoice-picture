export default function PiskotkyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Politika piškotkov</h1>
      <p className="text-gray-400 text-sm mb-10">Zadnja posodobitev: april 2026</p>

      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <Section title="Kaj so piškotki?">
          <p>Piškotki so majhne besedilne datoteke, ki jih spletna stran shrani v vaš brskalnik. Omogočajo delovanje storitev, ki zahtevajo prepoznavanje uporabnika med sejami.</p>
        </Section>

        <Section title="Kateri piškotki se uporabljajo?">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-900">Piškotek</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-900">Namen</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-900">Trajanje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200"><code className="bg-gray-100 px-1 rounded">__session</code></td>
                  <td className="p-3 border border-gray-200">Avtentikacija (Clerk) — ohranja prijavo</td>
                  <td className="p-3 border border-gray-200">Seja</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200"><code className="bg-gray-100 px-1 rounded">__client_uat</code></td>
                  <td className="p-3 border border-gray-200">Varnostni žeton (Clerk)</td>
                  <td className="p-3 border border-gray-200">1 leto</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">Aplikacija ne uporablja sledilnih ali oglaševalskih piškotkov.</p>
        </Section>

        <Section title="Upravljanje piškotkov">
          <p>Piškotke za avtentikacijo so nujni za delovanje storitve. Onemogočite jih lahko v nastavitvah brskalnika, kar pa bo preprečilo prijavo v aplikacijo.</p>
        </Section>

        <Section title="Kontakt">
          <p>Za vprašanja v zvezi s piškotki nas kontaktirajte na <a href="mailto:info@futurecode.si" className="text-blue-600 hover:underline">info@futurecode.si</a>.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}
