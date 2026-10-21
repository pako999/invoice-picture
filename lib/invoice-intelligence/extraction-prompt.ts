/** Keep tax-inclusive amounts consistent across direct OCR and batch extraction. */
export const VAT_EXTRACTION_PROMPT = [
  "Read every visible net, VAT and tax-inclusive amount, including columns labelled 'z DDV', 'z vključenim DDV', 'DDV vključen', 'bruto', 'incl. VAT' or 'tax inclusive'. Do not leave a visible amount null.",
  "For each line, grossAmount is the total for the entire quantity including VAT, not the unit price including VAT. unitPriceNet is the unit price excluding VAT after discount. Never copy a tax-inclusive unit price into unitPriceNet or unitPriceBeforeDiscount.",
  "totals.grossAmount is the full invoice total including VAT. totals.amountDue is the remaining balance and can be zero on a paid invoice; do not replace the gross invoice total with that zero balance.",
  "Read bank payment data exactly: supplier.iban is the creditor/supplier account, never the buyer account. Read supplier.bic only if explicitly printed as BIC/SWIFT; do not infer it from an IBAN or bank code. Preserve the complete paymentReference including the SI model or RF prefix and all digits. Read dueDate and the remaining unpaid totals.amountDue, including zero for paid invoices. Do not invent an IBAN, reference, due date or remaining balance.",
  "Keep printed values and their precision. Do not invent VAT, assume a VAT rate, or fabricate a missing amount. Leave genuinely absent values null for review.",
].join(" ");
