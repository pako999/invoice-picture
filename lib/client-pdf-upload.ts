import { MAX_PDF_UPLOAD_BYTES, PDF_UPLOAD_CHUNK_BYTES, pdfUploadChunkCount } from "@/lib/pdf-upload-limits";

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
  if (file.size <= 0 || file.size > MAX_PDF_UPLOAD_BYTES) throw new Error("PDF must be 10 MB or smaller");

  const uploadId = crypto.randomUUID();
  const totalChunks = pdfUploadChunkCount(file.size);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * PDF_UPLOAD_CHUNK_BYTES;
    const end = Math.min(file.size, start + PDF_UPLOAD_CHUNK_BYTES);
    const data = await blobToBase64(file.slice(start, end));

    const result = await postJsonWithRetry("/api/upload-chunk", {
      uploadId,
      chunkIndex,
      totalChunks,
      data,
    });

    if (!result.response.ok) {
      throw new Error(result.json.error || `Upload failed (${result.response.status})`);
    }
  }

  const result = await postJsonWithRetry("/api/finalize-upload", {
    uploadId,
    totalChunks,
    byteSize: file.size,
    subject: metadata.subject,
    filename: file.name,
    mime: "application/pdf",
    ...(metadata.companyId ? { companyId: metadata.companyId } : {}),
    ...(metadata.messageBody ? { messageBody: metadata.messageBody } : {}),
  });

  return { status: result.response.status, json: result.json };
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read PDF chunk"));
    reader.readAsDataURL(blob);
  });
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

      const retryAfter = Number(response.headers.get("Retry-After") || 0);
      const delayMs = retryAfter > 0
        ? retryAfter * 1000
        : Math.min(8000, 500 * 2 ** (attempt - 1));
      await sleep(delayMs);
    } catch (error) {
      if (attempt === MAX_RETRY_ATTEMPTS) throw error;
      await sleep(Math.min(8000, 500 * 2 ** (attempt - 1)));
    }
  }

  if (!lastResponse) throw new Error("Upload request failed");
  return { response: lastResponse, json: lastJson };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
