import { NextRequest, NextResponse } from "next/server";
import { workspaceAuth as auth } from "@/lib/workspace";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceDocuments } from "@/lib/schema";
import { getStatus } from "@/lib/subscription";
import { getPlanConfig } from "@/lib/plans";
import { normalizedInvoiceSchema } from "@/lib/invoice-intelligence/types";
import { generateEslog20Xml } from "@/lib/invoice-intelligence/eslog-format";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const [document] = await getDb().select({ status: invoiceDocuments.status, approvedJson: invoiceDocuments.approvedJson })
    .from(invoiceDocuments).where(and(eq(invoiceDocuments.id, id), eq(invoiceDocuments.clerkUserId, userId))).limit(1);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (document.status !== "approved" || !document.approvedJson) return NextResponse.json({ error: "Najprej preverite in potrdite podatke računa." }, { status: 409 });
  const subscription = await getStatus(userId);
  if (!getPlanConfig(subscription.commercialPlan).structuredDelivery) return NextResponse.json({ error: "XML/eSLOG izvoz ni vključen v vaš paket. Preverite pakete v ceniku.", code: "feature_not_in_plan" }, { status: 403 });
  try {
    const invoice = normalizedInvoiceSchema.parse(JSON.parse(document.approvedJson));
    return new NextResponse(generateEslog20Xml(invoice), { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="racun-${id}.eslog.xml"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Podatki računa niso popolni za XML eSLOG. Preverite številko, datum in podatke računa." }, { status: 400 });
  }
}
