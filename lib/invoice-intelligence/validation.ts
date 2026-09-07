import type { NormalizedInvoice, ValidationResult } from "./types";

const DEFAULT_TOLERANCE = process.env.INVOICE_MONETARY_TOLERANCE ?? "0.02";

function normalizeDecimal(value: string | null | undefined): string | null {
  if (value == null) return null;
  let v = value.trim().replace(/\s/g, "");
  if (!v) return null;
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(,\d{3})+\.\d+$/.test(v)) v = v.replace(/,/g, "");
  else if (v.includes(",") && !v.includes(".")) v = v.replace(",", ".");
  v = v.replace(/[^0-9.\-]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(v)) return null;
  return v;
}

function toScaled(value: string | null | undefined, scale = 6): bigint | null {
  const normalized = normalizeDecimal(value);
  if (!normalized) return null;
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const padded = (fraction + "0".repeat(scale)).slice(0, scale);
  const result = BigInt(whole || "0") * 10n ** BigInt(scale) + BigInt(padded || "0");
  return negative ? -result : result;
}

function diff(a: string | null | undefined, b: string | null | undefined): bigint | null {
  const aa = toScaled(a);
  const bb = toScaled(b);
  return aa == null || bb == null ? null : aa - bb;
}

function abs(v: bigint) { return v < 0n ? -v : v; }

function withinTolerance(delta: bigint | null, tolerance = DEFAULT_TOLERANCE) {
  if (delta == null) return true;
  const tol = toScaled(tolerance) ?? 20000n;
  return abs(delta) <= abs(tol);
}

function scaledToString(v: bigint | null, scale = 6) {
  if (v == null) return "n/a";
  const sign = v < 0n ? "-" : "";
  const n = abs(v);
  const divisor = 10n ** BigInt(scale);
  const whole = n / divisor;
  const frac = (n % divisor).toString().padStart(scale, "0").replace(/0+$/, "");
  return `${sign}${whole}${frac ? `.${frac}` : ""}`;
}

export function normalizeInvoiceValues(invoice: NormalizedInvoice): NormalizedInvoice {
  const moneyKeys = ["netAmount", "discountAmount", "vatAmount", "grossAmount", "amountPaid", "amountDue"] as const;
  for (const key of moneyKeys) invoice.totals[key] = normalizeDecimal(invoice.totals[key]);
  for (const item of invoice.lineItems) {
    item.quantity = normalizeDecimal(item.quantity);
    item.unitPriceNet = normalizeDecimal(item.unitPriceNet);
    item.discountPercent = normalizeDecimal(item.discountPercent);
    item.discountAmount = normalizeDecimal(item.discountAmount);
    item.vatRate = normalizeDecimal(item.vatRate);
    item.netAmount = normalizeDecimal(item.netAmount);
    item.vatAmount = normalizeDecimal(item.vatAmount);
    item.grossAmount = normalizeDecimal(item.grossAmount);
  }
  for (const row of invoice.vatBreakdown) {
    row.vatRate = normalizeDecimal(row.vatRate);
    row.taxableAmount = normalizeDecimal(row.taxableAmount);
    row.vatAmount = normalizeDecimal(row.vatAmount);
    row.grossAmount = normalizeDecimal(row.grossAmount);
  }
  invoice.currency = invoice.currency?.trim().toUpperCase() || null;
  invoice.supplier.countryCode = invoice.supplier.countryCode?.trim().toUpperCase() || null;
  invoice.buyer.countryCode = invoice.buyer.countryCode?.trim().toUpperCase() || null;
  invoice.supplier.vatNumber = normalizeVat(invoice.supplier.vatNumber);
  invoice.buyer.vatNumber = normalizeVat(invoice.buyer.vatNumber);
  invoice.supplier.iban = invoice.supplier.iban?.replace(/\s/g, "").toUpperCase() || null;
  invoice.issueDate = normalizeDate(invoice.issueDate);
  invoice.serviceDate = normalizeDate(invoice.serviceDate);
  invoice.dueDate = normalizeDate(invoice.dueDate);
  return invoice;
}

function normalizeVat(value: string | null) {
  return value?.replace(/[\s.\-]/g, "").toUpperCase() || null;
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso && validDate(trimmed)) return trimmed;
  const eu = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(trimmed);
  if (eu) {
    const result = `${eu[3]}-${eu[2].padStart(2, "0")}-${eu[1].padStart(2, "0")}`;
    return validDate(result) ? result : null;
  }
  return null;
}

function validDate(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}

export function validateIban(iban: string | null | undefined) {
  if (!iban) return true;
  const compact = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0n;
  for (const char of rearranged) {
    const chunk = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of chunk) remainder = (remainder * 10n + BigInt(digit)) % 97n;
  }
  return remainder === 1n;
}

const vatPatterns: Record<string, RegExp> = {
  SI: /^SI\d{8}$/,
  HR: /^HR\d{11}$/,
  DE: /^DE\d{9}$/,
  AT: /^ATU\d{8}$/,
  IT: /^IT\d{11}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
};

export function validateVatFormat(vat: string | null | undefined, country: string | null | undefined) {
  if (!vat) return true;
  const normalized = normalizeVat(vat)!;
  const code = (country || normalized.slice(0, 2)).toUpperCase();
  const pattern = vatPatterns[code];
  return pattern ? pattern.test(normalized) : /^[A-Z]{2}[A-Z0-9]{5,14}$/.test(normalized);
}

