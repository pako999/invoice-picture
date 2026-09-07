import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.DOCUMENT_URL_SIGNING_SECRET || process.env.CLERK_SECRET_KEY || "";
}

export function createDocumentSignature(documentId: number, clerkUserId: string, expiresAtMs: number) {
  const key = secret();
  if (!key) throw new Error("DOCUMENT_URL_SIGNING_SECRET is not configured");
  const payload = `${documentId}:${clerkUserId}:${expiresAtMs}`;
  return createHmac("sha256", key).update(payload).digest("hex");
}

export function verifyDocumentSignature(documentId: number, clerkUserId: string, expiresAtMs: number, signature: string) {
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now() || expiresAtMs > Date.now() + 15 * 60_000) return false;
  try {
    const expected = Buffer.from(createDocumentSignature(documentId, clerkUserId, expiresAtMs), "hex");
    const provided = Buffer.from(signature, "hex");
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}
