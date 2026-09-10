import { and, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { getDb } from "@/lib/db";
import { companies, invoiceAuditLogs, invoiceDocuments, invoices } from "@/lib/schema";
import { getResend } from "@/lib/resend";
import { brandedEmail } from "@/lib/email-template";
import { normalizedInvoiceSchema } from "./types";
import { buildInvoiceApiPayload, resolveXmlDelivery } from "./delivery-format";
import { getCompanyDeliverySettings, getDeliverySecret } from "./delivery-settings";

export async function queuePendingApprovedDeliveries(limit = 100) {
  const sql = rawDb();

  // Self-heal jobs that exhausted retries because older code rejected eSLOG
  // selection for PDF/image sources. After the fallback fix these deliveries
  // are safe to retry and will either forward a real eSLOG or send UBL 2.1.
  await sql`
    UPDATE "invoiceDeliveryJobs" j
    SET "status" = 'queued', "attempts" = 0, "availableAt" = now(),
        "lockedAt" = NULL, "lastError" = NULL, "updatedAt" = now()
    FROM "invoiceDocuments" d
    JOIN "companyDeliverySettings" s
      ON s."companyId" = d."companyId" AND s."clerkUserId" = d."clerkUserId"
    WHERE j."documentId" = d."id"
      AND d."status" = 'approved'
      AND s."mode" = 'xml_email'
      AND s."xmlFormat" = 'eslog_2_0_original'
      AND j."status" = 'failed'
      AND j."lastError" LIKE 'eSLOG 2.0 delivery requires%'
  `;

  const rows = await sql`
    INSERT INTO "invoiceDeliveryJobs" ("documentId", "status", "attempts", "availableAt", "createdAt", "updatedAt")
    SELECT d."id", 'queued', 0, now(), now(), now()
    FROM "invoiceDocuments" d
    JOIN "companyDeliverySettings" s ON s."companyId" = d."companyId" AND s."clerkUserId" = d."clerkUserId"
    LEFT JOIN "invoiceDeliveryJobs" j ON j."documentId" = d."id"
    WHERE d."status" = 'approved'
      AND d."approvedJson" IS NOT NULL
      AND s."mode" IN ('api_json', 'xml_email')
      AND j."id" IS NULL
    ORDER BY d."approvedAt" ASC NULLS LAST, d."id" ASC
    LIMIT ${Math.max(1, Math.min(500, limit))}
    ON CONFLICT ("documentId") DO NOTHING
    RETURNING "documentId"
  `;
  return rows.length;
}

export async function queueInvoiceDelivery(documentId: number) {
  const sql = rawDb();
  await sql`
    INSERT INTO "invoiceDeliveryJobs" ("documentId", "status", "attempts", "availableAt", "createdAt", "updatedAt")
    VALUES (${documentId}, 'queued', 0, now(), now(), now())
    ON CONFLICT ("documentId") DO UPDATE SET
      "status" = CASE WHEN "invoiceDeliveryJobs"."status" = 'completed' THEN 'completed' ELSE 'queued' END,
      "availableAt" = CASE WHEN "invoiceDeliveryJobs"."status" = 'completed' THEN "invoiceDeliveryJobs"."availableAt" ELSE now() END,
      "lastError" = CASE WHEN "invoiceDeliveryJobs"."status" = 'completed' THEN "invoiceDeliveryJobs"."lastError" ELSE NULL END,
      "lockedAt" = NULL,
      "updatedAt" = now()
  `;
}

export async function runQueuedDeliveryJobs(limit = 5) {
  const sql = rawDb();
  const rows = await sql`
    SELECT "id", "documentId", "attempts", "maxAttempts"
    FROM "invoiceDeliveryJobs"
    WHERE "status" IN ('queued', 'failed') AND "availableAt" <= now() AND "attempts" < "maxAttempts"
    ORDER BY "availableAt" ASC
    LIMIT ${Math.max(1, Math.min(20, limit))}
  `;
  const results: Array<{ jobId: number; documentId: number; ok: boolean; error?: string }> = [];
  for (const row of rows) {
    const jobId = Number(row.id);
    const documentId = Number(row.documentId);
    const attempt = Number(row.attempts) + 1;
    const locked = await sql`
      UPDATE "invoiceDeliveryJobs"
      SET "status" = 'processing', "attempts" = ${attempt}, "lockedAt" = now(), "updatedAt" = now()
      WHERE "id" = ${jobId} AND "status" IN ('queued', 'failed')
      RETURNING "id"
    `;
    if (!locked.length) continue;
    try {
      await deliverInvoiceDocument(documentId);
      await sql`UPDATE "invoiceDeliveryJobs" SET "status" = 'completed', "lockedAt" = NULL, "lastError" = NULL, "updatedAt" = now() WHERE "id" = ${jobId}`;
      results.push({ jobId, documentId, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const delayMinutes = Math.min(120, 2 ** Math.min(attempt, 7));
      await sql`
        UPDATE "invoiceDeliveryJobs"
        SET "status" = 'failed', "lockedAt" = NULL, "lastError" = ${message.slice(0, 2000)},
            "availableAt" = now() + (${delayMinutes} || ' minutes')::interval, "updatedAt" = now()
        WHERE "id" = ${jobId}
      `;
      await markSourceInvoice(documentId, false, message);
      await audit(documentId, "structured_delivery_failed", { error: message, attempt });
      console.error("structured_delivery_failed", { documentId, attempt, error: message });
      results.push({ jobId, documentId, ok: false, error: message });
    }
  }
  return results;
}

export async function deliverInvoiceDocument(documentId: number) {
  const db = getDb();
  const [document] = await db.select().from(invoiceDocuments).where(eq(invoiceDocuments.id, documentId)).limit(1);
  if (!document) throw new Error("Invoice document not found");
  if (!document.companyId) return { mode: "email_ocr" as const, skipped: true };
  if (!document.approvedJson) throw new Error("Invoice is not approved yet");

  const settings = await getCompanyDeliverySettings(document.companyId, document.clerkUserId);
  if (settings.mode === "email_ocr") return { mode: settings.mode, skipped: true };
  const invoice = normalizedInvoiceSchema.parse(JSON.parse(document.approvedJson));
  const [company] = await db.select().from(companies)
    .where(and(eq(companies.id, document.companyId), eq(companies.clerkUserId, document.clerkUserId)))
    .limit(1);
  if (!company) throw new Error("Company not found");

  if (settings.mode === "api_json") {
    if (!settings.apiEndpoint) throw new Error("JSON API endpoint is not configured");
    const token = await getDeliverySecret(document.companyId, document.clerkUserId);
    const payload = buildInvoiceApiPayload({
      documentId,
      companyId: document.companyId,
      sourceInvoiceId: document.sourceInvoiceId,
      invoice,
      source: { filename: document.filename, mimeType: document.mimeType, sha256: document.sha256, base64: document.originalBase64 },
    });
    const response = await fetch(settings.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SlikajRacun/1.0",
        "X-SlikajRacun-Event": "invoice.approved",
        "X-SlikajRacun-Document-Id": String(documentId),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Accounting API rejected invoice (${response.status}): ${(await response.text()).slice(0, 500)}`);
    await markSourceInvoice(documentId, true);
    await audit(documentId, "structured_delivery_success", { mode: settings.mode, endpointHost: new URL(settings.apiEndpoint).hostname });
    return { mode: settings.mode, status: response.status };
  }

  const resolved = resolveXmlDelivery({
    format: settings.xmlFormat,
    invoice,
    originalBase64: document.originalBase64,
    originalMimeType: document.mimeType,
    originalFilename: document.filename,
  });

  const formatLabel = resolved.format === "ubl_2_1" ? "UBL 2.1" : "eSLOG 2.0";
  const fallbackNotice = resolved.fallback
    ? "Izbran je bil eSLOG 2.0, vendar vhodni dokument ni bil originalni eSLOG XML. Da pošiljanje ne bi odpovedalo, je bil iz potrjenih podatkov varno ustvarjen UBL 2.1 XML."
    : "XML je bil pripravljen iz potrjenih podatkov računa. Originalni dokument ostane shranjen v Slikaj Račun.";

  const result = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: company.recipientEmail,
    subject: `Strukturiran račun ${invoice.invoiceNumber || ""}`.trim(),
    html: brandedEmail({
      preheader: "Strukturiran XML račun",
      eyebrow: "Slikaj Račun · XML",
      title: "Strukturiran račun za uvoz",
      introHtml: `<p style="margin:0">V priponki je <strong>${formatLabel}</strong> XML za uvoz v računovodski sistem.</p>`,
      noticeHtml: fallbackNotice,
    }),
    attachments: [{ filename: resolved.filename, content: Buffer.from(resolved.xml, "utf8").toString("base64"), contentType: "application/xml" }],
  });
  if (result.error) throw new Error(`XML email delivery failed: ${result.error.message}`);
  await markSourceInvoice(documentId, true);
  await audit(documentId, "structured_delivery_success", {
    mode: settings.mode,
    requestedXmlFormat: settings.xmlFormat,
    xmlFormat: resolved.format,
    fallback: resolved.fallback,
    to: company.recipientEmail,
  });
  return { mode: settings.mode, xmlFormat: resolved.format, fallback: resolved.fallback };
}

async function markSourceInvoice(documentId: number, success: boolean, error?: string) {
  const db = getDb();
  const [doc] = await db.select({ sourceInvoiceId: invoiceDocuments.sourceInvoiceId }).from(invoiceDocuments).where(eq(invoiceDocuments.id, documentId)).limit(1);
  if (!doc?.sourceInvoiceId) return;
  await db.update(invoices).set(success
    ? { status: "sent", sentAt: new Date(), errorMessage: null }
    : { status: "failed", errorMessage: error?.slice(0, 2000) || "Structured delivery failed" })
    .where(eq(invoices.id, doc.sourceInvoiceId));
}

async function audit(documentId: number, action: string, metadata: Record<string, unknown>) {
  const db = getDb();
  const [doc] = await db.select({ clerkUserId: invoiceDocuments.clerkUserId }).from(invoiceDocuments).where(eq(invoiceDocuments.id, documentId)).limit(1);
  if (!doc) return;
  await db.insert(invoiceAuditLogs).values({ documentId, clerkUserId: doc.clerkUserId, action, metadataJson: JSON.stringify(metadata) });
}

function rawDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}
