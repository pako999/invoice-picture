export default function NavodilaPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Navodila za uporabo</h1>
      <p className="text-gray-500 mb-12 text-lg">Vse kar potrebujete za začetek in vsakodnevno uporabo aplikacije SlikajRačun.</p>

      <div className="flex flex-col gap-10">
        <Section num="1" title="Registracija in prijava">
          <p>Obiščite <strong>racuni.futurecode.si</strong> in kliknite <em>Začni skenirati</em>. Ustvarite račun z emailom ali Google računom. Prijava je varna prek Clerk avtentikacije.</p>
        </Section>

        <Section num="2" title="Nastavitev email naslova">
          <p>Po prijavi pojdite v <strong>Nastavitve</strong>. V razdelek <em>Privzeti email</em> vpišite email naslov, na katerega vaš računovodski program sprejema račune (npr. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">uvoz@minimax.si</code>). To storite samo enkrat.</p>
        </Section>

        <Section num="3" title="Dodajanje podjetij (PRO)">
          <p>Če upravljate več podjetij, v Nastavitvah dodajte vsako podjetje z imenom in pripadajočim OCR email naslovom. Pri skeniranju nato izberete, kateremu podjetju pripada račun.</p>
        </Section>

        <Section num="4" title="Fotografiranje računa">
          <p>Kliknite <strong>Skeniraj</strong> in izberite <em>Fotografiraj</em> ali <em>Izberi iz galerije</em>. Poslikajte papirnat račun — podprti formati so JPG, PNG, WEBP in PDF. Preverite, da je slika ostra in dobro osvetljena.</p>
        </Section>

        <Section num="5" title="Pošiljanje računa">
          <p>Po izbiri slike pritisnite <strong>Pošlji račun</strong>. Aplikacija sliko pošlje na nastavljeni email v sekundi. Status pošiljanja se prikaže takoj.</p>
        </Section>

        <Section num="6" title="Arhiv računov">
          <p>Vsi poslani računi so shranjeni v razdelku <strong>Računi</strong>. Za vsak račun vidite datum, status dostave in predogled slike.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
        {num}
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <div className="text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
