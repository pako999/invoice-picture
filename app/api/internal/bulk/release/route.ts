import { failBulkStage } from "@/lib/bulk-invoices/failure";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";

const schema = z.object({
  jobId: z.number().int().positive(),
  error: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  if (!verifyBulkInternalSecret(req.headers.get("x-bulk-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = schema.parse(await req.json());
  const sql = bulkSql();
  const [job] = await sql`SELECT "status","stage","lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if(job?.status === "processing" && !/^\[(?:stage-error|rate-limit|batch-failure):/.test(String(job.lastError??""))) {
    await failBulkStage(sql,data.jobId,new Error(data.error),String(job.stage));
    return NextResponse.json({success:true});
  }
  const rows = await sql`
    UPDATE "bulkInvoiceJobs"
    SET "lockedAt"=CASE WHEN "status"='processing' THEN NULL ELSE "lockedAt" END,
        "lastError"=CASE
          WHEN "status"<>'processing' THEN "lastError"
          WHEN "lastError" LIKE '[rate-limit:%' OR "lastError" LIKE '[stage-error:%' OR "lastError" LIKE '[batch-failure:%' THEN "lastError"
          ELSE ${data.error}
        END,
        "updatedAt"=CASE WHEN "status"='processing' THEN now() ELSE "updatedAt" END
    WHERE "id"=${data.jobId}
    RETURNING "id","status"
  `;
  if (!rows.length) return NextResponse.json({ error: "Bulk job not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
