import type { NormalizedInvoice } from "./types";

const cents = (value: string | null) => value == null ? null : Math.round(Number(value.replace(",", ".")) * 100);
const money = (value: number) => (value / 100).toFixed(2);
const decimal = (value: string | null) => value == null ? NaN : Number(value.replace(",", "."));
const compact = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const sum = (values: Array<number | null>) => values.every(value => value != null && Number.isSafeInteger(value))
  ? values.reduce<number>((total, value) => total + value!, 0) : null;

export const RECEIPT_LINE_WARNING = "VAT-inclusive receipt line amounts reconciled with printed prices and VAT summary; net prices and VAT derived only when rounded line totals agree exactly. Review before approval.";

/** Correct gross-as-net only with independent printed evidence for EVERY line.
 * Single-rate, undiscounted receipts can be converted if cent rounding reproduces
 * the printed VAT summary exactly. Never distribute a rounding residual.
 */
export function reconcileVatInclusiveReceiptLines(invoice: NormalizedInvoice, text: string) {
  if (invoice.documentType !== "receipt" || !invoice.lineItems.length || invoice.vatBreakdown.length !== 1) return invoice;
  if (decimal(invoice.totals.discountAmount ?? "0") !== 0) return invoice;
  const plain = text.replace(/<\/tr\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/[|*]/g, " ");
  if (!/(?:vsota\s+vsebuje\s+DDV|z\s+(?:vključenim\s+)?DDV|DDV\s+vključen|incl(?:uding)?\.?\s+(?:VAT|tax)|tax\s+inclusive)/i.test(plain)) return invoice;
  const row = invoice.vatBreakdown[0];
  const gross = cents(invoice.totals.grossAmount);
  const net = cents(invoice.totals.netAmount);
  const vat = cents(invoice.totals.vatAmount);
  const rate = decimal(row.vatRate);
  if (gross == null || net == null || vat == null || gross <= 0 || net + vat !== gross || !Number.isFinite(rate) || rate <= 0
    || cents(row.taxableAmount) !== net || cents(row.vatAmount) !== vat || cents(row.grossAmount) !== gross) return invoice;
  // Require the extracted summary amounts and its rate to exist in the OCR text.
  const printedAmounts = [...plain.matchAll(/(?<![\d.,])(-?\d+[.,]\d{2})(?![\d.,])/g)].map(hit => cents(hit[1]));
  if (![net, vat, gross].every(value => printedAmounts.includes(value))
    || ![...plain.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].some(hit => Number(hit[1].replace(",", ".")) === rate)) return invoice;

  const mistakenNet = sum(invoice.lineItems.map(item => cents(item.netAmount))) === gross;
  const grossOnly = invoice.lineItems.every(item => item.netAmount == null && item.vatAmount == null)
    && sum(invoice.lineItems.map(item => cents(item.grossAmount))) === gross;
  if (!mistakenNet && !grossOnly) return invoice;
  if (invoice.lineItems.some(item => decimal(item.vatRate) !== rate || !Number.isFinite(decimal(item.quantity)) || !(decimal(item.quantity) > 0)
    || decimal(item.discountPercent ?? "0") !== 0 || decimal(item.discountAmount ?? "0") !== 0)) return invoice;

  const lines = plain.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const positions = invoice.lineItems.map(item => {
    const description = compact(item.description || "");
    const matches = lines.flatMap((line, index) => description.length >= 4 && compact(line).includes(description) ? [index] : []);
    return matches.length === 1 ? matches[0] : -1;
  });
  if (positions.includes(-1) || new Set(positions).size !== positions.length) return invoice;
  const printedGross = invoice.lineItems.map(item => cents(mistakenNet ? item.netAmount : item.grossAmount)!);
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const nextItem = Math.min(...positions.filter(position => position > start), lines.length);
    const nearby = lines.slice(start, Math.min(start + 4, nextItem));
    // Do not borrow a summary/payment amount when a line's own price is absent.
    const summary = nearby.findIndex(line => /(?:končna\s+vsota|skupaj|\btotal\b|\bVISA\b|\bMastercard\b)/i.test(line));
    const evidence = (summary < 0 ? nearby : nearby.slice(0, summary)).join(" ");
    if (![...evidence.matchAll(/(?<![\d.,])(-?\d+[.,]\d{2})(?![\d.,])/g)].some(hit => cents(hit[1]) === printedGross[i])) return invoice;
  }

  const derivedNet = printedGross.map(amount => Math.round(amount / (1 + rate / 100)));
  const canDerive = sum(derivedNet) === net && sum(printedGross.map((amount, index) => amount - derivedNet[index])) === vat;
  invoice.lineItems.forEach((item, index) => {
    item.grossAmount = money(printedGross[index]);
    item.netAmount = canDerive ? money(derivedNet[index]) : null;
    item.vatAmount = canDerive ? money(printedGross[index] - derivedNet[index]) : null;
    item.unitPriceNet = canDerive ? (derivedNet[index] / 100 / decimal(item.quantity)).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : null;
    item.unitPriceBeforeDiscount = null;
  });
  if (!invoice.warnings.includes(RECEIPT_LINE_WARNING)) invoice.warnings.push(RECEIPT_LINE_WARNING);
  invoice.validationStatus = "needs_review";
  return invoice;
}

export class InvoiceLineAmountsError extends Error {}

/** An explicit approval must not turn a recognizable double-VAT result into an
 * accounting export, nor turn an unknown net amount into a fabricated zero.
 */
export function assertReceiptLineAmountsForExport(invoice: NormalizedInvoice) {
  if (invoice.documentType !== "receipt" || !invoice.lineItems.length) return;
  const net = cents(invoice.totals.netAmount);
  const gross = cents(invoice.totals.grossAmount);
  if ((decimal(invoice.totals.discountAmount ?? "0") === 0 && net != null && gross != null && net !== gross && sum(invoice.lineItems.map(item => cents(item.netAmount))) === gross)
    || invoice.lineItems.some(item => item.grossAmount != null && item.netAmount == null)) {
    throw new InvoiceLineAmountsError("Cene postavk vključujejo DDV, neto zneski pa niso usklajeni. Preverite postavke računa pred izvozom.");
  }
}
