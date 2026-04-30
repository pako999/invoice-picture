export default function ZasebnostPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Politika zasebnosti</h1>
      <p className="text-gray-400 text-sm mb-10">Zadnja posodobitev: april 2026</p>

      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <Section title="1. Upravljavec podatkov">
          <p>Upravljavec osebnih podatkov je <strong>FutureCode d.o.o.</strong>, ki zagotavlja storitev SlikajRačun na naslovu racuni.futurecode.si.</p>
        </Section>

        <Section title="2. Katere podatke zbiramo">
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li><strong>Podatki računa:</strong> ime, email naslov (prek Clerk avtentikacije)</li>
            <li><strong>Nastavitve:</strong> email naslov za posredovanje računov, imena podjetij</li>
            <li><strong>Metapodatki pošiljanj:</strong> datum, status dostave, ime datoteke</li>
            <li><strong>Slike računov:</strong> se pošljejo neposredno na vaš email in niso shranjene na naših strežnikih</li>
          </ul>
        </Section>

        <Section title="3. Namen obdelave">
          <p>Podatke obdelujemo izključno za zagotavljanje storitve posredovanja računov na email vašega računovodskega programa in za prikaz zgodovine pošiljanj.</p>
        </Section>

        <Section title="4. Hramba podatkov">
          <p>Podatke hranimo dokler je vaš račun aktiven. Po prekinitvi naročnine so podatki izbrisani v 30 dneh. Metapodatki pošiljanj so shranjeni za namene arhiviranja.</p>
        </Section>

        <Section title="5. Deljenje podatkov s tretjimi stranmi">
          <p>Vaših podatkov ne prodajamo in ne delimo s tretjimi stranmi, razen:</p>
          <ul className="list-disc pl-5 flex flex-col gap-2 mt-2">
            <li><strong>Clerk:</strong> avtentikacija in upravljanje računov</li>
            <li><strong>Resend:</strong> posredovanje email sporočil</li>
            <li><strong>Neon:</strong> shranjevanje podatkov (PostgreSQL)</li>
          </ul>
        </Section>

        <Section title="6. Vaše pravice">
          <p>Imate pravico do dostopa, popravka, izbrisa in prenosa vaših osebnih podatkov. Za uveljavljanje pravic nas kontaktirajte na <a href="mailto:info@futurecode.si" className="text-blue-600 hover:underline">info@futurecode.si</a>.</p>
        </Section>

        <Section title="7. Piškotki">
          <p>Spletna stran uporablja piškotke izključno za delovanje avtentikacije. Za več informacij glejte <a href="/piskotki" className="text-blue-600 hover:underline">Politiko piškotkov</a>.</p>
        </Section>

        <Section title="8. Kontakt">
          <p>Za vprašanja v zvezi z zasebnostjo nas kontaktirajte na <a href="mailto:info@futurecode.si" className="text-blue-600 hover:underline">info@futurecode.si</a>.</p>
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
