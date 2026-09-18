import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PDF_UPLOAD_BYTES,
  MAX_PDF_UPLOAD_CHUNKS,
  PDF_UPLOAD_CHUNK_BYTES,
  pdfUploadChunkCount,
} from "../lib/pdf-upload-limits";

test("4.4 MB PDF is split below the request-body limit", () => {
  const bytes = Math.round(4.4 * 1024 * 1024);
  assert.equal(PDF_UPLOAD_CHUNK_BYTES, 512 * 1024);
  assert.equal(pdfUploadChunkCount(bytes), 9);
});

test("10 MB PDF fits the bounded upload queue", () => {
  assert.equal(pdfUploadChunkCount(MAX_PDF_UPLOAD_BYTES), 20);
  assert.equal(MAX_PDF_UPLOAD_CHUNKS, 20);
});

test("PDFs above 10 MB are rejected before upload", () => {
  assert.throws(() => pdfUploadChunkCount(MAX_PDF_UPLOAD_BYTES + 1));
});
