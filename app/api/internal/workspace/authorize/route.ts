import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBulkInternalSecret } from "@/lib/bulk-invoices/config";
import { canAccessWorkspace } from "@/lib/workspace";
export async function POST(req:Request) {
  if(!verifyBulkInternalSecret(req.headers.get("x-bulk-secret")))return NextResponse.json({error:"Unauthorized"},{status:401});
  const data=z.object({actorId:z.string().min(1).max(255),ownerId:z.string().min(1).max(255)}).safeParse(await req.json());
  if(!data.success)return NextResponse.json({error:"Invalid request"},{status:400});
  return NextResponse.json({allowed:await canAccessWorkspace(data.data.actorId,data.data.ownerId)},{headers:{"Cache-Control":"no-store"}});
}
