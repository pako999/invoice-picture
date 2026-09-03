import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { getResend } from "@/lib/resend";
import { brandedEmail } from "@/lib/email-template";

type Tier = "basic" | "pro";
type Billing = "monthly" | "yearly";

interface PaddleEvent {
  event_id?: string;
  event_type: string;
  data: {
    id?: string;
    customer_id?: string;
    subscription_id?: string;
    custom_data?: {
      clerkUserId?: string;
      customerEmail?: string;
      tier?: Tier;
      billing?: Billing;
    };
    current_billing_period?: { ends_at?: string };
    billing_period?: { ends_at?: string };
  };
}

function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(";").map((part) => part.trim().split("="));
  const ts = parts.find(([key]) => key === "ts")?.[1];
  const signatures = parts.filter(([key]) => key === "h1").map(([, value]) => value).filter(Boolean);
  if (!ts || signatures.length === 0) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "utf8");
    return signatureBuffer.length === expectedBuffer.length
      && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  });
}

function addBillingPeriod(from: Date, billing: Billing) {
  const result = new Date(from);
  if (billing === "yearly") result.setUTCFullYear(result.getUTCFullYear() + 1);
  else result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}

async function customerEmail(clerkUserId: string, supplied?: string) {
  if (supplied) return supplied;
  try {
    const user = await (await clerkClient()).users.getUser(clerkUserId);
    const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?? user.emailAddresses[0];
    return primary?.emailAddress;
  } catch (error) {
    console.warn("[paddle webhook] could not resolve customer email", { clerkUserId, error });
    return undefined;
  }
}

async function sendActivationEmail(clerkUserId: string, tier: Tier, suppliedEmail?: string) {
  const email = await customerEmail(clerkUserId, suppliedEmail);
  if (!email) return;
  const result = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "Vaš paket Slikaj Račun je aktiviran",
    html: brandedEmail({
      preheader: "Plačilo je uspešno in paket je aktiviran",
      eyebrow: "Uspešno plačilo",
      title: "Vaš paket je aktiviran",
      introHtml: `<p style="margin:0">Hvala za plačilo. Paket <strong>${tier === "pro" ? "PRO" : "Osnovni"}</strong> je aktiviran in ga lahko takoj uporabljate.</p>`,
      noticeHtml: "Vaša naročnina je aktivna. Račune lahko zdaj pošiljate brez prekinitve.",
      cta: { label: "Odpri Slikaj Račun", url: "https://www.posljiracun.si/scan" },
    }),
  });
  if (result.error) console.error("[paddle webhook] activation email failed", result.error);
}

async function activateSubscription(event: PaddleEvent) {
  const custom = event.data.custom_data;
  const clerkUserId = custom?.clerkUserId;
  const tier = custom?.tier;
  if (!clerkUserId || !tier) {
    console.warn("[paddle webhook] activation event missing custom data", {
      eventId: event.event_id,
      eventType: event.event_type,
      hasUserId: Boolean(clerkUserId),
      tier,
    });
    return;
  }

  const now = new Date();
  const explicitPeriodEnd = event.data.current_billing_period?.ends_at
    ?? event.data.billing_period?.ends_at;
  const currentPeriodEnd = explicitPeriodEnd
    ? new Date(explicitPeriodEnd)
    : addBillingPeriod(now, custom.billing ?? "monthly");
  const db = getDb();
  const [existing] = await db.select().from(subscriptions)
    .where(eq(subscriptions.clerkUserId, clerkUserId)).limit(1);
  const wasPaid = Boolean(
    existing
    && (existing.plan === "basic" || existing.plan === "pro")
    && existing.currentPeriodEnd
    && existing.currentPeriodEnd > now,
  );

  await db.insert(subscriptions).values({
    clerkUserId,
    plan: tier,
    trialEndsAt: now,
    currentPeriodEnd,
    paddleCustomerId: event.data.customer_id ?? null,
    paddleSubscriptionId: event.data.subscription_id ?? event.data.id ?? null,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: subscriptions.clerkUserId,
    set: {
      plan: tier,
      currentPeriodEnd,
      paddleCustomerId: event.data.customer_id ?? existing?.paddleCustomerId ?? null,
      paddleSubscriptionId: event.data.subscription_id ?? event.data.id ?? existing?.paddleSubscriptionId ?? null,
      updatedAt: now,
    },
  });

  console.info("[paddle webhook] subscription activated", {
    eventId: event.event_id,
    eventType: event.event_type,
    clerkUserId,
    tier,
    currentPeriodEnd: currentPeriodEnd.toISOString(),
  });

  if (!wasPaid) {
    try {
      await sendActivationEmail(clerkUserId, tier, custom.customerEmail);
    } catch (error) {
      console.error("[paddle webhook] activation email error", error);
    }
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[paddle webhook] PADDLE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    console.warn("[paddle webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.event_type) {
    case "transaction.completed":
    case "subscription.created":
    case "subscription.activated":
    case "subscription.resumed":
    case "subscription.updated":
      await activateSubscription(event);
      break;

    case "subscription.canceled": {
      const clerkUserId = event.data.custom_data?.clerkUserId;
      if (clerkUserId) {
        await getDb().update(subscriptions)
          .set({ plan: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.clerkUserId, clerkUserId));
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
