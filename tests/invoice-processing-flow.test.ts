import test from "node:test";
import assert from "node:assert/strict";
import { deliveryState, flowItems, positiveId, shouldPollFlow, type FlowSnapshot, type FlowUpload } from "../lib/invoice-processing-flow";

const empty = (): FlowSnapshot => ({ invoices: [], documents: [], batches: [], groups: [] });
const upload: FlowUpload = { key: "one", filename: "invoice.pdf", status: "accepted", invoiceId: 8, documentId: 42 };
const sent = () => deliveryState({ mode: "email_ocr", target: "accounting@example.test", sent: true });

test("null, zero and empty result IDs must never become PDF batch zero", () => {
  for (const value of [null, undefined, "", 0, "0", -1, NaN, "invalid"]) assert.equal(positiveId(value), undefined);
  assert.equal(positiveId("42"), 42);
});
test("upload acceptance is queued, not OCR success", () => {
  assert.equal(flowItems([upload], null)[0].status, "queued");
});
test("original delivery success remains separate from running OCR", () => {
  const snapshot = empty();
  snapshot.documents.push({ id: 42, sourceInvoiceId: 8, bulkJobId: null, filename: "invoice.pdf", status: "processing", error: null, delivery: sent() });
  const item = flowItems([upload], snapshot)[0];
  assert.equal(item.status, "processing");
  assert.equal(item.delivery?.status, "sent");
  assert.equal(shouldPollFlow([upload], snapshot), true);
});
test("an original sent without an OCR document is an explicit OCR admission failure", () => {
  const snapshot = empty();
  snapshot.invoices.push({ id: 8, filename: "invoice.pdf", documentId: null, status: "sent", error: null, delivery: sent() });
  const item = flowItems([upload], snapshot)[0];
  assert.equal(item.status, "ocr_unavailable");
  assert.equal(item.delivery?.status, "sent");
  assert.equal(shouldPollFlow([upload], snapshot), false);
});
test("XML queue completion without a receipt is still awaiting approval", () => {
  assert.equal(deliveryState({ mode: "xml_zip_email", target: "a@example.test", documentStatus: "needs_review", queueStatus: "completed" }).status, "awaiting_approval");
  assert.equal(deliveryState({ mode: "xml_zip_email", target: "a@example.test", documentStatus: "approved", queueStatus: "completed" }).status, "queued");
});
test("approval starts delivery monitoring and a receipt ends it", () => {
  const snapshot = empty();
  const document = { id: 42, sourceInvoiceId: 8, bulkJobId: null, filename: "invoice.pdf", status: "approved", error: null,
    delivery: deliveryState({ mode: "xml_email", target: "a@example.test", documentStatus: "approved", queueStatus: "processing" }) };
  snapshot.documents.push(document);
  assert.equal(shouldPollFlow([upload], snapshot), true);
  document.delivery = deliveryState({ mode: "xml_email", target: "a@example.test", documentStatus: "approved", sent: true });
  assert.equal(shouldPollFlow([upload], snapshot), false);
});
test("failed delivery distinguishes scheduled retry from exhausted attempts", () => {
  assert.equal(deliveryState({ mode: "xml_email", target: "a@example.test", queueStatus: "failed", attempts: 1, maxAttempts: 5, error: "Unavailable" }).status, "retrying");
  assert.equal(deliveryState({ mode: "xml_email", target: "a@example.test", queueStatus: "failed", attempts: 5, maxAttempts: 5 }).status, "failed");
});
test("partial uploads keep successful invoices and failed filenames together", () => {
  const snapshot = empty();
  snapshot.documents.push({ id: 42, sourceInvoiceId: 8, bulkJobId: null, filename: "invoice.pdf", status: "needs_review", error: null, delivery: sent() });
  const items = flowItems([upload, { key: "bad", filename: "bad.jpg", status: "failed", error: "Image unreadable" }], snapshot);
  assert.equal(items.length, 2);
  assert.equal(items[0].documentId, 42);
  assert.equal(items[1].error, "Image unreadable");
  assert.equal(shouldPollFlow([upload], snapshot), false);
});
test("multi-invoice PDFs expose each child and continue until the actual job ends", () => {
  const snapshot = empty();
  const uploads: FlowUpload[] = [{ key: "pdf", filename: "batch.pdf", status: "accepted", bulkJobId: 7 }];
  snapshot.batches.push({ id: 7, filename: "batch.pdf", stage: "extract", deliveryMode: "email_ocr", target: "a@example.test", pageCount: 4, ocrNextPage: 4, totalInvoices: 2, processedInvoices: 1, error: null });
  snapshot.groups.push({ jobId: 7, groupIndex: 0, documentId: 42, status: "extracted", delivery: sent() }, { jobId: 7, groupIndex: 1, documentId: null, status: "pending", delivery: sent() });
  snapshot.documents.push({ id: 42, sourceInvoiceId: 8, bulkJobId: 7, filename: "invoice-1.pdf", status: "needs_review", error: null, delivery: sent() });
  assert.equal(flowItems(uploads, snapshot).length, 2);
  assert.equal(shouldPollFlow(uploads, snapshot), true);
});
test("paused, quota-limited and failed batches stop polling until user action", () => {
  const snapshot = empty();
  const uploads: FlowUpload[] = [{ key: "pdf", filename: "batch.pdf", status: "accepted", bulkJobId: 7 }];
  snapshot.batches.push({ id: 7, filename: "batch.pdf", stage: "boundary_review", deliveryMode: "email_ocr", target: "a@example.test", pageCount: 4, ocrNextPage: 4, totalInvoices: 2, processedInvoices: 0, error: null });
  snapshot.groups.push({ jobId: 7, groupIndex: 0, documentId: null, status: "pending", delivery: deliveryState({ mode: "email_ocr", target: "a@example.test" }) });
  for (const stage of ["boundary_review", "quota_wait", "failed"]) {
    snapshot.batches[0].stage = stage;
    assert.equal(shouldPollFlow(uploads, snapshot), false);
  }
});
test("split-only PDFs do not claim OCR field extraction", () => {
  const snapshot = empty();
  const uploads: FlowUpload[] = [{ key: "pdf", filename: "batch.pdf", status: "accepted", bulkJobId: 7 }];
  snapshot.batches.push({ id: 7, filename: "batch.pdf", stage: "completed", deliveryMode: "split_pdf_email", target: "a@example.test", pageCount: 2, ocrNextPage: 0, totalInvoices: 2, processedInvoices: 2, error: null });
  snapshot.groups.push({ jobId: 7, groupIndex: 0, documentId: null, status: "extracted", delivery: sent() });
  assert.equal(flowItems(uploads, snapshot)[0].status, "split_ready");
  assert.equal(shouldPollFlow(uploads, snapshot), false);
});
test("deleted or unauthorized IDs show unavailable instead of an endless OCR spinner", () => {
  assert.equal(flowItems([upload], empty())[0].status, "unavailable");
  assert.equal(shouldPollFlow([upload], empty()), false);
});
