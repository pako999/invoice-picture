import test from "node:test";
import assert from "node:assert/strict";
import { invoiceIssueLabel } from "../lib/invoice-intelligence/issue-labels";
test("receipt warning variants are Slovenian", () => {
  for (const text of ["This is a receipt; manual review is recommended before processing.", "This is a receipt; manual review recommended before processing as an accounting document."]) {
    assert.match(invoiceIssueLabel(text, "sl").text, /blagajniški račun/);
  }
});
test("known validation issues and numbered lines are translated", () => {
  assert.match(invoiceIssueLabel("Amount due does not equal gross amount minus amount paid", "sl").text, /Znesek za plačilo/);
  assert.equal(invoiceIssueLabel("Line item 12 description is missing", "sl").text, "Postavka 12: manjka opis.");
});
test("English is unchanged; unknown diagnostics remain available without inventing translations", () => {
  const message = "Unrecognized provider warning";
  assert.deepEqual(invoiceIssueLabel(message, "en"), { text: message, original: null });
  assert.equal(invoiceIssueLabel(message, "sl").original, message);
  assert.match(invoiceIssueLabel(message, "sl").text, /Dodatno opozorilo/);
});
