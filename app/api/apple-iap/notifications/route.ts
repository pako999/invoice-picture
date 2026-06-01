import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import {
  BUNDLE_ID,
  PRODUCT_PLAN_MAP,
  verifyAppleJWS,
  type AppleNotificationPayload,
  type AppleTransactionInfo,
} from "@/lib/apple-iap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * App Store Server Notifications V2 webhook.
 *
 * Apple POSTs `{ signedPayload }` (a JWS) here on every subscription state
 * change — renewal, cancellation, refund, expiry, billing retry, etc. We
 * verify Apple's signature, find the user by the originalTransactionId we
 * stored during /api/apple-iap/verify, and update their plan + period so
 * /api/subscription reflects reality without the app re-verifying.
 *
 * Configure the URL in App Store Connect → your app → App Store Server
 * Notifications (both Production and Sandbox can point here).
 */

// notificationTypes that mean the subscription is currently entitled.
const ENTITLING = new Set([
  "SUBSCRIBED",
  "DID_RENEW",
  "OFFER_REDEEMED",
  "DID_CHANGE_RENEWAL_PREF", // plan up/downgrade — still entitled
  "RENEWAL_EXTENDED",
]);

// notificationTypes that mean access should be revoked now.
const REVOKING = new Set([
  "EXPIRED",
  "GRACE_PERIOD_EXPIRED",
  "REFUND",
  "REVOKE",
]);

export async function POST(req: Request) {
  let signedPayload: string | undefined;
  try {
    ({ signedPayload } = (await req.json()) as { signedPayload?: string });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!signedPayload) {
    return NextResponse.json({ error: "Missing signedPayload" }, { status: 400 });
  }

  // Verify Apple's signature on the notification envelope.
  let payload: AppleNotificationPayload;
  try {
    payload = await verifyAppleJWS<AppleNotificationPayload>(signedPayload);
  } catch (e) {
    console.error("[apple-iap/notifications] signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (payload.data?.bundleId && payload.data.bundleId !== BUNDLE_ID) {
    return NextResponse.json({ error: "Bundle ID mismatch" }, { status: 400 });
  }

  const notificationType = payload.notificationType ?? "";
  const signedTxn = payload.data?.signedTransactionInfo;
  if (!signedTxn) {
    // Some notification types (e.g. test) carry no transaction — acknowledge.
    return NextResponse.json({ received: true, note: "no transaction info" });
  }

  // The transaction info is itself an Apple-signed JWS — verify it too.
  let txn: AppleTransactionInfo;
  try {
    txn = await verifyAppleJWS<AppleTransactionInfo>(signedTxn);
  } catch (e) {
    console.error("[apple-iap/notifications] bad signedTransactionInfo:", e);
    return NextResponse.json({ error: "Invalid transaction signature" }, { status: 401 });
  }

  if (txn.bundleId && txn.bundleId !== BUNDLE_ID) {
    return NextResponse.json({ error: "Bundle ID mismatch" }, { status: 400 });
  }

  const originalTransactionId = txn.originalTransactionId;
  if (!originalTransactionId) {
    return NextResponse.json({ received: true, note: "no originalTransactionId" });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.appleOriginalTransactionId, originalTransactionId))
    .limit(1);

  if (!row) {
    // We don't know this subscription yet (the app hasn't called /verify, or
    // it belongs to another install). Acknowledge so Apple stops retrying.
    console.warn(
      `[apple-iap/notifications] ${notificationType}: no user for originalTransactionId ${originalTransactionId}`,
    );
    return NextResponse.json({ received: true, note: "unmatched" });
  }

  const expiresDate = txn.expiresDate ? new Date(txn.expiresDate) : null;

  if (ENTITLING.has(notificationType)) {
    const plan = (txn.productId && PRODUCT_PLAN_MAP[txn.productId]) || row.plan;
    await db
      .update(subscriptions)
      .set({
        plan,
        currentPeriodEnd: expiresDate ?? row.currentPeriodEnd,
        appleProductId: txn.productId ?? row.appleProductId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, row.id));
  } else if (REVOKING.has(notificationType)) {
    await db
      .update(subscriptions)
      .set({ plan: "expired", updatedAt: new Date() })
      .where(eq(subscriptions.id, row.id));
  } else if (expiresDate) {
    // e.g. DID_CHANGE_RENEWAL_STATUS (auto-renew toggled): keep access until
    // the period ends; just keep the period end fresh. An EXPIRED notification
    // will revoke later if they let it lapse.
    await db
      .update(subscriptions)
      .set({ currentPeriodEnd: expiresDate, updatedAt: new Date() })
      .where(eq(subscriptions.id, row.id));
  }

  return NextResponse.json({ received: true, notificationType, plan: row.plan });
}
