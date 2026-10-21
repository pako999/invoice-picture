import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { getCommercialPlanCode } from "@/lib/plan-entitlements";
import { getPlanConfig } from "@/lib/plans";

import { memberHasSeat } from "@/lib/workspace-limits";

export const WORKSPACE_COOKIE = "invoice-workspace";
export function workspaceSql() { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set"); return neon(process.env.DATABASE_URL); }

/** Rechecked on every request, including after removal or plan downgrade. */
export async function canAccessWorkspace(actorId: string, ownerId: string) {
  if (actorId === ownerId) return true;
  const sql = workspaceSql();
  const rows = await sql`SELECT "memberId" FROM "workspaceMembers" WHERE "ownerId"=${ownerId} AND "status"='active' ORDER BY "id"`;
  const limit = getPlanConfig(await getCommercialPlanCode(ownerId)).userLimit;
  return memberHasSeat(actorId,ownerId,rows.map(row=>String(row.memberId)),limit);
}

/** Only data endpoints use the selected workspace; billing retains Clerk identity. */
export async function workspaceAuth() {
  const session = await auth();
  if (!session.userId) return { ...session, actorId: null };
  const actorId = session.userId;
  const requested = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const ownerId = requested && requested !== actorId && await canAccessWorkspace(actorId,requested) ? requested : actorId;
  return { ...session, actorId, userId: ownerId };
}
