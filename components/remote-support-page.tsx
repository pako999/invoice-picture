import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  KeyRound,
  Laptop,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  MousePointer2,
  Phone,
  Power,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type Locale = "sl" | "en";

const copy = {
  sl: {
    eyebrow: "Varna pomoč na daljavo",
    title: "Oddaljena pomoč za Slikaj Račun",
    intro:
      "Če pri nastavitvi ali uporabi potrebujete pomoč, se lahko po predhodnem dogovoru varno povežemo z vašim računalnikom prek programa RustDesk. Ves čas vidite, kaj počnemo, povezavo pa lahko kadarkoli prekinete.",
    download: "Prenesi RustDesk z uradne strani",
    official: "Odpre se uradna stran rustdesk.com",
    language: "English instructions",
    beforeTitle: "Preden začnemo",
    before: [
      "Dogovorite se za termin z našo podporo.",
      "Računalnik povežite z internetom in shranite odprto delo.",
      "Zaprite zasebne dokumente in programe, ki jih ne potrebujete za pomoč.",
    ],
    installTitle: "Namestitev programa",
    windowsTitle: "Windows",
    windowsSteps: [
      "Odprite uradno stran za prenos in prenesite datoteko za Windows 64-bit (.exe).",
      "Odprite mapo Prenosi oziroma Downloads in dvakrat kliknite preneseno datoteko.",
      "Če Windows prikaže varnostno vprašanje, preverite, da gre za RustDesk, in potrdite zagon.",
      "RustDesk lahko za enkratno pomoč samo odprete. Če izberete namestitev, sledite prikazanim korakom.",
    ],
    macTitle: "Mac",
    macSteps: [
      "Na uradni strani prenesite različico za svoj Mac (.dmg).",
      "Odprite datoteko DMG in povlecite RustDesk v mapo Applications.",
      "Odprite RustDesk in v System Settings dovolite Screen Recording ter Accessibility.",
      "Po spremembi dovoljenj bo morda treba RustDesk zapreti in ponovno odpreti.",
    ],
    connectTitle: "Kako poteka povezava",
    connectSteps: [
      {
        title: "1. Odprite RustDesk",
        text: "Počakajte, da se spodaj prikaže zeleno stanje Ready oziroma Pripravljen.",
      },
      {
        title: "2. Pošljite ID in enkratno geslo",
        text: "Podpori pošljite številko ID in One-time password. Podatke pošljite šele ob dogovorjenem terminu.",
      },
      {
        title: "3. Potrdite povezavo",
        text: "Ko se prikaže zahteva, preverite, da je povezavo začela naša podpora, nato dovolite ogled oziroma upravljanje.",
      },
      {
        title: "4. Ostanite ob računalniku",
        text: "Spremljajte delo. Povezavo lahko kadarkoli prekinete, po koncu pa RustDesk zaprite.",
      },
    ],
    screenshotTitle: "Kje najdete ID in geslo?",
    screenshotText:
      "Na levi strani okna RustDesk sta prikazana vaš ID in enkratno geslo. Na sliki sta označena s številkama 2 in 3. Polje na desni je namenjeno povezovanju z drugim računalnikom in ga za prejem pomoči ne potrebujete.",
    screenshotAlt:
      "Okno RustDesk z označenim ID-jem računalnika in enkratnim geslom na levi strani",
    needTitle: "Kaj potrebujemo od vas",
    need: [
      { label: "Ime in podjetje", text: "da vemo, komu pomagamo" },
      { label: "Telefon ali e-pošto", text: "za uskladitev termina in komunikacijo med pomočjo" },
      { label: "Kratek opis težave", text: "kaj ne deluje in kaj ste že poskusili" },
      { label: "RustDesk ID", text: "številko, ki jo vidite v programu" },
      { label: "Enkratno geslo", text: "pošljite ga šele ob začetku dogovorjene pomoči" },
      { label: "Vašo potrditev", text: "da dovoljujete ogled ali upravljanje računalnika" },
    ],
    securityTitle: "Pomembno za vašo varnost",
    security: [
      "Oddaljeni dostop dovolite samo po predhodnem dogovoru z našo podporo.",
      "Nikoli ne zahtevamo gesla za spletno banko, plačilne kartice, e-pošto ali državne portale.",
      "Med povezavo ostanite ob računalniku in spremljajte delo.",
      "Po koncu zaprite RustDesk. Brez novega gesla in vaše odobritve se ne moremo ponovno povezati.",
    ],
    helpTitle: "Pri čem vam lahko pomagamo?",
    help: [
      "nastavitev uporabniškega računa in podjetij",
      "nastavitev pošiljanja računov in ciljnega e-poštnega naslova",
      "pomoč pri nalaganju, OCR-obdelavi in pregledu računov",
      "osnovna diagnostika brskalnika, dovoljenj in povezave",
    ],
    contactTitle: "Potrebujete oddaljeno pomoč?",
    contactText:
      "Najprej kontaktirajte podporo in opišite težavo. Poslali vam bomo termin ter potrdili, kdaj lahko varno posredujete RustDesk ID in enkratno geslo.",
    contactButton: "Kontaktiraj podporo",
    mailButton: "Pošlji e-pošto",
    note: "RustDesk prenesite samo z uradne domene rustdesk.com ali uradnega GitHub repozitorija.",
  },
  en: {
    eyebrow: "Secure remote assistance",
    title: "Remote support for Slikaj Račun",
    intro:
      "If you need help with setup or use, we can connect to your computer through RustDesk after arranging a support session. You can watch everything we do and end the connection at any time.",
    download: "Download RustDesk from the official website",
    official: "Opens the official rustdesk.com website",
    language: "Slovenska navodila",
    beforeTitle: "Before we start",
    before: [
      "Arrange a support time with our team.",
      "Connect the computer to the internet and save your open work.",
      "Close private documents and applications that are not needed for support.",
    ],
    installTitle: "Install the application",
    windowsTitle: "Windows",
    windowsSteps: [
      "Open the official download page and download the 64-bit Windows file (.exe).",
      "Open your Downloads folder and double-click the downloaded file.",
      "If Windows displays a security prompt, confirm that the application is RustDesk before allowing it to run.",
      "For a one-time session, you may simply run RustDesk. If you select installation, follow the steps shown.",
    ],
    macTitle: "Mac",
    macSteps: [
      "Download the correct Mac version (.dmg) from the official page.",
      "Open the DMG file and drag RustDesk into the Applications folder.",
      "Open RustDesk and allow Screen Recording and Accessibility in System Settings.",
      "After changing permissions, you may need to close and reopen RustDesk.",
    ],
    connectTitle: "How the connection works",
    connectSteps: [
      {
        title: "1. Open RustDesk",
        text: "Wait until the green Ready status appears at the bottom of the window.",
      },
      {
        title: "2. Send the ID and one-time password",
        text: "Send support your RustDesk ID and One-time password only at the arranged support time.",
      },
      {
        title: "3. Approve the connection",
        text: "When the request appears, verify that our support team initiated it, then allow viewing or control.",
      },
      {
        title: "4. Stay at the computer",
        text: "Watch the session. You can disconnect at any time and should close RustDesk when support is finished.",
      },
    ],
    screenshotTitle: "Where can I find the ID and password?",
    screenshotText:
      "Your ID and one-time password are shown on the left side of the RustDesk window. They are marked 2 and 3 in the image. The box on the right is used to connect to another computer and is not required when receiving support.",
    screenshotAlt:
      "RustDesk window showing the computer ID and one-time password on the left",
    needTitle: "What we need from you",
    need: [
      { label: "Name and company", text: "so we know who we are helping" },
      { label: "Phone or email", text: "to arrange the session and communicate during support" },
      { label: "A short problem description", text: "what is not working and what you have already tried" },
      { label: "RustDesk ID", text: "the number displayed in the application" },
      { label: "One-time password", text: "send it only when the arranged session starts" },
      { label: "Your permission", text: "confirm that you allow screen viewing or computer control" },
    ],
    securityTitle: "Important security information",
    security: [
      "Allow remote access only after arranging it with our support team.",
      "We never ask for online banking, payment card, email or government-portal passwords.",
      "Stay at the computer and watch the work during the session.",
      "Close RustDesk when finished. We cannot reconnect without new access details and your approval.",
    ],
    helpTitle: "What can we help with?",
    help: [
      "setting up your user account and companies",
      "configuring invoice delivery and destination email addresses",
      "help with uploads, OCR processing and invoice review",
      "basic browser, permission and connection diagnostics",
    ],
    contactTitle: "Do you need remote support?",
    contactText:
      "Contact support first and describe the problem. We will arrange a time and confirm when you can safely send the RustDesk ID and one-time password.",
    contactButton: "Contact support",
    mailButton: "Send an email",
    note: "Download RustDesk only from the official rustdesk.com domain or its official GitHub repository.",
  },
} as const;

