import Image from "next/image";
import Link from "next/link";
import { HeroButtons } from "@/components/hero-buttons";

const integrations = [
  { name: "Minimax",     domain: "minimax.si",    desc: "Email uvoz + OCR",    href: "https://minimax.si" },
  { name: "Birokrat",    domain: "birokrat.si",   desc: "Email uvoz + OCR",    href: "https://birokrat.si" },
  { name: "Pantheon",    domain: "datalab.si",    desc: "eBooks OCR storitev", href: "https://datalab.si" },
  { name: "SAOP",        domain: "saop.si",       desc: "API uvoz računov",    href: "https://saop.si" },
  { name: "E-računi",    domain: "e-racuni.si",   desc: "Email + DigiBox OCR", href: "https://e-racuni.si" },
  { name: "Eurofaktura", domain: "eurofaktura.com", desc: "Email + API uvoz",  href: "https://eurofaktura.com" },
];

const steps = [
  {
    n: "01",
    title: "Enkrat nastavi email",
    desc: "V nastavitvah vnesite email naslov, ki ga da vaš računovodski program za uvoz računov. To storite samo enkrat.",
  },
  {
    n: "02",
    title: "Fotografirajte račun",
    desc: "Odprite aplikacijo in s telefonom poslikajte papirnat račun ali naložite PDF. Hitro, brez tipkanja.",
  },
  {
    n: "03",
    title: "En klik — poslano",
    desc: "Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi. OCR obdelava poteka v programu.",
  },
];

const pricingFeatures = [
  "Neomejeno fotografiranje računov",
  "Pošiljanje na kateri koli email naslov",
  "Minimax, Birokrat, Pantheon, SAOP, E-računi",
  "OCR obdelava v vašem računovodskem programu",
  "Arhiv vseh poslanih računov s predogledom",
  "Podpora za JPG, PNG, WEBP in PDF",
  "Mobilno optimizirana aplikacija",
  "Varen dostop prek Clerk avtentikacije",
];

const DISPLAY = { fontFamily: "var(--font-fraunces, Georgia, serif)" } as const;
const INK = "#0D0A06";
const PARCHMENT = "#F4EFE4";
const DARK = "#0D0A06";
const ACCENT = "#C94A1A";
const MUTED = "#8A8175";
const BORDER = "#DDD5C8";

