import test from "node:test";
import assert from "node:assert/strict";
import { emptyInvoice } from "../lib/invoice-intelligence/types";
import { parseInvoiceTextDeterministically } from "../lib/invoice-intelligence/providers";
import { bankDate, generateSepaPayment, paymentIban } from "../lib/invoice-intelligence/sepa";
import { paymentIbanError } from "../lib/invoice-intelligence/iban";

const now = new Date("2026-10-21T12:00:00Z");
const payer = { name: "Kupec & partner", iban: "DE89370400440532013000", city: "Ljubljana", country: "SI", executionDate: "2026-10-22" };
function invoice() {
  const i = emptyInvoice();
  i.documentType = "invoice"; i.invoiceNumber = "2026-42"; i.currency = "EUR";
  Object.assign(i.supplier, { name: "Dobavitelj <d.o.o.>", iban: "SI56191000000123438", city: "Maribor", countryCode: "SI" });
  i.totals.grossAmount = "122.00"; i.totals.amountDue = "22.00";
  i.paymentReference = "SI00 2026-42";
  return i;
}
test("SEPA exports the unpaid balance, structured reference and escaped parties without mutating the invoice", () => {
  const i = invoice(), before = structuredClone(i);
  const xml = generateSepaPayment(i, payer, now);
  assert.match(xml, /pain\.001\.001\.09/);
  assert.match(xml, /<InstdAmt Ccy="EUR">22.00<\/InstdAmt>/);
  assert.match(xml, /<CtrlSum>22.00<\/CtrlSum>/);
  assert.match(xml, /<Ref>SI002026-42<\/Ref>/);
  assert.match(xml, /Kupec &amp; partner/);
  assert.match(xml, /Dobavitelj &lt;d.o.o.&gt;/);
  assert.match(xml, /<ReqdExctnDt><Dt>2026-10-22<\/Dt>/);
  assert.deepEqual(i, before);
  assert.notEqual(generateSepaPayment(i,payer,now), xml, "each file has its own bank message identifier");
});
test("SEPA rejects paid, unknown, negative, fractional-cent and non-EUR payments", () => {
  for (const amount of [null, "0", "-1", "12.001", "1e3"]) {
    const i = invoice(); i.totals.amountDue = amount;
    assert.throws(() => generateSepaPayment(i,payer,now), /znesek/);
  }
  const i = invoice(); i.currency = "USD";
  assert.throws(() => generateSepaPayment(i,payer,now), /EUR/);
  i.currency = "EUR"; i.documentType = "credit_note";
  assert.throws(() => generateSepaPayment(i,payer,now), /dobropise/);
});
test("SEPA checks IBANs, calendar dates, creditor details and payer details", () => {
  assert.equal(paymentIban("si56 1910 0000 0123 438"), "SI56191000000123438");
  for (const iban of [null, "SI56191000000123439", "not-an-iban"]) assert.throws(() => paymentIban(iban), /IBAN/);
  for (const executionDate of ["2026-02-30","2026-10-20","bad"]) assert.throws(() => generateSepaPayment(invoice(),{...payer,executionDate},now), /Datum/);
  assert.throws(() => generateSepaPayment(invoice(),{...payer,iban:invoice().supplier.iban!},now), /enaka/);
  const i=invoice();i.supplier.city=null;
  assert.throws(() => generateSepaPayment(i,payer,now), /mesto prejemnika/);
});
test("SEPA distinguishes a missing supplier IBAN from a valid saved company account", () => {
  const i = invoice(); i.supplier.iban = null;
  const savedPayer = { ...payer, iban: "SI56040000281605491" };
  assert.equal(paymentIbanError(savedPayer.iban, "plačnika"), null);
  assert.match(paymentIbanError(i.supplier.iban, "prejemnika")!, /Manjka IBAN prejemnika/);
  assert.throws(() => generateSepaPayment(i, savedPayer, now), /Manjka IBAN prejemnika/);
  i.supplier.iban = "DE89370400440532013000";
  assert.equal(paymentIbanError(i.supplier.iban, "prejemnika"), null);
  assert.match(generateSepaPayment(i, savedPayer, now), /<DbtrAcct><Id><IBAN>SI56040000281605491/);
});
test("SEPA validation identifies the specific payer or recipient account to correct", () => {
  assert.match(paymentIbanError(" ", "plačnika")!, /Vnesite svoj IBAN plačnika/);
  assert.match(paymentIbanError("SI56191000000123439", "plačnika")!, /IBAN plačnika ni veljaven/);
  assert.match(paymentIbanError("SI56191000000123439", "prejemnika")!, /IBAN prejemnika ni veljaven/);
  assert.equal(paymentIbanError("si56 1910 0000 0123 438", "prejemnika"), null);
});
test("SEPA validates RF checksum and preserves unstructured references without inventing an SI model", () => {
  const i=invoice();i.paymentReference="RF18 5390 0754 7034";
  assert.match(generateSepaPayment(i,payer,now), /<Issr>ISO<\/Issr>.*<Ref>RF18539007547034<\/Ref>/);
  i.paymentReference="RF19 5390 0754 7034";
  assert.throws(() => generateSepaPayment(i,payer,now), /kontrolne/);
  i.paymentReference="1972026";
  assert.match(generateSepaPayment(i,payer,now), /<Ustrd>1972026<\/Ustrd>/);
  i.paymentReference=null;
  assert.match(generateSepaPayment(i,payer,now), /<Ustrd>Racun 2026-42<\/Ustrd>/);
});
test("bank dates follow Slovenian local time at the UTC day boundary", () => {
  assert.equal(bankDate(new Date("2026-10-21T23:30:00Z")), "2026-10-22");
});

test("OCR fallback keeps the payment reference on its line and does not infer an unpaid balance", () => {
  const i = parseInvoiceTextDeterministically("Sklic: SI00 2026-42\nPlacilni pogoji: TRR\nGrand total: 122.00 EUR");
  assert.equal(i.paymentReference, "SI00 2026-42");
  assert.equal(i.totals.grossAmount, "122.00");
  assert.equal(i.totals.amountDue, null);
});
