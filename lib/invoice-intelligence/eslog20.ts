import type { NormalizedInvoice } from "./types";

const NS = "urn:eslog:2.00";

export function generateEslog20Xml(invoice: NormalizedInvoice, options?: { fallbackBuyerName?: string | null }) {
  const currency = invoice.currency || "EUR";
  const invoiceNumber = invoice.invoiceNumber || `OCR-${Date.now()}`;
  const issueDate = invoice.issueDate || new Date().toISOString().slice(0, 10);
  const dueDate = invoice.dueDate || issueDate;
  const typeCode = invoice.documentType === "credit_note" ? "381" : invoice.documentType === "proforma" ? "325" : "380";
  const seller = invoice.supplier;
  const buyer = { ...invoice.buyer, name: invoice.buyer.name || options?.fallbackBuyerName || "Kupec" };
  const lines = invoice.lineItems.length ? invoice.lineItems : syntheticLine(invoice);
  const totals = {
    net: decimal(invoice.totals.netAmount || sum(lines.map((l) => l.netAmount))),
    vat: decimal(invoice.totals.vatAmount || sum(lines.map((l) => l.vatAmount))),
    gross: decimal(invoice.totals.grossAmount || sum(lines.map((l) => l.grossAmount))),
    paid: decimal(invoice.totals.amountPaid || "0"),
    due: decimal(invoice.totals.amountDue || invoice.totals.grossAmount || sum(lines.map((l) => l.grossAmount))),
    discount: decimal(invoice.totals.discountAmount || "0"),
  };

  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<Invoice xmlns="${NS}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`);
  parts.push(`<M_INVOIC Id="data">`);
  parts.push(`<S_UNH><D_0062>${x(invoiceNumber)}</D_0062><C_S009><D_0065>INVOIC</D_0065><D_0052>D</D_0052><D_0054>01B</D_0054><D_0051>UN</D_0051></C_S009></S_UNH>`);
  parts.push(`<S_BGM><C_C002><D_1001>${typeCode}</D_1001></C_C002><C_C106><D_1004>${x(invoiceNumber)}</D_1004></C_C106></S_BGM>`);
  parts.push(dtm("137", issueDate));
  if (invoice.serviceDate) parts.push(dtm("35", invoice.serviceDate));
  if (invoice.purchaseOrderNumber) parts.push(`<G_SG1><S_RFF><C_C506><D_1153>ON</D_1153><D_1154>${x(invoice.purchaseOrderNumber)}</D_1154></C_C506></S_RFF></G_SG1>`);
  parts.push(partyGroup(buyer, "BY", "BB"));
  parts.push(partyGroup(seller, "SE", "RB"));
  parts.push(`<G_SG7><S_CUX><C_C504><D_6347>2</D_6347><D_6345>${x(currency)}</D_6345></C_C504></S_CUX></G_SG7>`);
  parts.push(`<G_SG8><S_PAT><D_4279>1</D_4279></S_PAT>${dtm("13", dueDate)}<S_PAI><C_C534><D_4461>${seller.iban ? "30" : "1"}</D_4461></C_C534></S_PAI></G_SG8>`);
  if (invoice.paymentReference) parts.push(`<S_FTX><D_4451>AAB</D_4451><C_C108><D_4440>${x(invoice.paymentReference)}</D_4440></C_C108></S_FTX>`);

  lines.forEach((line, index) => parts.push(lineGroup(line, index + 1)));

  parts.push(moa("79", totals.net));
  parts.push(moa("260", totals.discount));
  parts.push(moa("259", "0.00"));
  parts.push(moa("389", totals.net));
  parts.push(moa("176", totals.vat));
  parts.push(moa("388", totals.gross));
  if (Number(totals.paid) !== 0) parts.push(moa("113", totals.paid));
  parts.push(moa("9", totals.due));

  const vatRows = invoice.vatBreakdown.length ? invoice.vatBreakdown : deriveVatRows(lines);
  vatRows.forEach((row) => parts.push(vatSummary(row.vatRate, row.vatAmount, row.taxableAmount, invoice.warnings)));

  parts.push(`</M_INVOIC></Invoice>`);
  const xml = parts.join("");
  assertEslogShape(xml);
  return xml;
}