export default function LandingPage() {
  return (
    <div style={{ color: INK }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ background: PARCHMENT }}>
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <p className="anim-1 text-xs font-bold tracking-widest uppercase mb-6" style={{ color: ACCENT }}>
              🇸🇮 Za slovensko računovodstvo
            </p>

            <h1 className="anim-2 mb-6 leading-[0.9] tracking-tight"
              style={{ ...DISPLAY, fontSize: "clamp(52px, 7.5vw, 92px)", fontWeight: 800, color: INK }}>
              Računi<br />
              <em style={{ fontStyle: "italic", color: ACCENT }}>brez</em>{" "}
              tipkanja.
            </h1>

            <p className="anim-3 text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "#6B6357" }}>
              Fotografirajte papirnat račun — aplikacija ga pošlje neposredno na OCR&nbsp;email
              vašega računovodskega programa. Brez ročnega vnosa, brez kompliciranja.
            </p>

            <div className="anim-4 inline-flex items-start gap-3 text-sm rounded-xl px-5 py-4 mb-8 max-w-md"
              style={{ background: "#FDF3E7", border: `1px solid #F0D4A8`, color: "#7A4F1A" }}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>
                <strong>Pogoj za uporabo:</strong> V vašem računovodskem programu mora biti vklopljeno
                sprejemanje računov po emailu z OCR obdelavo.
              </span>
            </div>

            <div className="anim-5">
              <HeroButtons />
            </div>
          </div>

          {/* Right: receipt card */}
          <div className="flex-shrink-0 anim-3">
            <ReceiptCard />
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────── */}
      <div style={{ background: DARK, color: PARCHMENT, borderTop: `1px solid #1F1C16`, borderBottom: `1px solid #1F1C16` }}
        className="py-3.5 overflow-hidden select-none">
        <div className="animate-ticker flex items-center gap-0">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex items-center">
              {["MINIMAX", "BIROKRAT", "PANTHEON", "SAOP", "E-RAČUNI", "EUROFAKTURA"].map((name) => (
                <span key={name} className="flex items-center gap-6 px-6 text-xs font-bold tracking-widest">
                  <span style={{ color: ACCENT }}>◆</span>
                  <span>{name}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STEPS ────────────────────────────────────────── */}
      <section style={{ background: PARCHMENT }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
            <h2 style={{ ...DISPLAY, fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, lineHeight: 1, color: INK }}>
              Kako deluje
            </h2>
            <p className="text-sm max-w-xs text-right" style={{ color: MUTED }}>
              Trije koraki do brezpapirnega računovodstva
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-12 sm:gap-8">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col gap-5">
                <div style={{ ...DISPLAY, fontSize: "80px", fontWeight: 800, lineHeight: 1, color: i === 0 ? ACCENT : BORDER }}>
                  {s.n}
                </div>
                <div style={{ width: "40px", height: "2px", background: i === 0 ? ACCENT : BORDER }} />
                <h3 className="text-lg font-bold" style={{ color: INK }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────── */}
      <section style={{ background: DARK }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-center" style={{ color: ACCENT }}>
            Integracije
          </p>
          <h2 className="text-center mb-3" style={{ ...DISPLAY, fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, color: PARCHMENT }}>
            Deluje z vašim programom
          </h2>
          <p className="text-center text-sm mb-3 max-w-lg mx-auto" style={{ color: "#6B6357" }}>
            App posreduje sliko na email vašega programa. OCR obdelavo opravi program.
          </p>
          <p className="text-center text-xs font-semibold mb-12" style={{ color: "#D4A96A" }}>
            ⚠️ V programu mora biti vklopljeno sprejemanje računov po emailu z OCR obdelavo.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((p) => (
              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
                className="integration-card group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "#1F1C16" }}>
                  <Image src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=64`}
                    alt={p.name} width={24} height={24} unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: PARCHMENT }}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6B6357" }}>{p.desc}</div>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: ACCENT }}>✓</span>
              </a>
            ))}
          </div>
          <p className="text-center text-xs mt-6" style={{ color: "#4A4640" }}>
            + kateri koli drug program, ki sprejema račune po emailu
          </p>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section style={{ background: PARCHMENT }} className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-center" style={{ color: ACCENT }}>
            Cenik
          </p>
          <h2 className="text-center mb-12" style={{ ...DISPLAY, fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, color: INK }}>
            Začnite danes
          </h2>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Monthly */}
            <div className="flex flex-col gap-6 rounded-2xl p-7"
              style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: MUTED }}>Mesečno</p>
                <div className="flex items-baseline gap-2">
                  <span style={{ ...DISPLAY, fontSize: "52px", fontWeight: 800, color: INK, lineHeight: 1 }}>9,90</span>
                  <span className="text-sm" style={{ color: MUTED }}>€ / mes</span>
                </div>
                <p className="text-xs mt-2" style={{ color: MUTED }}>Kadarkoli odpoveš.</p>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {pricingFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#4A4640" }}>
                    <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: ACCENT }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up"
                className="mt-auto text-center text-sm font-bold py-3.5 rounded-xl transition-colors"
                style={{ background: INK, color: PARCHMENT }}>
                Začni mesečno →
              </Link>
            </div>

            {/* Yearly */}
            <div className="relative flex flex-col gap-6 rounded-2xl p-7"
              style={{ background: DARK, border: `1px solid #2A2720` }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                  style={{ background: ACCENT, color: "#FFFFFF" }}>
                  ✦ PRIPOROČAMO · prihrani 20 %
                </span>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#6B6357" }}>Letno</p>
                <div className="flex items-baseline gap-2">
                  <span style={{ ...DISPLAY, fontSize: "52px", fontWeight: 800, color: PARCHMENT, lineHeight: 1 }}>7,92</span>
                  <span className="text-sm" style={{ color: "#6B6357" }}>€ / mes</span>
                </div>
                <p className="text-xs mt-2" style={{ color: "#6B6357" }}>
                  <span style={{ textDecoration: "line-through" }}>118,80 €</span>
                  {" → "}
                  <strong style={{ color: PARCHMENT }}>95,04 € / leto</strong>
                </p>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {pricingFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#8A8175" }}>
                    <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: ACCENT }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up"
                className="mt-auto text-center text-sm font-bold py-3.5 rounded-xl transition-colors"
                style={{ background: ACCENT, color: "#FFFFFF" }}>
                Začni letno — prihrani 23,76 € →
              </Link>
            </div>
          </div>

          <p className="text-center text-xs mt-8" style={{ color: MUTED }}>
            Brez skritih stroškov · Brez vezave · Odpoveš kadarkoli
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ background: ACCENT }} className="py-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8">
          <h2 style={{ ...DISPLAY, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}>
            Imate vprašanje?<br />
            <span style={{ opacity: 0.75, fontSize: "0.65em", fontStyle: "italic" }}>Pišite nam.</span>
          </h2>
          <Link href="/contact"
            className="flex-shrink-0 text-sm font-bold px-8 py-4 rounded-xl transition-all"
            style={{ background: "#FFFFFF", color: ACCENT }}>
            📨 Kontaktirajte nas →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: DARK, color: "#4A4640", borderTop: `1px solid #1F1C16` }}
        className="py-8 text-center text-xs">
        SlikajRačun · © 2026 · Created by{" "}
        <a href="https://futurecode.si" target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors"
          style={{ color: "#6B6357" }}>
          futurecode.si
        </a>
      </footer>
    </div>
  );
}

function ReceiptCard() {
  return (
    <div className="animate-float" style={{ transform: "rotate(2.5deg)", width: "280px" }}>
      <div className="bg-white px-6 py-5"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.6",
          boxShadow: "0 24px 64px rgba(13,10,6,0.18), 0 4px 16px rgba(13,10,6,0.10)",
          borderRadius: "3px",
        }}>
        {/* Perforated edge top */}
        <PerforatedEdge />
        <div className="text-center font-bold text-base pt-3 pb-1"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: "15px", color: INK }}>
          SlikajRačun
        </div>
        <Dash />
        <div className="space-y-1.5 py-1" style={{ color: "#3D3A34" }}>
          <Row label="Račun #001" value="€ 124,50" bold />
          <Row label="Datum" value="29.04.2026" />
          <Row label="Prejemnik" value="uvoz@minimax.si" accent />
        </div>
        <Dash />
        <div className="space-y-1.5 py-1">
          <Row label="✓ Fotografiran" value="15:07" green />
          <Row label="✓ Poslan" value="15:08" green />
          <Row label="✓ OCR obdelan" value="15:08" green />
        </div>
        <Dash />
        <div className="text-center pb-3" style={{ color: "#A89F94", fontSize: "11px" }}>
          Čas obdelave: 3 sekunde
        </div>
        <PerforatedEdge />
      </div>
    </div>
  );
}

function Dash() {
  return <div style={{ borderTop: "2px dashed #E0D9CC", margin: "8px 0" }} />;
}

function PerforatedEdge() {
  return (
    <div style={{
      height: "8px",
      backgroundImage: "radial-gradient(circle, #F4EFE4 4px, transparent 4px)",
      backgroundSize: "16px 8px",
      backgroundPosition: "center",
      margin: "0 -24px",
    }} />
  );
}

function Row({ label, value, bold, accent, green }: {
  label: string; value: string; bold?: boolean; accent?: boolean; green?: boolean;
}) {
  const color = green ? "#16a34a" : accent ? ACCENT : "#3D3A34";
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span style={{ color, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 700 : 400 }} className="flex-shrink-0">{value}</span>
    </div>
  );
}
