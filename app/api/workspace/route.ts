import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { workspaceAuth, workspaceSql, canAccessWorkspace, WORKSPACE_COOKIE } from "@/lib/workspace";
import { getCommercialPlanCode } from "@/lib/plan-entitlements";
import { getPlanConfig } from "@/lib/plans";
const headers = { "Cache-Control":"private, no-store" };
const input = z.discriminatedUnion("action", [z.object({action:z.literal("switch"),ownerId:z.string().min(1).max(255)}),z.object({action:z.literal("invite"),email:z.email()}),z.object({action:z.literal("accept"),ownerId:z.string().min(1).max(255)}),z.object({action:z.literal("remove"),memberId:z.string().min(1).max(255)})]);
export async function GET() {
  const {userId,actorId} = await workspaceAuth();
  if(!userId||!actorId)return NextResponse.json({error:"Unauthorized"},{status:401});
  const sql=workspaceSql();
  const [members, invitations, plan] = await Promise.all([
    sql`SELECT "id","memberId","email","status" FROM "workspaceMembers" WHERE "ownerId"=${userId} ORDER BY "id"`,
    sql`SELECT m."ownerId",m."status",COALESCE((SELECT c."name" FROM companies c WHERE c."clerkUserId"=m."ownerId" ORDER BY c.id LIMIT 1),'Ekipa') AS "name" FROM "workspaceMembers" m WHERE m."memberId"=${actorId} ORDER BY m."id"`,
    getCommercialPlanCode(userId),
  ]);
  return NextResponse.json({ownerId:userId,isOwner:userId===actorId,actorId,plan,userLimit:getPlanConfig(plan).userLimit,members,invitations},{headers});
}
export async function POST(req:NextRequest) {
  const {userId:actorId}=await auth();if(!actorId)return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const data=input.parse(await req.json()),sql=workspaceSql();
    if(data.action==="switch") {
      if(!await canAccessWorkspace(actorId,data.ownerId))return NextResponse.json({error:"Nimate dostopa do te ekipe ali je dosežena omejitev uporabnikov."},{status:403});
      (await cookies()).set(WORKSPACE_COOKIE,data.ownerId,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:30*86400});
    } else if(data.action==="accept") {
      const limit=getPlanConfig(await getCommercialPlanCode(data.ownerId)).userLimit;
      const result=await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`seats:${data.ownerId}`},0))`,
        sql`UPDATE "workspaceMembers" SET "status"='active' WHERE "ownerId"=${data.ownerId} AND "memberId"=${actorId} AND "status"='pending' AND (SELECT count(*) FROM "workspaceMembers" WHERE "ownerId"=${data.ownerId} AND "status"='active') < ${Math.max(0,limit-1)} RETURNING id`,
      ]);
      if(!result[1].length)return NextResponse.json({error:"Povabila ni mogoče sprejeti. Preverite omejitev uporabnikov paketa."},{status:409});
    } else {
      const session=await workspaceAuth();if(session.userId!==actorId)return NextResponse.json({error:"Uporabnike upravlja lastnik naročnine."},{status:403});
      if(data.action==="remove")await sql`DELETE FROM "workspaceMembers" WHERE "ownerId"=${actorId} AND "memberId"=${data.memberId}`;
      else {
        const limit=getPlanConfig(await getCommercialPlanCode(actorId)).userLimit;
        const users=await(await clerkClient()).users.getUserList({emailAddress:[data.email.trim().toLowerCase()],limit:1});
        const member=users.data.find(u=>u.emailAddresses.some(e=>e.emailAddress.toLowerCase()===data.email.toLowerCase()&&e.verification?.status==="verified"));
        if(!member)return NextResponse.json({error:"Sodelavec naj najprej ustvari in potrdi svoj račun z navedenim e-poštnim naslovom."},{status:400});
        if(member.id===actorId)return NextResponse.json({error:"Lastnik je že vključen v število uporabnikov."},{status:400});
        const results=await sql.transaction([
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`seats:${actorId}`},0))`,
          sql`INSERT INTO "workspaceMembers" ("ownerId","memberId","email") SELECT ${actorId},${member.id},${data.email.toLowerCase()} WHERE (SELECT count(*) FROM "workspaceMembers" WHERE "ownerId"=${actorId}) < ${Math.max(0,limit-1)} ON CONFLICT ("ownerId","memberId") DO NOTHING RETURNING id`,
        ]);
        if(!results[1].length)return NextResponse.json({error:`Povabilo že obstaja ali je dosežena omejitev ${limit} uporabnikov, vključno z lastnikom.`,code:"user_limit_reached"},{status:409});
      }
    }
    return NextResponse.json({success:true},{headers});
  } catch(error) {console.error("[workspace]",error);return NextResponse.json({error:"Spremembe ekipe ni bilo mogoče shraniti."},{status:400});}
}
