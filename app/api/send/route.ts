import { MAX_INLINE_SOURCE_BYTES, inlineRequestTooLarge } from "@/lib/invoice-inline-upload";
import { traceInvoiceStage } from "@/lib/invoice-intelligence/trace";
import { NextRequest, NextResponse } from "next/server";
import { workspaceAuth as auth } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { invoices, userSettings, companies } from "@/lib/schema";
import { queueOriginalInvoiceEmail } from "@/lib/invoice-intelligence/original-delivery";
import { FREE_MONTHLY_LIMIT, getStatus } from "@/lib/subscription";
import { getPlanConfig } from "@/lib/plans";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { enqueueInvoiceDocument } from "@/lib/invoice-intelligence/queue";
import { OcrCommercialQuotaError } from "@/lib/invoice-intelligence/quota";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import { isStructuredDeliveryMode, type DeliveryMode } from "@/lib/invoice-intelligence/delivery-format";
export const maxDuration = 300;

const MAX_FILE_BYTES=MAX_INLINE_SOURCE_BYTES; const ALLOWED_MIME=new Set(["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif","application/xml","text/xml"]);
const schema=z.object({subject:z.string().min(1).max(255).default("Račun"),imageBase64:z.string().min(1).max(14*1024*1024),filename:z.string().min(1).max(255),mime:z.string().max(96).default("image/jpeg"),companyId:z.number().int().positive().optional(),messageBody:z.string().max(2000).optional(),preferBatch:z.boolean().optional().default(false)});

export async function POST(req:NextRequest){const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});const status=await getStatus(userId);const cfg=getPlanConfig(status.commercialPlan);if(!status.canSend)return NextResponse.json({success:false,error:"Paket ni aktiven. Nadgradite paket za nadaljevanje.",code:"subscription_required",plan:status.commercialPlan},{status:402});if(status.isFree&&status.monthlyUsage>=FREE_MONTHLY_LIMIT)return NextResponse.json({success:false,error:"Dosežena je mesečna omejitev 3 računov na brezplačnem paketu.",code:"free_limit_reached"},{status:403});
try{if(inlineRequestTooLarge(req.headers))return NextResponse.json({error:"Use private storage for larger PDFs",code:"inline_upload_too_large"},{status:413});const data=schema.parse(await traceInvoiceStage("file_read", null, { operation: "request_json_body" }, () => req.json()));const bytes=Buffer.from(data.imageBase64,"base64");if(bytes.length>MAX_FILE_BYTES)return NextResponse.json({success:false,error:"Za večji PDF uporabite zasebno shrambo.",code:"inline_upload_too_large"},{status:413});if(bytes.length===0)return NextResponse.json({success:false,error:"Datoteka je prevelika za neposredno nalaganje. Večji PDF naložite prek zasebne shrambe."},{status:400});if(!ALLOWED_MIME.has(data.mime))return NextResponse.json({success:false,error:"Nepodprt tip datoteke."},{status:415});if(data.mime==="application/pdf"&&bytes.subarray(0,4).toString()!=="%PDF")return NextResponse.json({success:false,error:"Neveljaven PDF."},{status:400});
const db=getDb();let recipientEmail:string|null|undefined;let deliveryMode:DeliveryMode="email_ocr";if(data.companyId){const[company]=await db.select().from(companies).where(and(eq(companies.id,data.companyId),eq(companies.clerkUserId,userId))).limit(1);recipientEmail=company?.recipientEmail;if(company)deliveryMode=(await getCompanyDeliverySettings(company.id,userId)).mode;}else{const[settings]=await db.select().from(userSettings).where(eq(userSettings.clerkUserId,userId)).limit(1);recipientEmail=settings?.recipientEmail;}if(!recipientEmail)return NextResponse.json({success:false,error:"V Nastavitvah določite prejemni e-mail.",code:"no_recipient"},{status:422});
if((deliveryMode==="xml_email"||deliveryMode==="xml_zip_email")&&!cfg.structuredDelivery)return NextResponse.json({success:false,error:"XML/eSLOG pošiljanje ni vključeno v vaš paket.",code:"feature_not_in_plan",upgradeUrl:"/cenik"},{status:403});if(deliveryMode==="api_json"&&!cfg.apiDelivery)return NextResponse.json({success:false,error:"JSON API pošiljanje ni vključeno v vaš paket.",code:"feature_not_in_plan",upgradeUrl:"/cenik"},{status:403});
const filename=sanitizeFilename(data.filename);const[result]=await db.insert(invoices).values({clerkUserId:userId,recipientEmail,companyId:data.companyId??null,subject:data.subject,imageData:data.imageBase64,imageMime:data.mime,filename,status:"pending"}).returning({id:invoices.id});let processingDocumentId:number|null=null;let queueErrorMessage:string|null=null;let quotaError:OcrCommercialQuotaError|null=null;
if(deliveryMode!=="split_pdf_email"){try{processingDocumentId=await enqueueInvoiceDocument({clerkUserId:userId,companyId:data.companyId??null,sourceInvoiceId:result.id,filename,mimeType:data.mime,base64:data.imageBase64,preferBatch:data.preferBatch});}catch(error){queueErrorMessage=error instanceof Error?error.message:"unknown";if(error instanceof OcrCommercialQuotaError)quotaError=error;console.error("invoice_reader_enqueue_failed",queueErrorMessage);}}
if(isStructuredDeliveryMode(deliveryMode)){if(!processingDocumentId){await db.update(invoices).set({status:"failed",errorMessage:`Structured delivery could not be queued: ${queueErrorMessage||"unknown error"}`}).where(eq(invoices.id,result.id));if(quotaError)return NextResponse.json({success:false,error:quotaError.message,code:quotaError.code,quotaType:quotaError.quotaType,plan:quotaError.plan,upgradeUrl:"/cenik"},{status:402});return NextResponse.json({success:false,error:"Strukturirane obdelave ni bilo mogoče uvrstiti v čakalno vrsto."},{status:500});}return NextResponse.json({success:true,id:result.id,processingDocumentId,deliveryMode,queuedForStructuredDelivery:true});}
await queueOriginalInvoiceEmail(result.id,data.messageBody);
return NextResponse.json({success:true,id:result.id,processingDocumentId,deliveryMode,queued:true,ocrQueued:Boolean(processingDocumentId),ocrError:queueErrorMessage,ocrLimitReached:Boolean(quotaError),ocrMessage:quotaError?.message??null,ocrPlan:quotaError?.plan??null},{status:202});}

catch(err){return NextResponse.json({success:false,error:err instanceof Error?err.message:"Napaka"},{status:400});}}
function sanitizeFilename(filename:string){const base=filename.split(/[\\/]/).pop()||"invoice";return base.replace(/[\u0000-\u001f\u007f]/g,"").replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g,"_").slice(0,255);}

