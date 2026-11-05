import { ProviderRequestError } from "@/lib/invoice-intelligence/provider-errors";

/** Persist transient failures for recovery workers instead of losing accepted jobs. */
export async function failBulkStage(sql: any, jobId: number, error: unknown, stage: string) {
  const message = error instanceof Error ? error.message : String(error);
  const [previous] = await sql`SELECT "status","lastError" FROM "bulkInvoiceJobs" WHERE "id"=${jobId} LIMIT 1`;
  if (previous?.status === "failed") return { message, retrying: false, status: 503 };
  const oldError = String(previous?.lastError ?? "");
  const previousAttempt = Number(oldError.match(/^\\[(?:stage-error|rate-limit):(\\d+)\\]/)?.[1] ?? 0);
  const retryableProviderRejection = error instanceof ProviderRequestError
    && error.acceptance === "rejected" && error.status === 429 && !error.attemptsExhausted;
  const attempt = previousAttempt + 1;
  const exhausted = retryableProviderRejection ? attempt >= 8 : error instanceof ProviderRequestError || attempt >= 2;
  const prefix = retryableProviderRejection ? "rate-limit" : "stage-error";
  const stored = `[${prefix}:${attempt}] [stage:${stage}] ${message}`.slice(0, 2000);
  await sql`UPDATE "bulkInvoiceJobs" SET "status"=${exhausted ? "failed" : "processing"},
    "stage"=${exhausted ? "failed" : stage},"lockedAt"=NULL,"lastError"=${stored},
    "completedAt"=${exhausted ? new Date() : null},"updatedAt"=now()
    WHERE "id"=${jobId} AND "status"='processing'`;
  return { message, retrying: !exhausted, status: retryableProviderRejection ? 429 : error instanceof ProviderRequestError && error.status != null && error.status < 500 ? error.status : 503 };
}
