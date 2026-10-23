import { ProviderRequestError } from "@/lib/invoice-intelligence/provider-errors";

/** Per-stage errors are bounded separately from successful worker steps. */
export async function failBulkStage(sql: any, jobId: number, error: unknown, stage: string) {
  const message = error instanceof Error ? error.message : String(error);
  const [previous] = await sql`SELECT "status","lastError" FROM "bulkInvoiceJobs" WHERE "id"=${jobId} LIMIT 1`;
  if (previous?.status === "failed") return { message, retrying: false, status: 503 };
  const attempt = Number(String(previous?.lastError ?? "").match(/^\[stage-error:(\d+)\]/)?.[1] ?? 0) + 1;
  const exhausted = error instanceof ProviderRequestError || attempt >= 2;
  const stored = `[stage-error:${attempt}] [stage:${stage}] ${message}`.slice(0, 2000);
  await sql`UPDATE "bulkInvoiceJobs" SET "status"=${exhausted ? "failed" : "processing"},
    "stage"=${exhausted ? "failed" : stage},"lockedAt"=NULL,"lastError"=${stored},
    "completedAt"=${exhausted ? new Date() : null},"updatedAt"=now()
    WHERE "id"=${jobId} AND "status"='processing'`;
  return { message, retrying: !exhausted, status: error instanceof ProviderRequestError && error.status != null && error.status < 500 ? error.status : 503 };
}
