export default function PogojiUporabe() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Pogoji uporabe</h1>
      <p className="text-gray-400 text-sm mb-10">Zadnja posodobitev: april 2026</p>

      <div className="flex flex-col gap-8 text-gray-700 leading-relaxed">
        <Section title="1. Splošno">
          <p>S prijavo in uporabo storitve SlikajRačun (racuni.futurecode.si) se strinjate s temi pogoji uporabe. Storitev zagotavlja FutureCode d.o.o.</p>
        </Section>

        <Section title="2. Opis storitve">
          <p>SlikajRačun je aplikacija za posredovanje fotografij računov na email naslov vašega računovodskega programa. Storitev ne izvaja OCR obdelave — ta poteka v vašem računovodskem programu.</p>
        </Section>

        <Section title="3. Naročnina in plačilo">
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>Storitev je na voljo v mesečni ali letni naročnini.</li>
            <li>Naročnina se samodejno obnovi ob koncu obdobja.</li>
            <li>Odpoved je možna kadarkoli — dostop ostane aktiven do konca plačanega obdobja.</li>
            <li>Povračilo ni možno za že plačana obdobja.</li>
          </ul>
        </Section>

        <Section title="4. Dovoljene uporabe">
          <p>Storitev smete uporabljati izključno za zakonite poslovne namene — posredovanje lastnih računov v vaš računovodski program. Prepovedana je vsaka zloraba, vdor v sisteme ali posredovanje vsebin, ki kršijo zakonodajo.</p>
        </Section>

        <Section title="5. Omejitev odgovornosti">
          <p>FutureCode d.o.o. ne odgovarja za morebitne napake pri OCR obdelavi v vašem računovodskem programu, za nedostopnost tretjih storitev (email, računovodski program) ali za izgubo podatkov, ki so nastale zunaj naše infrastrukture.</p>
        </Section>

        <Section title="6. Spremembe pogojev">
          <p>Pridržujemo si pravico do spremembe teh pogojev. O bistvenih spremembah vas bomo obvestili po emailu vsaj 14 dni vnaprej.</p>
        </Section>

        <Section title="7. Veljavno pravo">
          <p>Za te pogoje velja slovensko pravo. Morebitne spore rešujemo pred pristojnim sodiščem v Sloveniji.</p>
        </Section>

        <Section title="8. Kontakt">
          <p>Vprašanja v zvezi s pogoji pošljite na <a href="mailto:info@futurecode.si" className="text-blue-600 hover:underline">info@futurecode.si</a>.</p>
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
