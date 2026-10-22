/** Shared, serializable status contract for the upload → OCR → delivery screen. */
export type FlowUpload = {
  key: string;
  filename: string;
  status: "waiting" | "uploading" | "accepted" | "failed";
  invoiceId?: number;
  documentId?: number;
  bulkJobId?: number;
  error?: string;
};

export type FlowDelivery = {
  mode: string;
  target: string | null;
  status: "sent" | "sending" | "queued" | "awaiting_approval" | "retrying" | "failed" | "not_requested";
  error: string | null;
};

export type FlowDocument = {
  id: number;
  sourceInvoiceId: number | null;
  bulkJobId: number | null;
  filename: string;
  status: string;
  error: string | null;
  delivery: FlowDelivery;
};

export type FlowBatch = {
  id: number;
  filename: string;
  stage: string;
  deliveryMode: string;
  target: string | null;
  pageCount: number | null;
  ocrNextPage: number;
  totalInvoices: number;
  processedInvoices: number;
  error: string | null;
};

export type FlowSnapshot = {
  invoices: Array<{ id: number; filename: string; documentId: number | null; status: string; error: string | null; delivery: FlowDelivery }>;
  documents: FlowDocument[];
  batches: FlowBatch[];
  groups: Array<{ jobId: number; groupIndex: number; documentId: number | null; status: string; delivery: FlowDelivery }>;
};

export type FlowItem = {
  key: string;
  filename: string;
  status: string;
  documentId?: number;
  bulkJobId?: number;
  groupIndex?: number;
  error?: string | null;
  delivery?: FlowDelivery;
};

export function positiveId(value: unknown): number | undefined {
  const id = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

/** Responsive during normal OCR; bounded backoff for long-running batches. */
export function flowPollDelay(elapsedMs: number, unchanged: number): number {
  return elapsedMs < 90_000 ? 2000 : Math.min(15000, 3000 + unchanged * 2000);
}

export function isOcrWorking(status: string) {
  return ["uploaded", "queued", "processing", "waiting", "uploading"].includes(status);
}

export function isOcrReady(status: string) {
  return status === "approved" || status === "needs_review";
}

export function flowItems(uploads: FlowUpload[], snapshot: FlowSnapshot | null): FlowItem[] {
  const items: FlowItem[] = [];
  const documents = new Map(snapshot?.documents.map((item) => [item.id, item]));
  const sources = new Map(snapshot?.invoices.map((item) => [item.id, item]));
  const batches = new Map(snapshot?.batches.map((item) => [item.id, item]));
  const batchGroups = new Map<number, FlowSnapshot["groups"]>();
  for (const group of snapshot?.groups ?? []) {
    const list = batchGroups.get(group.jobId) ?? [];
    list.push(group);
    batchGroups.set(group.jobId, list);
  }
  for (const upload of uploads) {
    const base = { key: upload.key, filename: upload.filename, status: upload.status, error: upload.error };
    if (upload.status !== "accepted") { items.push(base); continue; }
    if (!snapshot) { items.push({ ...base, status: "queued" }); continue; }
    if (upload.bulkJobId) {
      const batch = batches.get(upload.bulkJobId);
      if (!batch) { items.push({ ...base, status: "unavailable" }); continue; }
      const groups = batchGroups.get(batch.id) ?? [];
      if (!groups.length) {
        items.push({ ...base, status: batch.stage, bulkJobId: batch.id, error: batch.error });
      } else for (const group of groups) {
        const doc = group.documentId == null ? undefined : documents.get(group.documentId);
        items.push({
          key: `batch-${batch.id}-${group.groupIndex}`, filename: doc?.filename ?? `${batch.filename} · ${group.groupIndex + 1}`,
          status: doc?.status ?? (group.status === "extracted" && batch.deliveryMode === "split_pdf_email" ? "split_ready" : batch.stage),
          documentId: doc?.id, bulkJobId: batch.id, groupIndex: group.groupIndex,
          error: doc?.error ?? batch.error, delivery: doc?.delivery ?? group.delivery,
        });
      }
      continue;
    }
    const source = upload.invoiceId ? sources.get(upload.invoiceId) : undefined;
    const documentId = source?.documentId ?? upload.documentId;
    const doc = documentId ? documents.get(documentId) : undefined;
    if (doc) {
      items.push({ ...base, key: `document-${doc.id}`, filename: doc.filename, status: doc.status, documentId: doc.id,
        bulkJobId: doc.bulkJobId ?? undefined, error: doc.error, delivery: doc.delivery });
    } else if (source) {
      // An original can be sent even when OCR admission failed. Never call this OCR success.
      items.push({ ...base, status: "ocr_unavailable", error: upload.error ?? source.error, delivery: source.delivery });
    } else items.push({ ...base, status: "unavailable" });
  }
  return [...new Map(items.map((item) => [item.key, item])).values()];
}

export function shouldPollFlow(uploads: FlowUpload[], snapshot: FlowSnapshot) {
  const items = flowItems(uploads, snapshot);
  const batches = new Map(snapshot.batches.map((batch) => [batch.id, batch]));
  return snapshot.batches.some((batch) => !["completed", "failed", "boundary_review", "quota_wait"].includes(batch.stage))
    || items.some((item) => {
      const batch = item.bulkJobId ? batches.get(item.bulkJobId) : undefined;
      if (batch && ["failed", "boundary_review", "quota_wait"].includes(batch.stage)) return false;
      return isOcrWorking(item.status) || ["sending", "queued", "retrying"].includes(item.delivery?.status ?? "");
    });
}

/** A delivery queue's "completed" flag is not a receipt (e.g. XML ZIP awaiting other approvals). */
export function deliveryState(input: {
  mode: string; target: string | null; documentStatus?: string | null; sent?: boolean;
  queueStatus?: string | null; attempts?: number | null; maxAttempts?: number | null; error?: string | null;
  originalStatus?: string | null;
}): FlowDelivery {
  const { mode, target } = input;
  let status: FlowDelivery["status"];
  if (input.sent) status = "sent";
  else if (!target) status = "not_requested";
  else if (input.queueStatus === "failed" || input.originalStatus === "failed") {
    status = input.queueStatus === "failed" && (input.attempts ?? 0) < (input.maxAttempts ?? 0) ? "retrying" : "failed";
  } else if (["xml_email", "xml_zip_email", "api_json"].includes(mode) && input.documentStatus !== "approved") status = "awaiting_approval";
  else if (["processing", "sending"].includes(input.queueStatus ?? "")) status = "sending";
  else status = "queued";
  return { mode, target, status, error: status === "sent" ? null : input.error ?? null };
}
