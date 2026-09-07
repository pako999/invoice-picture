import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const url = process.env.DATABASE_URL;
  let dbOk = false;
  let tableExists = false;
  let invoiceReaderTables = false;
  try {
    const sql = neon(url!);
    const result = await sql`SELECT
      to_regclass('public."userSettings"') as settings,
      to_regclass('public."invoiceDocuments"') as invoice_documents`;
    dbOk = true;
    tableExists = result[0]?.settings !== null;
    invoiceReaderTables = result[0]?.invoice_documents !== null;
  } catch {}

  const { userId } = await auth();
  const mistralConfigured = Boolean(process.env.MISTRAL_API_KEY);
  const azureConfigured = Boolean(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);

  return NextResponse.json({
    db: dbOk,
    tableExists,
    invoiceReaderTables,
    clerkUserId: userId ?? null,
    hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    invoiceReader: {
      primaryConfigured: mistralConfigured,
      primaryModel: process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest",
      azureFallbackConfigured: azureConfigured,
      azureModel: azureConfigured ? (process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-invoice") : null,
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      dedicatedSigningSecretConfigured: Boolean(process.env.DOCUMENT_URL_SIGNING_SECRET),
      signingFallbackAvailable: Boolean(process.env.CLERK_SECRET_KEY),
      confidenceThreshold: Number(process.env.INVOICE_CONFIDENCE_THRESHOLD ?? 0.92),
      monetaryTolerance: process.env.INVOICE_MONETARY_TOLERANCE ?? "0.02",
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
