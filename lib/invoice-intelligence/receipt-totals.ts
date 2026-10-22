import type { NormalizedInvoice } from "./types";

const MONEY = "(\\d+[.,]\\d{2})";
const cents = (value: string) => Math.round(Number(value.replace(",", ".")) * 100);
const money = (value: number) => (value / 100).toFixed(2);

/** Only reconcile receipts with independently agreeing printed gross and VAT totals.
 * Cash tender is not revenue: subtract the printed change before determining paid.
 */
export function reconcileReceiptTotals(invoice: NormalizedInvoice, text: string) {
  if (invoice.documentType !== "receipt") return invoice;
  const lines = text.split(/\r?\n/).map(line => line.replace(/[|*]/g, " ").trim());
  const unique = (pattern: RegExp) => {
    const hits = lines.map(line => pattern.exec(line)).filter(hit => hit !== null);
    return hits.length === 1 ? hits[0] : null;
  };
  const total = unique(new RegExp(`^(?:OLT\\s+)?Skupaj\\s*\\(?z\\s+(?:vključenim\\s+)?DDV\\)?\\s*:?\\s*${MONEY}\\s*(?:EUR|€)?$`, "i"));
  const vatTotal = unique(new RegExp(`^DDV\\s+Skupaj\\s*:?\\s*${MONEY}$`, "i"));
  if (!total || !vatTotal || !lines.some(line => /DDV\s*%\s+ZNESEK\s+DDV/i.test(line))) return invoice;
  const rows = lines.map(line => new RegExp(`^DDV\\s*:\\s*(\\d+(?:[.,]\\d+)?)%\\s+${MONEY}\\s+${MONEY}$`, "i").exec(line)).filter(row => row !== null);
  if (!rows.length) return invoice;
  const gross = cents(total[1]);
  const net = rows.reduce((sum, row) => sum + cents(row[2]), 0);
  const vat = rows.reduce((sum, row) => sum + cents(row[3]), 0);
  if (net + vat !== gross || vat !== cents(vatTotal[1])) return invoice;

  const before = JSON.stringify([invoice.totals, invoice.vatBreakdown, invoice.lineItems]);
  const oldNet = invoice.totals.netAmount;
  invoice.totals.netAmount = money(net);
  invoice.totals.vatAmount = money(vat);
  invoice.totals.grossAmount = money(gross);
  invoice.vatBreakdown = rows.map(row => ({ vatRate: Number(row[1].replace(",", ".")).toFixed(2), taxableAmount: money(cents(row[2])), vatAmount: money(cents(row[3])), grossAmount: money(cents(row[2]) + cents(row[3])) }));

  const tender = unique(new RegExp(`^(?:EURO|Gotovina|Cash)\\s*:?\\s*${MONEY}$`, "i"));
  const change = unique(new RegExp(`^(?:Change|Vračilo|Vracilo|Vrnjeno)\\s*:?\\s*${MONEY}$`, "i"));
  const explicitDue = lines.some(line => /(?:za\s+pla[čc]ilo|amount\s+due)/i.test(line));
  if (!explicitDue && tender && change && cents(tender[1]) - cents(change[1]) === gross) {
    invoice.totals.amountPaid = money(gross);
    invoice.totals.amountDue = "0.00";
  } else if (!explicitDue && before !== JSON.stringify([invoice.totals, invoice.vatBreakdown, invoice.lineItems])) {
    // A corrected total alone is not proof of payment or outstanding debt.
    invoice.totals.amountDue = null;
  }

  // When gross prices were read as net, retain only individually matched printed
  // line totals. Do not manufacture per-line tax allocations from a receipt total.
  if (oldNet && cents(oldNet) === gross && net !== gross) {
    for (const item of invoice.lineItems) {
      if (!item.description || !item.netAmount) continue;
      const words = item.description.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const matches = lines.filter(line => {
        const price = new RegExp(`\\s${MONEY}$`).exec(line);
        return price && cents(price[1]) === cents(item.netAmount!) && line.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").includes(words);
      });
      if (matches.length !== 1) continue;
      item.grossAmount = money(cents(item.netAmount));
      item.netAmount = null;
      item.vatAmount = null;
      item.unitPriceNet = null;
      item.unitPriceBeforeDiscount = null;
    }
  }
  if (before !== JSON.stringify([invoice.totals, invoice.vatBreakdown, invoice.lineItems])) {
    const warning = "Receipt amounts reconciled with printed VAT-inclusive total and VAT summary; review corrected amounts and line items before approval.";
    if (!invoice.warnings.includes(warning)) invoice.warnings.push(warning);
    invoice.validationStatus = "needs_review";
  }
  return invoice;
}
