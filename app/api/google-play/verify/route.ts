import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { getOrCreateSubscription } from "@/lib/subscription";

// Same package name as the Android build (and iOS bundle ID).
const PACKAGE_NAME =
  process.env.GOOGLE_PLAY_PACKAGE_NAME ?? "si.posljiracun.app";

// SKU → plan tier. Identical to Apple side because we use the same SKUs
// across both stores.
const PRODUCT_PLAN_MAP: Record<string, "basic" | "pro"> = {
  "si.posljiracun.app.basic_monthly": "basic",
  "si.posljiracun.app.basic_yearly": "basic",
  "si.posljiracun.app.pro_monthly": "pro",
  "si.posljiracun.app.pro_yearly": "pro",
};

/**
 * Build an authenticated androidpublisher client from the service account
 * credentials. Required env vars (set on Vercel):
 *   GOOGLE_PLAY_SA_EMAIL          → client_email from the JSON key
 *   GOOGLE_PLAY_SA_PRIVATE_KEY    → private_key from the JSON key
 *                                    (newlines escaped as \n is fine —
 *                                     we re-expand them below)
 */
function getPlayClient() {
  const email = process.env.GOOGLE_PLAY_SA_EMAIL;
  const rawKey = process.env.GOOGLE_PLAY_SA_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_PLAY_SA_EMAIL or GOOGLE_PLAY_SA_PRIVATE_KEY env vars",
    );
  }
  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  return google.androidpublisher({ version: "v3", auth });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purchaseToken, productId } = (await req.json()) as {
    purchaseToken?: string;
    productId?: string;
  };

  if (!purchaseToken || !productId) {
    return NextResponse.json(
      { error: "Missing purchaseToken or productId" },
      { status: 400 },
    );
  }

  const plan = PRODUCT_PLAN_MAP[productId];
  if (!plan) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  let publisher: ReturnType<typeof getPlayClient>;
  try {
    publisher = getPlayClient();
  } catch (e) {
    console.error("[google-play/verify] env error:", e);
    return NextResponse.json(
      { error: "Server not configured for Google Play verification" },
      { status: 500 },
    );
  }

  // Look up the subscription with the v2 API (returns lineItems + state).
  // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get
  let purchase;
  try {
    const res = await publisher.purchases.subscriptionsv2.get({
      packageName: PACKAGE_NAME,
      token: purchaseToken,
    });
    purchase = res.data;
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    console.error("[google-play/verify] lookup failed:", err.message);
    if (err.code === 404 || err.code === 410) {
      return NextResponse.json(
        { error: "Purchase not found or expired" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }

  // The token must reference the SKU the client claimed.
  const lineItem = purchase.lineItems?.find((li) => li.productId === productId);
  if (!lineItem) {
    return NextResponse.json(
      { error: "Product ID does not match purchase" },
      { status: 400 },
    );
  }

  // Active states per Google: SUBSCRIPTION_STATE_ACTIVE,
  // SUBSCRIPTION_STATE_IN_GRACE_PERIOD, SUBSCRIPTION_STATE_ON_HOLD,
  // SUBSCRIPTION_STATE_PAUSED, SUBSCRIPTION_STATE_CANCELED (still active
  // until expiry), SUBSCRIPTION_STATE_EXPIRED.
  const state = purchase.subscriptionState;
  const activeStates = new Set([
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED", // still entitled until expiry
  ]);
  if (!state || !activeStates.has(state)) {
    return NextResponse.json(
      { error: `Subscription not active (${state ?? "unknown"})` },
      { status: 400 },
    );
  }

  const expiryTime = lineItem.expiryTime ?? undefined;
  const currentPeriodEnd = expiryTime
    ? new Date(expiryTime)
    : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

  // Persist the entitlement before acknowledging — if acknowledgement fails
  // we still want the user to have access (Google retries acknowledgement
  // for 3 days; the user already paid).
  await getOrCreateSubscription(userId);
  const db = getDb();
  await db
    .update(subscriptions)
    .set({
      plan,
      currentPeriodEnd,
      paddleCustomerId: purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
      paddleSubscriptionId: purchaseToken.slice(0, 64), // reuse column to store the GP token
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.clerkUserId, userId));

  // Acknowledge the purchase within 3 days, otherwise Google auto-refunds.
  // ackState=1 means already acknowledged.
  if (purchase.acknowledgementState !== "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") {
    try {
      await publisher.purchases.subscriptions.acknowledge({
        packageName: PACKAGE_NAME,
        subscriptionId: productId,
        token: purchaseToken,
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      // Non-fatal — log and continue. Google retries on its end.
      console.error("[google-play/verify] acknowledge failed:", err.message);
    }
  }

  return NextResponse.json({ success: true, plan });
}
