import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { clerkClient } from "@clerk/nextjs/server";
import { getResend } from "@/lib/resend";
import { brandedEmail } from "@/lib/email-template";
import { createOcrRunBudget, estimateSourcePages, OcrRunBudgetError, OcrSafetyQuotaError, reserveOcrProviderBudget } from "./safety";
import { mergeDetectedInvoices, readInvoiceBatchChunk, type BatchDetectedInvoice } from "./eslog-batch-reader";
import { generateEslog20Xml } from "./eslog20";
import { createStoredZip } from "./zip";
import { validateInvoice } from "./validation";
import { normalizedInvoiceSchema, type NormalizedInvoice } from "./types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const OPEN_BATCH_IDLE_SECONDS = 45;

type StoredDetected = BatchDetectedInvoice & { originalEslogXml?: string };

export async function appendEslogBatchSource(args: {
  clerkUserId: string;
  companyId: number;
  recipientEmail: string;
  sourceInvoiceId: number | null;
  filename: string;
  mimeType: string;
  base64: string;
}) {
  const bytes = Buffer.from(args.base64, "base64");
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) throw new Error("Invalid eSLOG batch file or file is larger than 10 MB");
  const sql = db();
  const active = await sql`
    SELECT "id", "batchKey" FROM "invoiceEslogBatches"
    WHERE "clerkUserId" = ${args.clerkUserId}
      AND "companyId" = ${args.companyId}
      AND "status" = 'collecting'
      AND "lastActivityAt" > now() - (${OPEN_BATCH_IDLE_SECONDS} || ' seconds')::interval
    ORDER BY "lastActivityAt" DESC
    LIMIT 1
  `;

  let batchId: number;
  let batchKey: string;
  if (active.length) {
    batchId = Number(active[0].id);
    batchKey = String(active[0].batchKey);
  } else {
    batchKey = randomUUID();
    const created = await sql`
      INSERT INTO "invoiceEslogBatches" ("batchKey", "clerkUserId", "companyId", "recipientEmail", "status", "lastActivityAt", "createdAt", "updatedAt")
      VALUES (${batchKey}, ${args.clerkUserId}, ${args.companyId}, ${args.recipientEmail}, 'collecting', now(), now(), now())
      RETURNING "id"
    `;
    batchId = Number(created[0].id);
  }

  const incremented = await sql`
    UPDATE "invoiceEslogBatches"
    SET "sourceCount" = "sourceCount" + 1, "lastActivityAt" = now(), "updatedAt" = now()
    WHERE "id" = ${batchId}
    RETURNING "sourceCount"
  `;
  const sourceOrder = Number(incremented[0].sourceCount) - 1;
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  await sql`
    INSERT INTO "invoiceEslogBatchSources" (
      "batchId", "sourceInvoiceId", "sourceOrder", "filename", "mimeType", "originalBase64", "sha256", "byteSize", "status", "createdAt", "updatedAt"
    ) VALUES (
      ${batchId}, ${args.sourceInvoiceId}, ${sourceOrder}, ${safeFilename(args.filename)}, ${args.mimeType}, ${args.base64}, ${sha256}, ${bytes.length}, 'queued', now(), now()
    )
  `;
  return { batchId, batchKey, sourceOrder };
}

