import { NextRequest, NextResponse } from "next/server";
import { workspaceAuth as auth } from "@/lib/workspace";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { companies, invoiceDocuments } from "@/lib/schema";
import { normalizedInvoiceSchema } from "@/lib/invoice-intelligence/types";
import { generateSepaPayment } from "@/lib/invoice-intelligence/sepa";
import { companyBankProfile } from "@/lib/company-bank-profile";
const input = z.object({ bic: z.string().max(11).optional(), name:z.string().trim().min(1).max(70), iban:z.string().max(50),city:z.string().trim().min(1).max(35),country:z.string().length(2),executionDate:z.string().length(10), confirmed:z.literal(true) });
export async function GET(_req:NextRequest, {params}:{params:Promise<{id:string}>}) {
  const {userId}=await auth();
  if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=Number((await params).id);
  if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({error:"Invalid id"},{status:400});
  const db=getDb();
  const [doc]=await db.select({companyId:invoiceDocuments.companyId}).from(invoiceDocuments).where(and(eq(invoiceDocuments.id,id),eq(invoiceDocuments.clerkUserId,userId))).limit(1);
  if(!doc)return NextResponse.json({error:"Not found"},{status:404});
  const [company]=doc.companyId ? await db.select().from(companies).where(and(eq(companies.id,doc.companyId),eq(companies.clerkUserId,userId))).limit(1) : [];
  return NextResponse.json({companyId:company?.id??null,companyName:company?.name??null,bank:company?.bankIban?companyBankProfile(company):null},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:NextRequest, {params}:{params:Promise<{id:string}>}) {
  const {userId}=await auth();
  if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=Number((await params).id);
  if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({error:"Invalid id"},{status:400});
  try {
    const payer=input.parse(await req.json());
    const [doc]=await getDb().select({status:invoiceDocuments.status,approvedJson:invoiceDocuments.approvedJson}).from(invoiceDocuments).where(and(eq(invoiceDocuments.id,id),eq(invoiceDocuments.clerkUserId,userId))).limit(1);
    if(!doc)return NextResponse.json({error:"Not found"},{status:404});
    if(doc.status!=="approved"||!doc.approvedJson)return NextResponse.json({error:"Najprej preverite in potrdite podatke računa."},{status:409});
    const invoice=normalizedInvoiceSchema.parse(JSON.parse(doc.approvedJson));
    return new NextResponse(generateSepaPayment(invoice,payer),{headers:{"Content-Type":"application/xml; charset=utf-8","Content-Disposition":`attachment; filename="SEPA-${id}.xml"`,"Cache-Control":"private, no-store"}});
  } catch(error) {
    return NextResponse.json({error:error instanceof z.ZodError?"Preverite plačilne podatke in potrdite pregled.":error instanceof Error?error.message:"SEPA izvoz ni uspel."},{status:400});
  }
}
