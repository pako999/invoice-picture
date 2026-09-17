import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { activateStripeSubscription } from "@/lib/stripe-subscriptions";

const schema = z.object({ sessionId: z.string().trim().min(8).max(255) });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { sessionId } = schema.parse(await req.json());
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.client_reference_id !== userId && session.metadata?.clerkUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.mode !== "subscription" || (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") || !session.subscription) {
      return NextResponse.json({ error: "Payment is not complete" }, { status: 409 });
    }
    const subscription = typeof session.subscription === "string"
      ? await getStripe().subscriptions.retrieve(session.subscription)
      : session.subscription;
    const activated = await activateStripeSubscription(subscription, session.metadata ?? {});
    return NextResponse.json({ activated });
  } catch (error) {
    console.error("[stripe confirm]", error);
    return NextResponse.json({ error: error instanceof z.ZodError ? "Invalid session" : "Could not confirm payment" }, { status: 400 });
  }
}
