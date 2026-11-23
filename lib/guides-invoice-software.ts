import type { OcrGuide } from "@/lib/ocr-guides";

// Guides for the broad "program za račune" searches seen in Search Console
// (Nov 2026): "program za izdajanje / izdajo / pisanje računov" and
// "program za vodenje prejetih računov". Slikaj Račun handles incoming
// invoices only, so the issuing guide is an honest buyer's guide that
// explains where incoming-invoice OCR fits, not a sales page.

const GOV_E_INVOICE_LAW = "https://www.gov.si/novice/2025-10-23-drzavni-zbor-sprejel-zakon-o-izmenjavi-elektronskih-racunov-in-drugih-elektronskih-dokumentov/";

export const invoiceSoftwareGuides: OcrGuide[] = [
  {
    post: {
      id: "invoicing-software", publishedAt: "2026-11-23", updatedAt: "2026-11-23",
      coverImage: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=70",
      slug: "program-za-izdajanje-racunov", keyword: "program za izdajanje računov, program za izdajo računov, program za pisanje računov, program za fakturiranje",
      title: "Program za izdajanje računov: kako izbrati v 2026",
      description: "Kaj mora znati program za izdajanje računov v Sloveniji: obvezni podatki, davčno potrjevanje, e-računi od 2028, brezplačne možnosti in prejeti računi.",
      readingMinutes: 8, excerpt: "Davčno potrjevanje, eSLOG e-računi, obvezni podatki in brezplačni paketi: kaj preveriti pri izbiri programa za izdajo računov in kako ga dopolniti za prejete račune.",
      coverAlt: "Program za izdajanje računov na računalniku v pisarni",
      slugEn: "invoicing-software-slovenia", keywordEn: "invoicing software Slovenia",
      titleEn: "Invoicing Software in Slovenia: How to Choose (2026)",
      descriptionEn: "What invoicing software in Slovenia must support: mandatory invoice data, fiscal verification, B2B e-invoicing from 2028, free options and incoming invoices.",
      readingMinutesEn: 7, excerptEn: "Fiscal verification, eSLOG e-invoices, mandatory invoice data and free plans: what to check when choosing invoicing software in Slovenia.",
      coverAltEn: "Invoicing software on an office computer",
    },
    sl: {
      intro: "Program za izdajanje računov (fakturirni program) pripravi ponudbe, predračune in račune za vaše kupce. V Sloveniji mora poleg lepega PDF-ja podpirati še davčno potrjevanje gotovinskih računov, od 1. januarja 2028 pa tudi izmenjavo e-računov med podjetji. V vodniku je kontrolni seznam za izbiro in razlaga, zakaj potrebujete ločeno rešitev za račune, ki jih prejmete.",
      sections: [
        { title: "Kaj mora znati dober program za izdajanje računov", paragraphs: ["Najprej preverite, ali program pokrije vse vrste računov, ki jih izdajate, in ali se poveže z računovodstvom. Spodnji seznam je minimum za slovensko podjetje ali s.p."], items: [
          "Vse obvezne podatke na računu: zaporedno številko, datum izdaje in opravljene storitve, podatke izdajatelja in kupca, ID za DDV, opis, količino, davčno osnovo, stopnjo in znesek DDV.",
          "Davčno potrjevanje računov pri FURS za plačila z gotovino in karticami, če jih sprejemate.",
          "Izdajo e-računov v formatu eSLOG 2.0 za podjetja in javni sektor.",
          "Ponudbe, predračune, dobropise in avansne račune.",
          "Pošiljanje računov po e-pošti in spremljanje plačil oziroma opominov.",
          "Izvoz ali neposredno povezavo z računovodskim programom.",
        ] },
        { title: "Davčno potrjevanje računov (davčna blagajna)", paragraphs: [
          "Račune, plačane z gotovino, plačilno kartico ali drugim gotovinskim načinom, je treba v Sloveniji davčno potrditi pri FURS. Program mora zato znati poslati račun v potrditev in na račun natisniti identifikacijsko oznako (ZOI) in enkratno identifikacijsko oznako (EOR).",
          "Če izdajate samo račune s plačilom na transakcijski račun, davčnega potrjevanja ne potrebujete, vendar mora program kljub temu podpirati vse obvezne podatke in pravilno oštevilčenje.",
        ] },
        { title: "E-računi med podjetji od 1. januarja 2028", paragraphs: [
          "Državni zbor je oktobra 2025 sprejel Zakon o izmenjavi elektronskih računov in drugih elektronskih dokumentov. Po njem bodo morala podjetja od 1. januarja 2028 med seboj izmenjevati strukturirane e-račune namesto PDF-jev. Javnemu sektorju e-račune pošiljate že danes.",
          "Pri izbiri programa zato preverite, ali zna izdati in poslati e-račun v standardu eSLOG 2.0 in prek katerega ponudnika izmenjave ga pošlje. Podrobnosti in roke spremljajte na gov.si in FURS, ker se izvedbeni predpisi še dopolnjujejo.",
        ] },
        { title: "Vrste programov za izdajanje računov", paragraphs: ["Na slovenskem trgu so pogosti spletni fakturirni programi, računovodski programi z modulom za fakturiranje in ERP sistemi. Med pogosto uporabljenimi so Minimax, Birokrat, e-računi, Pantheon, SAOP in Metakocka. Aktualne pakete in cene preverite pri ponudniku."], table: { headings: ["Vrsta", "Primerno za", "Davčno potrjevanje in e-računi", "Opomba"], rows: [
          ["Spletni fakturirni program", "s.p., mikro podjetja", "Običajno da", "Hiter začetek, plačilo po mesecih"],
          ["Računovodski program s fakturiranjem", "Podjetja z lastnim ali zunanjim računovodstvom", "Da", "Računi so takoj v knjigovodstvu"],
          ["ERP sistem", "Podjetja z zalogami, prodajo in več oddelki", "Da", "Zahtevnejša uvedba"],
          ["Predloga v Wordu ali Excelu", "Občasni računi brez gotovine", "Ne", "Ni primerno za gotovino in e-račune od 2028"],
        ] } },
        { title: "Brezplačen program za račune: na kaj paziti", paragraphs: [
          "Nekateri ponudniki imajo brezplačne ali preizkusne pakete z omejitvijo števila računov, uporabnikov ali funkcij. Preden začnete, preverite, ali brezplačni paket vključuje davčno potrjevanje, e-račune in izvoz podatkov, ter koliko stane nadgradnja, ko podjetje zraste.",
          "Predloga v Excelu je brezplačna, a ne potrdi gotovinskih računov in ne bo zadoščala za obvezne e-račune med podjetji.",
        ] },
        { title: "Izdani in prejeti računi sta dva različna procesa", paragraphs: [
          "Program za izdajanje računov skrbi za račune, ki jih pošljete kupcem. Račune, ki jih prejmete od dobaviteljev, pa je treba zajeti, prebrati, preveriti in poslati v računovodstvo. Ta del pogosto ostane ročen: fotografije v telefonu, PDF-ji v e-pošti in prepisovanje zneskov.",
          "Slikaj Račun ne izdaja računov. Namenjen je prav prejetim računom: račun fotografirate ali naložite PDF, OCR prebere dobavitelja, zneske, DDV in IBAN, vi podatke preverite, račun pa pošljete v Minimax, Birokrat, Pantheon ali drug program, ki ga že uporabljate.",
        ] },
      ],
      faq: [
        ["Kateri je najboljši program za izdajanje računov?", "Ni enega najboljšega. Za s.p. brez gotovine zadošča preprost spletni fakturirni program, podjetje z zalogami potrebuje ERP. Ključno je, da program podpira davčno potrjevanje, če ga potrebujete, in e-račune eSLOG 2.0."],
        ["Ali lahko račune pišem v Wordu ali Excelu?", "Za občasne račune s plačilom na transakcijski račun je to mogoče, če račun vsebuje vse obvezne podatke. Za gotovinske račune ne, ker jih je treba davčno potrditi, od 2028 pa bodo med podjetji obvezni e-računi."],
        ["Ali Slikaj Račun izdaja račune?", "Ne. Slikaj Račun je namenjen prejetim računom: zajemu, OCR branju, preverjanju in pošiljanju v računovodski program. Za izdajo računov uporabljate svoj fakturirni ali računovodski program."],
        ["Kaj je eSLOG 2.0?", "eSLOG 2.0 je slovenski standard za strukturirane e-račune v formatu XML, usklajen z evropskim standardom EN 16931. Ga uporabljajo javni sektor in vedno več podjetij."],
      ],
      sources: [{ label: "Gov.si: Državni zbor sprejel zakon o izmenjavi elektronskih računov", href: GOV_E_INVOICE_LAW }],
      related: [
        { label: "Program za račune: primerjava slovenskih programov", href: "/programi-za-racune" },
        { label: "Program za vodenje prejetih računov", href: "/blog/program-za-vodenje-prejetih-racunov" },
      ],
    },
    en: {
      intro: "Invoicing software creates quotes, pro-forma invoices and invoices for your customers. In Slovenia it must also handle fiscal verification of cash invoices and, from 1 January 2028, structured B2B e-invoices. This guide is a checklist for choosing one, plus why invoices you receive need a separate workflow.",
      sections: [
        { title: "What good invoicing software must do", paragraphs: ["Check that the software covers every invoice type you issue and connects to your bookkeeping. This is the minimum for a Slovenian company or sole trader."], items: [
          "All mandatory invoice data: sequential number, issue and supply dates, seller and buyer details, VAT ID, description, quantity, tax base, VAT rate and VAT amount.",
          "Fiscal verification with FURS for cash and card payments, if you accept them.",
          "Issuing eSLOG 2.0 e-invoices for businesses and the public sector.",
          "Quotes, pro-forma invoices, credit notes and advance invoices.",
          "Email delivery, payment tracking and reminders.",
          "Export or a direct connection to your accounting software.",
        ] },
        { title: "Fiscal verification of cash invoices", paragraphs: ["Invoices paid in cash, by card or by other cash-equivalent methods must be verified with the Slovenian tax authority (FURS). The software sends each invoice for verification and prints the ZOI and EOR codes on it. If you only invoice for bank transfer, fiscal verification is not required."] },
        { title: "B2B e-invoicing from 1 January 2028", paragraphs: ["In October 2025 the Slovenian parliament adopted the Act on the Exchange of Electronic Invoices and Other Electronic Documents. From 1 January 2028 businesses must exchange structured e-invoices with each other instead of PDFs. Public-sector e-invoicing is already mandatory. Check that your software can issue eSLOG 2.0 e-invoices, and follow gov.si and FURS for implementing rules."] },
        { title: "Types of invoicing software", paragraphs: ["Common options in Slovenia are online invoicing tools, accounting software with an invoicing module and ERP systems. Widely used products include Minimax, Birokrat, e-računi, Pantheon, SAOP and Metakocka. Check current plans and prices with each vendor."], table: { headings: ["Type", "Best for", "Fiscal verification and e-invoices", "Note"], rows: [
          ["Online invoicing tool", "Sole traders, micro companies", "Usually yes", "Quick start, monthly billing"],
          ["Accounting software with invoicing", "Companies with in-house or external accounting", "Yes", "Invoices land straight in the books"],
          ["ERP system", "Companies with stock, sales and departments", "Yes", "Longer rollout"],
          ["Word or Excel template", "Occasional bank-transfer invoices", "No", "Not enough for cash or 2028 e-invoicing"],
        ] } },
        { title: "Issued and received invoices are separate workflows", paragraphs: ["Invoicing software handles invoices you send. Invoices you receive from suppliers still have to be captured, read, checked and sent to accounting, which often stays manual. Slikaj Račun does not issue invoices. It handles incoming invoices: photograph or upload them, let OCR read supplier, totals, VAT and IBAN, review the result and send it to Minimax, Birokrat, Pantheon or the software you already use."] },
      ],
      faq: [
        ["What is the best invoicing software in Slovenia?", "There is no single best option. A sole trader without cash sales needs a simple online tool; a company with stock needs an ERP. Make sure it supports fiscal verification where needed and eSLOG 2.0 e-invoices."],
        ["Does Slikaj Račun issue invoices?", "No. Slikaj Račun handles incoming invoices: capture, OCR, review and delivery to accounting software."],
        ["What is eSLOG 2.0?", "eSLOG 2.0 is the Slovenian XML e-invoice standard, aligned with the European standard EN 16931."],
      ],
      sources: [{ label: "Gov.si: parliament adopts the e-invoice exchange act (Slovenian)", href: GOV_E_INVOICE_LAW }],
      related: [
        { label: "Accounting software in Slovenia", href: "/en/blog/accounting-software-slovenia-guide" },
        { label: "Incoming invoice management", href: "/en/blog/incoming-invoice-management" },
      ],
    },
  },
  {
    post: {
      id: "incoming-invoice-management", publishedAt: "2026-11-23", updatedAt: "2026-11-23",
      coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=70",
      slug: "program-za-vodenje-prejetih-racunov", keyword: "program za vodenje prejetih računov, prejeti računi, kako digitalizirati račune",
      title: "Program za vodenje prejetih računov: od pošte do knjiženja",
      description: "Kako voditi prejete račune brez prepisovanja: zajem papirnatih in PDF računov, OCR, kontrola zneskov, arhiv in pošiljanje računovodji. Vodnik po korakih.",
      readingMinutes: 7, excerpt: "Papirnati računi, PDF-ji v e-pošti in e-računi: kako jih zbrati na enem mestu, samodejno prebrati, preveriti in poslati v računovodski program.",
      coverAlt: "Prejeti računi pripravljeni za digitalni zajem",
      slugEn: "incoming-invoice-management", keywordEn: "incoming invoice management software",
      titleEn: "Incoming Invoice Management: From Inbox to Bookkeeping",
      descriptionEn: "How to manage incoming supplier invoices without retyping: capture paper and PDF invoices, read them with OCR, check totals, archive and send them to accounting.",
      readingMinutesEn: 6, excerptEn: "Collect paper, PDF and e-invoices in one place, read them automatically, check them and deliver them to your accounting software.",
      coverAltEn: "Incoming invoices prepared for digital capture",
    },
    sl: {
      intro: "Program za vodenje prejetih računov poskrbi, da vsak račun dobavitelja pride v računovodstvo hitro, pravilno in samo enkrat. Knjiženje opravi računovodski program, pred tem pa je treba račun zajeti, prebrati, preveriti in arhivirati. V tem vodniku je postopek od nabiralnika do knjiženja in kako ga avtomatizirate z OCR.",
      sections: [
        { title: "Kaj pomeni vodenje prejetih računov", paragraphs: ["Vodenje prejetih računov je zaporedje korakov, ki se ponovi pri vsakem računu dobavitelja. Večino zamude in napak povzročita prva dva koraka, ko računi čakajo v predalih, telefonih in e-poštnih nabiralnikih."], ordered: true, items: [
          "Prejem: papirnat račun, PDF v e-pošti ali e-račun eSLOG.",
          "Zajem: račun mora priti na eno mesto v digitalni obliki.",
          "Branje podatkov: dobavitelj, številka, datumi, zneski, DDV, IBAN in rok plačila.",
          "Kontrola: ali se zneski ujemajo, ali račun ni podvojen in ali je za pravo podjetje.",
          "Pošiljanje v računovodski program in knjiženje.",
          "Plačilo in arhiviranje.",
        ] },
        { title: "Ročno vodenje ali OCR: primerjava", paragraphs: ["Pri nekaj računih na mesec je ročni postopek obvladljiv. Ko jih je več deset ali vodite več podjetij, se prepisovanje hitro nabere."], table: { headings: ["Korak", "Ročno", "S Slikaj Račun"], rows: [
          ["Zajem papirnatega računa", "Skeniranje ali predaja v mapi", "Fotografija s telefonom v brskalniku"],
          ["Branje podatkov", "Prepisovanje zneskov in DDV", "OCR prebere polja in postavke"],
          ["Kontrola", "Ročno seštevanje", "Samodejna kontrola neto, DDV, bruto in IBAN"],
          ["Pošiljanje računovodji", "E-pošta s prilogami ali fizična mapa", "Uvozni email programa ali eSLOG, UBL, API"],
          ["Arhiv", "Mape in ločene datoteke", "Arhiv vseh pošiljanj na enem mestu"],
        ] } },
        { title: "Kako digitalizirati prejete račune s Slikaj Račun", paragraphs: ["Postopek deluje v brskalniku na telefonu ali računalniku, brez namestitve."], ordered: true, items: [
          "Izberite podjetje, ki mu računi pripadajo.",
          "Fotografirajte papirnat račun ali naložite PDF. Naložite lahko več računov hkrati, PDF z več računi pa razdelite na posamezne dokumente.",
          "OCR prebere dobavitelja, številko računa, datume, DDV, zneske, IBAN in postavke.",
          "Preverite rezultat. Računi z negotovimi podatki so označeni za pregled, original pa vidite ob prebranih podatkih.",
          "Pošljite račun v računovodski program: original na uvozni email (na primer Minimax, Birokrat ali Pantheon) ali potrjene podatke kot eSLOG 2.0 oziroma UBL 2.1.",
        ] },
        { title: "Evidenca prejetih računov in DDV", paragraphs: [
          "Davčni zavezanci za DDV vodijo evidenco prejetih računov, ki je podlaga za odbitek vstopnega DDV. To evidenco običajno vodi računovodski program ob knjiženju. Naloga vhodnega procesa je, da program dobi popolne in pravilne podatke: pravo davčno številko dobavitelja, datum opravljene storitve in razčlenitev DDV po stopnjah.",
          "Zato je kontrola pred pošiljanjem pomembnejša od same hitrosti. Napačno prebran znesek DDV se popravi v nekaj sekundah ob pregledu, pozneje pa šele pri usklajevanju.",
        ] },
        { title: "Arhiviranje prejetih računov", paragraphs: [
          "Račune je treba hraniti več let; za večino računov je po Zakonu o DDV rok 10 let po poteku leta, na katero se nanašajo, za nepremičnine dlje. Elektronsko hranjenje je dovoljeno, če sta zagotovljeni pristnost izvora in celovitost vsebine.",
          "Za dolžino hrambe in pravila za izvirnike se posvetujte s svojim računovodjo. Slikaj Račun hrani arhiv poslanih dokumentov, ki pa ne nadomešča hrambe v vašem računovodskem programu.",
        ] },
        { title: "Prejeti računi pri več podjetjih", paragraphs: ["Računovodski servisi in skupine podjetij potrebujejo ločeno usmerjanje: vsak račun mora priti v pravo podjetje in pravi program. Paketa PRO in Računovodstvo omogočata več podjetij v enem uporabniškem računu, vsako z lastno destinacijo in načinom dostave."] },
      ],
      faq: [
        ["Kateri program potrebujem za vodenje prejetih računov?", "Knjiženje opravite v računovodskem programu, ki ga že uporabljate. Slikaj Račun pred tem poskrbi za zajem, OCR branje, preverjanje in pošiljanje računov v ta program."],
        ["Kako najhitreje digitaliziram papirnate račune?", "Fotografirajte jih s telefonom v brskalniku ali jih skenirajte v en PDF in ga razdelite na posamezne račune. OCR nato prebere podatke, vi pa jih le preverite."],
        ["Ali moram papirnate račune hraniti tudi po digitalizaciji?", "To je odvisno od tega, ali vaš način elektronske hrambe zagotavlja pristnost in celovitost. Preden zavržete izvirnike, se posvetujte z računovodjo."],
        ["Ali je program za prejete račune brezplačen?", "Slikaj Račun ima brezplačen paket s 3 računi in 10 OCR stranmi mesečno. Plačljivi paketi se začnejo pri 16,50 € mesečno."],
      ],
      related: [
        { label: "Aplikacija za račune: slikaj in pošlji", href: "/aplikacija-za-racune" },
        { label: "Program za račune: primerjava programov", href: "/programi-za-racune" },
        { label: "Program za izdajanje računov", href: "/blog/program-za-izdajanje-racunov" },
      ],
    },
    en: {
      intro: "Incoming invoice management makes sure every supplier invoice reaches accounting quickly, correctly and only once. Your accounting software does the bookkeeping, but each invoice first has to be captured, read, checked and archived. This guide covers the process from inbox to bookkeeping and how to automate it with OCR.",
      sections: [
        { title: "What incoming invoice management involves", paragraphs: ["The same steps repeat for every supplier invoice. Most delays and errors happen in the first two, while invoices sit in drawers, phones and inboxes."], ordered: true, items: [
          "Receipt: paper invoice, PDF by email or eSLOG e-invoice.",
          "Capture: get the invoice into one digital place.",
          "Data extraction: supplier, number, dates, totals, VAT, IBAN and due date.",
          "Checks: totals add up, no duplicates, correct company.",
          "Delivery to accounting software and bookkeeping.",
          "Payment and archiving.",
        ] },
        { title: "Manual handling vs OCR", paragraphs: ["A few invoices a month are manageable by hand. With dozens of invoices or several companies, retyping adds up quickly."], table: { headings: ["Step", "Manual", "With Slikaj Račun"], rows: [
          ["Capturing paper invoices", "Scanner or a physical folder", "Phone photo in the browser"],
          ["Reading data", "Retyping totals and VAT", "OCR reads fields and line items"],
          ["Checks", "Manual sums", "Automatic net, VAT, gross and IBAN checks"],
          ["Sending to accounting", "Email attachments or folders", "Import email, eSLOG, UBL or API"],
        ] } },
        { title: "How to digitise incoming invoices with Slikaj Račun", paragraphs: ["It runs in the browser on your phone or computer, with nothing to install."], ordered: true, items: [
          "Select the company the invoices belong to.",
          "Photograph a paper invoice or upload PDFs, several at once. Split a PDF containing multiple invoices into separate documents.",
          "OCR reads supplier, invoice number, dates, VAT, totals, IBAN and line items.",
          "Review the result. Uncertain invoices are flagged, with the original shown next to the extracted data.",
          "Send to accounting: the original to the software's import email (for example Minimax, Birokrat or Pantheon) or reviewed data as eSLOG 2.0 or UBL 2.1.",
        ] },
        { title: "Archiving", paragraphs: ["Under Slovenian VAT law most invoices must be kept for 10 years after the year they relate to. Electronic storage is allowed if authenticity and integrity are ensured. Ask your accountant before discarding paper originals."] },
      ],
      faq: [
        ["What software do I need for incoming invoices?", "Bookkeeping happens in your existing accounting software. Slikaj Račun handles capture, OCR, review and delivery into it."],
        ["Is there a free plan?", "Yes: 3 invoices and 10 OCR pages per month. Paid plans start at €16.50 per month."],
      ],
      related: [
        { label: "Invoice OCR in Slovenia", href: "/en/invoice-ocr-slovenia" },
        { label: "Invoicing software in Slovenia", href: "/en/blog/invoicing-software-slovenia" },
      ],
    },
  },
];
