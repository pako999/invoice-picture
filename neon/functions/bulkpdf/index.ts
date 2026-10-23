import { beginInvoiceTrace, traceInvoiceStage } from "../../../lib/invoice-intelligence/trace";
import { createHash, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { PDFDocument } from "pdf-lib";

const MAX_BYTES = 200 * 1024 * 1024;
const MAX_PAGES = 500;
const OCR_BATCH_PAGES = 25;
const EXTRACT_BATCH_SIZE = 1;
const SPLIT_BATCH_SIZE = 20;
const SIGNED_URL_SECONDS = 30 * 60;
const BUCKET = process.env.BULK_BUCKET || "bulk-invoices";
const INTERNAL_SECRET = process.env.BULK_INTERNAL_SECRET || "";
const CLERK_ISSUER = (process.env.CLERK_ISSUER || "https://clerk.invalid").replace(/\/$/, "");
const APP_BASE_URL = productionAppBaseUrl(process.env.APP_BASE_URL);

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  forcePathStyle: true,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});
const clerkJwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", CLERK_ISSUER));

type BulkRange = {
  startPage: number;
  endPage: number;
  boundaryConfidence: number | null;
  needsBoundaryReview: boolean;
};

type BulkJob = {
  id: number;
  clerkUserId: string;
  objectKey: string;
  filename: string;
  stage: string;
  pageCount: number | null;
  ocrNextPage: number;
  classifyCursor: number;
  totalInvoices: number;
  processedInvoices: number;
};

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, bucket: BUCKET, maxBytes: MAX_BYTES, maxPages: MAX_PAGES });
      }
      if (request.method === "POST" && url.pathname === "/sign-upload") return signUpload(request);
      if (request.method === "POST" && url.pathname === "/sign-download") return signDownload(request);
      if (request.method === "POST" && url.pathname === "/run") {
        const ownerId = await authenticatedUserId(request);
        if (!ownerId) return json({ error: "Unauthorized" }, 401);
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        const jobId = Number(body.jobId);
        if (!Number.isSafeInteger(jobId) || jobId <= 0) return json({ error: "Invalid job" }, 400);
        return drain({ jobId, ownerId }, 60_000);
      }
      if ((request.method === "GET" || request.method === "POST") && url.pathname === "/work") {
        console.log(`[bulkpdf] /work ${request.method} trigger=${Boolean(request.headers.get("x-neon-trigger-invocation-id"))}`);
        if (!request.headers.get("x-neon-trigger-invocation-id")) return json({ error: "Trigger authorization required" }, 403);
        return drain({}, 600_000);
      }
      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("[bulkpdf] request failed", messageOf(error));
      return json({ error: messageOf(error) }, 500);
    }
  },
};

