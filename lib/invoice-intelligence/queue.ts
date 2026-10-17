import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { getDb } from "@/lib/db";
import { invoiceDocuments, invoiceProcessingJobs } from "@/lib/schema";
import { OcrCommercialQuotaError, resolveOcrEntitlement } from "@/lib/invoice-intelligence/quota";
import { getPlanConfig } from "@/lib/plans";

export async function enqueueInvoiceDocument(input:{clerkUserId:string;companyId:number|null;sourceInvoiceId:number|null;filename:string;mimeType:string;base64:string}){
  const bytes=Buffer.from(input.base64,"base64");
  const sha256=createHash("sha256").update(bytes).digest("hex");
  const idempotencyKey=createHash("sha256").update(`${input.clerkUserId}:${input.sourceInvoiceId??"upload"}:${sha256}`).digest("hex");
  const retentionDays=Number(process.env.INVOICE_RETENTION_DAYS??365);
  const retentionUntil=Number.isFinite(retentionDays)&&retentionDays>0?new Date(Date.now()+retentionDays*86400000):null;
  const readerConfigured=Boolean(process.env.MISTRAL_API_KEY)||/xml/i.test(input.mimeType)||/\.xml$/i.test(input.filename);
  const db=getDb();
  const[existing]=await db.select({id:invoiceDocuments.id}).from(invoiceDocuments).where(eq(invoiceDocuments.idempotencyKey,idempotencyKey)).limit(1);
  if(existing)return existing.id;
  let priority=false;let documentId:number|null=null;const filename=sanitizeFilename(input.filename);
  if(readerConfigured){
    const quota=await resolveOcrEntitlement(input.clerkUserId);priority=getPlanConfig(quota.plan).priorityProcessing;
    const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is not set");const sql=neon(url);
    const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
    const results=await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`ocr-doc:${input.clerkUserId}`},0))`,
      sql`INSERT INTO "invoiceDocuments" ("clerkUserId","companyId","sourceInvoiceId","filename","mimeType","originalBase64","sha256","byteSize","idempotencyKey","status","retentionUntil","createdAt","updatedAt")
          SELECT ${input.clerkUserId},${input.companyId},${input.sourceInvoiceId},${filename},${input.mimeType},${input.base64},${sha256},${bytes.length},${idempotencyKey},'queued',${retentionUntil},now(),now()
          WHERE ((SELECT count(*) FROM "invoiceDocuments" WHERE "clerkUserId"=${input.clerkUserId} AND "createdAt">=${monthStart})
            + COALESCE((SELECT sum(GREATEST("totalInvoices"-"processedInvoices",0)) FROM "bulkInvoiceJobs" WHERE "clerkUserId"=${input.clerkUserId} AND "createdAt">=${monthStart}),0)) < ${quota.monthlyDocumentLimit}
          ON CONFLICT ("idempotencyKey") DO NOTHING RETURNING "id"`,
    ]);
    documentId=Number((results[1] as Array<{id:number}>)[0]?.id||0)||null;
    if(!documentId){const[duplicate]=await db.select({id:invoiceDocuments.id}).from(invoiceDocuments).where(eq(invoiceDocuments.idempotencyKey,idempotencyKey)).limit(1);if(duplicate)return duplicate.id;throw new OcrCommercialQuotaError(quota.adminOverride?`Admin OCR mesečni limit ${quota.monthlyDocumentLimit} dokumentov je dosežen.`:`Dosežen je mesečni OCR limit paketa ${quota.planName}: ${quota.monthlyDocumentLimit} dokumentov. Originalno pošiljanje računov še vedno deluje; za nadaljnjo AI obdelavo nadgradite paket.`,"documents",quota.monthlyDocumentLimit,quota.plan);}
  }else{
    const[document]=await db.insert(invoiceDocuments).values({clerkUserId:input.clerkUserId,companyId:input.companyId,sourceInvoiceId:input.sourceInvoiceId,filename,mimeType:input.mimeType,originalBase64:input.base64,sha256,byteSize:bytes.length,idempotencyKey,status:"uploaded",retentionUntil}).onConflictDoNothing({target:invoiceDocuments.idempotencyKey}).returning({id:invoiceDocuments.id});
    documentId=document?.id??null;
  }
  if(!documentId)return null;
  if(readerConfigured)await db.insert(invoiceProcessingJobs).values({documentId,status:"queued",availableAt:priority?new Date(Date.now()-60000):new Date()}).onConflictDoNothing();
  return documentId;
}
function sanitizeFilename(filename:string){const base=filename.split(/[\\/]/).pop()||"invoice";return base.replace(/[\u0000-\u001f\u007f]/g,"").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g,"_").slice(0,255);}
