import Link from "next/link";
import {
  Archive,
  BookOpen,
  Braces,
  Building2,
  Camera,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  Layers3,
  Mail,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Locale = "sl" | "en";

const sl = {
  badge: "Posodobljena navodila",
  title: "Kako uporabljati Slikaj Račun",
  intro: "Od fotografije ali PDF-ja do preverjenih podatkov in dostave v računovodski sistem. Izberite preprost OCR e-mail, samodejno razdeljevanje PDF-ja, XML/ZIP ali JSON API.",
  start: "Začni skenirati",
  settings: "Odpri nastavitve",
  contents: "Vsebina navodil",
  nav: [
    ["setup", "1. Začetna nastavitev"], ["single", "2. OCR Reader"], ["bulk", "3. PDF z več računi"],
    ["review", "4. Pregled in potrditev"], ["delivery", "5. Načini dostave"], ["archive", "6. Arhiv"],
    ["limits", "7. Paketi in limiti"], ["help", "8. Težave in pomoč"],
  ],
  pathsTitle: "Tri najpogostejše poti",
  paths: [
    { icon: Mail, title: "Hitro pošiljanje originala", text: "Fotografirajte ali naložite račun. Originalni PDF ali slika se takoj pošlje na OCR e-mail računovodskega programa, AI OCR pa pripravi podatke za vaš arhiv in pregled." },
    { icon: ScanLine, title: "AI OCR Reader", text: "Aplikacija prebere dobavitelja, številko in datume računa, DDV številko, IBAN, sklic, valuto, zneske, DDV razčlenitev ter postavke." },
    { icon: Layers3, title: "En PDF, več računov", text: "Naložite skupni PDF. Sistem prepozna, ali ima posamezni račun eno ali več strani, določi meje in dokument razdeli na pravilne račune." },
  ],
  setupTitle: "1. Registracija, podjetja in ciljni sistem",
  setupIntro: "Po registraciji najprej določite, kam naj aplikacija pošilja račune.",
  setupSteps: [
    "Odprite Nastavitve.",
    "Za eno podjetje vnesite privzeti e-mail za uvoz računov.",
    "Za računovodski servis dodajte vsako podjetje posebej. Ob nalaganju boste lahko izbrali pravo podjetje.",
    "Pri podjetju kliknite ikono ⚙️ in izberite način dostave: originalni dokument, ločeni PDF-ji, XML, skupinski ZIP ali JSON API.",
    "Preverite točen uvozni e-mail v Minimaxu, Birokratu, Pantheonu, SAOP-u, E-računih ali drugem ciljnem programu.",
  ],
  setupNote: "Vsako podjetje ima lahko svoj e-mail, način dostave, XML format ali API endpoint. Dokumenti podjetij ostanejo ločeno sledljivi.",
  singleTitle: "2. Fotografiranje, nalaganje in AI OCR Reader",
  singleSteps: [
    "Odprite Skeniraj in izberite podjetje oziroma ciljnega prejemnika.",
    "Na telefonu uporabite kamero; na računalniku povlecite ali izberite JPG, JPEG, PNG, WEBP oziroma PDF.",
    "Naložite en račun ali več dokumentov naenkrat in kliknite Pošlji.",
    "Original se pri načinu OCR e-mail pošlje takoj. AI OCR obdelava se izvede v ozadju in rezultat se pojavi med Računi.",
    "Odprite račun ter primerjajte originalni dokument s prebranimi podatki.",
  ],
  photoTitle: "Za najboljši OCR rezultat",
  photoTips: ["Zajemite celoten račun brez odrezanih robov.", "Poskrbite za ostro sliko, enakomerno svetlobo in čim manj senc ali odsevov.", "Vsaka fotografija naj vsebuje samo en račun.", "Če je račun že digitalen, vedno naložite originalni PDF namesto posnetka zaslona."],
  bulkTitle: "3. PDF dokument z več računi",
  bulkIntro: "Ta funkcija je namenjena skeniranemu ali združenemu PDF-ju, v katerem je več različnih računov.",
  bulkSteps: [
    "V Nastavitvah izberite »Prepoznaj račune in pošlji ločene PDF-je«, če želite samo razdelitev brez zajema podatkov; ali izberite XML/ZIP/API za strukturirano obdelavo.",
    "Na strani Skeniraj naložite PDF. Večji dokument se prikaže tudi v razdelku PDF paketi.",
    "Sistem pregleda strani in določi, katere zaporedne strani pripadajo istemu računu. Podprti so eno- in večstranski računi.",
    "Če sistem ni prepričan, odprite paket, popravite začetno in končno stran posameznega računa ter potrdite razdelitev.",
    "Pri načinu ločeni PDF-ji se vsak račun pošlje kot samostojen PDF in v svojem e-poštnem sporočilu. Podatki računa se pri tem načinu ne zajemajo.",
  ],
  bulkWarning: "Pomembno: razdelitev PDF-ja uporablja AI samo za iskanje mej dokumentov. To ni isto kot OCR Reader, ki bere računovodske podatke.",
  reviewTitle: "4. Pregled, popravljanje in potrjevanje OCR podatkov",
  reviewSteps: [
    "Odprite Računi. V mreži vidite več računov hkrati z majhnimi predogledi in statusom.",
    "S premikom miške povečajte predogled ali kliknite račun za celoten dokument.",
    "Na strani pregleda sta original in strukturirani podatki prikazana drug ob drugem.",
    "Preverite dobavitelja in kupca, številko računa, datume, DDV številko, IBAN, sklic, zneske, DDV ter postavke.",
    "Popravite napačna polja in shranite. Račun potrdite šele, ko so podatki pravilni.",
    "Za brisanje več računov vključite izbiro, označite dokumente in uporabite skupinski izbris.",
  ],
  reviewNote: "Negotovi, nepopolni ali neskladni dokumenti dobijo status za pregled. Strukturirani XML, ZIP ali API podatki se ne pošljejo naprej, dokler račun ni potrjen.",
  deliveryTitle: "5. Načini dostave v računovodski sistem",
  delivery: [
    { icon: Mail, title: "OCR e-mail · original", text: "Takoj pošlje originalni PDF ali sliko na nastavljeni e-mail. Primerno za programe, ki imajo svoj OCR e-poštni predal." },
    { icon: Layers3, title: "Ločeni PDF-ji · brez zajema", text: "Skupni PDF razdeli po računih in vsak račun pošlje posebej. Ne bere in ne izvaža računovodskih polj." },
    { icon: FileCheck2, title: "UBL / eSLOG XML", text: "Po OCR pregledu in potrditvi ustvari strukturirani XML. Originalni eSLOG XML se lahko posreduje nespremenjen." },
    { icon: FileArchive, title: "ZIP vseh XML računov", text: "Počaka, da so vsi računi iz paketa potrjeni, nato ustvari en ZIP, v katerem je vsak račun ločena XML datoteka za skupinski uvoz." },
    { icon: Braces, title: "JSON API", text: "Na vaš HTTPS endpoint pošlje normalizirane podatke, validacijo in originalni dokument kot Base64. Namenjeno povezavi z lastnim ERP ali računovodskim sistemom." },
  ],
  archiveTitle: "6. Računi, arhiv in statusi",
  archiveItems: ["Vsi poslani in OCR-obdelani dokumenti so dostopni na strani Računi.", "Filtrirajte po statusu, podjetju ali datumu ter poiščite račun po podatkih.", "Odprite original, podatke obdelave in revizijsko sled dogodkov.", "Pri napaki preverite sporočilo in ponovno zaženite obdelavo ali dostavo.", "Trajni izbris odstrani račun, izvorno datoteko in podatke obdelave ter ga ni mogoče razveljaviti."],
  limitsTitle: "7. Paketi, poraba OCR in nadgradnja",
  limitsItems: ["V Nastavitvah je prikazana trenutna poraba OCR dokumentov in OCR strani.", "Vsaka stran, poslana v AI OCR, se všteva v mesečni limit izbranega paketa. Plačljivi paketi nimajo ločene omejitve števila računov.", "Pri plačljivih paketih ostane pošiljanje originalnih PDF-jev in slik po e-pošti neomejeno; omejitve veljajo za AI OCR.", "Ko porabite OCR limit, aplikacija jasno prikaže porabo in ponudi nadgradnjo. Paket se spremeni šele po uspešno potrjenem plačilu Stripe.", "Večja paketa vključujeta več podjetij, strukturirane izvoze in prednostno obdelavo."],
  helpTitle: "8. Najpogostejše težave",
  help: [
    ["Račun ni bil dostavljen", "Preverite ciljni e-mail, izbrano podjetje in status dostave v arhivu. Pri napaki uporabite ponovno dostavo."],
    ["OCR je prebral napačne podatke", "Odprite pregled, primerjajte original s polji, popravite vrednosti in šele nato potrdite račun."],
    ["PDF je napačno razdeljen", "V PDF paketu ročno popravite razpone strani in potrdite novo razdelitev."],
    ["Dosežen je OCR limit", "Original se lahko pri ustreznem načinu še vedno pošlje, AI OCR pa se ne izvede. Nadgradite paket ali počakajte na novo obračunsko obdobje."],
    ["Dolga obdelava ali čakalna vrsta", "Odprite PDF paket ali račun in preverite trenutno fazo. Če je na voljo, uporabite Nadaljuj ali Ponovno obdelaj."],
  ],
  privacyTitle: "Varnost podatkov",
  privacyText: "Račune pošiljajte samo na preverjene naslove in API končne točke. Pred trajnim brisanjem preverite izbor. Za občutljive dokumente uporabljajte svoj uporabniški račun in ne delite prijavnih podatkov.",
  supportTitle: "Potrebujete pomoč pri prvi nastavitvi?",
  supportText: "Lahko vam pomagamo nastaviti podjetja, uvozni e-mail, XML/ZIP ali API povezavo in skupaj preverimo prvi račun.",
  support: "Pomoč pri nastavitvi",
  remote: "Oddaljena pomoč",
  contact: "Kontakt",
};

const en = {
  ...sl,
  badge: "Updated guide",
  title: "How to use Slikaj Račun",
  intro: "From a photo or PDF to verified invoice data and delivery into your accounting system. Use simple OCR email, automatic PDF splitting, XML/ZIP or a JSON API.",
  start: "Start scanning",
  settings: "Open settings",
  contents: "Guide contents",
  nav: [["setup", "1. Initial setup"], ["single", "2. OCR Reader"], ["bulk", "3. Multi-invoice PDF"], ["review", "4. Review and approval"], ["delivery", "5. Delivery modes"], ["archive", "6. Archive"], ["limits", "7. Plans and limits"], ["help", "8. Help"]],
  pathsTitle: "Three common workflows",
  paths: [
    { icon: Mail, title: "Send the original quickly", text: "Capture or upload an invoice. The original PDF or image is sent immediately to the accounting inbox while AI OCR prepares data for your archive and review." },
    { icon: ScanLine, title: "AI OCR Reader", text: "The app reads the supplier, invoice number and dates, VAT ID, IBAN, payment reference, currency, totals, VAT breakdown and line items." },
    { icon: Layers3, title: "One PDF, many invoices", text: "Upload a combined PDF. The system detects whether each invoice has one or several pages, finds its boundaries and splits the document correctly." },
  ],
  setupTitle: "1. Registration, companies and destination",
  setupIntro: "After registration, first choose where the app should deliver invoices.",
  setupSteps: ["Open Settings.", "For one company, enter the default invoice-import email.", "Accounting firms can add each client company separately and select the right company during upload.", "Open ⚙️ for a company and choose original email, separate PDFs, XML, bulk ZIP or JSON API delivery.", "Verify the exact import email in Minimax, Birokrat, Pantheon, SAOP, E-računi or your other destination system."],
  setupNote: "Each company can have its own email, delivery mode, XML format or API endpoint. Company documents remain separately traceable.",
  singleTitle: "2. Capture, upload and AI OCR Reader",
  singleSteps: ["Open Scan and select the company or destination.", "Use the camera on mobile; on desktop select or drag JPG, JPEG, PNG, WEBP or PDF files.", "Upload one invoice or several documents and select Send.", "With OCR email mode, the original is sent immediately. AI OCR runs in the background and the result appears under Invoices.", "Open the invoice and compare the original document with the extracted fields."],
  photoTitle: "For the best OCR result",
  photoTips: ["Capture the complete invoice without cropped edges.", "Use a sharp image, even light and minimal shadows or reflections.", "Each photo should contain only one invoice.", "For a digital invoice, upload the original PDF instead of a screenshot."],
  bulkTitle: "3. A PDF containing multiple invoices",
  bulkIntro: "Use this for a scanned or combined PDF that contains several different invoices.",
  bulkSteps: ["In Settings select “Detect invoices and send separate PDFs” for splitting only, or XML/ZIP/API for structured processing.", "Upload the PDF on Scan. Larger documents also appear under PDF batches.", "The system determines which consecutive pages belong to the same invoice; one- and multi-page invoices are supported.", "If uncertain, open the batch, adjust each invoice’s first and last page, then confirm the split.", "In separate-PDF mode, every invoice is sent as its own PDF email and invoice fields are not extracted."],
  bulkWarning: "Important: PDF splitting uses AI only to find document boundaries. This differs from OCR Reader, which extracts accounting fields.",
  reviewTitle: "4. Review, correct and approve OCR data",
  reviewSteps: ["Open Invoices to see multiple documents with thumbnails and status.", "Hover for a larger preview or click to open the full document.", "The review page shows the original and structured data side by side.", "Check supplier and buyer, invoice number, dates, VAT ID, IBAN, reference, totals, VAT and line items.", "Correct any fields and save. Approve only when the data is correct.", "For bulk deletion, enable selection, choose documents and use bulk delete."],
  reviewNote: "Uncertain, incomplete or inconsistent documents are marked for review. Structured XML, ZIP or API data is not delivered until the invoice is approved.",
  deliveryTitle: "5. Delivery modes",
  delivery: [
    { icon: Mail, title: "OCR email · original", text: "Immediately sends the original PDF or image to the configured inbox." },
    { icon: Layers3, title: "Separate PDFs · no extraction", text: "Splits a combined PDF and sends each invoice separately without extracting fields." },
    { icon: FileCheck2, title: "UBL / eSLOG XML", text: "Creates structured XML after OCR review and approval. Original eSLOG XML can be forwarded unchanged." },
    { icon: FileArchive, title: "ZIP of all XML invoices", text: "Waits until all invoices are approved, then creates one ZIP with a separate XML file for each invoice." },
    { icon: Braces, title: "JSON API", text: "POSTs normalized fields, validation and the original document as Base64 to your HTTPS endpoint." },
  ],
  archiveTitle: "6. Invoices, archive and statuses",
  archiveItems: ["All sent and OCR-processed documents are available under Invoices.", "Filter by status, company or date and search by invoice data.", "Open the original, processing data and event audit trail.", "When processing fails, review the message and retry processing or delivery.", "Permanent deletion removes the invoice, source file and processing data and cannot be undone."],
  limitsTitle: "7. Plans, OCR usage and upgrades",
  limitsItems: ["Settings shows current OCR document and page usage.", "Every page processed by AI OCR counts towards the selected plan’s monthly limit. Paid plans have no separate invoice limit.", "Paid plans keep original PDF/image email delivery unlimited; limits apply to AI OCR.", "At the limit, the app shows usage and offers an upgrade. The plan changes only after Stripe confirms successful payment.", "Larger plans include more companies, structured exports and priority processing."],
  helpTitle: "8. Common issues",
  help: [["Invoice not delivered", "Check the destination email, selected company and archive delivery status. Retry delivery after an error."], ["Incorrect OCR data", "Open review, compare the original with the fields, correct values and then approve."], ["PDF split incorrectly", "Open the PDF batch, edit page ranges and confirm the corrected split."], ["OCR limit reached", "The original can still be sent in the applicable mode, but AI OCR is skipped. Upgrade or wait for the next billing period."], ["Processing is taking longer", "Open the batch or invoice to check its current stage. Use Resume or Reprocess when available."]],
  privacyTitle: "Data security",
  privacyText: "Send invoices only to verified addresses and API endpoints. Check selections before permanent deletion and never share account credentials.",
  supportTitle: "Need help with your first setup?",
  supportText: "We can help configure companies, the import email, XML/ZIP or API delivery and verify your first invoice.",
  support: "Setup help",
  remote: "Remote support",
  contact: "Contact",
};

function Steps({ items }: { items: string[] }) {
  return <ol className="space-y-3">{items.map((item, index) => <li key={item} className="flex gap-3 text-slate-700"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">{index + 1}</span><span className="pt-0.5 leading-relaxed">{item}</span></li>)}</ol>;
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="space-y-3">{items.map(item => <li key={item} className="flex gap-3 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"/><span className="leading-relaxed">{item}</span></li>)}</ul>;
}

export function UserGuideContent({ locale }: { locale: Locale }) {
  const t = locale === "en" ? en : sl;
  const prefix = locale === "en" ? "/en" : "";
  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-4xl text-center">
        <Badge className="mb-5 border-0 bg-blue-100 text-blue-700 hover:bg-blue-100"><Sparkles className="mr-1.5 h-3.5 w-3.5"/>{t.badge}</Badge>
        <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">{t.title}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">{t.intro}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`${prefix}/scan`} className="rounded-xl bg-blue-600 px-6 py-3 font-extrabold text-white shadow-lg hover:bg-blue-700">{t.start} →</Link>
          <Link href={`${prefix}/settings`} className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-800 hover:bg-slate-50">{t.settings}</Link>
        </div>
      </header>

      <nav className="mt-12 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm" aria-label={t.contents}>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-blue-600">{t.contents}</p>
        <div className="flex flex-wrap gap-2">{t.nav.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-blue-100 hover:text-blue-700">{label}</a>)}</div>
      </nav>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-black text-slate-950">{t.pathsTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">{t.paths.map(({icon: Icon,title,text}) => <Card key={title} className="border-slate-200 shadow-sm"><CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100"><Icon className="h-6 w-6 text-blue-700"/></div><CardTitle className="pt-2 text-xl">{title}</CardTitle></CardHeader><CardContent><p className="leading-relaxed text-slate-600">{text}</p></CardContent></Card>)}</div>
      </section>

      <div className="mt-10 space-y-7">
        <Card id="setup" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><Settings className="h-7 w-7 text-blue-600"/><CardTitle className="text-2xl">{t.setupTitle}</CardTitle></div></CardHeader><CardContent><p className="mb-5 text-slate-600">{t.setupIntro}</p><Steps items={t.setupSteps}/><div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-relaxed text-blue-950"><Building2 className="mr-2 inline h-5 w-5"/>{t.setupNote}</div></CardContent></Card>

        <Card id="single" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><Camera className="h-7 w-7 text-emerald-600"/><CardTitle className="text-2xl">{t.singleTitle}</CardTitle></div></CardHeader><CardContent><Steps items={t.singleSteps}/><div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="mb-3 font-black text-emerald-950">{t.photoTitle}</h3><Bullets items={t.photoTips}/></div></CardContent></Card>

        <Card id="bulk" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><Layers3 className="h-7 w-7 text-violet-600"/><CardTitle className="text-2xl">{t.bulkTitle}</CardTitle></div></CardHeader><CardContent><p className="mb-5 text-slate-600">{t.bulkIntro}</p><Steps items={t.bulkSteps}/><div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-relaxed text-amber-950"><TriangleAlert className="h-5 w-5 shrink-0"/><span>{t.bulkWarning}</span></div><Link href={`${prefix}/bulk-invoices`} className="mt-5 inline-flex font-bold text-blue-700 hover:underline">{locale === "en" ? "Open PDF batches" : "Odpri PDF pakete"} →</Link></CardContent></Card>

        <Card id="review" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><FileCheck2 className="h-7 w-7 text-orange-600"/><CardTitle className="text-2xl">{t.reviewTitle}</CardTitle></div></CardHeader><CardContent><Steps items={t.reviewSteps}/><div className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm font-semibold leading-relaxed text-orange-950">{t.reviewNote}</div><Link href={`${prefix}/invoices`} className="mt-5 inline-flex font-bold text-blue-700 hover:underline">{locale === "en" ? "Open invoices" : "Odpri račune"} →</Link></CardContent></Card>

        <Card id="delivery" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><Braces className="h-7 w-7 text-indigo-600"/><CardTitle className="text-2xl">{t.deliveryTitle}</CardTitle></div></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2">{t.delivery.map(({icon: Icon,title,text}) => <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><Icon className="h-6 w-6 text-blue-700"/><h3 className="mt-3 font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p></div>)}</div></CardContent></Card>

        <Card id="archive" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><Archive className="h-7 w-7 text-sky-600"/><CardTitle className="text-2xl">{t.archiveTitle}</CardTitle></div></CardHeader><CardContent><Bullets items={t.archiveItems}/></CardContent></Card>

        <Card id="limits" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-emerald-600"/><CardTitle className="text-2xl">{t.limitsTitle}</CardTitle></div></CardHeader><CardContent><Bullets items={t.limitsItems}/><Link href={locale === "en" ? "/en/pricing" : "/cenik"} className="mt-5 inline-flex font-bold text-blue-700 hover:underline">{locale === "en" ? "View plans and pricing" : "Poglej pakete in cenik"} →</Link></CardContent></Card>

        <Card id="help" className="scroll-mt-28"><CardHeader><div className="flex items-center gap-3"><BookOpen className="h-7 w-7 text-teal-600"/><CardTitle className="text-2xl">{t.helpTitle}</CardTitle></div></CardHeader><CardContent><div className="divide-y divide-slate-200">{t.help.map(([title,text]) => <div key={title} className="py-4 first:pt-0 last:pb-0"><h3 className="font-black text-slate-950">{title}</h3><p className="mt-1 leading-relaxed text-slate-600">{text}</p></div>)}</div></CardContent></Card>

        <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-blue-400"/><div><h2 className="text-xl font-black">{t.privacyTitle}</h2><p className="mt-2 leading-relaxed text-slate-300">{t.privacyText}</p></div></div></div>

        <section className="rounded-3xl bg-blue-600 p-7 text-center text-white sm:p-10"><h2 className="text-2xl font-black sm:text-3xl">{t.supportTitle}</h2><p className="mx-auto mt-3 max-w-2xl text-blue-100">{t.supportText}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`${prefix}/${locale === "en" ? "setup-help" : "pomoc-pri-nastavitvi"}`} className="rounded-xl bg-white px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50">{t.support}</Link><Link href={`${prefix}/${locale === "en" ? "remote-support" : "oddaljena-pomoc"}`} className="rounded-xl border border-blue-300 px-5 py-3 font-extrabold text-white hover:bg-blue-700">{t.remote}</Link><Link href={`${prefix}/contact`} className="rounded-xl border border-blue-300 px-5 py-3 font-extrabold text-white hover:bg-blue-700">{t.contact}</Link></div></section>
      </div>
    </div>
  </main>;
}
