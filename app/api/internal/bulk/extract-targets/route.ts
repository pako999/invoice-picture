import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";

const schema = z.object({ jobId: z.number().int().positive(), limit: z.number().int().min(1).max(5).default(1) });

export async function POST(req: Request) {
  if (!verifyBulkInternalSecret(req.headers.get("x-bulk-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = schema.parse(await req.json());
  const sql = bulkSql();
  const jobs = await sql`SELECT "stage" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if (!jobs.length || jobs[0].stage !== "extract") {
    return NextResponse.json({ error: "Bulk job is not ready for extraction" }, { status: 409 });
  }
  const targets = await sql`SELECT "groupIndex","objectKey" FROM "bulkInvoiceGroups"
    WHERE "jobId"=${data.jobId} AND "status" IN ('pending','reprocess')
    ORDER BY "groupIndex" LIMIT ${Math.min(data.limit, 1)}`;
  return NextResponse.json({ targets });
}
