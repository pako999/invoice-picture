import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";
import { getStripePriceId } from "@/lib/stripe-prices";

const checkoutSchema = z.object({
  tier: z.enum(["basic", "pro", "accounting_pro", "accounting_max"]),
  billing: z.enum(["monthly", "yearly"]),
  locale: z.enum(["sl", "en"]).default("sl"),
});

function appOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return configured || req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = checkoutSchema.parse(await req.json());
    const priceId = getStripePriceId(data.tier, data.billing);
    if (!priceId) {
      return NextResponse.json(
        { error: data.locale === "en" ? "Card payment is not configured yet. Choose bank transfer." : "Kartično plačilo še ni nastavljeno. Izberite plačilo po predračunu." },
        { status: 503 },
      );
    }

    const user = await (await clerkClient()).users.getUser(userId);
    const email = (user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId) ?? user.emailAddresses[0])?.emailAddress;
    const [existing] = await getDb().select({ stripeCustomerId: subscriptions.stripeCustomerId }).from(subscriptions).where(eq(subscriptions.clerkUserId, userId)).limit(1);
    const origin = appOrigin(req);
    const prefix = data.locale === "en" ? "/en" : "";
    const metadata = {
      clerkUserId: userId,
      customerEmail: email ?? "",
      tier: data.tier,
      billing: data.billing,
    };

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existing?.stripeCustomerId ? { customer: existing.stripeCustomerId } : { customer_email: email }),
      client_reference_id: userId,
      metadata,
      subscription_data: { metadata },
      success_url: `${origin}${prefix}/scan?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${prefix}/upgrade?plan=${data.tier}&billing=${data.billing}&canceled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("Stripe Checkout URL was not returned");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe checkout]", error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    if (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json({ error: "Kartično plačilo še ni nastavljeno. Izberite plačilo po predračunu." }, { status: 503 });
    }
    return NextResponse.json({ error: "Stripe Checkout could not be started" }, { status: 500 });
  }
}
