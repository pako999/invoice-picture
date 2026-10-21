import { NextResponse } from "next/server";
import { workspaceAuth as auth } from "@/lib/workspace";
import { z } from "zod";
import { bulkSql } from "@/lib/bulk-invoices/service";
import { getOcrUsageSummary } from "@/lib/invoice-intelligence/quota";
import { validateBulkRanges } from "@/lib/bulk-invoices/config";
const row=z.object({startPage:z.number().int().min(0),endPage:z.number().int().min(0)});
const schema=z.object({ranges:z.array(row).min(1).max(500)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
 const {userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=Number((await params).id);const data=schema.parse(await req.json());const sql=bulkSql();
 const jobs=await sql`SELECT "pageCount","stage","deliveryMode" FROM "bulkInvoiceJobs" WHERE "id"=${id} AND "clerkUserId"=${userId} LIMIT 1`;
 if(!jobs.length)return NextResponse.json({error:"Not found"},{status:404});
 if(!["boundary_review","quota_wait"].includes(String(jobs[0].stage)))return NextResponse.json({error:"Razpone je mogoče spreminjati samo med pregledom meja računov."},{status:409});
 const pageCount=Number(jobs[0].pageCount??0);
 const ranges=data.ranges.map(r=>({...r,boundaryConfidence:null,needsBoundaryReview:false}));
 if(!validateBulkRanges(ranges,pageCount))return NextResponse.json({error:"Razponi morajo zaporedno pokriti vse strani brez vrzeli ali prekrivanja."},{status:400});
 const usage=await getOcrUsageSummary(userId),monthStart=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1));
 const tx=await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(hashtextextended(${`ocr-doc:${userId}`},0))`,
  sql`UPDATE "bulkInvoiceJobs" SET "rangesJson"=${JSON.stringify(ranges)},"boundaryReviewRequired"=false,"totalInvoices"=${ranges.length},"stage"='split',"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${id} AND "clerkUserId"=${userId} AND "stage" IN ('boundary_review','quota_wait') AND ("deliveryMode"='split_pdf_email' OR ((SELECT count(*) FROM "invoiceDocumentMeter" WHERE "clerkUserId"=${userId} AND "createdAt">=${monthStart}) + COALESCE((SELECT sum(GREATEST("totalInvoices"-"processedInvoices",0)) FROM "bulkInvoiceJobs" WHERE "clerkUserId"=${userId} AND "id"<>${id} AND "status"='processing' AND "stage" IN ('boundary_review','split','extract') AND "deliveryMode"<>'split_pdf_email' AND "createdAt">=${monthStart}),0) + ${ranges.length}) <= ${usage.monthlyDocumentLimit}) RETURNING "id"`,
 ]);
 if(!tx[1].length)return NextResponse.json({error:"Izbrano število računov presega preostalo mesečno OCR kvoto.",code:"ocr_plan_limit_reached"},{status:402});
 return NextResponse.json({success:true,ranges});
}
