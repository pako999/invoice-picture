import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { bulkInvoiceGroups, bulkInvoiceJobs, invoiceAuditLogs, invoiceDocuments, invoices } from "@/lib/schema";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import { sendInvoiceEmail } from "@/lib/resend";
const schema=z.object({jobId:z.number().int().positive(),groupIndex:z.number().int().min(0),objectUrl:z.string().url()});
export async function POST(req:Request){
 if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=schema.parse(await req.json());const db=getDb();
 const [job]=await db.select().from(bulkInvoiceJobs).where(eq(bulkInvoiceJobs.id,data.jobId)).limit(1);if(!job)return NextResponse.json({error:"Job not found"},{status:404});
 const [group]=await db.select().from(bulkInvoiceGroups).where(and(eq(bulkInvoiceGroups.jobId,data.jobId),eq(bulkInvoiceGroups.groupIndex,data.groupIndex))).limit(1);
 if(!group?.documentId)return NextResponse.json({error:"Bulk child is not extracted yet"},{status:409});
 const [doc]=await db.select().from(invoiceDocuments).where(eq(invoiceDocuments.id,group.documentId)).limit(1);if(!doc?.sourceInvoiceId)return NextResponse.json({error:"Source invoice missing"},{status:409});
 if(!job.companyId)return NextResponse.json({error:"Company is required for bulk email delivery"},{status:409});
 const settings=await getCompanyDeliverySettings(job.companyId,job.clerkUserId);if(settings.mode!=="email_ocr"){await db.update(bulkInvoiceGroups).set({deliveryStatus:"not_required",deliveryError:null,updatedAt:new Date()}).where(eq(bulkInvoiceGroups.id,group.id));return NextResponse.json({success:true,skipped:true});}
 try{
  const u=new URL(data.objectUrl);if(!u.hostname.endsWith(".storage.c-3.eu-central-1.aws.neon.tech"))throw new Error("Invalid private storage URL");
  const response=await fetch(data.objectUrl,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error(`Child PDF download failed (${response.status})`);
  const len=Number(response.headers.get("content-length")||0);if(len>25*1024*1024)throw new Error("Child PDF exceeds the 25 MB email delivery safety limit");
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>25*1024*1024)throw new Error("Child PDF exceeds the 25 MB email delivery safety limit");
  const [source]=await db.select().from(invoices).where(eq(invoices.id,doc.sourceInvoiceId)).limit(1);if(!source)throw new Error("Invoice archive row missing");
  const sent=await sendInvoiceEmail({to:source.recipientEmail,subject:source.subject,imageBase64:bytes.toString("base64"),filename:doc.filename,mime:"application/pdf"});
  if(sent.error)throw new Error(sent.error.message);
  await db.update(invoices).set({status:"sent",sentAt:new Date(),errorMessage:null}).where(eq(invoices.id,source.id));
  await db.update(bulkInvoiceGroups).set({deliveryStatus:"completed",deliveryError:null,updatedAt:new Date()}).where(eq(bulkInvoiceGroups.id,group.id));
  await db.insert(invoiceAuditLogs).values({documentId:doc.id,clerkUserId:job.clerkUserId,action:"bulk_original_email_sent",metadataJson:JSON.stringify({bulkJobId:data.jobId,groupIndex:data.groupIndex,to:source.recipientEmail})});
  const remaining=await db.select({id:bulkInvoiceGroups.id}).from(bulkInvoiceGroups).where(and(eq(bulkInvoiceGroups.jobId,data.jobId),eq(bulkInvoiceGroups.deliveryStatus,"pending"))).limit(1);
  const failed=await db.select({id:bulkInvoiceGroups.id}).from(bulkInvoiceGroups).where(and(eq(bulkInvoiceGroups.jobId,data.jobId),eq(bulkInvoiceGroups.deliveryStatus,"failed"))).limit(1);
  const all=await db.select({id:bulkInvoiceGroups.id,documentId:bulkInvoiceGroups.documentId}).from(bulkInvoiceGroups).where(eq(bulkInvoiceGroups.jobId,data.jobId));
  if(!remaining.length&&!failed.length&&all.length>0&&all.every(g=>g.documentId!=null))await db.update(bulkInvoiceJobs).set({status:"completed",stage:"completed",processedInvoices:all.length,completedAt:new Date(),lockedAt:null,lastError:null,updatedAt:new Date()}).where(eq(bulkInvoiceJobs.id,data.jobId));
  return NextResponse.json({success:true});
 }catch(error){const msg=error instanceof Error?error.message:String(error);await db.update(bulkInvoiceGroups).set({deliveryStatus:"failed",deliveryError:msg.slice(0,2000),updatedAt:new Date()}).where(eq(bulkInvoiceGroups.id,group.id));await db.update(invoices).set({status:"failed",errorMessage:msg.slice(0,2000)}).where(eq(invoices.id,doc.sourceInvoiceId));return NextResponse.json({error:msg},{status:500});}
}
