import { BULK_PDF_MAX_BYTES } from "@/lib/bulk-invoices/public-config";

const MAX_RETRY_ATTEMPTS = 5;

export type QueuedPdfResult = {
  status: number;
  json: Record<string, any>;
};

export async function queuePdfUpload(
  file: File,
  metadata: {
    subject: string;
    companyId?: number;
    messageBody?: string;
  },
): Promise<QueuedPdfResult> {
  if (file.type !== "application/pdf") throw new Error("Expected a PDF file");
  if (file.size <= 0 || file.size > BULK_PDF_MAX_BYTES) throw new Error("PDF must be 200 MB or smaller");

  const signed = await postJsonWithRetry("/api/bulk-invoices/sign-upload", {
    filename: file.name,
    byteSize: file.size,
    mimeType: "application/pdf",
  });

  if (!signed.response.ok) {
    throw new Error(signed.json.error || `Priprava PDF uploada ni uspela (${signed.response.status})`);
  }

  const uploadUrl = String(signed.json.url || "");
  const objectKey = String(signed.json.objectKey || "");
  if (!uploadUrl || !objectKey) throw new Error("Bulk storage upload URL manjka");

  const uploadHeaders: Record<string, string> = {
    "Content-Type": "application/pdf",
    ...(signed.json.headers && typeof signed.json.headers === "object" ? signed.json.headers : {}),
  };
  const uploadMethod = typeof signed.json.method === "string" ? signed.json.method : "PUT";

  const uploaded = await fetchWithRetry(uploadUrl, {
    method: uploadMethod,
    headers: uploadHeaders,
    body: file,
  });
  if (!uploaded.ok) {
    throw new Error(`PDF upload v zasebno shrambo ni uspel (${uploaded.status})`);
  }

  const registered = await postJsonWithRetry("/api/bulk-invoices/register", {
    objectKey,
    filename: file.name,
    byteSize: file.size,
    ...(metadata.companyId ? { companyId: metadata.companyId } : {}),
  });

  const job = registered.json.job && typeof registered.json.job === "object" ? registered.json.job : null;
  return {
    status: registered.response.status,
    json: {
      ...registered.json,
      queued: registered.response.ok && Boolean(registered.json.success),
      bulkJobId: job?.id ?? null,
      bulk: true,
    },
  };
}

async function postJsonWithRetry(
  url: string,
  body: Record<string, unknown>,
): Promise<{ response: Response; json: Record<string, any> }> {
  let lastResponse: Response | null = null;
  let lastJson: Record<string, any> = {};

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json().catch(() => ({})) as Record<string, any>;
      lastResponse = response;
      lastJson = json;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_RETRY_ATTEMPTS) return { response, json };

      await sleep(retryDelay(response, attempt));
    } catch (error) {
      if (attempt === MAX_RETRY_ATTEMPTS) throw error;
      await sleep(Math.min(8000, 600 * 2 ** (attempt - 1)));
    }
  }

  if (!lastResponse) throw new Error("Upload request failed");
  return { response: lastResponse, json: lastJson };
}

async function fetchWithRetry(url: string, init: RequestInit) {
  let last: Response | null = null;
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, init);
      last = response;
      if (response.ok || (response.status < 500 && response.status !== 429) || attempt === MAX_RETRY_ATTEMPTS) return response;
      await sleep(retryDelay(response, attempt));
    } catch (error) {
      if (attempt === MAX_RETRY_ATTEMPTS) throw error;
      await sleep(Math.min(8000, 600 * 2 ** (attempt - 1)));
    }
  }
  if (!last) throw new Error("PDF upload failed");
  return last;
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("Retry-After") || 0);
  return retryAfter > 0 ? retryAfter * 1000 : Math.min(8000, 600 * 2 ** (attempt - 1));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