async function signUpload(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const filename = sanitizeFilename(String(body.filename || "bulk.pdf"));
  const byteSize = Number(body.byteSize ?? body.size ?? 0);
  const mimeType = String(body.mimeType ?? body.contentType ?? "application/pdf");
  if (!Number.isInteger(byteSize) || byteSize <= 0 || byteSize > MAX_BYTES || mimeType !== "application/pdf") {
    return json({ error: "Invalid PDF upload." }, 400);
  }
  const objectKey = `bulk/${userId}/${Date.now()}-${randomUUID()}-${filename}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: objectKey, ContentType: "application/pdf" });
  const url = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });
  return json({
    url,
    uploadUrl: url,
    objectKey,
    key: objectKey,
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
  });
}

async function signDownload(request: Request) {
  const userId = await authenticatedUserId(request);
  if (!userId) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const key = String(body.key || "");
  if (!isOwnedObjectKey(key, userId)) return json({ error: "Forbidden" }, 403);
  return json({ url: await signedDownloadUrl(key) });
}

// Bounded request, not a resident daemon. Durable stage/locks survive termination.
// Never re-query an empty queue. Provider-pending steps back off instead of spinning.
async function drain(scope: { jobId?: number; ownerId?: string }, budgetMs: number) {
  const deadline = Date.now() + budgetMs;
  // Invocation-local only: reuse the parsed original across split chunks.
  const sourceCache: { key?: string; pdf?: PDFDocument } = {};
  let steps = 0;
  for (; steps < 100 && Date.now() < deadline; steps++) {
    const started = Date.now();
    const response = await work(scope, sourceCache);
    const body = await response.json() as Record<string, any>;
    console.log("invoice_stage_timing", { stage: "bulk_worker_step", jobId: body.jobId, workerStage: body.stage, ok: response.ok, durationMs: Date.now() - started });
    if (!response.ok || body.idle) return json({ ...body, steps }, response.status);
    const result = body.result || {};
    if (result.retrying || result.success === false) return json({ ...body, steps });
    if (result.batchPending || result.batchSubmitted || (result.batch && result.pages === 0)) {
      // Leave long provider batches to the scheduled recovery run; no idle DB loop.
      return json({ ...body, steps, providerPending: true });
    }
  }
  return json({ ok: true, steps, continuation: true });
}

async function work(scope: { jobId?: number; ownerId?: string }, sourceCache: { key?: string; pdf?: PDFDocument } = {}) {
  if (!INTERNAL_SECRET) {
    console.error("[bulkpdf] BULK_INTERNAL_SECRET is missing");
    return json({ error: "Worker is not configured" }, 503);
  }

  let claimedJobId: number | null = null;
  try {
    const next = await appPost<{ job: BulkJob | null }>("/api/internal/bulk/next", scope);
    const job = next.job;
    if (!job) return json({ ok: true, idle: true });
    claimedJobId = Number(job.id);
    console.log(`[bulkpdf] job ${job.id} stage ${job.stage}`);

    if (job.stage === "uploaded") {
      const bytes = await downloadObject(job.objectKey);
      const pdf = await traceInvoiceStage("preprocess",bytes.byteLength,{operation:"pdf_load_and_count",job_id:job.id},()=>PDFDocument.load(bytes, { updateMetadata: false }));
      sourceCache.key = job.objectKey;
      sourceCache.pdf = pdf;
      const pageCount = pdf.getPageCount();
      if (pageCount < 1 || pageCount > MAX_PAGES) throw new Error(`PDF page count ${pageCount} is outside the supported range`);
      await appPost("/api/internal/bulk/page-count", { jobId: job.id, pageCount });
      return json({ ok: true, jobId: job.id, stage: job.stage, pageCount });
    }

    if (job.stage === "ocr") {
      const documentUrl = await signedDownloadUrl(job.objectKey);
      const result = await appPost("/api/internal/bulk/ocr", {
        jobId: job.id,
        documentUrl,
        startPage: Number(job.ocrNextPage || 0),
        batchPages: OCR_BATCH_PAGES,
      });
      return json({ ok: true, jobId: job.id, stage: job.stage, result });
    }

    if (job.stage === "classify") {
      const result = await appPost("/api/internal/bulk/classify", { jobId: job.id });
      return json({ ok: true, jobId: job.id, stage: job.stage, result });
    }

    if (job.stage === "split") {
      const splitState = await appPost<{ ranges: BulkRange[]; existingGroupIndexes?: number[] }>(
        "/api/internal/bulk/ranges",
        { jobId: job.id },
      );
      const existing = new Set((splitState.existingGroupIndexes || []).map(Number));
      const pending = splitState.ranges
        .map((range, groupIndex) => ({ range, groupIndex }))
        .filter((item) => !existing.has(item.groupIndex))
        .slice(0, SPLIT_BATCH_SIZE);
      if (!pending.length) throw new Error("No pending PDF groups were found while the split stage is active");

      if (sourceCache.key !== job.objectKey || !sourceCache.pdf) {
        const bytes = await downloadObject(job.objectKey);
        sourceCache.pdf = await traceInvoiceStage("preprocess",bytes.byteLength,{operation:"pdf_load_for_split",job_id:job.id},()=>PDFDocument.load(bytes, { updateMetadata: false }));
        sourceCache.key = job.objectKey;
      }
      const source = sourceCache.pdf;
      const children = [] as Array<Record<string, unknown>>;
      for (const { range, groupIndex } of pending) {
        validateRange(range, source.getPageCount());
        const finishSplitTrace = beginInvoiceTrace("preprocess",null,{operation:"split_child_pdf",job_id:job.id,group_index:groupIndex});
        const child = await PDFDocument.create();
        const indexes = Array.from({ length: range.endPage - range.startPage + 1 }, (_, i) => range.startPage + i);
        const pages = await child.copyPages(source, indexes);
        pages.forEach((page) => child.addPage(page));
        const bytes = await child.save();
        finishSplitTrace({output_bytes:bytes.byteLength});
        const objectKey = `bulk/${job.clerkUserId}/jobs/${job.id}/invoice-${String(groupIndex + 1).padStart(3, "0")}.pdf`;
        await uploadPdf(objectKey, bytes);
        children.push({
          groupIndex,
          startPage: range.startPage,
          endPage: range.endPage,
          objectKey,
          byteSize: bytes.byteLength,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          boundaryConfidence: range.boundaryConfidence,
          needsBoundaryReview: range.needsBoundaryReview,
        });
      }
      const result = await appPost("/api/internal/bulk/split-complete", { jobId: job.id, children });
      return json({ ok: true, jobId: job.id, stage: job.stage, children: children.length, result });
    }

    if (job.stage === "extract") {
      const targetResult = await appPost<{
        targets?: Array<{ groupIndex: number; objectKey: string }>;
      }>("/api/internal/bulk/extract-targets", { jobId: job.id, limit: EXTRACT_BATCH_SIZE });
      const documents = await Promise.all((targetResult.targets || []).map(async (target) => ({
        groupIndex: Number(target.groupIndex),
        documentUrl: await signedDownloadUrl(String(target.objectKey)),
      })));
      const result = await appPost<{
        deliveryItems?: Array<{ groupIndex: number; objectKey: string; documentId: number }>;
        [key: string]: unknown;
      }>("/api/internal/bulk/extract", { jobId: job.id, batchSize: EXTRACT_BATCH_SIZE, documents });
      const deliveries = [] as Array<{ groupIndex: number; ok: boolean }>;
      for (const item of result.deliveryItems || []) {
        const objectUrl = await signedDownloadUrl(item.objectKey);
        try {
          await appPost("/api/internal/bulk/deliver-email", {
            jobId: job.id,
            groupIndex: item.groupIndex,
            objectUrl,
          });
          deliveries.push({ groupIndex: item.groupIndex, ok: true });
        } catch (error) {
          console.error(`[bulkpdf] delivery failed for job ${job.id} group ${item.groupIndex}`, messageOf(error));
          deliveries.push({ groupIndex: item.groupIndex, ok: false });
        }
      }
      return json({ ok: true, jobId: job.id, stage: job.stage, result, deliveries });
    }

    throw new Error(`Unsupported active bulk stage: ${job.stage}`);
  } catch (error) {
    const message = messageOf(error);
    console.error(`[bulkpdf] worker failed${claimedJobId ? ` for job ${claimedJobId}` : ""}`, message);
    if (claimedJobId) {
      await appPost("/api/internal/bulk/release", { jobId: claimedJobId, error: message }).catch((releaseError) => {
        console.error(`[bulkpdf] could not release job ${claimedJobId}`, messageOf(releaseError));
      });
    }
    return json({ error: message, jobId: claimedJobId }, 500);
  }
}

async function authenticatedUserId(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  try {
    const token = authorization.slice(7);
    const { payload } = await jwtVerify(token, clerkJwks, { issuer: CLERK_ISSUER });
    const actorId = typeof payload.sub === "string" && payload.sub ? payload.sub : null;
    if (!actorId) return null;
    const ownerId = request.headers.get("x-workspace-owner");
    if (!ownerId || ownerId === actorId) return actorId;
    // The app rechecks membership and the current plan's user limit. A caller
    // cannot grant workspace access by supplying an owner header.
    const permission = await appPost<{allowed:boolean}>("/api/internal/workspace/authorize", { actorId, ownerId });
    return permission.allowed ? ownerId : null;
  } catch {
    return null;
  }
}

async function appPost<T = Record<string, unknown>>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${APP_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bulk-secret": INTERNAL_SECRET },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const detail = String(result.error || result.message || response.statusText || "request failed");
    throw new Error(`${path} failed (${response.status}): ${detail}`);
  }
  return result as T;
}

async function signedDownloadUrl(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: SIGNED_URL_SECONDS });
}

async function downloadObject(key: string) {
  return traceInvoiceStage("file_read",null,{operation:"object_storage_pdf_download"},async()=>{
  const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!result.Body) throw new Error(`Object ${key} has no body`);
  const bytes = await result.Body.transformToByteArray();
  if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) throw new Error(`Object ${key} has an invalid size`);
  if (Buffer.from(bytes.subarray(0, 4)).toString() !== "%PDF") throw new Error(`Object ${key} is not a PDF`);
  return bytes;
  });
}

async function uploadPdf(key: string, bytes: Uint8Array) {
  await traceInvoiceStage("upload",bytes.byteLength,{operation:"child_pdf_storage_put"},()=>s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: bytes,
    ContentType: "application/pdf",
    ContentLength: bytes.byteLength,
  })));
}

function validateRange(range: BulkRange, pageCount: number) {
  if (!Number.isInteger(range.startPage) || !Number.isInteger(range.endPage) || range.startPage < 0 || range.endPage < range.startPage || range.endPage >= pageCount) {
    throw new Error(`Invalid split range ${range.startPage}-${range.endPage}`);
  }
}

function productionAppBaseUrl(value: string | undefined) {
  try {
    const url = new URL(value || "https://posljiracun.si");
    if (url.protocol !== "https:" || (url.hostname !== "posljiracun.si" && !url.hostname.endsWith(".posljiracun.si"))) {
      return "https://posljiracun.si";
    }
    return url.origin;
  } catch {
    return "https://posljiracun.si";
  }
}

function isOwnedObjectKey(key: string, userId: string) {
  return key.startsWith(`bulk/${userId}/`) && key.length <= 1024 && !key.includes("..") && !key.includes("\\");
}

function sanitizeFilename(value: string) {
  return value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_").slice(0, 180) || "bulk.pdf";
}

function json(value: unknown, status = 200) {
  return cors(new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  }));
}

function cors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Headers", "authorization, content-type");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

