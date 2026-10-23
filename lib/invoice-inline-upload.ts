// Base64 adds 1/3 to source bytes. Leave room below Vercel's 4.5 MB limit
// for the JSON envelope and metadata. Larger PDFs use private storage.
export const MAX_INLINE_SOURCE_BYTES = 2.5 * 1024 * 1024;
export const MAX_INLINE_JSON_BYTES = 4_000_000;

export function inlineRequestTooLarge(headers: Headers) {
  const value = headers.get("content-length");
  return value != null && Number(value) > MAX_INLINE_JSON_BYTES;
}

export function serializeInlineInvoice(value: unknown) {
  const body = JSON.stringify(value);
  if (new TextEncoder().encode(body).byteLength > MAX_INLINE_JSON_BYTES) {
    throw new Error("Datoteka je prevelika za neposredno nalaganje. PDF naložite prek zasebne shrambe.");
  }
  return body;
}
