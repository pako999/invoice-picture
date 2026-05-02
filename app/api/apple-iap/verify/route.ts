import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SignJWT, importPKCS8, decodeJwt } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { getOrCreateSubscription } from "@/lib/subscription";

const BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? "si.posljiracun.app";

const PRODUCT_PLAN_MAP: Record<string, "basic" | "pro"> = {
  "si.posljiracun.app.basic_monthly": "basic",
  "si.posljiracun.app.basic_yearly":  "basic",
  "si.posljiracun.app.pro_monthly":   "pro",
  "si.posljiracun.app.pro_yearly":    "pro",
};

async function makeAppleJWT(): Promise<string> {
  const keyId = process.env.APPLE_IAP_KEY_ID!;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID!;
  const rawKey = process.env.APPLE_IAP_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const pk = await importPKCS8(rawKey, "ES256");

  return new SignJWT({ bid: BUNDLE_ID })
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("appstoreconnect-v1")
    .sign(pk);
}

async function fetchTransaction(transactionId: string, sandbox: boolean) {
  const base = sandbox
    ? "https://api.storekit-sandbox.itunes.apple.com"
    : "https://api.storekit.itunes.apple.com";
  const jwt = await makeAppleJWT();
  const res = await fetch(`${base}/inApps/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.signedTransactionInfo) return null;
  return decodeJwt(data.signedTransactionInfo);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, productId } = await req.json();
  if (!transactionId || !productId) {
    return NextResponse.json({ error: "Missing transactionId or productId" }, { status: 400 });
  }

  const plan = PRODUCT_PLAN_MAP[productId];
  if (!plan) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

  // Try production first, fall back to sandbox (dev/TestFlight)
  let txn = await fetchTransaction(transactionId, false);
  if (!txn) txn = await fetchTransaction(transactionId, true);
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  if (txn.bundleId !== BUNDLE_ID) {
    return NextResponse.json({ error: "Bundle ID mismatch" }, { status: 400 });
  }
  if (txn.productId !== productId) {
    return NextResponse.json({ error: "Product ID mismatch" }, { status: 400 });
  }

  const db = getDb();
  await getOrCreateSubscription(userId);

  const expiresDate = txn.expiresDate as number | undefined;
  const currentPeriodEnd = expiresDate ? new Date(expiresDate) : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

  await db
    .update(subscriptions)
    .set({ plan, currentPeriodEnd, updatedAt: new Date() })
    .where(eq(subscriptions.clerkUserId, userId));

  return NextResponse.json({ success: true, plan });
}
