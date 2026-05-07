import { NextResponse } from "next/server";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { fetchPurchase, getPlayClient } from "@/lib/google-play";

/**
 * Daily cron — refreshes Google Play subscriptions so renewals and
 * cancellations propagate without waiting for the user to re-open the
 * app. Without this, a user whose monthly renewal succeeded would still
 * see their plan as "expired" until the app reverified.
 *
 * For each row with a non-null googlePlayPurchaseToken, we fetch the
 * latest state from Google and update plan + currentPeriodEnd. If Google
 * says the subscription is no longer entitled (expired, on hold), we
 * downgrade them to "expired" so the gates kick back in.
 *
 * Vercel calls this endpoint with `Authorization: Bearer <CRON_SECRET>`
 * — we verify that header before doing any work.
 *
 * The deeper fix is RTDN (Google Pub/Sub push on every state change),
 * but a daily polling cron is enough until volume justifies that work.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel sends Bearer <CRON_SECRET> when invoking via vercel.json crons.
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let publisher;
  try {
    publisher = getPlayClient();
  } catch (e) {
    console.error("[cron/refresh-google-play] env error:", e);
    return NextResponse.json(
      { error: "Server not configured for Google Play verification" },
      { status: 500 },
    );
  }

  const db = getDb();

  // Only refresh rows that look like they came from Google Play and that
  // are on a paid plan. Free/trial users have nothing to refresh.
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        isNotNull(subscriptions.googlePlayPurchaseToken),
        isNotNull(subscriptions.googlePlayProductId),
        or(
          eq(subscriptions.plan, "basic"),
          eq(subscriptions.plan, "pro"),
          eq(subscriptions.plan, "expired"),
        ),
      ),
    );

  let refreshed = 0;
  let downgraded = 0;
  let stillEntitled = 0;
  let unknown = 0;
  const errors: Array<{ userId: string; message: string }> = [];

  for (const row of rows) {
    const token = row.googlePlayPurchaseToken;
    const productId = row.googlePlayProductId;
    if (!token || !productId) continue; // satisfies TS, also a sanity check

    try {
      const purchase = await fetchPurchase(publisher, token, productId);

      if (!purchase) {
        // Google no longer knows about this token — purchase was refunded
        // or the token is so old it's been purged. Mark as expired.
        await db
          .update(subscriptions)
          .set({ plan: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.id, row.id));
        unknown += 1;
        continue;
      }

      if (purchase.entitled) {
        const currentPeriodEnd = purchase.expiry ?? row.currentPeriodEnd;
        await db
          .update(subscriptions)
          .set({
            // Re-assert the plan in case it was previously flipped to expired.
            plan: row.plan === "expired"
              ? (productId.includes(".pro_") ? "pro" : "basic")
              : row.plan,
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, row.id));
        stillEntitled += 1;
      } else if (row.plan !== "expired") {
        await db
          .update(subscriptions)
          .set({ plan: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.id, row.id));
        downgraded += 1;
      }

      refreshed += 1;
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error(
        `[cron/refresh-google-play] row ${row.id} (${row.clerkUserId}):`,
        err.message,
      );
      errors.push({ userId: row.clerkUserId, message: err.message ?? "unknown" });
    }
  }

  return NextResponse.json({
    success: true,
    total: rows.length,
    refreshed,
    stillEntitled,
    downgraded,
    unknown,
    errorCount: errors.length,
    // Truncate error list so cron logs don't blow up if everything fails.
    errors: errors.slice(0, 10),
  });
}
