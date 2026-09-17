import type { InvoiceLineItemData, NormalizedInvoice, VatBreakdownData } from "./types";

const ESLOG_NAMESPACE = "urn:eslog:2.00";

export function generateEslog20Xml(invoice: NormalizedInvoice) {
  const invoiceNumber = required(invoice.invoiceNumber, "Invoice number");
  const issueDate = required(invoice.issueDate, "Issue date");
  const currency = invoice.currency || "EUR";
  const documentTypeCode = invoice.documentType === "credit_note" ? "381" : invoice.documentType === "proforma" ? "386" : "380";
  const messageReference = invoiceNumber.slice(-14);
  const vatRows = invoice.vatBreakdown.length ? invoice.vatBreakdown : deriveVatRows(invoice);

  const references = invoice.purchaseOrderNumber
    ? `<G_SG1><S_RFF><C_C506><D_1153>ON</D_1153><D_1154>${xml(invoice.purchaseOrderNumber)}</D_1154></C_C506></S_RFF></G_SG1>`
    : "";
  const note = invoice.paymentTerms
    ? `<S_FTX><D_4451>AAI</D_4451><C_C108><D_4440>${xml(clamp(invoice.paymentTerms, 512))}</D_4440></C_C108></S_FTX>`
    : "";

  const lines = invoice.lineItems.map((line, index) => lineXml(line, index + 1)).join("");
  const vatSummary = vatRows.map(vatSummaryXml).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${ESLOG_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <M_INVOIC Id="data">
    <S_UNH><D_0062>${xml(messageReference)}</D_0062><C_S009><D_0065>INVOIC</D_0065><D_0052>D</D_0052><D_0054>01B</D_0054><D_0051>UN</D_0051></C_S009></S_UNH>
    <S_BGM><C_C002><D_1001>${documentTypeCode}</D_1001></C_C002><C_C106><D_1004>${xml(invoiceNumber)}</D_1004></C_C106></S_BGM>
    <S_DTM><C_C507><D_2005>137</D_2005><D_2380>${xml(issueDate)}</D_2380></C_C507></S_DTM>
    ${invoice.serviceDate ? `<S_DTM><C_C507><D_2005>35</D_2005><D_2380>${xml(invoice.serviceDate)}</D_2380></C_C507></S_DTM>` : ""}
    ${note}
    ${references}
    ${partyXml(invoice.buyer, "BY", false)}
    ${partyXml(invoice.supplier, "SE", true)}
    <G_SG7><S_CUX><C_C504><D_6347>2</D_6347><D_6345>${xml(currency)}</D_6345></C_C504></S_CUX></G_SG7>
    <G_SG8><S_PAT><D_4279>1</D_4279></S_PAT>${invoice.dueDate ? `<S_DTM><C_C507><D_2005>13</D_2005><D_2380>${xml(invoice.dueDate)}</D_2380></C_C507></S_DTM>` : ""}<S_PAI><C_C534><D_4461>1</D_4461></C_C534></S_PAI></G_SG8>
    ${lines}
    ${summaryAmountXml("79", invoice.totals.netAmount)}
    ${summaryAmountXml("260", invoice.totals.discountAmount || "0")}
    ${summaryAmountXml("259", "0")}
    ${summaryAmountXml("389", invoice.totals.netAmount)}
    ${summaryAmountXml("176", invoice.totals.vatAmount)}
    ${summaryAmountXml("388", invoice.totals.grossAmount)}
    ${invoice.totals.amountPaid ? summaryAmountXml("113", invoice.totals.amountPaid) : ""}
    ${summaryAmountXml("9", invoice.totals.amountDue || invoice.totals.grossAmount)}
    ${vatSummary}
  </M_INVOIC>
</Invoice>`;
}

function partyXml(party: NormalizedInvoice["supplier"] | NormalizedInvoice["buyer"], qualifier: "BY" | "SE", includeBank: boolean) {
  const vat = party.vatNumber?.replace(/^SI/i, "") || null;
  const registration = party.registrationNumber || null;
  const bank = includeBank && "iban" in party && party.iban
    ? `<S_FII><D_3035>RB</D_3035><C_C078><D_3194>${xml(party.iban)}</D_3194></C_C078>${party.bic ? `<C_C088><D_3433>${xml(party.bic)}</D_3433></C_C088>` : ""}</S_FII>`
    : "";
  const refs = [
    vat ? referenceXml("VA", vat) : "",
    registration ? referenceXml("0199", registration) : "",
  ].join("");
  return `<G_SG2><S_NAD><D_3035>${qualifier}</D_3035><C_C080><D_3036>${xml(clamp(party.name || (qualifier === "SE" ? "Neznani dobavitelj" : "Neznani kupec"), 70))}</D_3036></C_C080>${party.address ? `<C_C059><D_3042>${xml(clamp(party.address, 70))}</D_3042></C_C059>` : ""}${party.city ? `<D_3164>${xml(clamp(party.city, 35))}</D_3164>` : ""}${party.postalCode ? `<D_3251>${xml(clamp(party.postalCode, 9))}</D_3251>` : ""}${party.countryCode ? `<D_3207>${xml(party.countryCode)}</D_3207>` : ""}</S_NAD>${bank}${refs}</G_SG2>`;
}

function referenceXml(type: string, value: string) {
  return `<G_SG3><S_RFF><C_C506><D_1153>${type}</D_1153><D_1154>${xml(value)}</D_1154></C_C506></S_RFF></G_SG3>`;
}

function lineXml(line: InvoiceLineItemData, index: number) {
  const quantity = decimal(line.quantity, "1");
  const net = decimal(line.netAmount, "0");
  const tax = line.vatAmount != null ? decimal(line.vatAmount, "0") : money(number(net) * number(line.vatRate || "0") / 100);
  const gross = line.grossAmount != null ? decimal(line.grossAmount, "0") : money(number(net) + number(tax));
  const unitPrice = line.unitPriceNet != null ? decimal(line.unitPriceNet, "0") : quantity !== "0" ? money(number(net) / number(quantity)) : net;
  const rate = decimal(line.vatRate, "0");
  const category = number(rate) === 0 ? "Z" : "S";

  return `<G_SG26><S_LIN><D_1082>${index}</D_1082></S_LIN><S_IMD><D_7077>F</D_7077><C_C273><D_7008>${xml(clamp(line.description || `Postavka ${index}`, 256))}</D_7008></C_C273></S_IMD><S_QTY><C_C186><D_6063>47</D_6063><D_6060>${quantity}</D_6060><D_6411>${unitCode(line.unit)}</D_6411></C_C186></S_QTY><G_SG27><S_MOA><C_C516><D_5025>38</D_5025><D_5004>${gross}</D_5004></C_C516></S_MOA></G_SG27><G_SG27><S_MOA><C_C516><D_5025>203</D_5025><D_5004>${net}</D_5004></C_C516></S_MOA></G_SG27><G_SG29><S_PRI><C_C509><D_5125>AAA</D_5125><D_5118>${unitPrice}</D_5118><D_5284>1</D_5284><D_6411>C62</D_6411></C_C509></S_PRI></G_SG29><G_SG29><S_PRI><C_C509><D_5125>AAB</D_5125><D_5118>${unitPrice}</D_5118><D_5284>1</D_5284><D_6411>C62</D_6411></C_C509></S_PRI></G_SG29><G_SG34>${taxXml(rate, category, tax, net)}</G_SG34></G_SG26>`;
}

function vatSummaryXml(row: VatBreakdownData) {
  const rate = decimal(row.vatRate, "0");
  const taxable = decimal(row.taxableAmount, "0");
  const tax = decimal(row.vatAmount, "0");
  return `<G_SG52>${taxXml(rate, number(rate) === 0 ? "Z" : "S", tax, taxable)}</G_SG52>`;
}

function taxXml(rate: string, category: string, taxAmount: string, taxableAmount: string) {
  return `<S_TAX><D_5283>7</D_5283><C_C241><D_5153>VAT</D_5153></C_C241><C_C243><D_5278>${rate}</D_5278></C_C243><D_5305>${category}</D_5305></S_TAX><S_MOA><C_C516><D_5025>124</D_5025><D_5004>${taxAmount}</D_5004></C_C516></S_MOA><S_MOA><C_C516><D_5025>125</D_5025><D_5004>${taxableAmount}</D_5004></C_C516></S_MOA>`;
}

function summaryAmountXml(code: string, amount: string | null) {
  return `<G_SG50><S_MOA><C_C516><D_5025>${code}</D_5025><D_5004>${decimal(amount, "0")}</D_5004></C_C516></S_MOA></G_SG50>`;
}

function deriveVatRows(invoice: NormalizedInvoice): VatBreakdownData[] {
  if (!invoice.lineItems.length) return [{ vatRate: "0", taxableAmount: invoice.totals.netAmount, vatAmount: invoice.totals.vatAmount, grossAmount: invoice.totals.grossAmount }];
  const rows = new Map<string, { taxable: number; tax: number; gross: number }>();
  for (const line of invoice.lineItems) {
    const rate = decimal(line.vatRate, "0");
    const row = rows.get(rate) || { taxable: 0, tax: 0, gross: 0 };
    row.taxable += number(line.netAmount || "0");
    row.tax += number(line.vatAmount || "0");
    row.gross += number(line.grossAmount || "0");
    rows.set(rate, row);
  }
  return [...rows].map(([vatRate, row]) => ({ vatRate, taxableAmount: money(row.taxable), vatAmount: money(row.tax), grossAmount: money(row.gross) }));
}

function required(value: string | null, label: string) {
  if (!value?.trim()) throw new Error(`${label} is required for eSLOG 2.0`);
  return value.trim();
}

function decimal(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  return Number.isFinite(Number(normalized)) ? normalized : fallback;
}

function number(value: string) { return Number(value) || 0; }
function money(value: number) { return value.toFixed(2); }
function clamp(value: string, max: number) { return value.length > max ? value.slice(0, max) : value; }
function unitCode(value: string | null) { return value && /^[A-Z0-9]{1,3}$/i.test(value) ? value.toUpperCase() : "C62"; }
function xml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
