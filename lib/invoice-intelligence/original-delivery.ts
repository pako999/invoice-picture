import { after } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendInvoiceEmail } from "@/lib/resend";

function sqlClient() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}

export async function queueOriginalInvoiceEmail(invoiceId: number, messageBody?: string) {
  const sql = sqlClient();
  await sql`INSERT INTO "invoiceOriginalDeliveryJobs" ("invoiceId","messageBody") VALUES (${invoiceId},${messageBody ?? null}) ON CONFLICT ("invoiceId") DO NOTHING`;
  after(async () => { await runOriginalInvoiceEmails(1, invoiceId).catch(error => console.error("original_delivery_worker_failed", { invoiceId, error: String(error) })); });
}

export async function runOriginalInvoiceEmails(limit = 5, invoiceId?: number) {
  const sql = sqlClient();
  await sql`WITH exhausted AS (
    UPDATE "invoiceOriginalDeliveryJobs" SET "status"='failed',"lockedAt"=NULL,"lastError"='Email completion is unknown after interruption; review before retrying'
    WHERE "status"='processing' AND "lockedAt"<now()-interval '10 minutes' AND "attempts">=2 AND (${invoiceId == null} OR "invoiceId"=${invoiceId ?? 0}) RETURNING "invoiceId"
  ) UPDATE "invoices" SET "status"='failed',"errorMessage"='Email completion is unknown after interruption; review before retrying' WHERE "id" IN (SELECT "invoiceId" FROM exhausted)`;
  const rows = await sql`UPDATE "invoiceOriginalDeliveryJobs" j SET "status"='processing',"lockedAt"=now(),"attempts"="attempts"+1
    WHERE j."invoiceId" IN (SELECT "invoiceId" FROM "invoiceOriginalDeliveryJobs"
      WHERE ("status" IN ('queued','failed') OR ("status"='processing' AND "lockedAt"<now()-interval '10 minutes'))
      AND "attempts"<2 AND "availableAt"<=now() AND (${invoiceId == null} OR "invoiceId"=${invoiceId ?? 0})
      ORDER BY "availableAt" LIMIT ${Math.max(1, Math.min(20, limit))} FOR UPDATE SKIP LOCKED)
    RETURNING j."invoiceId",j."messageBody",j."attempts"`;
  const results = [];
  for (const row of rows) {
    const id = Number(row.invoiceId);
    try {
      const [invoice] = await sql`SELECT "recipientEmail","subject","imageData","filename","imageMime" FROM "invoices" WHERE "id"=${id}`;
      if (!invoice?.imageData) throw new Error("Original invoice content is unavailable");
      const result = await sendInvoiceEmail({ to: String(invoice.recipientEmail), subject: String(invoice.subject),
        imageBase64: String(invoice.imageData), filename: String(invoice.filename), mime: String(invoice.imageMime),
        messageBody: row.messageBody == null ? undefined : String(row.messageBody), idempotencyKey: `original-invoice/${id}` });
      if (result.error) throw new Error(result.error.message);
      await sql.transaction([
        sql`UPDATE "invoices" SET "status"='sent',"sentAt"=now(),"errorMessage"=NULL WHERE "id"=${id}`,
        sql`UPDATE "invoiceOriginalDeliveryJobs" SET "status"='completed',"lockedAt"=NULL,"lastError"=NULL WHERE "invoiceId"=${id}`,
      ]);
      results.push({ invoiceId: id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sql.transaction([
        sql`UPDATE "invoiceOriginalDeliveryJobs" SET "status"='failed',"lockedAt"=NULL,"availableAt"=now()+interval '2 minutes',"lastError"=${message.slice(0,2000)} WHERE "invoiceId"=${id}`,
        sql`UPDATE "invoices" SET "status"='failed',"errorMessage"=${message.slice(0,2000)} WHERE "id"=${id}`,
      ]);
      results.push({ invoiceId: id, ok: false });
    }
  }
  return results;
}
