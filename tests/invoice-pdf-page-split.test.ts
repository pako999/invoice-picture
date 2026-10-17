import test from "node:test";
import assert from "node:assert/strict";
import { splitPdfFilename } from "../lib/bulk-invoices/page-split";
import { isStructuredDeliveryMode, normalizeDeliveryMode } from "../lib/invoice-intelligence/delivery-format";

test("split PDF delivery creates stable filenames", () => {
  assert.equal(splitPdfFilename("prejeti-racuni.pdf", 0), "prejeti-racuni-racun-001.pdf");
  assert.equal(splitPdfFilename("PREJETI.PDF", 31), "PREJETI-racun-032.pdf");
});

test("split PDF email is not a structured data delivery mode", () => {
  const mode = normalizeDeliveryMode("split_pdf_email");
  assert.equal(mode, "split_pdf_email");
  assert.equal(isStructuredDeliveryMode(mode), false);
  assert.equal(normalizeDeliveryMode("unknown"), "email_ocr");
});

test("XML ZIP delivery is a structured mode", () => {
  const mode = normalizeDeliveryMode("xml_zip_email");
  assert.equal(mode, "xml_zip_email");
  assert.equal(isStructuredDeliveryMode(mode), true);
});
