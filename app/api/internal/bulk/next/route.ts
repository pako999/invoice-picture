import { NextResponse } from "next/server";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const sql=bulkSql();

 const input=await req.json().catch(()=>({}));
 const jobId=input.jobId==null?null:Number(input.jobId);
 const ownerId=typeof input.ownerId==='string'?input.ownerId:null;
 if(jobId!==null&&(!Number.isSafeInteger(jobId)||jobId<=0||!ownerId))return NextResponse.json({error:"Invalid scope"},{status:400});
 // One read when idle, no lock transaction or maintenance writes.
 const ready=await sql`SELECT "id" FROM "bulkInvoiceJobs" WHERE "status"='processing'
   AND "stage" IN ('queued','uploaded','ocr','classify','split','extract')
   AND (${jobId===null} OR ("id"=${jobId} AND "clerkUserId"=${ownerId}))
   AND ("lockedAt" IS NULL OR "lockedAt"<now()-interval '15 minutes') LIMIT 1`;
 if(!ready.length)return NextResponse.json({job:null});

 const claim=await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(hashtextextended('bulk-worker-admission',0))`,
  sql`
  WITH candidate AS (
    SELECT "id" FROM "bulkInvoiceJobs" candidate_job
    WHERE "status"='processing'
      AND (${jobId===null} OR ("id"=${jobId} AND "clerkUserId"=${ownerId}))
      AND "stage" NOT IN ('boundary_review','quota_wait','completed','failed')
      AND (
        "stage" <> 'queued' OR (
          (SELECT count(*) FROM "bulkInvoiceJobs" active
           WHERE active."clerkUserId"=candidate_job."clerkUserId" AND active."status"='processing'
             AND active."stage" NOT IN ('queued','boundary_review','quota_wait','completed','failed')) < 2
          AND (SELECT count(*) FROM "bulkInvoiceJobs" active
               WHERE active."status"='processing'
                 AND active."stage" NOT IN ('queued','boundary_review','quota_wait','completed','failed')) < 120
        )
      )
      AND ("lockedAt" IS NULL OR "lockedAt" < now()-interval '15 minutes')
      AND (
        "lastError" IS NULL
        OR "lastError" NOT LIKE '[rate-limit:%'
        OR "updatedAt" <= now()-interval '2 minutes'
      )
    ORDER BY "updatedAt" ASC,"id" ASC
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE "bulkInvoiceJobs" j
  SET "stage"=CASE WHEN j."stage"='queued' THEN 'uploaded' ELSE j."stage" END,
      "lockedAt"=now(),"attempts"="attempts"+1,"updatedAt"=now()
  FROM candidate c WHERE j."id"=c."id"
  RETURNING j."id",j."clerkUserId",j."companyId",j."objectKey",j."filename",j."byteSize",
    j."status",j."stage",j."pageCount",j."ocrNextPage",j."classifyCursor",j."totalInvoices",j."processedInvoices"
 `]);
 const rows=claim[1];
 return NextResponse.json({job:rows[0]??null});
}

