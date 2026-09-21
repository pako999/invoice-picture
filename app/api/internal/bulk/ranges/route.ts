import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret,validateBulkRanges } from "@/lib/bulk-invoices/config";
import { bulkSql } from "@/lib/bulk-invoices/service";
const schema=z.object({jobId:z.number().int().positive()});
export async function POST(req:Request){if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const {jobId}=schema.parse(await req.json());const sql=bulkSql();const rows=await sql`SELECT "pageCount","rangesJson","stage" FROM "bulkInvoiceJobs" WHERE "id"=${jobId} LIMIT 1`;
 if(!rows.length||rows[0].stage!=='split')return NextResponse.json({error:"Bulk job is not ready to split"},{status:409});
 let ranges:any[]=[];try{ranges=JSON.parse(String(rows[0].rangesJson||"[]"));}catch{}
 if(!validateBulkRanges(ranges,Number(rows[0].pageCount??0)))return NextResponse.json({error:"Invalid invoice page ranges"},{status:400});
 const existing=await sql`SELECT "groupIndex" FROM "bulkInvoiceGroups" WHERE "jobId"=${jobId} ORDER BY "groupIndex"`;
 return NextResponse.json({ranges,existingGroupIndexes:existing.map((row:any)=>Number(row.groupIndex))});
}