const stepIcons = [Power, KeyRound, MousePointer2, Eye];

export function RemoteSupportPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const isSl = locale === "sl";
  const contactHref = isSl ? "/contact" : "/en/contact";
  const languageHref = isSl ? "/en/remote-support" : "/oddaljena-pomoc";

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t.title,
    step: t.connectSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.text,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              {t.eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              {t.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              {t.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://rustdesk.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-blue-800"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                {t.download}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href={languageHref}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
              >
                {t.language}
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-500">{t.official}</p>
          </div>

          <figure className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/10">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 p-8 text-white">
              <div className="text-center">
                <MonitorSmartphone className="mx-auto h-24 w-24" strokeWidth={1.4} aria-hidden="true" />
                <p className="mt-5 text-2xl font-black">RustDesk</p>
                <p className="mt-2 text-blue-100">
                  {isSl ? "Vi nadzorujete povezavo" : "You control the connection"}
                </p>
              </div>
            </div>
            <figcaption className="mt-4 text-sm leading-6 text-slate-600">
              {isSl
                ? "Program omogoča začasen oddaljeni ogled in upravljanje računalnika samo z vašim dovoljenjem."
                : "The application enables temporary remote viewing and control only with your permission."}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <Clock3 className="h-7 w-7 text-blue-700" aria-hidden="true" />
            <h2 className="text-2xl font-black sm:text-3xl">{t.beforeTitle}</h2>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {t.before.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black sm:text-4xl">{t.installTitle}</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <InstallCard
            icon={<Laptop className="h-8 w-8" aria-hidden="true" />}
            title={t.windowsTitle}
            steps={t.windowsSteps}
            badge="Windows"
          />
          <InstallCard
            icon={<MonitorSmartphone className="h-8 w-8" aria-hidden="true" />}
            title={t.macTitle}
            steps={t.macSteps}
            badge="macOS"
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black sm:text-4xl">{t.connectTitle}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.connectSteps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <figure key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-black">{step.title}</h3>
                  <figcaption className="mt-3 leading-7 text-slate-600">{step.text}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
        <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <Image
            src="https://rustdesk.com/docs/en/client/images/client.png"
            alt={t.screenshotAlt}
            width={874}
            height={632}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-slate-200 p-5 text-sm leading-6 text-slate-600">
            {isSl
              ? "Uradni prikaz programa RustDesk. Za pomoč nam posredujete samo označena podatka 2 in 3."
              : "Official RustDesk interface. For support, send us only the details marked 2 and 3."}
          </figcaption>
        </figure>
        <div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <KeyRound className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl">{t.screenshotTitle}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{t.screenshotText}</p>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-7 w-7 text-blue-300" aria-hidden="true" />
              <h2 className="text-3xl font-black">{t.needTitle}</h2>
            </div>
            <dl className="mt-7 space-y-4">
              {t.need.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                  <dt className="font-bold text-white">{item.label}</dt>
                  <dd className="mt-1 leading-6 text-slate-300">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-emerald-300" aria-hidden="true" />
              <h2 className="text-3xl font-black">{t.securityTitle}</h2>
            </div>
            <ul className="mt-7 space-y-4">
              {t.security.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-white/5 p-5 leading-7 text-slate-200">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
              <TriangleAlert className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
              <p className="leading-7">{t.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black sm:text-4xl">{t.helpTitle}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {t.help.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <span className="leading-7">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-xl sm:p-12">
          <h2 className="text-3xl font-black sm:text-4xl">{t.contactTitle}</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">{t.contactText}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={contactHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-800 transition hover:bg-blue-50"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              {t.contactButton}
            </Link>
            <a
              href="mailto:info@posljiracun.si"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-blue-300/50 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              {t.mailButton}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function InstallCard({
  icon,
  title,
  steps,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  steps: readonly string[];
  badge: string;
}) {
  return (
    <figure className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          {icon}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{badge}</span>
      </div>
      <h3 className="mt-6 text-2xl font-black">{title}</h3>
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 leading-7 text-slate-600">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">{title}</figcaption>
    </figure>
  );
}
