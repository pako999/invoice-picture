import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  companies, invoiceAuditLogs, invoiceDocuments, invoiceProcessingAttempts, invoiceValidationResults, invoices, userSettings
} from "@/lib/schema";
import { verifyBulkInternalSecret,BULK_EXTRACT_BATCH_SIZE } from "@/lib/bulk-invoices/config";
import { bulkSql,createMistralInvoiceExtractionBatch,extractBulkInvoiceFromDocument,hasUsableBulkOcrMarkdown,pollMistralInvoiceExtractionBatch } from "@/lib/bulk-invoices/service";
import { normalizeDeliveryMode } from "@/lib/invoice-intelligence/delivery-format";

const schema=z.object({
 jobId:z.number().int().positive(),
 batchSize:z.number().int().min(1).max(BULK_EXTRACT_BATCH_SIZE).default(BULK_EXTRACT_BATCH_SIZE),
 documents:z.array(z.object({groupIndex:z.number().int().min(0),documentUrl:z.string().url()})).max(BULK_EXTRACT_BATCH_SIZE).optional()
});

export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const sql=bulkSql();const db=getDb();
 try{
  const jobs=await sql`SELECT * FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  if(!jobs.length||jobs[0].stage!=='extract')return NextResponse.json({error:"Bulk job is not ready for extraction"},{status:409});
  const job:any=jobs[0];
  let recipientEmail:string|null=typeof job.recipientEmail==="string"&&job.recipientEmail?job.recipientEmail:null;const deliveryMode=normalizeDeliveryMode(job.deliveryMode);
  if(job.companyId){
    const [company]=await db.select().from(companies).where(and(eq(companies.id,Number(job.companyId)),eq(companies.clerkUserId,String(job.clerkUserId)))).limit(1);
    if(!company)throw new Error("Bulk company not found");
    recipientEmail=company.recipientEmail;
  }else if(!recipientEmail){
    const [settings]=await db.select().from(userSettings).where(eq(userSettings.clerkUserId,String(job.clerkUserId))).limit(1);recipientEmail=settings?.recipientEmail??null;
  }
  if(!recipientEmail)throw new Error("Recipient email is not configured");

  // A worker can disappear after claiming an email. Resend receives a stable
  // idempotency key, so safely make stale claims retryable without duplicates.
  await sql`UPDATE "bulkInvoiceGroups" SET "deliveryStatus"='pending',"updatedAt"=now()
    WHERE "jobId"=${data.jobId} AND "deliveryStatus"='sending' AND "updatedAt"<now()-interval '15 minutes'`;

  // One structured request per worker tick keeps bulk packages below Mistral's
  // request-per-minute limit. The worker may still send the historical batch
  // size, so clamp here instead of rejecting its request.
  const groups=await sql`SELECT * FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId} AND "status" IN ('pending','reprocess') ORDER BY "groupIndex" LIMIT ${Math.min(data.batchSize,1)}`;
  const documentUrls=new Map((data.documents??[]).map(item=>[item.groupIndex,item.documentUrl]));
  if(deliveryMode==="split_pdf_email"){
    for(const group of groups as any[]){
      await sql`UPDATE "bulkInvoiceGroups" SET "status"='extracted',"deliveryStatus"='pending',"deliveryError"=NULL,"updatedAt"=now() WHERE "id"=${group.id}`;
    }
    const [progress]=await sql`SELECT count(*) FILTER (WHERE "status" = 'extracted')::int AS processed,count(*)::int AS total,
      count(*) FILTER (WHERE "deliveryStatus" IN ('pending','failed','sending'))::int AS pending_delivery FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId}`;
    const processed=Number(progress?.processed??0),total=Number(progress?.total??0),pendingDelivery=Number(progress?.pending_delivery??0);
    const deliveryItems=await sql`SELECT "groupIndex","objectKey","documentId" FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId} AND "deliveryStatus"='pending' ORDER BY "groupIndex" LIMIT 5`;
    if(processed>=total&&total>0&&pendingDelivery===0)await complete(sql,data.jobId,total);
    else await sql`UPDATE "bulkInvoiceJobs" SET "processedInvoices"=${processed},"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
    return NextResponse.json({success:true,processed,total,deliveryItems,done:processed>=total&&pendingDelivery===0,structuredExtractionSkipped:true});
  }
  for(const group of groups as any[]){
    const pages=await sql`SELECT "pageNumber","markdown","ocrConfidenceBps" FROM "bulkInvoicePages"
      WHERE "jobId"=${data.jobId} AND "pageNumber">=${group.startPage} AND "pageNumber"<=${group.endPage} ORDER BY "pageNumber"`;
    const markdown=(pages as any[]).map(p=>`--- PAGE ${Number(p.pageNumber)+1} ---\n${String(p.markdown??"")}`).join("\n\n");
    const confidences=(pages as any[]).map(p=>p.ocrConfidenceBps==null?null:Number(p.ocrConfidenceBps)/10000).filter((n):n is number=>n!=null&&Number.isFinite(n));
    const avg=confidences.length?confidences.reduce((a,b)=>a+b,0)/confidences.length:null;
    const documentUrl=documentUrls.get(Number(group.groupIndex));
    const sourceFilename=childFilename(String(job.filename),Number(group.groupIndex));
    let sourceInvoiceId:number|null=null;let documentId:number|null=group.documentId==null?null:Number(group.documentId);
    let previousInvoice:any=null;
    if(documentId){
      const [doc]=await db.select({
        sourceInvoiceId:invoiceDocuments.sourceInvoiceId,
        normalizedJson:invoiceDocuments.normalizedJson,
      }).from(invoiceDocuments).where(eq(invoiceDocuments.id,documentId)).limit(1);
      sourceInvoiceId=doc?.sourceInvoiceId??null;
      if(doc?.normalizedJson){
        try{previousInvoice=JSON.parse(doc.normalizedJson);}catch{previousInvoice=null;}
      }
    }
    // The package pages have already been OCR'd. Reuse that markdown for
    // structured extraction instead of sending every child PDF through the
    // real-time OCR endpoint a second time. Direct OCR is only a safety
    // fallback for empty/unusable page text.
    const started=Date.now();let extracted;
    if(hasUsableBulkOcrMarkdown(markdown)){
      if(!group.extractionBatchId){const batch=await createMistralInvoiceExtractionBatch(markdown,avg);await sql`UPDATE "bulkInvoiceGroups" SET "extractionBatchId"=${batch.batchId},"extractionBatchCreatedAt"=now(),"updatedAt"=now() WHERE "id"=${group.id}`;await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;return NextResponse.json({success:true,batchSubmitted:true,batchId:batch.batchId},{status:202});}
      const state=await pollMistralInvoiceExtractionBatch({batchId:String(group.extractionBatchId),markdown,ocrConfidence:avg});
      if(["QUEUED","RUNNING","CANCELLATION_REQUESTED"].includes(state.status)){await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;return NextResponse.json({success:true,batchPending:true,status:state.status},{status:202});}
      if(!state.result)throw new Error(state.error||`Mistral Batch extraction ended with ${state.status}`);extracted=state.result;
    }else if(documentUrl)extracted=await extractBulkInvoiceFromDocument(documentUrl,avg);else throw new Error("Bulk OCR returned no usable text for structured extraction");
    const autoApprove=canAutoApprove(extracted.invoice,extracted.validation.status,avg,Boolean(group.needsBoundaryReview));
    const normalizedJson=JSON.stringify(extracted.invoice);
    const warningList=[...extracted.invoice.warnings,...extracted.validation.warnings,...extracted.validation.errors];
    if(!sourceInvoiceId){
      const [src]=await db.insert(invoices).values({clerkUserId:String(job.clerkUserId),recipientEmail,companyId:job.companyId==null?null:Number(job.companyId),subject:"Račun",imageData:null,imageMime:"application/pdf",filename:sourceFilename,status:"pending"}).returning({id:invoices.id});
      sourceInvoiceId=src.id;
    }
    const idempotencyKey=createHash("sha256").update(`bulk:${job.clerkUserId}:${data.jobId}:${group.groupIndex}:${group.sha256}`).digest("hex");
    const retentionDays=Number(process.env.INVOICE_RETENTION_DAYS??365);const retentionUntil=retentionDays>0?new Date(Date.now()+retentionDays*86400000):null;
    const isReprocess=String(group.status)==="reprocess";
    const values={
      clerkUserId:String(job.clerkUserId),companyId:job.companyId==null?null:Number(job.companyId),sourceInvoiceId,filename:sourceFilename,mimeType:"application/pdf",
      originalBase64:null,storageObjectKey:String(group.objectKey),bulkJobId:data.jobId,bulkGroupIndex:Number(group.groupIndex),sourcePageStart:Number(group.startPage),sourcePageEnd:Number(group.endPage),
      sha256:String(group.sha256),byteSize:Number(group.byteSize),idempotencyKey,status:(autoApprove?"approved":"needs_review") as "approved"|"needs_review",
      documentType:extracted.invoice.documentType,documentLanguage:extracted.invoice.documentLanguage,provider:extracted.provider,model:extracted.model,
      rawText:markdown,rawProviderResponse:JSON.stringify(extracted.raw),normalizedJson,approvedJson:autoApprove?normalizedJson:null,
      overallConfidenceBps:avg==null?null:Math.round(avg*10000),validationStatus:(autoApprove?"valid":"needs_review") as "valid"|"needs_review",
      warningsJson:JSON.stringify(warningList),processingCostMicros:null,processingStartedAt:new Date(started),processedAt:new Date(),approvedAt:autoApprove?new Date():null,retentionUntil,updatedAt:new Date()
    };
    if(documentId){
      await db.update(invoiceDocuments).set(values).where(eq(invoiceDocuments.id,documentId));
    }else{
      const [doc]=await db.insert(invoiceDocuments).values(values).onConflictDoNothing({target:invoiceDocuments.idempotencyKey}).returning({id:invoiceDocuments.id});
      documentId=doc?.id??(await db.select({id:invoiceDocuments.id}).from(invoiceDocuments).where(eq(invoiceDocuments.idempotencyKey,idempotencyKey)).limit(1))[0]?.id??null;
    }
    if(!documentId)throw new Error("Could not create bulk child invoice document");
    await db.insert(invoiceValidationResults).values({documentId,status:autoApprove?"valid":"needs_review",warningsJson:JSON.stringify(extracted.validation.warnings),errorsJson:JSON.stringify(extracted.validation.errors),differencesJson:JSON.stringify(extracted.validation.differences)});
    await db.insert(invoiceProcessingAttempts).values({documentId,provider:extracted.provider,model:extracted.model,status:"succeeded",durationMs:Date.now()-started,pagesProcessed:Number(group.endPage)-Number(group.startPage)+1,costMicros:null,completedAt:new Date()});
    await db.insert(invoiceAuditLogs).values({documentId,clerkUserId:String(job.clerkUserId),action:autoApprove?"auto_approved":"sent_to_review",metadataJson:JSON.stringify({bulkJobId:data.jobId,groupIndex:Number(group.groupIndex),pages:[Number(group.startPage),Number(group.endPage)]})});
    const nextDeliveryStatus=isReprocess
      ? String(group.deliveryStatus)
      : deliveryMode==='email_ocr'?'pending':'not_required';
    await sql`UPDATE "bulkInvoiceGroups" SET "documentId"=${documentId},"status"='extracted',"deliveryStatus"=${nextDeliveryStatus},"deliveryError"=NULL,"extractionBatchId"=NULL,"extractionBatchCreatedAt"=NULL,"updatedAt"=now() WHERE "id"=${group.id}`;
  }
  const [progress]=await sql`SELECT count(*) FILTER (WHERE "status" = 'extracted')::int AS processed,count(*)::int AS total,
    count(*) FILTER (WHERE "deliveryStatus" IN ('pending','failed','sending'))::int AS pending_delivery FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId}`;
  const processed=Number(progress?.processed??0),total=Number(progress?.total??0),pendingDelivery=Number(progress?.pending_delivery??0);
  const deliveryItems=await sql`SELECT "groupIndex","objectKey","documentId" FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId} AND "documentId" IS NOT NULL AND "deliveryStatus"='pending' ORDER BY "groupIndex" LIMIT 5`;
  if(processed>=total&&total>0&&pendingDelivery===0)await complete(sql,data.jobId,total);
  else await sql`UPDATE "bulkInvoiceJobs" SET "processedInvoices"=${processed},"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({success:true,processed,total,deliveryItems,done:processed>=total&&pendingDelivery===0});
 }catch(error){
  const msg=error instanceof Error?error.message:String(error);
  if(/\b429\b|rate limit/i.test(msg)){
   const previous=await sql`SELECT "lastError" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
   const rateLimitAttempt=nextRateLimitAttempt(previous[0]?.lastError);
   const exhausted=rateLimitAttempt>=3;
   const storedError=`[rate-limit:${rateLimitAttempt}] ${msg}`.slice(0,2000);
   await sql`UPDATE "bulkInvoiceJobs" SET "status"=${exhausted?'failed':'processing'},"stage"=${exhausted?'failed':'extract'},"lockedAt"=NULL,"lastError"=${storedError},"completedAt"=${exhausted?new Date():null},"updatedAt"=now() WHERE "id"=${data.jobId}`;
   if(exhausted){
    const friendlyError="OCR storitev je trenutno preobremenjena. Samodejni poskusi so bili izčrpani; izberite Ponovno obdelaj.";
    await sql`
      WITH failed_documents AS (
        UPDATE "invoiceDocuments" d
        SET "status"='failed',"validationStatus"='failed',
            "warningsJson"=${JSON.stringify([friendlyError])},
            "processedAt"=now(),"updatedAt"=now()
        FROM "bulkInvoiceGroups" g
        WHERE g."jobId"=${data.jobId}
          AND g."status"='reprocess'
          AND g."documentId"=d."id"
        RETURNING d."sourceInvoiceId"
      )
      UPDATE "invoices" i
      SET "status"='failed',"errorMessage"=${friendlyError}
      WHERE i."id" IN (
        SELECT "sourceInvoiceId" FROM failed_documents WHERE "sourceInvoiceId" IS NOT NULL
      )`;
   }
   return NextResponse.json({error:exhausted?"OCR provider is temporarily unavailable. Retry the PDF package later.":msg,code:"ocr_rate_limited",retrying:!exhausted},{status:exhausted?503:429});
  }
  await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"lastError"=${msg.slice(0,2000)},"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({error:msg},{status:500});
 }
}
function childFilename(filename:string,index:number){const base=filename.replace(/\.pdf$/i,"").slice(0,180);return `${base}-racun-${String(index+1).padStart(3,"0")}.pdf`;}
function canAutoApprove(invoice:any,status:string,confidence:number|null,boundaryReview:boolean){const t=Number(process.env.INVOICE_CONFIDENCE_THRESHOLD??0.92);return !boundaryReview&&status==="valid"&&(confidence??0)>=t&&Boolean(invoice.supplier?.name&&invoice.invoiceNumber&&invoice.issueDate&&invoice.currency&&invoice.totals?.netAmount&&invoice.totals?.vatAmount&&invoice.totals?.grossAmount);}
async function complete(sql:any,jobId:number,total:number){await sql`UPDATE "bulkInvoiceJobs" SET "status"='completed',"stage"='completed',"processedInvoices"=${total},"lockedAt"=NULL,"lastError"=NULL,"completedAt"=now(),"updatedAt"=now() WHERE "id"=${jobId}`;}
function nextRateLimitAttempt(lastError: unknown) {
 const match=String(lastError??"").match(/^\[rate-limit:(\d+)\]/);
 return Number(match?.[1]??0)+1;
}
