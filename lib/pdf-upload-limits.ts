export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024;
export const PDF_UPLOAD_CHUNK_BYTES = 512 * 1024;
export const MAX_PDF_UPLOAD_CHUNKS = Math.ceil(MAX_PDF_UPLOAD_BYTES / PDF_UPLOAD_CHUNK_BYTES);

export function pdfUploadChunkCount(byteSize: number) {
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_PDF_UPLOAD_BYTES) {
    throw new Error("PDF size must be between 1 byte and 10 MB");
  }
  return Math.ceil(byteSize / PDF_UPLOAD_CHUNK_BYTES);
}
