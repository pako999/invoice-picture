import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret,BULK_CLASSIFY_BATCH_PAGES,buildBulkRanges } from "@/lib/bulk-invoices/config";
import { bulkSql,classifyBulkPages } from "@/lib/bulk-invoices/service";
import { getOcrUsageSummary } from "@/lib/invoice-intelligence/quota";
const schema=z.object({jobId:z.number().int().positive()});
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const {jobId}=schema.parse(await req.json());const sql=bulkSql();
 try{
  const jobs=await sql`SELECT "clerkUserId","pageCount","classifyCursor","stage" FROM "bulkInvoiceJobs" WHERE "id"=${jobId} LIMIT 1`;
  if(!jobs.length||jobs[0].stage!=='classify')return NextResponse.json({error:"Bulk classifier is not ready"},{status:409});
  const pageCount=Number(jobs[0].pageCount??0);let cursor=Number(jobs[0].classifyCursor??0);
  if(cursor<pageCount){
   const end=Math.min(pageCount,cursor+BULK_CLASSIFY_BATCH_PAGES);
   const pages=await sql`SELECT "pageNumber","markdown" FROM "bulkInvoicePages" WHERE "jobId"=${jobId} AND "pageNumber">=${cursor} AND "pageNumber"<${end} ORDER BY "pageNumber"`;
   const prev=cursor>0?(await sql`SELECT "pageNumber","markdown" FROM "bulkInvoicePages" WHERE "jobId"=${jobId} AND "pageNumber"=${cursor-1} LIMIT 1`)[0]??null:null;
   const classified=await classifyBulkPages({pages:pages.map((p:any)=>({pageNumber:Number(p.pageNumber),markdown:String(p.markdown??"")})),previousPage:prev?{pageNumber:Number(prev.pageNumber),markdown:String(prev.markdown??"")}:null});
   const map=new Map(classified.map(r=>[r.pageNumber,r]));
   for(let p=cursor;p<end;p++){
    const row=map.get(p)??{pageNumber:p,startsNewInvoice:p===0,continuationOfPrevious:p>0,invoiceNumber:null,supplierName:null,confidence:0,reason:"Classifier omitted this page; manual boundary review required."};
    if(p===0)row.startsNewInvoice=true;
    await sql`UPDATE "bulkInvoicePages" SET "startsNewInvoice"=${row.startsNewInvoice},"boundaryConfidenceBps"=${Math.round(row.confidence*10000)},
      "classificationJson"=${JSON.stringify(row)},"updatedAt"=now() WHERE "jobId"=${jobId} AND "pageNumber"=${p}`;
   }
   cursor=end;
   await sql`UPDATE "bulkInvoiceJobs" SET "classifyCursor"=${cursor},"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${jobId}`;
   if(cursor<pageCount)return NextResponse.json({success:true,classifyCursor:cursor,done:false});
  }
  const rows=await sql`SELECT "pageNumber","startsNewInvoice","boundaryConfidenceBps" FROM "bulkInvoicePages" WHERE "jobId"=${jobId} ORDER BY "pageNumber"`;
  const ranges=buildBulkRanges(rows.map((r:any)=>({pageNumber:Number(r.pageNumber),startsNewInvoice:r.startsNewInvoice===true,boundaryConfidence:r.boundaryConfidenceBps==null?null:Number(r.boundaryConfidenceBps)/10000})),pageCount);
  const usage=await getOcrUsageSummary(String(jobs[0].clerkUserId));
  if(usage.remainingDocuments<ranges.length){
    const msg=`Bulk PDF vsebuje približno ${ranges.length} računov, vaš paket pa ima na voljo še ${usage.remainingDocuments} OCR dokumentov. Nadgradite paket in nato nadaljujte.`;
    await sql`UPDATE "bulkInvoiceJobs" SET "rangesJson"=${JSON.stringify(ranges)},"totalInvoices"=${ranges.length},"stage"='quota_wait',"status"='processing',
      "lockedAt"=NULL,"lastError"=${msg},"updatedAt"=now() WHERE "id"=${jobId}`;
    return NextResponse.json({success:true,done:true,quotaWait:true,totalInvoices:ranges.length,message:msg});
  }
  const needsReview=ranges.some(r=>r.needsBoundaryReview);
  await sql`UPDATE "bulkInvoiceJobs" SET "rangesJson"=${JSON.stringify(ranges)},"totalInvoices"=${ranges.length},
    "boundaryReviewRequired"=${needsReview},"stage"=${needsReview?'boundary_review':'split'},"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${jobId}`;
  return NextResponse.json({success:true,done:true,totalInvoices:ranges.length,boundaryReviewRequired:needsReview,ranges});
 }catch(error){const msg=error instanceof Error?error.message:String(error);await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"lastError"=${msg.slice(0,2000)},"updatedAt"=now() WHERE "id"=${jobId}`;return NextResponse.json({error:msg},{status:500});}
}
