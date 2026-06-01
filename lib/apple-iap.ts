import { X509Certificate } from "node:crypto";
import { compactVerify } from "jose";

/** App bundle id. Override with APPLE_BUNDLE_ID if it ever changes. */
export const BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? "si.posljiracun.app";

/** Maps each StoreKit product id to the plan it grants. */
export const PRODUCT_PLAN_MAP: Record<string, "basic" | "pro"> = {
  "si.posljiracun.app.basic_monthly": "basic",
  "si.posljiracun.app.basic_yearly":  "basic",
  "si.posljiracun.app.pro_monthly":   "pro",
  "si.posljiracun.app.pro_yearly":    "pro",
};

/**
 * SHA-256 fingerprint of "Apple Root CA - G3" — the root that every App Store
 * JWS (notifications + signedTransactionInfo) chains up to. We pin to it so a
 * forged x5c chain (self-signed by an attacker) is rejected.
 *
 * ⚠️ CONFIRM THIS against Apple's published certificate before relying on it:
 *   https://www.apple.com/certificateauthority/  → "Apple Root CA - G3"
 *   openssl x509 -inform DER -in AppleRootCA-G3.cer -noout -fingerprint -sha256
 * Override via APPLE_ROOT_CA_G3_SHA256 (colons optional) without a redeploy.
 * Verification fails closed: a wrong value rejects all notifications rather
 * than accepting bad ones.
 */
const APPLE_ROOT_CA_G3_SHA256 =
  (process.env.APPLE_ROOT_CA_G3_SHA256 ??
    "63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179")
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase();

function fingerprint256(cert: X509Certificate): string {
  return cert.fingerprint256.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
}

function withinValidity(cert: X509Certificate, now: Date): boolean {
  return new Date(cert.validFrom) <= now && now <= new Date(cert.validTo);
}

/**
 * Verifies an App Store JWS (compact form, ES256, x5c header) and returns its
 * decoded JSON payload. Throws if the certificate chain is invalid, expired,
 * does not root in the pinned Apple Root CA - G3, or the signature is bad.
 */
export async function verifyAppleJWS<T = Record<string, unknown>>(
  token: string,
): Promise<T> {
  const [rawHeader] = token.split(".");
  if (!rawHeader) throw new Error("Malformed JWS");

  const header = JSON.parse(Buffer.from(rawHeader, "base64").toString("utf8")) as {
    alg?: string;
    x5c?: string[];
  };
  if (header.alg !== "ES256") throw new Error(`Unexpected alg: ${header.alg}`);
  if (!header.x5c || header.x5c.length < 2) {
    throw new Error("Missing x5c certificate chain");
  }

  const chain = header.x5c.map((b64) => new X509Certificate(Buffer.from(b64, "base64")));
  const [leaf, ...issuers] = chain;
  const root = chain[chain.length - 1];
  const now = new Date();

  // Every cert in the chain must be currently valid.
  for (const cert of chain) {
    if (!withinValidity(cert, now)) throw new Error("Certificate expired or not yet valid");
  }

  // Each cert must be signed by the next one up; the root must be self-signed.
  for (let i = 0; i < chain.length - 1; i++) {
    if (!chain[i].verify(chain[i + 1].publicKey)) {
      throw new Error("Broken certificate chain");
    }
  }
  if (!root.verify(root.publicKey)) throw new Error("Root certificate not self-signed");

  // Pin the root to Apple's published Apple Root CA - G3.
  if (fingerprint256(root) !== APPLE_ROOT_CA_G3_SHA256) {
    throw new Error("Chain does not root in the pinned Apple Root CA - G3");
  }

  // `issuers` referenced only to keep intent explicit; chain already validated.
  void issuers;

  // Signature is valid for the (now-trusted) leaf certificate's public key.
  const { payload } = await compactVerify(token, leaf.publicKey);
  return JSON.parse(Buffer.from(payload).toString("utf8")) as T;
}

/** Shape of the decoded JWSTransaction we care about. */
export interface AppleTransactionInfo {
  bundleId?: string;
  productId?: string;
  originalTransactionId?: string;
  expiresDate?: number; // ms since epoch
  revocationDate?: number;
  type?: string;
}

/** Shape of the decoded App Store Server Notification (V2) payload. */
export interface AppleNotificationPayload {
  notificationType?: string;
  subtype?: string;
  data?: {
    bundleId?: string;
    environment?: string;
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
}
