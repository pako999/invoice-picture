import { NextResponse } from "next/server";
import { purgeExpiredInvoiceDocuments } from "@/lib/invoice-intelligence/retention";
import { queuePreviouslyUploadedDocuments } from "@/lib/invoice-intelligence/bootstrap-queue";
import { queuePendingApprovedDeliveries } from "@/lib/invoice-intelligence/delivery";
import { repairBulkOrphans } from "@/lib/bulk-invoices/maintenance";
export const maxDuration = 300;
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const queued = await queuePreviouslyUploadedDocuments(100);
    const deliveries = await queuePendingApprovedDeliveries(100);
    await repairBulkOrphans();
    const purged = await purgeExpiredInvoiceDocuments(50);
    return NextResponse.json({ queued, deliveries, purged });
  } catch (error) {
    console.error("invoice_maintenance_failed", String(error));
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  }
}
