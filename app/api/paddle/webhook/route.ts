import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";

interface PaddleEvent {
  event_type: string;
  data: {
    id?: string;
    customer_id?: string;
    custom_data?: { clerkUserId?: string; tier?: "basic" | "pro" };
    items?: Array<{ price?: { id?: string } }>;
    current_billing_period?: { ends_at?: string };
    status?: string;
  };
}

function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;
  const signed = `${ts}:${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "PADDLE_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaddleEvent;
  const clerkUserId = event.data.custom_data?.clerkUserId;
  const tier = event.data.custom_data?.tier;
  const periodEnd = event.data.current_billing_period?.ends_at;

  if (!clerkUserId) {
    return NextResponse.json({ received: true, note: "No clerkUserId in custom_data" });
  }

  const db = getDb();

  switch (event.event_type) {
    case "subscription.created":
    case "subscription.activated":
    case "subscription.resumed":
    case "subscription.updated":
      if (tier) {
        await db
          .update(subscriptions)
          .set({
            plan: tier,
            paddleCustomerId: event.data.customer_id ?? null,
            paddleSubscriptionId: event.data.id ?? null,
            currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.clerkUserId, clerkUserId));
      }
      break;

    case "subscription.canceled":
      await db
        .update(subscriptions)
        .set({ plan: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.clerkUserId, clerkUserId));
      break;

    case "subscription.past_due":
      // Keep current plan but log — could trigger email later
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
