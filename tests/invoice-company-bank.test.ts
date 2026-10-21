import test from "node:test";
import assert from "node:assert/strict";
import { companyBankProfile, companyBankProfileSchema } from "../lib/company-bank-profile";
import { generateSepaPayment } from "../lib/invoice-intelligence/sepa";
import { emptyInvoice } from "../lib/invoice-intelligence/types";

const valid = { name: "Podjetje A", iban: "si56 1910 0000 0123 438", bic: "bsljsi2x", city: "Maribor", country: "si" };
test("company bank profile normalizes input and rejects incorrect payment details before saving", () => {
  const bank = companyBankProfileSchema.parse(valid);
  assert.equal(bank.iban, "SI56191000000123438");
  assert.equal(bank.bic, "BSLJSI2X");
  assert.equal(bank.country, "SI");
  for (const patch of [{ iban: "SI56191000000123439" }, { name: "" }, { city: "" }, { bic: "12345678" }, { country: "11" }]) {
    assert.equal(companyBankProfileSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(companyBankProfileSchema.safeParse({ ...valid, iban: "", bic: "", name: "", city: "" }).success, true, "saved bank account can be cleared");
});
test("company profile supplies the debtor while the invoice supplies the creditor in SEPA", () => {
  const bank = companyBankProfileSchema.parse(valid);
  const profile = companyBankProfile({ name: "Other display name", bankPayerName: bank.name, bankIban: bank.iban, bankBic: bank.bic, bankCity: bank.city, bankCountry: bank.country });
  const invoice = emptyInvoice();
  Object.assign(invoice, { documentType: "invoice", invoiceNumber: "INV-42", currency: "EUR" });
  Object.assign(invoice.supplier, { name: "Supplier B", iban: "DE89370400440532013000", city: "Berlin", countryCode: "DE" });
  invoice.totals.amountDue = "122.00";
  const xml = generateSepaPayment(invoice, { ...profile, executionDate: "2026-10-23" }, new Date("2026-10-21T12:00:00Z"));
  assert.match(xml, /<Dbtr><Nm>Podjetje A<\/Nm>/);
  assert.match(xml, /<DbtrAcct><Id><IBAN>SI56191000000123438/);
  assert.match(xml, /<DbtrAgt><FinInstnId><BICFI>BSLJSI2X<\/BICFI>/);
  assert.match(xml, /<Cdtr><Nm>Supplier B<\/Nm>/);
  assert.match(xml, /<CdtrAcct><Id><IBAN>DE89370400440532013000/);
  assert.throws(() => generateSepaPayment(invoice, { ...profile, bic: "<invalid>", executionDate: "2026-10-23" }, new Date("2026-10-21T12:00:00Z")), /BIC/);
});