export async function runQueuedEslogBatches() {
  const sql = db();
  await sql`
    UPDATE "invoiceEslogBatches"
    SET "status" = 'queued', "updatedAt" = now()
    WHERE "status" = 'collecting'
      AND "lastActivityAt" < now() - (${OPEN_BATCH_IDLE_SECONDS} || ' seconds')::interval
  `;
  await sql`
    UPDATE "invoiceEslogBatchSources"
    SET "status" = 'queued', "updatedAt" = now()
    WHERE "status" = 'processing' AND "updatedAt" < now() - interval '5 minutes'
  `;

  const batches = await sql`
    SELECT * FROM "invoiceEslogBatches"
    WHERE "status" IN ('queued', 'processing')
    ORDER BY "createdAt" ASC
    LIMIT 1
  `;
  if (!batches.length) return { processedChunks: 0, finalized: 0, batchKey: null as string | null };
  const batch = batches[0];
  const batchId = Number(batch.id);
  await sql`UPDATE "invoiceEslogBatches" SET "status" = 'processing', "updatedAt" = now() WHERE "id" = ${batchId}`;

  const sources = await sql`
    SELECT * FROM "invoiceEslogBatchSources"
    WHERE "batchId" = ${batchId} AND "status" = 'queued'
    ORDER BY "sourceOrder" ASC
    LIMIT 1
  `;

  let processedChunks = 0;
  if (sources.length) {
    const source = sources[0];
    const locked = await sql`
      UPDATE "invoiceEslogBatchSources" SET "status" = 'processing', "updatedAt" = now()
      WHERE "id" = ${Number(source.id)} AND "status" = 'queued'
      RETURNING "id"
    `;
    if (locked.length) {
      try {
        await processSourceChunk(batch, source);
        processedChunks = 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (error instanceof OcrSafetyQuotaError || error instanceof OcrRunBudgetError) {
          await sql`
            UPDATE "invoiceEslogBatchSources" SET "status" = 'queued', "errorMessage" = ${message.slice(0, 2000)}, "updatedAt" = now()
            WHERE "id" = ${Number(source.id)}
          `;
          await sql`UPDATE "invoiceEslogBatches" SET "status" = 'queued', "errorMessage" = ${message.slice(0, 2000)}, "updatedAt" = now() WHERE "id" = ${batchId}`;
        } else {
          await sql`
            UPDATE "invoiceEslogBatchSources" SET "status" = 'failed', "errorMessage" = ${message.slice(0, 2000)}, "updatedAt" = now()
            WHERE "id" = ${Number(source.id)}
          `;
          await sql`UPDATE "invoiceEslogBatches" SET "status" = 'needs_review', "errorMessage" = ${message.slice(0, 2000)}, "updatedAt" = now() WHERE "id" = ${batchId}`;
          await notifyBatchProblem(batch, message);
        }
      }
    }
  }

  const finalized = await finalizeIfReady(batchId);
  return { processedChunks, finalized: finalized ? 1 : 0, batchKey: String(batch.batchKey) };
}

async function processSourceChunk(batch: any, source: any) {
  const sql = db();
  const sourceId = Number(source.id);
  const mimeType = String(source.mimeType);
  const filename = String(source.filename);
  const base64 = String(source.originalBase64);
  const rawText = /xml/i.test(mimeType) || /\.xml$/i.test(filename)
    ? Buffer.from(base64, "base64").toString("utf8")
    : "";

  if (rawText && isOriginalEslog20(rawText)) {
    const stored: StoredDetected[] = [{
      startPage: 0,
      endPage: 0,
      continuesPrevious: false,
      invoice: emptyStoredInvoice(),
      originalEslogXml: rawText,
    }];
    await sql`
      UPDATE "invoiceEslogBatchSources"
      SET "pageCount" = 1, "nextPage" = 1, "partialResultsJson" = ${JSON.stringify(stored)}, "status" = 'completed', "errorMessage" = NULL, "updatedAt" = now()
      WHERE "id" = ${sourceId}
    `;
    return;
  }

  const isImage = mimeType.startsWith("image/");
  const estimated = isImage ? 1 : estimateSourcePages({ base64, mimeType, filename });
  const maxPages = envInt("INVOICE_ESLOG_MAX_PAGES_PER_SOURCE", 48, 1, 200);
  const pageCount = Number(source.pageCount) > 0 ? Number(source.pageCount) : Math.max(1, estimated ?? 8);
  if (pageCount > maxPages) throw new Error(`PDF has ${pageCount} pages; eSLOG safety limit is ${maxPages} pages per source file.`);

  const nextPage = Math.max(0, Number(source.nextPage) || 0);
  const start = nextPage === 0 ? 0 : Math.max(0, nextPage - 1);
  const end = Math.min(pageCount - 1, start + 7);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const runBudget = createOcrRunBudget();
  await reserveOcrProviderBudget({ clerkUserId: String(batch.clerkUserId), provider: "mistral", pages: pages.length, runBudget });
  const result = await readInvoiceBatchChunk({ base64, mimeType, filename, pages });
  const previous = parseStored(source.partialResultsJson);
  const merged = mergeDetectedInvoices(previous.filter((x) => !x.originalEslogXml), result.invoices) as StoredDetected[];
  const nextUnseen = end + 1;
  const done = nextUnseen >= pageCount;
  if (done && merged.length === 0) throw new Error(`No invoice was detected in ${filename}`);
  await sql`
    UPDATE "invoiceEslogBatchSources"
    SET "pageCount" = ${pageCount}, "nextPage" = ${nextUnseen}, "partialResultsJson" = ${JSON.stringify(merged)},
        "status" = ${done ? "completed" : "queued"}, "errorMessage" = NULL, "updatedAt" = now()
    WHERE "id" = ${sourceId}
  `;
}

