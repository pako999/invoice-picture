import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { workspaceAuth } from "@/lib/workspace";
import { PLAN_CONFIGS } from "@/lib/plans";
import { subscriptions } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";
import { getVerifiedStripePriceId } from "@/lib/stripe-prices";

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
    if ((await workspaceAuth()).userId !== userId) return NextResponse.json({ error: "Naročnino ekipe upravlja njen lastnik. Za svojo naročnino preklopite v svoj delovni prostor." }, { status: 403 });
    const data = checkoutSchema.parse(await req.json());
    const priceId = await getVerifiedStripePriceId(data.tier, data.billing);
    if (!priceId) {
      return NextResponse.json(
        { error: data.locale === "en" ? "Card payment is not configured yet. Choose bank transfer." : "Kartično plačilo še ni nastavljeno. Izberite plačilo po predračunu." },
        { status: 503 },
      );
    }

    // Fail closed: automatic_tax silently charges zero without a registration.
    const registrations = await getStripe().tax.registrations.list({ status: "active", limit: 100 });
    if (!registrations.data.some(registration => registration.country === "SI")) return NextResponse.json({ error: data.locale === "en" ? "Card checkout is being configured for VAT. Request a pro forma invoice below." : "Kartično plačilo čaka na dokončanje nastavitve DDV. Spodaj lahko naročite predračun." }, { status: 503 });
    const user = await (await clerkClient()).users.getUser(userId);
    const email = (user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId) ?? user.emailAddresses[0])?.emailAddress;
    const [existing] = await getDb().select({ stripeCustomerId: subscriptions.stripeCustomerId, stripeSubscriptionId: subscriptions.stripeSubscriptionId }).from(subscriptions).where(eq(subscriptions.clerkUserId, userId)).limit(1);
    const origin = appOrigin(req);
    const prefix = data.locale === "en" ? "/en" : "";
    const metadata = {
      clerkUserId: userId,
      customerEmail: email ?? "",
      tier: data.tier,
      billing: data.billing,
      includedUsers: String(PLAN_CONFIGS[data.tier].userLimit),
      quotaBasis: "ocr_pages",
      includedPages: String(PLAN_CONFIGS[data.tier].ocrPagesMonthly),
      previousSubscriptionId: existing?.stripeSubscriptionId ?? "",
    };

    const session = await getStripe().checkout.sessions.create({
      ui_mode: "embedded_page",
      integration_identifier: "posljiracun_checkout_ocrflowx",
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existing?.stripeCustomerId ? { customer: existing.stripeCustomerId } : { customer_email: email }),
      client_reference_id: userId,
      metadata,
      subscription_data: { metadata },
      return_url: `${origin}${prefix}/scan?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
    });

    if (!session.client_secret) throw new Error("Stripe Embedded Checkout client secret was not returned");
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("[stripe checkout]", error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
    if (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json({ error: "Kartično plačilo še ni nastavljeno. Izberite plačilo po predračunu." }, { status: 503 });
    }
    return NextResponse.json({ error: "Stripe Checkout could not be started" }, { status: 500 });
  }
}
