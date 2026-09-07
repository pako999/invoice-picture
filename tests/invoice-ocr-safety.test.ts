import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateSourcePages,
  getOcrSafetyConfig,
  mistralPagesForInput,
  providerReservationPages,
  azureAllowedForInput,
} from "../lib/invoice-intelligence/safety";

function fakePdf(pageCount: number) {
  const body = Array.from({ length: pageCount }, () => "/Type /Page").join("\n");
  return Buffer.from(`%PDF-1.4\n${body}\n%%EOF`).toString("base64");
}

test("1000-page PDF is detected but Mistral is hard-capped", () => {
  const input = { base64: fakePdf(1000), mimeType: "application/pdf", filename: "huge.pdf" };
  assert.equal(estimateSourcePages(input), 1000);
  assert.equal(mistralPagesForInput(input)?.length, getOcrSafetyConfig().maxPagesPerDocument);
  assert.equal(providerReservationPages(input), getOcrSafetyConfig().maxPagesPerDocument);
  assert.equal(azureAllowedForInput(input), false);
});

test("unknown-page PDF still receives explicit Mistral page allow-list", () => {
  const input = { base64: Buffer.from("%PDF-1.4\ncompressed-or-unusual-page-tree\n%%EOF").toString("base64"), mimeType: "application/pdf", filename: "unknown.pdf" };
  assert.equal(estimateSourcePages(input), null);
  assert.deepEqual(mistralPagesForInput(input), Array.from({ length: getOcrSafetyConfig().maxPagesPerDocument }, (_, i) => i));
  assert.equal(azureAllowedForInput(input), false);
});

test("single image uses one provider page and no PDF page allow-list", () => {
  const input = { base64: Buffer.from("image").toString("base64"), mimeType: "image/jpeg", filename: "invoice.jpg" };
  assert.equal(estimateSourcePages(input), 1);
  assert.equal(providerReservationPages(input), 1);
  assert.equal(mistralPagesForInput(input), undefined);
  assert.equal(azureAllowedForInput(input), true);
});