export function assertEslogShape(xml: string) {
  const required = [
    /<Invoice[^>]*xmlns="urn:eslog:2\.00"/,
    /<M_INVOIC\b/,
    /<S_UNH>/,
    /<D_0065>INVOIC<\/D_0065>/,
    /<S_BGM>/,
    /<D_1004>[^<]+<\/D_1004>/,
    /<G_SG2>/,
    /<D_3035>SE<\/D_3035>/,
    /<D_3035>BY<\/D_3035>/,
    /<G_SG26>/,
    /<G_SG50>/,
    /<G_SG52>/,
  ];
  if (!required.every((r) => r.test(xml))) throw new Error("Generated eSLOG 2.0 is structurally incomplete");
}

function partyGroup(p: NormalizedInvoice["supplier"] | NormalizedInvoice["buyer"], qualifier: "SE" | "BY", bankQualifier: "RB" | "BB") {
  const name = p.name || (qualifier === "SE" ? "Dobavitelj" : "Kupec");
  const bits = [`<G_SG2><S_NAD><D_3035>${qualifier}</D_3035><C_C080><D_3036>${x(name).slice(0, 140)}</D_3036></C_C080>`];
  if (p.address) bits.push(`<C_C059><D_3042>${x(p.address).slice(0, 70)}</D_3042></C_C059>`);
  if (p.city) bits.push(`<D_3164>${x(p.city)}</D_3164>`);
  if (p.postalCode) bits.push(`<D_3251>${x(p.postalCode)}</D_3251>`);
  if (p.countryCode) bits.push(`<D_3207>${x(p.countryCode.toUpperCase())}</D_3207>`);
  bits.push(`</S_NAD>`);
  const iban = "iban" in p ? p.iban : null;
  const bic = "bic" in p ? p.bic : null;
  if (iban || bic) {
    bits.push(`<S_FII><D_3035>${bankQualifier}</D_3035>`);
    if (iban) bits.push(`<C_C078><D_3194>${x(iban.replace(/\s+/g, ""))}</D_3194></C_C078>`);
    if (bic) bits.push(`<C_C088><D_3433>${x(bic)}</D_3433></C_C088>`);
    bits.push(`</S_FII>`);
  }
  if (p.vatNumber) bits.push(`<G_SG3><S_RFF><C_C506><D_1153>VA</D_1153><D_1154>${x(p.vatNumber)}</D_1154></C_C506></S_RFF></G_SG3>`);
  if (p.registrationNumber) bits.push(`<G_SG3><S_RFF><C_C506><D_1153>0199</D_1153><D_1154>${x(p.registrationNumber)}</D_1154></C_C506></S_RFF></G_SG3>`);
  bits.push(`</G_SG2>`);
  return bits.join("");
}

function lineGroup(line: NormalizedInvoice["lineItems"][number], row: number) {
  const quantity = numberText(line.quantity || "1");
  const unit = unitCode(line.unit);
  const net = decimal(line.netAmount || multiply(line.quantity || "1", line.unitPriceNet || "0"));
  const vat = decimal(line.vatAmount || taxFromRate(net, line.vatRate));
  const gross = decimal(line.grossAmount || add(net, vat));
  const unitNet = decimal(line.unitPriceNet || divide(net, quantity || "1"));
  const rate = numberText(line.vatRate || "0");
  const category = vatCategory(rate, []);
  const desc = line.description || `Postavka ${row}`;
  return [
    `<G_SG26>`,
    `<S_LIN><D_1082>${row}</D_1082></S_LIN>`,
    `<S_IMD><D_7077>F</D_7077><C_C273><D_7008>${x(desc).slice(0, 70)}</D_7008></C_C273></S_IMD>`,
    `<S_QTY><C_C186><D_6063>47</D_6063><D_6060>${quantity}</D_6060><D_6411>${unit}</D_6411></C_C186></S_QTY>`,
    `<G_SG27><S_MOA><C_C516><D_5025>38</D_5025><D_5004>${gross}</D_5004></C_C516></S_MOA></G_SG27>`,
    `<G_SG27><S_MOA><C_C516><D_5025>203</D_5025><D_5004>${net}</D_5004></C_C516></S_MOA></G_SG27>`,
    `<G_SG29><S_PRI><C_C509><D_5125>AAA</D_5125><D_5118>${unitNet}</D_5118><D_5284>1</D_5284><D_6411>${unit}</D_6411></C_C509></S_PRI></G_SG29>`,
    `<G_SG29><S_PRI><C_C509><D_5125>AAB</D_5125><D_5118>${unitNet}</D_5118><D_5284>1</D_5284><D_6411>${unit}</D_6411></C_C509></S_PRI></G_SG29>`,
    `<G_SG34>${taxSegment(rate, category, vat, net)}</G_SG34>`,
    `</G_SG26>`,
  ].join("");
}