const ISO_CURRENCIES = new Set(["EUR", "USD", "GBP", "CHF", "HRK", "CZK", "PLN", "HUF", "SEK", "NOK", "DKK", "RON", "BGN", "RSD", "BAM", "JPY", "CAD", "AUD"]);

export function validateInvoice(invoice: NormalizedInvoice): ValidationResult {
  const warnings: string[] = [...invoice.warnings];
  const errors: string[] = [];
  const differences: Record<string, string> = {};

  const required: Array<[string, unknown]> = [
    ["supplier.name", invoice.supplier.name],
    ["invoiceNumber", invoice.invoiceNumber],
    ["issueDate", invoice.issueDate],
    ["currency", invoice.currency],
    ["totals.netAmount", invoice.totals.netAmount],
    ["totals.vatAmount", invoice.totals.vatAmount],
    ["totals.grossAmount", invoice.totals.grossAmount],
  ];
  for (const [name, value] of required) if (value == null || value === "") warnings.push(`Missing required accounting field: ${name}`);

  if (invoice.currency && !ISO_CURRENCIES.has(invoice.currency)) errors.push(`Invalid currency code: ${invoice.currency}`);
  if (!validateIban(invoice.supplier.iban)) errors.push("Supplier IBAN failed MOD-97 validation");
  if (!validateVatFormat(invoice.supplier.vatNumber, invoice.supplier.countryCode)) warnings.push("Supplier VAT number format does not match country");
  if (!validateVatFormat(invoice.buyer.vatNumber, invoice.buyer.countryCode)) warnings.push("Buyer VAT number format does not match country");

  const totalsExpectedGross = add(invoice.totals.netAmount, invoice.totals.vatAmount);
  const grossDelta = diff(totalsExpectedGross, invoice.totals.grossAmount);
  if (!withinTolerance(grossDelta)) {
    errors.push("Net amount + VAT does not equal gross total");
    differences.netPlusVatVsGross = scaledToString(grossDelta);
  }

  if (invoice.lineItems.length) {
    const lineNet = sum(invoice.lineItems.map((x) => x.netAmount));
    const lineVat = sum(invoice.lineItems.map((x) => x.vatAmount));
    const netDelta = diff(lineNet, invoice.totals.netAmount);
    const vatDelta = diff(lineVat, invoice.totals.vatAmount);
    if (!withinTolerance(netDelta)) { warnings.push("Line item net sum differs from invoice net total"); differences.lineNetVsTotal = scaledToString(netDelta); }
    if (!withinTolerance(vatDelta)) { warnings.push("Line item VAT sum differs from invoice VAT total"); differences.lineVatVsTotal = scaledToString(vatDelta); }
  }

  if (invoice.vatBreakdown.length) {
    const vatNet = sum(invoice.vatBreakdown.map((x) => x.taxableAmount));
    const vatTax = sum(invoice.vatBreakdown.map((x) => x.vatAmount));
    const netDelta = diff(vatNet, invoice.totals.netAmount);
    const vatDelta = diff(vatTax, invoice.totals.vatAmount);
    if (!withinTolerance(netDelta)) { errors.push("VAT breakdown taxable total differs from invoice net total"); differences.vatBreakdownNet = scaledToString(netDelta); }
    if (!withinTolerance(vatDelta)) { errors.push("VAT breakdown VAT total differs from invoice VAT total"); differences.vatBreakdownVat = scaledToString(vatDelta); }
  }

  if (invoice.issueDate && invoice.dueDate && invoice.dueDate < invoice.issueDate) errors.push("Due date is before issue date");
  if (invoice.serviceDate && invoice.issueDate && invoice.serviceDate > invoice.dueDate! && invoice.dueDate) warnings.push("Service date is after due date");

  const due = toScaled(invoice.totals.amountDue);
  const gross = toScaled(invoice.totals.grossAmount);
  const paid = toScaled(invoice.totals.amountPaid);
  if (due != null && gross != null && paid != null && !withinTolerance(due - (gross - paid))) warnings.push("Amount due does not equal gross amount minus amount paid");

  if (invoice.supplier.vatNumber && invoice.buyer.vatNumber && invoice.supplier.vatNumber === invoice.buyer.vatNumber) warnings.push("Supplier and buyer VAT numbers are identical; parties may be reversed");

  if (invoice.documentType === "credit_note" && gross != null && gross > 0n) warnings.push("Credit note gross amount is positive; verify sign convention");

  return {
    status: errors.length ? "failed" : warnings.length ? "needs_review" : "valid",
    warnings: unique(warnings),
    errors: unique(errors),
    differences,
  };
}

function add(a: string | null | undefined, b: string | null | undefined): string | null {
  const aa = toScaled(a);
  const bb = toScaled(b);
  return aa == null || bb == null ? null : scaledToString(aa + bb);
}

function sum(values: Array<string | null | undefined>): string | null {
  let found = false;
  let total = 0n;
  for (const value of values) {
    const n = toScaled(value);
    if (n != null) { found = true; total += n; }
  }
  return found ? scaledToString(total) : null;
}

function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }
