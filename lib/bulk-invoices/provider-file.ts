import { createHmac, timingSafeEqual } from "node:crypto";

const LIFETIME_MS = 25 * 60 * 60 * 1000;
export function providerFileSignature(key: string, expires: number, secret: string) {
  if (!secret) throw new Error("Provider download signing is not configured");
  return createHmac("sha256", secret).update(`ocr-source\n${expires}\n${key}`).digest("hex");
}

export function createProviderFileUrl(baseUrl: string, key: string, secret: string, now = Date.now()) {
  const expires = now + LIFETIME_MS;
  const url = new URL("/provider-file", baseUrl);
  if (url.protocol !== "https:") throw new Error("Provider downloads require HTTPS");
  url.searchParams.set("key", key);
  url.searchParams.set("exp", String(expires));
  url.searchParams.set("sig", providerFileSignature(key, expires, secret));
  return url.toString();
}

export function verifyProviderFileUrl(url: URL, secret: string, now = Date.now()) {
  const key = url.searchParams.get("key") ?? "", expires = Number(url.searchParams.get("exp"));
  if (!secret || !key.startsWith("bulk/") || key.length > 1024 || key.split("/").some(part => part === ".." || part === ".") || !Number.isSafeInteger(expires) || expires <= now || expires > now + LIFETIME_MS) return null;
  try {
    const expected = Buffer.from(providerFileSignature(key, expires, secret), "hex");
    const provided = Buffer.from(url.searchParams.get("sig") ?? "", "hex");
    return provided.length === expected.length && timingSafeEqual(provided, expected) ? key : null;
  } catch { return null; }
}
