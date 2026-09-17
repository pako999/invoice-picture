"use client";

import { useEffect } from "react";

const exact: Record<string, string> = {
  "Supplier IBAN failed MOD-97 validation": "IBAN dobavitelja ni prestal preverjanja MOD-97.",
  "Supplier VAT number format does not match country": "Oblika ID za DDV dobavitelja ne ustreza državi.",
  "Buyer VAT number format does not match country": "Oblika ID za DDV kupca ne ustreza državi.",
  "Net amount + VAT does not equal gross total": "Neto znesek + DDV se ne ujema z bruto zneskom.",
  "Line item net sum differs from invoice net total": "Vsota neto zneskov postavk se razlikuje od neto zneska računa.",
  "Line item VAT sum differs from invoice VAT total": "Vsota DDV po postavkah se razlikuje od skupnega DDV na računu.",
  "Line item gross sum differs from invoice gross total": "Vsota bruto zneskov postavk se razlikuje od bruto zneska računa.",
  "VAT breakdown taxable total differs from invoice net total": "Davčna osnova v DDV razčlenitvi se razlikuje od neto zneska računa.",
  "VAT breakdown VAT total differs from invoice VAT total": "DDV v DDV razčlenitvi se razlikuje od skupnega DDV na računu.",
  "VAT breakdown gross total differs from invoice gross total": "Bruto znesek v DDV razčlenitvi se razlikuje od bruto zneska računa.",
  "Due date is before issue date": "Rok plačila je pred datumom izdaje računa.",
  "Service date is after due date": "Datum storitve je po roku plačila.",
  "Amount due does not equal gross amount minus amount paid": "Znesek za plačilo se ne ujema z bruto zneskom minus že plačani znesek.",
  "Amount due exceeds gross amount": "Znesek za plačilo je večji od bruto zneska računa.",
  "Supplier and buyer VAT numbers are identical; parties may be reversed": "ID za DDV dobavitelja in kupca sta enaka; preveri, ali sta stranki zamenjani.",
  "Supplier and buyer names are identical; parties may be reversed": "Naziv dobavitelja in kupca je enak; preveri, ali sta stranki zamenjani.",
  "Credit note gross amount is positive; verify sign convention": "Bruto znesek dobropisa je pozitiven; preveri predznak zneska.",
};

function translateWarning(message: string) {
  const trimmed = message.trim();
  if (exact[trimmed]) return exact[trimmed];

  let match = /^Missing required accounting field:\s*(.+)$/i.exec(trimmed);
  if (match) return `Manjka obvezno računovodsko polje: ${fieldName(match[1])}.`;

  match = /^Invalid currency code:\s*(.+)$/i.exec(trimmed);
  if (match) return `Neveljavna oznaka valute: ${match[1]}.`;

  match = /^Line item (\d+) net amount does not match quantity × unit price minus discount$/i.exec(trimmed);
  if (match) return `Postavka ${match[1]}: neto znesek se ne ujema s količino × ceno na enoto minus popust.`;

  match = /^Line item (\d+) discount amount does not match discount percent$/i.exec(trimmed);
  if (match) return `Postavka ${match[1]}: znesek popusta se ne ujema z odstotkom popusta.`;

  match = /^Line item (\d+) net \+ VAT does not equal gross amount$/i.exec(trimmed);
  if (match) return `Postavka ${match[1]}: neto znesek + DDV se ne ujema z bruto zneskom.`;

  match = /^Computed net from VAT breakdown differs from extracted net total(?: by)?\s*(.*)$/i.exec(trimmed);
  if (match) return `Izračunani neto znesek iz DDV razčlenitve se razlikuje od prebranega neto zneska${match[1] ? ` za ${match[1]}` : ""}.`;

  match = /^Computed VAT from VAT breakdown differs from extracted VAT total(?: by)?\s*(.*)$/i.exec(trimmed);
  if (match) return `Izračunani DDV iz DDV razčlenitve se razlikuje od prebranega skupnega DDV${match[1] ? ` za ${match[1]}` : ""}.`;

  match = /^Computed gross from VAT breakdown differs from extracted gross total(?: by)?\s*(.*)$/i.exec(trimmed);
  if (match) return `Izračunani bruto znesek iz DDV razčlenitve se razlikuje od prebranega bruto zneska${match[1] ? ` za ${match[1]}` : ""}.`;

  match = /^Document total is within monetary tolerance(?:.*)$/i.exec(trimmed);
  if (match) return "Skupni znesek dokumenta je znotraj dovoljene tolerance zaokroževanja.";

  return trimmed;
}

function fieldName(value: string) {
  const names: Record<string, string> = {
    "supplier.name": "naziv dobavitelja",
    invoiceNumber: "številka računa",
    issueDate: "datum izdaje",
    currency: "valuta",
    "totals.netAmount": "neto znesek",
    "totals.vatAmount": "DDV",
    "totals.grossAmount": "bruto znesek",
  };
  return names[value] ?? value;
}

export function SlovenianWarningTranslator() {
  useEffect(() => {
    const translate = () => {
      document.querySelectorAll(".invoice-review-route .invoice-warning-message").forEach((node) => {
        const original = node.getAttribute("data-original-warning") || node.textContent || "";
        if (!node.getAttribute("data-original-warning")) node.setAttribute("data-original-warning", original);
        const translated = translateWarning(original);
        if (node.textContent !== translated) node.textContent = translated;
      });
    };

    translate();
    const observer = new MutationObserver(translate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
