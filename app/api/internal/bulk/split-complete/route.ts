import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
const child=z.object({groupIndex:z.number().int().min(0),startPage:z.number().int().min(0),endPage:z.number().int().min(0),objectKey:z.string().min(1),byteSize:z.number().int().positive(),sha256:z.string().length(64),boundaryConfidence:z.number().min(0).max(1).nullable().optional(),needsBoundaryReview:z.boolean()});
const schema=z.object({jobId:z.number().int().positive(),children:z.array(child).min(1).max(500)});
export async function POST(req:Request){if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const sql=bulkSql();
 try{
  for(const c of data.children)await sql`INSERT INTO "bulkInvoiceGroups" ("jobId","groupIndex","startPage","endPage","objectKey","sha256","byteSize","boundaryConfidenceBps","needsBoundaryReview","status","deliveryStatus","createdAt","updatedAt")
   VALUES (${data.jobId},${c.groupIndex},${c.startPage},${c.endPage},${c.objectKey},${c.sha256},${c.byteSize},${c.boundaryConfidence==null?null:Math.round(c.boundaryConfidence*10000)},${c.needsBoundaryReview},'pending','pending',now(),now())
   ON CONFLICT ("jobId","groupIndex") DO UPDATE SET "startPage"=EXCLUDED."startPage","endPage"=EXCLUDED."endPage","objectKey"=EXCLUDED."objectKey","sha256"=EXCLUDED."sha256","byteSize"=EXCLUDED."byteSize","updatedAt"=now()`;
  const jobs=await sql`SELECT "rangesJson" FROM "bulkInvoiceJobs" WHERE "id"=${data.jobId} LIMIT 1`;
  let expected=0;try{const ranges=JSON.parse(String(jobs[0]?.rangesJson||"[]"));expected=Array.isArray(ranges)?ranges.length:0;}catch{}
  const counts=await sql`SELECT count(*)::int AS count FROM "bulkInvoiceGroups" WHERE "jobId"=${data.jobId}`;
  const groups=Number(counts[0]?.count??0);const done=expected>0&&groups>=expected;
  await sql`UPDATE "bulkInvoiceJobs" SET "stage"=${done?'extract':'split'},"totalInvoices"=${expected||groups},"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId}`;
  return NextResponse.json({success:true,groups,expected,done});
 }catch(error){const msg=error instanceof Error?error.message:String(error);await sql`UPDATE "bulkInvoiceJobs" SET "lockedAt"=NULL,"lastError"=${msg.slice(0,2000)},"updatedAt"=now() WHERE "id"=${data.jobId}`;return NextResponse.json({error:msg},{status:500});}
}
