import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { ProviderCapacityError } from "./provider-errors";

let sqlClient: ReturnType<typeof neon<false, false>> | undefined;
export async function acquireMistralSlot(signal?: AbortSignal | null) {
  const configured = Number(process.env.MISTRAL_MAX_CONCURRENT_REQUESTS ?? 3);
  const limit = Number.isInteger(configured) && configured >= 1 && configured <= 10 ? configured : 3;
  // Provider-only benchmarks do not have a database. App deployments fail
  // closed through their normal DATABASE_URL configuration.
  if (process.env.INVOICE_PROVIDER_BENCHMARK === "1") return async () => {};
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = sqlClient ??= neon(process.env.DATABASE_URL);
  const token = randomUUID(), deadline = Date.now() + 20_000;
  do {
    signal?.throwIfAborted();
    const rows = await sql`
      UPDATE "invoiceProviderSlots" SET "token"=${token},"expiresAt"=now()+interval '180 seconds'
      WHERE "slot"=(SELECT "slot" FROM "invoiceProviderSlots"
        WHERE "slot"<=${limit} AND "expiresAt"<=now() ORDER BY "slot" LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING "slot"`;
    if (rows.length) {
      const slot = Number(rows[0].slot);
      return async () => { await sql`UPDATE "invoiceProviderSlots" SET "expiresAt"='1970-01-01',"token"=NULL WHERE "slot"=${slot} AND "token"=${token}`; };
    }
    // Only active requests wait; there is no resident worker or idle polling.
    await new Promise(resolve => setTimeout(resolve, 1000));
  } while (Date.now() < deadline);
  throw new ProviderCapacityError();
}
