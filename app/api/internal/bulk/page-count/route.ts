import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret,BULK_PDF_MAX_PAGES } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
const schema=z.object({jobId:z.number().int().positive(),pageCount:z.number().int().min(1).max(BULK_PDF_MAX_PAGES)});
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const sql=bulkSql();
 const rows=await sql`UPDATE "bulkInvoiceJobs" SET "pageCount"=${data.pageCount},"ocrNextPage"=0,"stage"='ocr',
   "lockedAt"=NULL,"lastError"=NULL,"updatedAt"=now() WHERE "id"=${data.jobId} AND "status"='processing' RETURNING "id"`;
 if(!rows.length)return NextResponse.json({error:"Bulk job not found"},{status:404});
 return NextResponse.json({success:true,pageCount:data.pageCount});
}
