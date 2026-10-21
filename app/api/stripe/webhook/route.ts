import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { activateStripeSubscription, cancelStripeSubscription, refreshStripeSubscription } from "@/lib/stripe-subscriptions";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    console.warn("[stripe webhook] invalid signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.mode === "subscription" && (session.payment_status === "paid" || session.payment_status === "no_payment_required") && session.subscription) {
        const subscription = typeof session.subscription === "string"
          ? await getStripe().subscriptions.retrieve(session.subscription)
          : session.subscription;
        await activateStripeSubscription(subscription, session.metadata ?? {});
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      if (subscription.status === "active" || subscription.status === "trialing") {
        const latest = subscription.latest_invoice;
        const invoice = typeof latest === "string" ? await getStripe().invoices.retrieve(latest) : latest;
        // Do not extend access for an unpaid renewal or pending plan change.
        if (invoice?.status === "paid") await refreshStripeSubscription(subscription);
      }
    } else if (event.type === "invoice.paid") {
      const parent = event.data.object.parent;
      const linked = parent?.type === "subscription_details" ? parent.subscription_details?.subscription : null;
      if (linked) {
        const subscription = typeof linked === "string" ? await getStripe().subscriptions.retrieve(linked) : linked;
        if (subscription.status === "active") await refreshStripeSubscription(subscription);
      }
    } else if (event.type === "invoice.payment_failed") {
      // Keep the already-paid period; no extension is granted. Stripe retries
      // payment, and invoice.paid activates the next period after recovery.
      console.warn("[stripe] renewal payment failed", {invoiceId:event.data.object.id});
    } else if (event.type === "customer.subscription.deleted") {
      await cancelStripeSubscription(event.data.object);
    }
  } catch (error) {
    console.error("[stripe webhook] processing failed", { eventId: event.id, type: event.type, error });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
