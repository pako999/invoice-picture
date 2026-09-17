import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getStatus } from "@/lib/subscription";
export const dynamic="force-dynamic";export const revalidate=0;const NO_STORE={"Cache-Control":"no-store, no-cache, must-revalidate, max-age=0"};const schema=z.object({name:z.string().min(1).max(255),recipientEmail:z.string().email()});
export async function GET(){const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401,headers:NO_STORE});try{const rows=await getDb().select().from(companies).where(eq(companies.clerkUserId,userId)).orderBy(desc(companies.createdAt));return NextResponse.json(rows,{headers:NO_STORE});}catch(err){console.error("[companies GET]",err);return NextResponse.json([],{headers:NO_STORE});}}
export async function POST(req:NextRequest){const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401,headers:NO_STORE});try{const status=await getStatus(userId);const db=getDb();const existing=await db.select({id:companies.id}).from(companies).where(eq(companies.clerkUserId,userId));if(status.companyLimit!==null&&existing.length>=status.companyLimit)return NextResponse.json({error:`Vaš paket omogoča največ ${status.companyLimit} ${status.companyLimit===1?"podjetje":"podjetja"}. Nadgradite paket za več podjetij.`,code:"company_limit_reached",plan:status.commercialPlan,upgradeUrl:"/cenik"},{status:403,headers:NO_STORE});const data=schema.parse(await req.json());const[row]=await db.insert(companies).values({clerkUserId:userId,...data}).returning();return NextResponse.json(row,{headers:NO_STORE});}catch(err){return NextResponse.json({error:err instanceof z.ZodError?"Neveljavni podatki.":"Napaka pri shranjevanju."},{status:400,headers:NO_STORE});}}
