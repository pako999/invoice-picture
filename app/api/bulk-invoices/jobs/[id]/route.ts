import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSql } from "@/lib/bulk-invoices/service";
import { createDocumentSignature } from "@/lib/invoice-intelligence/signing";
export async function GET(_req: Request,{params}:{params:Promise<{id:string}>}) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id=Number((await params).id); if(!Number.isInteger(id)) return NextResponse.json({error:"Invalid id"},{status:400});
  const sql=bulkSql();
  const jobs=await sql`
    SELECT "id","filename","byteSize","status","stage","pageCount","ocrNextPage","classifyCursor","rangesJson",
           "boundaryReviewRequired","totalInvoices","processedInvoices","lastError","createdAt","updatedAt","completedAt"
    FROM "bulkInvoiceJobs" WHERE "id"=${id} AND "clerkUserId"=${userId} LIMIT 1
  `;
  if(!jobs.length)return NextResponse.json({error:"Not found"},{status:404});
  const groups=await sql`
    SELECT g."groupIndex",g."startPage",g."endPage",g."boundaryConfidenceBps",g."needsBoundaryReview",
           g."status",g."deliveryStatus",g."deliveryError",g."documentId",
           d."status" AS "documentStatus",d."validationStatus",d."overallConfidenceBps",d."filename" AS "documentFilename"
    FROM "bulkInvoiceGroups" g LEFT JOIN "invoiceDocuments" d ON d."id"=g."documentId"
    WHERE g."jobId"=${id} ORDER BY g."groupIndex"
  `;
  const job:any=jobs[0];
  // Keep the signed preview URL stable while this page polls job progress so
  // an open PDF iframe is not reloaded every three seconds.
  const previewWindowMs=15*60_000;
  const expires=(Math.floor(Date.now()/previewWindowMs)+2)*previewWindowMs;
  const groupsWithPreviews=groups.map((group:any)=>{
    const documentId=group.documentId==null?null:Number(group.documentId);
    return {
      ...group,
      previewUrl:documentId==null?null:`/api/invoice-reader/${documentId}/file?exp=${expires}&sig=${createDocumentSignature(documentId,userId,expires)}`,
    };
  });
  return NextResponse.json({
    job:{...job,ranges:parse(job.rangesJson),rangesJson:undefined},
    groups:groupsWithPreviews
  },{headers:{"Cache-Control":"no-store"}});
}
function parse(v:any){if(!v)return null;try{return JSON.parse(String(v));}catch{return null;}}
