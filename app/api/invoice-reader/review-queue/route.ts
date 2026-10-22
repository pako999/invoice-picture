import { NextResponse } from "next/server";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { workspaceAuth } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { invoiceDocuments } from "@/lib/schema";

const inputSchema = z.object({
  ids: z.array(z.number().int().positive()).max(5000).optional(),
  excludeId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(5000).default(200),
});

// Navigation needs only IDs, not invoice content, usage totals or archive statistics.
export async function POST(req: Request) {
  const { userId } = await workspaceAuth();
  if (!userId) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });
  try {
    const input = inputSchema.parse(await req.json());
    const ids = input.ids ? [...new Set(input.ids)] : undefined;
    const documents = ids?.length === 0 ? [] : await getDb()
      .select({ id: invoiceDocuments.id }).from(invoiceDocuments)
      .where(and(
        eq(invoiceDocuments.clerkUserId, userId),
        eq(invoiceDocuments.status, "needs_review"),
        ids ? inArray(invoiceDocuments.id, ids) : undefined,
        input.excludeId ? ne(invoiceDocuments.id, input.excludeId) : undefined,
      )).orderBy(asc(invoiceDocuments.id)).limit(input.limit);
    return NextResponse.json({ documents }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const invalid = error instanceof z.ZodError || error instanceof SyntaxError;
    return NextResponse.json({ error: invalid ? "Neveljaven izbor računov." : "Seznama računov trenutno ni mogoče osvežiti." }, { status: invalid ? 400 : 503 });
  }
}
