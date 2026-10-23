const sl: Record<string, string> = {
  "Supplier IBAN failed MOD-97 validation": "IBAN dobavitelja ni veljaven (napačna kontrolna številka).",
  "Supplier VAT number format does not match country": "Oblika ID za DDV dobavitelja ne ustreza izbrani državi.",
  "Buyer VAT number format does not match country": "Oblika ID za DDV kupca ne ustreza izbrani državi.",
  "Net amount + VAT does not equal gross total": "Neto znesek in DDV se ne seštejeta v bruto znesek.",
  "Amount due does not equal gross amount minus amount paid": "Znesek za plačilo se ne ujema z razliko med bruto in že plačanim zneskom.",
  "Amount due exceeds gross amount": "Znesek za plačilo presega bruto znesek računa.",
  "Line item net sum differs from invoice net total": "Vsota neto zneskov postavk se ne ujema z neto zneskom računa.",
  "Line item VAT sum differs from invoice VAT total": "Vsota DDV postavk se ne ujema z DDV računa.",
  "Line item gross sum differs from invoice gross total": "Vsota bruto zneskov postavk se ne ujema z bruto zneskom računa.",
  "VAT breakdown taxable total differs from invoice net total": "Vsota davčnih osnov se ne ujema z neto zneskom računa.",
  "VAT breakdown VAT total differs from invoice VAT total": "Vsota DDV po stopnjah se ne ujema z DDV računa.",
  "VAT breakdown gross total differs from invoice gross total": "Bruto vsota davčnega povzetka se ne ujema z bruto zneskom računa.",
  "Due date is before issue date": "Rok plačila je pred datumom izdaje.",
  "Service date is after due date": "Datum storitve je po roku plačila.",
  "Supplier and buyer VAT numbers are identical; parties may be reversed": "Dobavitelj in kupec imata enak ID za DDV. Preverite podatke obeh strank.",
  "Supplier and buyer names are identical; parties may be reversed": "Naziva dobavitelja in kupca sta enaka. Preverite podatke obeh strank.",
  "Credit note gross amount is positive; verify sign convention": "Bruto znesek dobropisa je pozitiven. Preverite predznak zneskov.",
  "Document is marked as draft; manual review is required before delivery": "Dokument je označen kot osnutek. Pred pošiljanjem ga preglejte.",
  "Quotation/proforma document requires manual review before delivery.": "Ponudbo oziroma predračun je treba pred pošiljanjem pregledati.",
  "Receipt amounts reconciled with printed VAT-inclusive total and VAT summary; review corrected amounts and line items before approval.": "Zneski so popravljeni glede na natisnjeni seštevek z DDV in davčni povzetek. Pred potrditvijo preglejte popravljene zneske in postavke.",
  "VAT-inclusive receipt line amounts reconciled with printed prices and VAT summary; net prices and VAT derived only when rounded line totals agree exactly. Review before approval.": "Cene postavk že vključujejo DDV. Neto zneski in DDV so izračunani samo ob točnem ujemanju z davčnim povzetkom. Pred potrditvijo preglejte postavke.",
};
const fields: Record<string, string> = { "supplier.name": "naziv dobavitelja", invoiceNumber: "številka računa", issueDate: "datum izdaje", currency: "valuta", "totals.netAmount": "neto znesek", "totals.vatAmount": "DDV", "totals.grossAmount": "bruto znesek" };
const lineIssues: Record<string, string> = {
  "description is missing": "manjka opis",
  "net amount does not match quantity × pre-discount price minus discount": "neto znesek se ne ujema s količino, ceno in popustom",
  "net unit price does not match the stated discount": "neto cena na enoto se ne ujema s popustom",
  "discount amount does not match discount percent": "znesek popusta se ne ujema z odstotkom popusta",
  "net amount does not match quantity × net unit price": "neto znesek se ne ujema s količino in neto ceno na enoto",
  "net + VAT does not equal gross amount": "neto znesek in DDV se ne seštejeta v bruto znesek",
};

/** Keep stored diagnostics intact; localize only the presentation. */
export function invoiceIssueLabel(message: string, locale: "sl" | "en") {
  if (locale === "en") return { text: message, original: null };
  if (sl[message]) return { text: sl[message], original: null };
  if (/^This is a receipt; manual review (?:is )?recommended before processing(?: as an accounting document)?\.?$/i.test(message)) return { text: "To je blagajniški račun. Pred obdelavo je priporočen ročni pregled.", original: null };
  if (/^Line-item VAT rates and amounts may not be fully consistent with totals due to rounding differences\.?$/i.test(message)) return { text: "Stopnje in zneski DDV pri postavkah se lahko zaradi zaokroževanja razlikujejo od skupnih zneskov.", original: null };
  const missing = /^Missing required accounting field: (.+)$/.exec(message);
  if (missing && fields[missing[1]]) return { text: `Manjka obvezni podatek: ${fields[missing[1]]}.`, original: null };
  const currency = /^Invalid currency code: (.+)$/.exec(message);
  if (currency) return { text: `Neveljavna oznaka valute: ${currency[1]}.`, original: null };
  const line = /^Line item (\d+) (.+)$/.exec(message);
  if (line && lineIssues[line[2]]) return { text: `Postavka ${line[1]}: ${lineIssues[line[2]]}.`, original: null };
  // OCR warnings are free text: never invent a translation or discard the detail.
  return { text: "Dodatno opozorilo pri obdelavi računa. Preverite izvirno sporočilo in podatke računa.", original: message };
}
