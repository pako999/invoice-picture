import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOcrUsageSummary } from "@/lib/invoice-intelligence/quota";

export const dynamic = "force-dynamic";
export async function GET(){const{userId}=await auth();if(!userId)return NextResponse.json({error:"Unauthorized"},{status:401});try{return NextResponse.json(await getOcrUsageSummary(userId),{headers:{"Cache-Control":"no-store"}});}catch(error){console.error("ocr_usage_failed",error);return NextResponse.json({error:"OCR usage is temporarily unavailable"},{status:500});}}