async function finalizeIfReady(batchId: number) {
  const sql = db();
  const batches = await sql`SELECT * FROM "invoiceEslogBatches" WHERE "id" = ${batchId} LIMIT 1`;
  if (!batches.length || !["queued", "processing"].includes(String(batches[0].status))) return false;
  const batch = batches[0];
  const sources = await sql`SELECT * FROM "invoiceEslogBatchSources" WHERE "batchId" = ${batchId} ORDER BY "sourceOrder" ASC`;
  if (!sources.length || sources.some((s) => String(s.status) !== "completed")) return false;

  const companyRows = await sql`SELECT "name" FROM "companies" WHERE "id" = ${Number(batch.companyId)} AND "clerkUserId" = ${String(batch.clerkUserId)} LIMIT 1`;
  const fallbackBuyerName = companyRows[0]?.name ? String(companyRows[0].name) : null;
  const xmlFiles: Array<{ name: string; content: string }> = [];
  const sourceInvoiceIds: number[] = [];
  let counter = 0;

  for (const source of sources) {
    if (source.sourceInvoiceId) sourceInvoiceIds.push(Number(source.sourceInvoiceId));
    for (const detected of parseStored(source.partialResultsJson)) {
      counter += 1;
      if (detected.originalEslogXml) {
        xmlFiles.push({ name: `${String(counter).padStart(3, "0")}_${safeBase(source.filename || "eslog")}.xml`, content: detected.originalEslogXml });
        continue;
      }
      const invoice = normalizedInvoiceSchema.parse(detected.invoice);
      const validation = validateInvoice(invoice);
      const missing = exportMissing(invoice, fallbackBuyerName);
      if (validation.status === "failed" || missing.length) {
        const reason = `Invoice ${invoice.invoiceNumber || counter} requires review before eSLOG export: ${[...validation.errors, ...missing].join("; ")}`;
        await sql`UPDATE "invoiceEslogBatches" SET "status" = 'needs_review', "errorMessage" = ${reason.slice(0, 2000)}, "updatedAt" = now() WHERE "id" = ${batchId}`;
        await notifyBatchProblem(batch, reason);
        return false;
      }
      const xml = generateEslog20Xml(invoice, { fallbackBuyerName });
      xmlFiles.push({ name: `${String(counter).padStart(3, "0")}_${safeBase(invoice.invoiceNumber || `racun-${counter}`)}.xml`, content: xml });
    }
  }

  if (!xmlFiles.length) throw new Error("No eSLOG invoices available for ZIP export");
  const zip = createStoredZip(xmlFiles);
  const zipFilename = `eslog-racuni-${new Date().toISOString().slice(0, 10)}-${String(batch.batchKey).slice(0, 8)}.zip`;
  const send = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: String(batch.recipientEmail),
    subject: `eSLOG paket · ${xmlFiles.length} računov`,
    html: brandedEmail({
      preheader: `${xmlFiles.length} eSLOG računov za paketni uvoz`,
      eyebrow: "Slikaj Račun · eSLOG 2.0",
      title: `${xmlFiles.length} računov pripravljenih za uvoz`,
      introHtml: `<p style="margin:0">V priponki je en ZIP z <strong>${xmlFiles.length}</strong> ločenimi eSLOG 2.0 XML računi. Večstranski računi so ostali skupaj, različni računi pa so ločeni.</p>`,
      noticeHtml: "ZIP lahko uvozite kot paket v računovodski sistem, ki podpira paketni uvoz eSLOG datotek.",
    }),
    attachments: [{ filename: zipFilename, content: zip.toString("base64"), contentType: "application/zip" }],
  });
  if (send.error) throw new Error(`eSLOG ZIP email failed: ${send.error.message}`);

  if (sourceInvoiceIds.length) {
    await sql`
      UPDATE "invoices" SET "status" = 'sent', "sentAt" = now(), "errorMessage" = NULL
      WHERE "id" = ANY(${sourceInvoiceIds})
    `;
  }
  await sql`
    UPDATE "invoiceEslogBatches"
    SET "status" = 'completed', "totalInvoices" = ${xmlFiles.length}, "zipFilename" = ${zipFilename}, "zipBase64" = ${zip.toString("base64")},
        "errorMessage" = NULL, "completedAt" = now(), "updatedAt" = now()
    WHERE "id" = ${batchId}
  `;
  return true;
}

