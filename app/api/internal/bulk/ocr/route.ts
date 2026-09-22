import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret,BULK_OCR_BATCH_PAGES } from "@/lib/bulk-invoices/config";
import { bulkSql,ocrBulkPages } from "@/lib/bulk-invoices/service";
import { OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";
const schema=z.object({jobId:z.number().int().positive(),documentUrl:z.string().url(),startPage:z.number().int().min(0),batchPages:z.number().int().min(1).max(BULK_OCR_BATCH_PAGES)});
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const sql=bulkSql();
 try{
  const jobs=await sql`SELECT "clerkUserId","pageCount","stage","ocrNextPage" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if(!jobs.length||jobs[0].stage!=='ocr')return NextResponse.json({error:"Bulk OCR job is not ready"},{status:409});
  const pageCount=Number(jobs[0].pageCount??0);const start=Math.max(Number(jobs[0].ocrNextPage??0),data.startPage);
  const out=await ocrBulkPages({clerkUserId:String(jobs[0].clerkUserId),documentUrl:data.documentUrl,startPage:start,batchPages:data.batchPages,pageCount});
  for(const page of out.pages){
    await sql`INSERT INTO "bulkInvoicePages" ("jobId","pageNumber","markdown","ocrConfidenceBps","createdAt","updatedAt")
      VALUES (${data.jobId},${page.pageNumber},${page.markdown},${page.confidence==null?null:Math.round(page.confidence*10000)},now(),now())
      ON CONFLICT ("jobId","pageNumber") DO UPDATE SET "markdown"=EXCLUDED."markdown","ocrConfidenceBps"=EXCLUDED."ocrConfidenceBps","updatedAt"=now()`;
  }
  await sql`UPDATE "bulkInvoiceJobs" SET "ocrNextPage"=${out.nextPage},"stage"=${out.done?'classify':'ocr'},
    "classifyCursor"=CASE WHEN ${out.done} THEN 0 ELSE "classifyCursor" END,"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({success:true,pages:out.pages.length,nextPage:out.nextPage,done:out.done});
 }catch(error){
  const msg=error instanceof Error?error.message:String(error);
  const quotaReached=error instanceof OcrCommercialQuotaError;
  if(!quotaReached&&(/\b429\b|rate limit/i.test(msg))){
   const previous=await sql`SELECT "lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
   const rateLimitAttempt=nextRateLimitAttempt(previous[0]?.lastError);
   const exhausted=rateLimitAttempt>=3;
   const storedError=`[rate-limit:${rateLimitAttempt}] ${msg}`.slice(0,2000);
   await sql`UPDATE "bulkInvoiceJobs" SET "status"=${exhausted?'failed':'processing'},"stage"=${exhausted?'failed':'ocr'},"lockedAt"=NULL,"lastError"=${storedError},"completedAt"=${exhausted?new Date():null},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({error:exhausted?"OCR provider is temporarily unavailable. Retry the PDF package later.":msg,code:"ocr_rate_limited",retrying:!exhausted},{status:exhausted?503:429});
  }
  await sql`UPDATE "bulkInvoiceJobs" SET "stage"=${quotaReached?'quota_wait':'ocr'},"lockedAt"=NULL,"lastError"=${msg.slice(0,2000)},"updatedAt"=now() WHERE "id"=${data.jobId}`;
  const status=quotaReached?402:500;return NextResponse.json({error:msg},{status});
 }
}
function nextRateLimitAttempt(lastError: unknown) {
 const match=String(lastError??"").match(/^\[rate-limit:(\d+)\]/);
 return Number(match?.[1]??0)+1;
}
