import { NextRequest, NextResponse } from "next/server";
import { workspaceAuth as auth, workspaceSql } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getStatus } from "@/lib/subscription";
export const dynamic="force-dynamic";export const revalidate=0;
const NO_STORE={"Cache-Control":"no-store, no-cache, must-revalidate, max-age=0"};
const schema=z.object({name:z.string().trim().min(1).max(255),recipientEmail:z.email()});
export async function GET(){const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401,headers:NO_STORE});try{const rows=await getDb().select().from(companies).where(eq(companies.clerkUserId,userId)).orderBy(desc(companies.createdAt));return NextResponse.json(rows,{headers:NO_STORE});}catch(err){console.error("[companies GET]",err);return NextResponse.json([],{headers:NO_STORE});}}
export async function POST(req:NextRequest){
 const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401,headers:NO_STORE});
 try{
  const status=await getStatus(userId),data=schema.parse(await req.json()),sql=workspaceSql();
  const result=await sql.transaction([
   sql`SELECT pg_advisory_xact_lock(hashtextextended(${`companies:${userId}`},0))`,
   sql`INSERT INTO companies ("clerkUserId","name","recipientEmail") SELECT ${userId},${data.name},${data.recipientEmail} WHERE ${status.companyLimit===null} OR (SELECT count(*) FROM companies WHERE "clerkUserId"=${userId}) < ${status.companyLimit??0} RETURNING *`,
  ]);
  if(!result[1].length)return NextResponse.json({error:`Vaš paket omogoča največ ${status.companyLimit} podjetij. Nadgradite paket za več podjetij.`,code:"company_limit_reached",plan:status.commercialPlan,upgradeUrl:"/cenik"},{status:403,headers:NO_STORE});
  return NextResponse.json(result[1][0],{headers:NO_STORE});
 }catch(err){return NextResponse.json({error:err instanceof z.ZodError?"Neveljavni podatki.":"Napaka pri shranjevanju."},{status:400,headers:NO_STORE});}
}
