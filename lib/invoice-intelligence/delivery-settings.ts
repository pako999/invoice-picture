import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { validatePublicHttpsUrl, type DeliveryMode, type XmlDeliveryFormat } from "./delivery-format";

export type CompanyDeliverySettings = {
  companyId: number;
  clerkUserId: string;
  mode: DeliveryMode;
  apiEndpoint: string | null;
  hasApiToken: boolean;
  xmlFormat: XmlDeliveryFormat;
};

export async function getCompanyDeliverySettings(companyId: number, clerkUserId: string): Promise<CompanyDeliverySettings> {
  const sql = db();
  const rows = await sql`
    SELECT "companyId", "clerkUserId", "mode", "apiEndpoint", "apiTokenEncrypted", "xmlFormat"
    FROM "companyDeliverySettings"
    WHERE "companyId" = ${companyId} AND "clerkUserId" = ${clerkUserId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { companyId, clerkUserId, mode: "email_ocr", apiEndpoint: null, hasApiToken: false, xmlFormat: "ubl_2_1" };
  return {
    companyId: Number(row.companyId),
    clerkUserId: String(row.clerkUserId),
    mode: normalizeMode(row.mode),
    apiEndpoint: row.apiEndpoint ? String(row.apiEndpoint) : null,
    hasApiToken: Boolean(row.apiTokenEncrypted),
    xmlFormat: normalizeXmlFormat(row.xmlFormat),
  };
}

export async function saveCompanyDeliverySettings(args: {
  companyId: number;
  clerkUserId: string;
  mode: DeliveryMode;
  apiEndpoint?: string | null;
  apiBearerToken?: string | null;
  clearApiToken?: boolean;
  xmlFormat?: XmlDeliveryFormat;
}) {
  const sql = db();
  const endpoint = args.mode === "api_json"
    ? validatePublicHttpsUrl(String(args.apiEndpoint || ""))
    : args.apiEndpoint?.trim() || null;
  if (args.mode === "api_json" && !endpoint) throw new Error("API endpoint is required for JSON delivery");
  const existing = await sql`
    SELECT "apiTokenEncrypted" FROM "companyDeliverySettings"
    WHERE "companyId" = ${args.companyId} AND "clerkUserId" = ${args.clerkUserId}
    LIMIT 1
  `;
  let encrypted = existing[0]?.apiTokenEncrypted ? String(existing[0].apiTokenEncrypted) : null;
  if (args.clearApiToken) encrypted = null;
  else if (args.apiBearerToken?.trim()) encrypted = encryptSecret(args.apiBearerToken.trim());

  await sql`
    INSERT INTO "companyDeliverySettings" ("companyId", "clerkUserId", "mode", "apiEndpoint", "apiTokenEncrypted", "xmlFormat", "createdAt", "updatedAt")
    VALUES (${args.companyId}, ${args.clerkUserId}, ${args.mode}, ${endpoint}, ${encrypted}, ${args.xmlFormat || "ubl_2_1"}, now(), now())
    ON CONFLICT ("companyId") DO UPDATE SET
      "clerkUserId" = EXCLUDED."clerkUserId",
      "mode" = EXCLUDED."mode",
      "apiEndpoint" = EXCLUDED."apiEndpoint",
      "apiTokenEncrypted" = EXCLUDED."apiTokenEncrypted",
      "xmlFormat" = EXCLUDED."xmlFormat",
      "updatedAt" = now()
  `;
  return getCompanyDeliverySettings(args.companyId, args.clerkUserId);
}

export async function getDeliverySecret(companyId: number, clerkUserId: string) {
  const rows = await db()`SELECT "apiTokenEncrypted" FROM "companyDeliverySettings" WHERE "companyId" = ${companyId} AND "clerkUserId" = ${clerkUserId} LIMIT 1`;
  const value = rows[0]?.apiTokenEncrypted ? String(rows[0].apiTokenEncrypted) : null;
  return value ? decryptSecret(value) : null;
}

function key() {
  const source = process.env.DELIVERY_SECRET_ENCRYPTION_KEY || process.env.DOCUMENT_URL_SIGNING_SECRET || process.env.CLERK_SECRET_KEY;
  if (!source) throw new Error("No encryption key configured for delivery secrets");
  return crypto.createHash("sha256").update(source).digest();
}

function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptSecret(value: string) {
  const [version, ivRaw, tagRaw, dataRaw] = value.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted delivery secret");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
}

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}
function normalizeMode(value: unknown): DeliveryMode {
  return value === "api_json" || value === "xml_email" ? value : "email_ocr";
}
function normalizeXmlFormat(value: unknown): XmlDeliveryFormat {
  return value === "eslog_2_0_original" ? value : "ubl_2_1";
}
