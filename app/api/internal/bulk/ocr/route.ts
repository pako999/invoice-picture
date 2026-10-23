import { randomUUID } from "node:crypto";
import { withProviderContext } from "@/lib/invoice-intelligence/provider-usage";
import { failBulkStage } from "@/lib/bulk-invoices/failure";
import { ProviderRequestError } from "@/lib/invoice-intelligence/provider-errors";
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
  const jobs=await sql`SELECT "preferBatch","clerkUserId","pageCount","stage","ocrNextPage","ocrBatchId","ocrBatchStartPage","ocrBatchPageCount","ocrBatchCreatedAt","lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if(!jobs.length||jobs[0].stage!=='ocr')return NextResponse.json({error:"Bulk OCR job is not ready"},{status:409});
  const job=jobs[0]; return await withProviderContext({ clerkUserId: String(job.clerkUserId), bulkJobId: data.jobId }, async () => {const pageCount=Number(job.pageCount??0);const start=Number(job.ocrNextPage??0);
  const existingBatchId=typeof job.ocrBatchId==='string'?job.ocrBatchId:'';
  if(existingBatchId.startsWith("submitting:"))throw new ProviderRequestError("Previous Batch OCR submission has unknown completion; review before manually retrying",null,"unknown",0,true);
  const previousBatchError=String(job.lastError??"").startsWith("[batch-failure:")?String(job.lastError):null;
  const realtime=!existingBatchId&&useRealtimeBulkProcessing(pageCount,Boolean(job.preferBatch));
  if(!existingBatchId&&!realtime){
   const intent=`submitting:${randomUUID()}`;
   const claim=await sql`UPDATE "bulkInvoiceJobs" SET "ocrBatchId"=${intent},"updatedAt"=now() WHERE "id"=${data.jobId} AND "ocrBatchId" IS NULL RETURNING "id"`;
   if(!claim.length)return NextResponse.json({success:true,batchPending:true},{status:202});
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
   // An accepted batch ending without usable output is not proof that no
   // inference ran. Keep its ID/reservation and require an explicit retry.
   const message=`[batch-failure:1] ${out.error||`Mistral Batch OCR ${out.status}`}`.slice(0,2000);
   await sql`UPDATE "bulkInvoiceJobs" SET "status"='failed',"stage"='failed',"completedAt"=now(),"lockedAt"=NULL,"lastError"=${message},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({success:false,batch:true,status:out.status,retrying:false});
  }
  // One parameterized write for all returned pages, rather than one DB
  // round trip per page of a whole-document OCR response.
  await sql`INSERT INTO "bulkInvoicePages" ("jobId","pageNumber","markdown","ocrConfidenceBps","createdAt","updatedAt")
    SELECT ${data.jobId},p."pageNumber",p.markdown,CASE WHEN p.confidence IS NULL THEN NULL ELSE round(p.confidence*10000)::int END,now(),now()
    FROM jsonb_to_recordset(${JSON.stringify(out.pages)}::jsonb) AS p("pageNumber" int,markdown text,confidence numeric)
    ON CONFLICT ("jobId","pageNumber") DO UPDATE SET "markdown"=EXCLUDED."markdown","ocrConfidenceBps"=EXCLUDED."ocrConfidenceBps","updatedAt"=now()`;
  const nextPage=batchStart+out.pages.length;const done=nextPage>=pageCount;
  await sql`UPDATE "bulkInvoiceJobs" SET "ocrNextPage"=${nextPage},"stage"=${done?'classify':'ocr'},
    "ocrBatchId"=NULL,"ocrBatchStartPage"=NULL,"ocrBatchPageCount"=NULL,"ocrBatchCreatedAt"=NULL,
    "classifyCursor"=CASE WHEN ${done} THEN 0 ELSE "classifyCursor" END,"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({success:true,batch:!realtime,status:out.status,pages:out.pages.length,nextPage,done});
 });
 }catch(error){
  const msg=error instanceof Error?error.message:String(error);
  if(error instanceof ProviderRequestError){const failure=await failBulkStage(sql,data.jobId,error,"ocr");return NextResponse.json({error:failure.message,retrying:failure.retrying},{status:failure.status});}
  const quotaReached=error instanceof OcrCommercialQuotaError;
  if(/Batch OCR submission failed \(402\)|enable billing/i.test(msg)){
   const storedError=`[provider-access] Mistral Batch OCR ni omogočen za API delovni prostor tega ključa (402). V Mistral Console omogočite billing za isti workspace/API key in nato izberite Ponovno zaženi OCR.`;
   await sql`UPDATE "bulkInvoiceJobs" SET "status"='failed',"stage"='failed',"lockedAt"=NULL,"lastError"=${storedError},"completedAt"=now(),"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({error:storedError,code:"ocr_provider_access_required",retrying:false},{status:402});
  }
  if(!quotaReached&&(/\b429\b|rate limit/i.test(msg))){
   const previous=await sql`SELECT "lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
   const rateLimitAttempt=nextRateLimitAttempt(previous[0]?.lastError);
   // Legacy untyped throttling gets at most one deferred retry.
   const exhausted=rateLimitAttempt>=2;
   const storedError=`[rate-limit:${rateLimitAttempt}] ${msg}`.slice(0,2000);
   await sql`UPDATE "bulkInvoiceJobs" SET "status"=${exhausted?'failed':'processing'},"stage"=${exhausted?'failed':'ocr'},"lockedAt"=NULL,"lastError"=${storedError},"completedAt"=${exhausted?new Date():null},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   return NextResponse.json({error:exhausted?"OCR provider is temporarily unavailable. Retry the PDF package later.":msg,code:"ocr_rate_limited",retrying:!exhausted},{status:exhausted?503:429});
  }
  if(quotaReached){await sql`UPDATE "bulkInvoiceJobs" SET "stage"='quota_wait',"lockedAt"=NULL,"lastError"=${msg.slice(0,2000)},"updatedAt"=now() WHERE "id"=${data.jobId}`;return NextResponse.json({error:msg},{status:402});}
  const failure=await failBulkStage(sql,data.jobId,error,"ocr");return NextResponse.json({error:failure.message,retrying:failure.retrying},{status:failure.status});
 }
}
function nextRateLimitAttempt(lastError: unknown) {
 const match=String(lastError??"").match(/^\[rate-limit:(\d+)\]/);
 return Number(match?.[1]??0)+1;
}
