import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { bulkSql } from "@/lib/bulk-invoices/service";
import { validateBulkRanges } from "@/lib/bulk-invoices/config";
const row=z.object({startPage:z.number().int().min(0),endPage:z.number().int().min(0)});
const schema=z.object({ranges:z.array(row).min(1).max(500)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
 const {userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=Number((await params).id);const data=schema.parse(await req.json());const sql=bulkSql();
 const jobs=await sql`SELECT "pageCount","stage" FROM "bulkInvoiceJobs" WHERE "id"=${id} AND "clerkUserId"=${userId} LIMIT 1`;
 if(!jobs.length)return NextResponse.json({error:"Not found"},{status:404});
 const pageCount=Number(jobs[0].pageCount??0);
 const ranges=data.ranges.map(r=>({...r,boundaryConfidence:null,needsBoundaryReview:false}));
 if(!validateBulkRanges(ranges,pageCount))return NextResponse.json({error:"Razponi morajo zaporedno pokriti vse strani brez vrzeli ali prekrivanja."},{status:400});
 await sql`UPDATE "bulkInvoiceJobs" SET "rangesJson"=${JSON.stringify(ranges)},"boundaryReviewRequired"=false,
   "totalInvoices"=${ranges.length},"stage"='split',"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${id}`;
 return NextResponse.json({success:true,ranges});
}
