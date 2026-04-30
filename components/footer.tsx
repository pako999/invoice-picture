import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  produkt: [
    { label: "Kako deluje", href: "/#kako-deluje" },
    { label: "Integracije", href: "/#integracije" },
    { label: "Funkcionalnosti", href: "/#funkcionalnosti" },
    { label: "Cenik", href: "/#cenik" },
  ],
  podpora: [
    { label: "Navodila za uporabo", href: "/navodila-za-uporabo" },
    { label: "Pogosta vprašanja", href: "/pogosta-vprasanja" },
    { label: "Kontakt", href: "/contact" },
    { label: "Pomoč pri nastavitvi", href: "/pomoc-pri-nastavitvi" },
  ],
  pravno: [
    { label: "Zasebnost", href: "/zasebnost" },
    { label: "Pogoji uporabe", href: "/pogoji-uporabe" },
    { label: "Piškotki", href: "/piskotki" },
  ],
};

export function Footer() {
  return (
    <>
      {/* CTA Banner */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-600 py-20 px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Imate vprašanje ali potrebujete pomoč<br className="hidden sm:block" /> pri nastavitvi?
        </h2>
        <p className="text-blue-100 text-lg mb-8">
          Kontaktirajte nas in z veseljem vam bomo pomagali
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-bold px-8 py-3.5 rounded-2xl text-sm transition-colors shadow-lg"
        >
          📨 Kontaktirajte nas
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Logo size={32} />
                <span className="font-extrabold text-white text-lg tracking-tight">Računi</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                🇸🇮 Narejen za slovensko računovodstvo
              </p>
            </div>

            {/* Produkt */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Produkt</h4>
              <ul className="flex flex-col gap-3">
                {footerLinks.produkt.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Podpora */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Podpora</h4>
              <ul className="flex flex-col gap-3">
                {footerLinks.podpora.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pravno */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Pravno</h4>
              <ul className="flex flex-col gap-3">
                {footerLinks.pravno.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
            © 2026 Računi. Vse pravice pridržane.
          </div>
        </div>
      </footer>
    </>
  );
}
