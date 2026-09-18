import { NextResponse } from "next/server";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const sql=bulkSql();
 const rows=await sql`
  WITH candidate AS (
    SELECT "id" FROM "bulkInvoiceJobs"
    WHERE "status"='processing'
      AND "stage" NOT IN ('boundary_review','quota_wait','completed','failed')
      AND ("lockedAt" IS NULL OR "lockedAt" < now()-interval '15 minutes')
    ORDER BY "updatedAt" ASC,"id" ASC
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE "bulkInvoiceJobs" j
  SET "lockedAt"=now(),"attempts"="attempts"+1,"updatedAt"=now()
  FROM candidate c WHERE j."id"=c."id"
  RETURNING j."id",j."clerkUserId",j."companyId",j."objectKey",j."filename",j."byteSize",
    j."status",j."stage",j."pageCount",j."ocrNextPage",j."classifyCursor",j."totalInvoices",j."processedInvoices"
 `;
 return NextResponse.json({job:rows[0]??null});
}
