import { google, type androidpublisher_v3 } from "googleapis";

export const GOOGLE_PLAY_PACKAGE_NAME =
  process.env.GOOGLE_PLAY_PACKAGE_NAME ?? "si.posljiracun.app";

/** SKU → plan tier. Identical to Apple side because the same SKUs ship on
 *  both stores. Anything not in this map is rejected. */
export const PRODUCT_PLAN_MAP: Record<string, "basic" | "pro"> = {
  "si.posljiracun.app.basic_monthly": "basic",
  "si.posljiracun.app.basic_yearly": "basic",
  "si.posljiracun.app.pro_monthly": "pro",
  "si.posljiracun.app.pro_yearly": "pro",
};

/** Subscription states Google considers "still entitled" — the user paid
 *  and either the period hasn't elapsed yet, they're in the grace window
 *  for a failed renewal, or they cancelled but the prepaid term still has
 *  time left. */
const ENTITLED_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  "SUBSCRIPTION_STATE_CANCELED",
]);

export type PlayPublisher = androidpublisher_v3.Androidpublisher;

/** Authenticated androidpublisher client built from the service-account
 *  env vars. Throws if the env is missing — callers should catch and
 *  return a 500 with a clear message. */
export function getPlayClient(): PlayPublisher {
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

export type FetchedPurchase = {
  /** True if Google still considers the user entitled. */
  entitled: boolean;
  /** When the current paid period ends (used for `currentPeriodEnd`). */
  expiry: Date | null;
  /** Whether the subscription has been acknowledged. */
  acknowledged: boolean;
  /** Raw subscriptionState string for logging. */
  state: string | null;
  /** The line-item matching the SKU we asked about, if present. */
  lineItem: androidpublisher_v3.Schema$SubscriptionPurchaseLineItem | null;
};

/** Fetch a subscription purchase and normalise the bits we care about.
 *  Returns null if the token is unknown to Google (404/410). */
export async function fetchPurchase(
  publisher: PlayPublisher,
  purchaseToken: string,
  productId: string,
): Promise<FetchedPurchase | null> {
  let data: androidpublisher_v3.Schema$SubscriptionPurchaseV2;
  try {
    const res = await publisher.purchases.subscriptionsv2.get({
      packageName: GOOGLE_PLAY_PACKAGE_NAME,
      token: purchaseToken,
    });
    data = res.data;
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err.code === 404 || err.code === 410) return null;
    throw e;
  }

  const lineItem =
    data.lineItems?.find((li) => li.productId === productId) ?? null;
  const state = data.subscriptionState ?? null;
  const expiry = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : null;
  const acknowledged =
    data.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";

  return {
    entitled: state ? ENTITLED_STATES.has(state) : false,
    expiry,
    acknowledged,
    state,
    lineItem,
  };
}

/** Acknowledge a purchase. Safe to call when already acknowledged — Google
 *  returns 400 in that case which we swallow. */
export async function acknowledgePurchase(
  publisher: PlayPublisher,
  purchaseToken: string,
  productId: string,
): Promise<void> {
  try {
    await publisher.purchases.subscriptions.acknowledge({
      packageName: GOOGLE_PLAY_PACKAGE_NAME,
      subscriptionId: productId,
      token: purchaseToken,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    // Already-acknowledged returns a 400 — non-fatal.
    console.error("[google-play] acknowledge failed:", err.message);
  }
}