function vatSummary(rate: string | null, amount: string | null, base: string | null, warnings: string[]) {
  const r = numberText(rate || "0");
  return `<G_SG52>${taxSegment(r, vatCategory(r, warnings), decimal(amount || "0"), decimal(base || "0"))}</G_SG52>`;
}

function taxSegment(rate: string, category: string, amount: string, base: string) {
  return `<S_TAX><D_5283>7</D_5283><C_C241><D_5153>VAT</D_5153></C_C241><C_C243><D_5278>${rate}</D_5278></C_C243><D_5305>${category}</D_5305></S_TAX><S_MOA><C_C516><D_5025>124</D_5025><D_5004>${amount}</D_5004></C_C516></S_MOA><S_MOA><C_C516><D_5025>125</D_5025><D_5004>${base}</D_5004></C_C516></S_MOA>`;
}

function dtm(code: string, value: string) { return `<S_DTM><C_C507><D_2005>${code}</D_2005><D_2380>${x(value)}</D_2380></C_C507></S_DTM>`; }
function moa(code: string, value: string) { return `<G_SG50><S_MOA><C_C516><D_5025>${code}</D_5025><D_5004>${decimal(value)}</D_5004></C_C516></S_MOA></G_SG50>`; }

function syntheticLine(invoice: NormalizedInvoice): NormalizedInvoice["lineItems"] {
  const net = invoice.totals.netAmount || invoice.totals.grossAmount || "0";
  const vat = invoice.totals.vatAmount || "0";
  const gross = invoice.totals.grossAmount || add(net, vat);
  const rate = Number(net) !== 0 ? String((Number(vat) / Number(net)) * 100) : "0";
  return [{ description: "Račun", quantity: "1", unit: "C62", unitPriceNet: net, discountPercent: null, discountAmount: null, vatRate: rate, netAmount: net, vatAmount: vat, grossAmount: gross }];
}

function deriveVatRows(lines: NormalizedInvoice["lineItems"]): NormalizedInvoice["vatBreakdown"] {
  const map = new Map<string, { net: number; vat: number; gross: number }>();
  for (const l of lines) {
    const rate = numberText(l.vatRate || "0");
    const row = map.get(rate) || { net: 0, vat: 0, gross: 0 };
    row.net += Number(l.netAmount || 0); row.vat += Number(l.vatAmount || 0); row.gross += Number(l.grossAmount || 0);
    map.set(rate, row);
  }
  return [...map.entries()].map(([vatRate, v]) => ({ vatRate, taxableAmount: decimal(String(v.net)), vatAmount: decimal(String(v.vat)), grossAmount: decimal(String(v.gross)) }));
}

function vatCategory(rate: string, warnings: string[]) {
  if (warnings.some((w) => /reverse.?charge|samoobdav|obrnjena dav/i.test(w))) return "AE";
  return Number(rate) > 0 ? "S" : "Z";
}
function unitCode(unit: string | null) {
  const u = (unit || "").trim().toLowerCase();
  if (["h", "hr", "hour", "ura", "ure"].includes(u)) return "HUR";
  if (["kg", "kilogram"].includes(u)) return "KGM";
  if (["m", "meter", "metre"].includes(u)) return "MTR";
  if (["l", "liter", "litre"].includes(u)) return "LTR";
  return /^[A-Z0-9]{2,3}$/.test(unit || "") ? String(unit) : "C62";
}
function x(v: string) { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;"); }
function decimal(v: string) { const n = Number(String(v).replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n.toFixed(2) : "0.00"; }
function numberText(v: string) { const n = Number(String(v).replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : "0"; }
function add(a: string, b: string) { return String(Number(a || 0) + Number(b || 0)); }
function multiply(a: string, b: string) { return String(Number(a || 0) * Number(b || 0)); }
function divide(a: string, b: string) { const d = Number(b || 0); return d ? String(Number(a || 0) / d) : "0"; }
function taxFromRate(net: string, rate: string | null) { return String(Number(net || 0) * Number(rate || 0) / 100); }
function sum(values: Array<string | null>) { return String(values.reduce((s, v) => s + Number(v || 0), 0)); }
