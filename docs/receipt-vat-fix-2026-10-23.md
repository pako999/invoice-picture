# VAT-inclusive receipt line correction

## Confirmed cause

The saved provider annotation for the reported receipt already contained the
error. It copied printed VAT-inclusive item totals into `netAmount` and then
added 22% VAT. The document-level summary was correct. The line totals therefore
contained VAT twice: 74.37 instead of 60.95.

`lib/invoice-intelligence/receipt-totals.ts` previously recognized only a narrow
`Skupaj(z DDV)` / `DDV Skupaj` layout and reconciled lines only when the **header**
net total was wrong. This receipt used `Končna vsota vsebuje DDV`, split item
names/prices over separate OCR paragraphs, and had an already correct header.
`mergeMissingInvoiceFields` in `providers.ts` deliberately did not replace
non-null, incorrect model amounts. XML serialization then faithfully exported
those incorrect amounts. Validation warned about the line sums, but manual
approval allowed the saved result to be exported.

## Focused changes

- `receipt-lines.ts`: require an explicit inclusive-VAT statement, the printed
  summary amounts and rate, a consistent single-rate summary, every printed item
  price matched uniquely near its description, and exact gross-total agreement.
  Recognize both gross-as-net and correctly extracted gross-only lines. Discounts,
  ambiguous matches, absent prices, mixed rates and conflicting evidence are left
  for review. This is not a general-purpose receipt layout parser.
- Preserve the printed gross line totals. Derive net amounts and VAT only when
  rounding each line to cents reproduces both printed summary totals exactly.
  Retain six decimal places for derived unit prices before trimming insignificant
  zeroes; the two-unit line has net unit price 1.055, not 1.29. Do not distribute
  rounding differences. Without exact agreement, net and VAT remain unknown and
  export requires correction.
- Apply reconciliation through the shared direct/bulk extraction finalizer and
  keep a review warning. Extraction already uses Document AI's strict
  `document_annotation_format` JSON schema in the same OCR request. Add explicit
  field-level descriptions for line and document net, VAT and VAT-inclusive gross
  amounts and unit prices in `types.ts`, as well as retail-receipt instructions in
  the shared extraction prompt. Existing field names remain compatible with stored
  data and exports: `netAmount` means price without VAT, `vatAmount` means VAT, and
  `grossAmount` means price with VAT. No additional provider call or page conversion
  is needed. A schema guarantees the structure, not correct arithmetic or price
  interpretation; the saved structured response is the regression input.
- Reject the recognizable receipt double-VAT signature in eSLOG, UBL and JSON
  delivery, including legacy approved results. Reject gross-only receipt lines
  whose net is still unknown instead of exporting zero. Document discounts are
  excluded from the sum-based signature. XML download returns HTTP 409 with a
  useful explanation. Original supplied eSLOG passthrough is unchanged.

## Replayed saved OCR result

The saved OCR text and annotation were replayed locally, without another paid
OCR request. Only line monetary fields, the reconciliation warning and review
status were changed by the narrow correction.

| Line | Printed gross retained | Corrected net | Corrected VAT |
| --- | ---: | ---: | ---: |
| 1 | 45.99 | 37.70 | 8.29 |
| 2 | 5.89 | 4.83 | 1.06 |
| 3 | 6.49 | 5.32 | 1.17 |
| 4 (quantity 2) | 2.58 | 2.11 | 0.47 |
| Total | 60.95 | 49.96 | 10.99 |

All monetary validation differences are empty after reconciliation. The existing
supplier IBAN and buyer VAT-format issues remain for review; this price fix does
not invent bank or identity data. A corrected stored invoice must be reviewed
again before new delivery. A previously downloaded or delivered XML must be
replaced in the destination system by the user.

## Validation

Regression coverage includes the split-line layout, quantity two, already correct
gross-only extraction, export contents, legacy export rejection, idempotence,
missing/conflicting evidence, duplicate descriptions, discounts, mixed VAT rates,
ordinary invoices and rounding disagreement. Tests use a minimal receipt fixture
without customer or payment identifiers.

Run:

```sh
node --import tsx --test tests/invoice-*.test.ts
npm run check
NODE_OPTIONS=--max-old-space-size=4096 node node_modules/next/dist/bin/next build
git diff --check
```

Provider accuracy on a fresh upload and external accounting-system import have
not been tested with a new live request. The regression verifies the actual saved
OCR response and generated XML; it makes no claim of a new extraction-latency
measurement.
