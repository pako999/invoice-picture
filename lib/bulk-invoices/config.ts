import { createHash, timingSafeEqual } from "node:crypto";

export const BULK_PDF_GATEWAY_URL = "https://br-weathered-frog-alr3b4zn-bulkpdf.compute.c-3.eu-central-1.aws.neon.tech";
export const BULK_PDF_MAX_BYTES = 200 * 1024 * 1024;
export const BULK_PDF_MAX_PAGES = 500;
export const BULK_OCR_BATCH_PAGES = 25;
export const BULK_CLASSIFY_BATCH_PAGES = 20;
export const BULK_EXTRACT_BATCH_SIZE = 5;
export const BULK_BOUNDARY_CONFIDENCE_THRESHOLD = 0.72;

const INTERNAL_SECRET_SHA256 = "e1a05eae8a5746b05c3ae0dd6dc4556f2065bd42d86ff9bd2b8e330359fcdcb0";

export function verifyBulkInternalSecret(value: string | null) {
  if (!value) return false;
  const actual = createHash("sha256").update(value).digest();
  const expected = Buffer.from(INTERNAL_SECRET_SHA256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type BulkInvoiceRange = {
  startPage: number;
  endPage: number;
  boundaryConfidence: number | null;
  needsBoundaryReview: boolean;
};

export function validateBulkRanges(ranges: BulkInvoiceRange[], pageCount: number) {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > BULK_PDF_MAX_PAGES) return false;
  if (!ranges.length || ranges.length > pageCount) return false;
  let expected = 0;
  for (const range of ranges) {
    if (!Number.isInteger(range.startPage) || !Number.isInteger(range.endPage)) return false;
    if (range.startPage !== expected || range.endPage < range.startPage || range.endPage >= pageCount) return false;
    expected = range.endPage + 1;
  }
  return expected === pageCount;
}

export function buildBulkRanges(
  pages: Array<{ pageNumber: number; startsNewInvoice: boolean | null; boundaryConfidence: number | null }>,
  pageCount: number,
): BulkInvoiceRange[] {
  const byPage = new Map(pages.map((p) => [p.pageNumber, p]));
  const starts = [0];
  for (let page = 1; page < pageCount; page += 1) {
    if (byPage.get(page)?.startsNewInvoice) starts.push(page);
  }
  return starts.map((startPage, index) => {
    const endPage = (starts[index + 1] ?? pageCount) - 1;
    const boundary = startPage === 0 ? 1 : byPage.get(startPage)?.boundaryConfidence ?? null;
    return {
      startPage,
      endPage,
      boundaryConfidence: boundary,
      needsBoundaryReview: boundary == null || boundary < BULK_BOUNDARY_CONFIDENCE_THRESHOLD,
    };
  });
}
