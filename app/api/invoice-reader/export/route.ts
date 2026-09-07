import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoiceAuditLogs, invoiceDocuments } from "@/lib/schema";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";
  const db = getDb();
  const rows = await db.select({ id: invoiceDocuments.id, filename: invoiceDocuments.filename, approvedJson: invoiceDocuments.approvedJson, approvedAt: invoiceDocuments.approvedAt })
    .from(invoiceDocuments)
    .where(and(eq(invoiceDocuments.clerkUserId, userId), eq(invoiceDocuments.status, "approved")))
    .limit(5000);
  const data = rows.flatMap((row) => {
    try { return [{ id: row.id, filename: row.filename, approvedAt: row.approvedAt, invoice: JSON.parse(row.approvedJson || "null") }]; } catch { return []; }
  });
  await db.insert(invoiceAuditLogs).values({ clerkUserId: userId, action: "export", metadataJson: JSON.stringify({ format, count: data.length }) });

  if (format === "json") {
    return NextResponse.json({ exportedAt: new Date().toISOString(), count: data.length, documents: data }, { headers: { "Content-Disposition": "attachment; filename=approved-invoices.json", "Cache-Control": "private, no-store" } });
  }

  const header = ["id", "filename", "supplier", "supplierVat", "invoiceNumber", "issueDate", "dueDate", "currency", "netAmount", "vatAmount", "grossAmount", "amountDue"];
  const lines = [header.join(",")];
  for (const row of data) {
    const i = row.invoice ?? {};
    lines.push([
      row.id, row.filename, i.supplier?.name, i.supplier?.vatNumber, i.invoiceNumber, i.issueDate, i.dueDate, i.currency,
      i.totals?.netAmount, i.totals?.vatAmount, i.totals?.grossAmount, i.totals?.amountDue,
    ].map(csv).join(","));
  }
  return new NextResponse(lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=approved-invoices.csv", "Cache-Control": "private, no-store" } });
}

function csv(value: unknown) { const s = value == null ? "" : String(value); return `"${s.replace(/"/g, '""')}"`; }
