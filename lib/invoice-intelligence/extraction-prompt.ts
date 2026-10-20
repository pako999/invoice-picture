/** Keep tax-inclusive amounts consistent across direct OCR and batch extraction. */
export const VAT_EXTRACTION_PROMPT = [
  "Read every visible net, VAT and tax-inclusive amount, including columns labelled 'z DDV', 'z vključenim DDV', 'DDV vključen', 'bruto', 'incl. VAT' or 'tax inclusive'. Do not leave a visible amount null.",
  "For each line, grossAmount is the total for the entire quantity including VAT, not the unit price including VAT. unitPriceNet is the unit price excluding VAT after discount. Never copy a tax-inclusive unit price into unitPriceNet or unitPriceBeforeDiscount.",
  "totals.grossAmount is the full invoice total including VAT. totals.amountDue is the remaining balance and can be zero on a paid invoice; do not replace the gross invoice total with that zero balance.",
  "Keep printed values and their precision. Do not invent VAT, assume a VAT rate, or fabricate a missing amount. Leave genuinely absent values null for review.",
].join(" ");