function parseStored(value: unknown): StoredDetected[] {
  if (!value) return [];
  try { const parsed = JSON.parse(String(value)); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function isOriginalEslog20(xml: string) {
  return /<Invoice\b[^>]*xmlns=["']urn:eslog:2\.00["'][^>]*>/i.test(xml)
    && /<M_INVOIC\b/i.test(xml)
    && /<D_0065>\s*INVOIC\s*<\/D_0065>/i.test(xml);
}

function exportMissing(invoice: NormalizedInvoice, fallbackBuyerName: string | null) {
  const missing: string[] = [];
  if (!invoice.invoiceNumber) missing.push("invoiceNumber missing");
  if (!invoice.issueDate) missing.push("issueDate missing");
  if (!invoice.supplier.name) missing.push("supplier name missing");
  if (!invoice.buyer.name && !fallbackBuyerName) missing.push("buyer name missing");
  if (!invoice.currency) missing.push("currency missing");
  if (!invoice.totals.netAmount) missing.push("net total missing");
  if (!invoice.totals.grossAmount) missing.push("gross total missing");
  return missing;
}

async function notifyBatchProblem(batch: any, message: string) {
  const recipients = new Set<string>();
  try {
    const user = await (await clerkClient()).users.getUser(String(batch.clerkUserId));
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ?? user.emailAddresses[0];
    if (primary?.emailAddress) recipients.add(primary.emailAddress);
  } catch { /* best effort */ }
  for (const e of (process.env.ADMIN_EMAILS || "").split(",").map((x) => x.trim()).filter(Boolean)) recipients.add(e);
  if (!recipients.size) return;
  await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: [...recipients],
    subject: "eSLOG paket potrebuje pregled",
    html: brandedEmail({
      preheader: "eSLOG paket ni bil poslan",
      eyebrow: "Slikaj Račun · pregled",
      title: "eSLOG paket potrebuje pregled",
      introHtml: `<p style="margin:0">Paket ni bil poslan v računovodski program, ker podatki niso dovolj zanesljivi za varen eSLOG izvoz.</p>`,
      noticeHtml: escapeHtml(message).slice(0, 1500),
    }),
  }).catch(() => undefined);
}

function emptyStoredInvoice(): NormalizedInvoice {
  return {
    documentType: "invoice", documentLanguage: null,
    supplier: { name: null, address: null, postalCode: null, city: null, countryCode: null, vatNumber: null, registrationNumber: null, email: null, phone: null, iban: null, bic: null },
    buyer: { name: null, address: null, postalCode: null, city: null, countryCode: null, vatNumber: null, registrationNumber: null },
    invoiceNumber: null, purchaseOrderNumber: null, issueDate: null, serviceDate: null, dueDate: null, paymentReference: null, paymentTerms: null, currency: null,
    lineItems: [], totals: { netAmount: null, discountAmount: null, vatAmount: null, grossAmount: null, amountPaid: null, amountDue: null }, vatBreakdown: [],
    confidence: { overall: 1, fields: {} }, warnings: [], validationStatus: "valid",
  };
}
function safeFilename(v: string) { return (v.split(/[\\/]/).pop() || "invoice").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 255); }
function safeBase(v: string) { return String(v).replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "racun"; }
function escapeHtml(v: string) { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function envInt(name: string, fallback: number, min: number, max: number) { const n = Number.parseInt(process.env[name] || "", 10); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback; }
function db() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set"); return neon(process.env.DATABASE_URL); }
