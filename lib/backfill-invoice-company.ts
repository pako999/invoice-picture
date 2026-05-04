// One-time backfill: for every invoice with companyId=NULL, find a
// matching company (same user + same recipientEmail) and link it.
// Idempotent — safe to run multiple times.
//
// Wired into the / API on first GET so it runs once after deploy
// without manual intervention. Guarded by a process-level flag so it
// only runs once per server lifetime, not per request.

import { getDb } from "@/lib/db";
import { invoices, companies } from "@/lib/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

let didRun = false;

export async function backfillInvoiceCompanyIds(): Promise<void> {
  if (didRun) return;
  didRun = true;

  const db = getDb();
  try {
    // Update invoices that have NULL companyId by matching on the
    // (clerkUserId, recipientEmail) pair against the companies table.
    // Uses a single UPDATE ... FROM so it scales to 10k+ invoice rows.
    await db.execute(sql`
      UPDATE invoices i
      SET "companyId" = c.id
      FROM companies c
      WHERE i."companyId" IS NULL
        AND i."clerkUserId" = c."clerkUserId"
        AND i."recipientEmail" = c."recipientEmail"
    `);
  } catch (e) {
    // Don't crash the API if the backfill fails (e.g. column missing
    // mid-deploy). Just log; the next request will retry.
    console.warn("[backfill] invoice.companyId backfill failed:", e);
    didRun = false;
  }
}

// Re-export so other modules don't need to import individually
export const _internal = { invoices, companies, isNull, eq, and };
