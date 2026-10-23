import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret,BULK_OCR_BATCH_PAGES } from "@/lib/bulk-invoices/config";
import {
 bulkSql,
 ocrBulkPages,
 createMistralOcrBatch,
 pollMistralOcrBatch,
 releaseMistralOcrBatchReservation,
} from "@/lib/bulk-invoices/service";
import { OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";
import { useRealtimeBulkProcessing } from "@/lib/bulk-invoices/processing-mode";
import { measureInvoiceStage } from "@/lib/invoice-intelligence/timing";
export const maxDuration = 300;
const schema=z.object({jobId:z.number().int().positive(),documentUrl:z.string().url(),startPage:z.number().int().min(0),batchPages:z.number().int().min(1).max(BULK_OCR_BATCH_PAGES)});
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const sql=bulkSql();
 try{
  const jobs=await sql`SELECT "clerkUserId","pageCount","stage","ocrNextPage","ocrBatchId","ocrBatchStartPage","ocrBatchPageCount","ocrBatchCreatedAt","lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if(!jobs.length||jobs[0].stage!=='ocr')return NextResponse.json({error:"Bulk OCR job is not ready"},{status:409});
  const job=jobs[0];const pageCount=Number(job.pageCount??0);const start=Math.max(Number(job.ocrNextPage??0),data.startPage);
  const existingBatchId=typeof job.ocrBatchId==='string'?job.ocrBatchId:'';
  const previousBatchError=String(job.lastError??"").startsWith("[batch-failure:")?String(job.lastError):null;
  const realtime=!existingBatchId&&useRealtimeBulkProcessing(pageCount);
  if(!existingBatchId&&!realtime){
   const batch=await createMistralOcrBatch({clerkUserId:String(job.clerkUserId),documentUrl:data.documentUrl,startPage:start,batchPages:data.batchPages,pageCount});
   await sql`UPDATE "bulkInvoiceJobs" SET "ocrBatchId"=${batch.batchId},"ocrBatchStartPage"=${batch.startPage},"ocrBatchPageCount"=${batch.pageCount},
    "ocrBatchCreatedAt"=${batch.createdAt},"lockedAt"=NULL,"lastError"=${previousBatchError},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({success:true,batch:true,status:batch.status,pages:0,nextPage:start,done:false});
  }

  const batchStart=realtime?start:Number(job.ocrBatchStartPage??start);const batchPageCount=realtime?Math.min(data.batchPages,pageCount-start):Number(job.ocrBatchPageCount??0);
  if(batchPageCount<1)throw new Error("Mistral Batch OCR state is missing its page count");
  const out=await measureInvoiceStage("bulk_ocr",{jobId:data.jobId,mode:realtime?"realtime":"batch",startPage:start},async()=>realtime
   ? {...await ocrBulkPages({clerkUserId:String(job.clerkUserId),documentUrl:data.documentUrl,startPage:start,batchPages:data.batchPages,pageCount}),status:"SUCCESS" as const,error:null}
   : pollMistralOcrBatch({batchId:existingBatchId,startPage:batchStart,expectedPageCount:batchPageCount}));
  if(out.status==='QUEUED'||out.status==='RUNNING'||out.status==='CANCELLATION_REQUESTED'){
   await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"lastError"=${previousBatchError},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({success:true,batch:true,status:out.status,pages:0,nextPage:start,done:false});
  }
  if(out.status!=='SUCCESS'){
   const failureCount=Number(previousBatchError?.match(/^\[batch-failure:(\d+)\]/)?.[1]??0)+1;
   const exhausted=failureCount>=3;
   await releaseMistralOcrBatchReservation({clerkUserId:String(job.clerkUserId),createdAt:job.ocrBatchCreatedAt instanceof Date?job.ocrBatchCreatedAt:new Date(String(job.ocrBatchCreatedAt??Date.now())),pages:batchPageCount});
   await sql`UPDATE "bulkInvoiceJobs" SET "ocrBatchId"=NULL,"ocrBatchStartPage"=NULL,"ocrBatchPageCount"=NULL,"ocrBatchCreatedAt"=NULL,
    "status"=${exhausted?"failed":"processing"},"stage"=${exhausted?"failed":"ocr"},"completedAt"=${exhausted?new Date():null},
    "lockedAt"=NULL,"lastError"=${`[batch-failure:${failureCount}] ${out.error||`Mistral Batch OCR ${out.status}`}`.slice(0,2000)},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({success:false,batch:true,status:out.status,retrying:!exhausted});
  }
  for(const page of out.pages){
    await sql`INSERT INTO "bulkInvoicePages" ("jobId","pageNumber","markdown","ocrConfidenceBps","createdAt","updatedAt")
      VALUES (${data.jobId},${page.pageNumber},${page.markdown},${page.confidence==null?null:Math.round(page.confidence*10000)},now(),now())
      ON CONFLICT ("jobId","pageNumber") DO UPDATE SET "markdown"=EXCLUDED."markdown","ocrConfidenceBps"=EXCLUDED."ocrConfidenceBps","updatedAt"=now()`;
  }
  const nextPage=batchStart+out.pages.length;const done=nextPage>=pageCount;
  await sql`UPDATE "bulkInvoiceJobs" SET "ocrNextPage"=${nextPage},"stage"=${done?'classify':'ocr'},
    "ocrBatchId"=NULL,"ocrBatchStartPage"=NULL,"ocrBatchPageCount"=NULL,"ocrBatchCreatedAt"=NULL,
    "classifyCursor"=CASE WHEN ${done} THEN 0 ELSE "classifyCursor" END,"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({success:true,batch:!realtime,status:out.status,pages:out.pages.length,nextPage,done});
 }catch(error){
  const msg=error instanceof Error?error.message:String(error);
  const quotaReached=error instanceof OcrCommercialQuotaError;
  if(/Batch OCR submission failed \(402\)|enable billing/i.test(msg)){
   const storedError=`[provider-access] Mistral Batch OCR ni omogočen za API delovni prostor tega ključa (402). V Mistral Console omogočite billing za isti workspace/API key in nato izberite Ponovno zaženi OCR.`;
   await sql`UPDATE "bulkInvoiceJobs" SET "status"='failed',"stage"='failed',"lockedAt"=NULL,"lastError"=${storedError},"completedAt"=now(),"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({error:storedError,code:"ocr_provider_access_required",retrying:false},{status:402});
  }
  if(!quotaReached&&(/\b429\b|rate limit/i.test(msg))){
   const previous=await sql`SELECT "lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
   const rateLimitAttempt=nextRateLimitAttempt(previous[0]?.lastError);
   // Keep transient provider throttling retryable for several hours. The
   // queue applies a cooldown and OCR itself uses one-page requests, so this
   // no longer hot-loops or repeatedly submits an oversized page batch.
   const exhausted=rateLimitAttempt>=12;
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
