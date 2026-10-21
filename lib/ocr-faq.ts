import { PLAN_CONFIGS, formatEur } from "@/lib/plans";

export function ocrFaq(locale: "sl" | "en") {
  const basic = PLAN_CONFIGS.basic, pro = PLAN_CONFIGS.pro;
  const pairs = locale === "sl" ? [
    ["Kako deluje OCR računov?", "Naložite PDF ali fotografijo, izberete podjetje in način obdelave. Slikaj Račun prebere računovodske podatke, preveri zneske ter omogoča pregled, popravke in dostavo dokumenta oziroma strukturiranih podatkov."],
    ["Ali je skeniranje isto kot OCR?", "Skeniranje ustvari sliko ali PDF. OCR prepozna vsebino, izluščenje pa jo razporedi v polja, kot so dobavitelj, številka računa, datumi, DDV, zneski in postavke."],
    ["Kdo prebere podatke iz računa?", "Pri načinu AI OCR podatke prebere Slikaj Račun. Če izberete samo pošiljanje originala na uvozni email, lahko nadaljnjo OCR obdelavo izvede vaš računovodski program, če jo podpira."],
    ["Ali lahko skeniram račun s telefonom?", "Da. Aplikacija deluje v brskalniku na telefonu. Izberite Fotografiraj ali naložite shranjen PDF oziroma sliko in preverite, da je celoten račun dobro berljiv."],
    ["Katere datoteke so podprte?", "Podprti so PDF, JPG, PNG in WEBP ter uvoz podprtih strukturiranih XML dokumentov. Pri že uporabnih XML podatkih dodatna OCR prepoznava ni potrebna."],
    ["Ali PDF lahko vsebuje več računov?", "Da. PDF paketi predlagajo razdelitev po računih in ohranijo več strani istega računa skupaj. Negotove meje preverite ter popravite pred potrditvijo."],
    ["Kaj naredim, če OCR napačno prebere račun?", "Odprite OCR pregled, primerjajte original s polji, popravite napačne podatke in dokument potrdite. Če je original neberljiv, pripravite kakovostnejši posnetek."],
    ["Kako se šteje poraba OCR?", "Pri plačljivih paketih štejemo OCR strani, brez ločene omejitve računov. Tristranski račun porabi tri strani. Vključeni uporabniki in podjetja si delijo mesečno kvoto. Brezplačni paket ima omejitev 3 računov in 10 OCR strani mesečno."],
    ["Koliko stane OCR obdelava?", `Osnovni vključuje ${basic.ocrPagesMonthly} OCR strani za ${formatEur(basic.monthlyPrice!)} mesečno, PRO pa ${pro.ocrPagesMonthly} strani za ${formatEur(pro.monthlyPrice!)} mesečno, brez DDV. Letno plačilo znaša ${formatEur(basic.yearlyPrice!)} oziroma ${formatEur(pro.yearlyPrice!)}. Aktualni računovodski paketi so v ceniku.`],
    ["Koliko uporabnikov in podjetij vključuje paket?", `Osnovni vključuje ${basic.userLimit} uporabnika in ${basic.companyLimit} podjetje, PRO ${pro.userLimit} uporabnike in ${pro.companyLimit} podjetja. Računovodstvo PRO vključuje 5 uporabnikov, MAX 10; računovodska paketa omogočata neomejeno podjetij. Lastnik šteje med vključene uporabnike.`],
    ["Ali lahko računovodji pošljem samo original?", "Da. Plačljivi paketi omogočajo neomejeno e-poštno pošiljanje izvirnih PDF-jev in slik. OCR obdelava ima ločeno kvoto strani. Pri razdelitvi skupnega PDF-ja se lahko OCR uporabi tudi za zaznavanje mej med računi."],
    ["Kako podatke uvozim v računovodski program?", "Glede na paket in nastavitve lahko pošljete original, pripravite XML eSLOG 2.0 ali UBL 2.1 oziroma uporabite JSON API dostavo. Pred množičnim uvozom preverite podprti format prejemnika in izvedite testni uvoz."],
    ["Ali XML račun in SEPA pomenita isto?", "Ne. XML eSLOG ali UBL prenese podatke računa. SEPA XML pripravi plačilne naloge, ki jih pregledate in potrdite v svoji banki."],
    ["Kje preverim, ali je račun poslan?", "Stanje dokumenta in dostave preverite v arhivu Računi. Pri skupnem PDF-ju odprite še PDF paket: uspešno nalaganje ne pomeni, da sta razdelitev in dostava že zaključeni."],
    ["Ali lahko aplikacijo preizkusim brezplačno?", "Da. Brezplačni paket omogoča 3 račune in 10 OCR strani mesečno za enega uporabnika in eno podjetje. Za večjo kvoto in dodatne funkcije izberite ustrezen plačljivi paket."],
  ] : [
    ["How does invoice OCR work?", "Upload a PDF or photo, select the company and delivery mode. Slikaj Račun extracts invoice fields, checks calculations and lets you review, correct and deliver the original or structured data."],
    ["Is scanning the same as invoice OCR?", "Scanning creates an image or PDF. OCR recognises the content, and extraction arranges it into fields such as supplier, invoice number, dates, VAT, totals and items."],
    ["Who reads the invoice data?", "In AI OCR mode, Slikaj Račun extracts the fields. When you only forward the original to an import email, your accounting software may perform its own OCR if it supports that workflow."],
    ["Can I scan invoices with my phone?", "Yes. Use the app in your phone browser, take a photo or upload an existing PDF or image. Check that the whole invoice is readable."],
    ["Which file formats are supported?", "PDF, JPG, PNG and WEBP are supported, along with supported structured XML imports. Usable structured XML data does not need another OCR pass."],
    ["Can one PDF contain several invoices?", "Yes. PDF batches propose invoice boundaries and keep continuation pages together. Review uncertain boundaries and correct the page ranges before confirming."],
    ["What if OCR reads a field incorrectly?", "Compare the original with the extracted fields in OCR review, correct mistakes and approve the document. Prepare a clearer image if the source is unreadable."],
    ["How is OCR usage counted?", "Paid plans count OCR pages without a separate invoice-count limit. A three-page invoice uses three pages. Included users and companies share the monthly allowance. The free plan allows 3 invoices and 10 OCR pages per month."],
    ["How much does invoice OCR cost?", `Basic includes ${basic.ocrPagesMonthly} OCR pages for ${formatEur(basic.monthlyPrice!, "en")}/month; PRO includes ${pro.ocrPagesMonthly} pages for ${formatEur(pro.monthlyPrice!, "en")}/month, excluding VAT. Annual billing is ${formatEur(basic.yearlyPrice!, "en")} or ${formatEur(pro.yearlyPrice!, "en")}. See pricing for accounting plans.`],
    ["How many users and companies are included?", `Basic includes ${basic.userLimit} user and ${basic.companyLimit} company; PRO includes ${pro.userLimit} users and ${pro.companyLimit} companies. Accounting PRO includes 5 users and MAX 10, both with unlimited companies. The owner counts towards the included seats.`],
    ["Can I send only the original document?", "Yes. Paid plans include unlimited email forwarding of original PDFs and images. OCR has a separate page allowance. Splitting a combined PDF may still use OCR to identify document boundaries."],
    ["How do I import data into accounting software?", "Depending on your plan and settings, forward the original, export eSLOG 2.0 or UBL 2.1 XML, or use JSON API delivery. Check the receiving program’s supported format and test one import before processing a larger batch."],
    ["Are invoice XML and SEPA the same?", "No. eSLOG or UBL carries invoice data. SEPA XML prepares payment instructions for you to review and authorise in your bank."],
    ["Where can I check delivery?", "Check document and delivery status in Invoices. For a combined PDF, also open the PDF batch: upload completion does not mean that splitting and delivery have finished."],
    ["Can I try the application for free?", "Yes. The free plan includes 3 invoices and 10 OCR pages per month for one user and one company. Choose a paid plan for larger allowances and additional features."],
  ];
  return pairs.map(([question, answer]) => ({ question, answer }));
}
