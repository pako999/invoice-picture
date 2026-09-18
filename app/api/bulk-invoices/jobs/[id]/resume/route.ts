import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOcrUsageSummary } from "@/lib/invoice-intelligence/quota";
import { bulkSql } from "@/lib/bulk-invoices/service";
export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});const id=Number((await params).id);const sql=bulkSql();
 const rows=await sql`SELECT "totalInvoices","stage" FROM "bulkInvoiceJobs" WHERE "id"=${id} AND "clerkUserId"=${userId} LIMIT 1`;if(!rows.length)return NextResponse.json({error:"Not found"},{status:404});
 if(rows[0].stage!=='quota_wait')return NextResponse.json({error:"Job ne čaka na nadgradnjo paketa."},{status:409});
 const usage=await getOcrUsageSummary(userId);const needed=Number(rows[0].totalInvoices??0);if(usage.remainingDocuments<needed)return NextResponse.json({error:`Potrebujete prostor za ${needed} OCR dokumentov, na voljo jih je še ${usage.remainingDocuments}.`,code:"ocr_plan_limit_reached"},{status:402});
 await sql`UPDATE "bulkInvoiceJobs" SET "stage"='classify',"status"='processing',"lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${id}`;
 return NextResponse.json({success:true});
}
