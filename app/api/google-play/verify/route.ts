import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { getOrCreateSubscription } from "@/lib/subscription";
import {
  PRODUCT_PLAN_MAP,
  acknowledgePurchase,
  fetchPurchase,
  getPlayClient,
} from "@/lib/google-play";

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

  let publisher;
  try {
    publisher = getPlayClient();
  } catch (e) {
    console.error("[google-play/verify] env error:", e);
    return NextResponse.json(
      { error: "Server not configured for Google Play verification" },
      { status: 500 },
    );
  }

  let purchase;
  try {
    purchase = await fetchPurchase(publisher, purchaseToken, productId);
  } catch (e) {
    console.error("[google-play/verify] lookup failed:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  if (!purchase) {
    return NextResponse.json(
      { error: "Purchase not found or expired" },
      { status: 404 },
    );
  }

  if (!purchase.lineItem) {
    return NextResponse.json(
      { error: "Product ID does not match purchase" },
      { status: 400 },
    );
  }

  if (!purchase.entitled) {
    return NextResponse.json(
      { error: `Subscription not active (${purchase.state ?? "unknown"})` },
      { status: 400 },
    );
  }

  // Default to a month from now if Google didn't return an expiry — keeps
  // the user entitled long enough for the next cron tick to refresh.
  const currentPeriodEnd =
    purchase.expiry ?? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

  await getOrCreateSubscription(userId);
  const db = getDb();
  await db
    .update(subscriptions)
    .set({
      plan,
      currentPeriodEnd,
      googlePlayPurchaseToken: purchaseToken,
      googlePlayProductId: productId,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.clerkUserId, userId));

  // Acknowledge within 3 days or Google auto-refunds. Persist BEFORE this
  // so a failed acknowledgement doesn't lose the user their entitlement.
  if (!purchase.acknowledged) {
    await acknowledgePurchase(publisher, purchaseToken, productId);
  }

  return NextResponse.json({ success: true, plan });
}
