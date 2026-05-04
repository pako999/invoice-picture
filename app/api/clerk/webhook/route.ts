import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getOrCreateSubscription } from "@/lib/subscription";
import { getDb } from "@/lib/db";
import { userSettings, subscriptions, companies, invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Subset of the Clerk user.created payload we actually use. Clerk's
// docs are authoritative — see https://clerk.com/docs/integrations/webhooks/sync-data
type ClerkUser = {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
};

type WebhookEvent = { type: string; data: ClerkUser };

/** Pick the user's primary email from the webhook payload. Falls back
 *  to the first email if no primary is marked. Returns null if none. */
function primaryEmailOf(user: ClerkUser): string | null {
  const emails = user.email_addresses ?? [];
  if (emails.length === 0) return null;
  const primary = emails.find((e) => e.id === user.primary_email_address_id);
  return (primary ?? emails[0]).email_address ?? null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type === "user.created") {
    const user = event.data;
    // 1. Default subscription (free plan, with trial)
    await getOrCreateSubscription(user.id);

    // 2. Seed the default recipient email from the sign-up email so the
    //    user can immediately scan & send without going to Settings.
    //    Use INSERT ... ON CONFLICT DO NOTHING so we never overwrite a
    //    value the user has already saved manually.
    const email = primaryEmailOf(user);
    if (email) {
      try {
        const db = getDb();
        const existing = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.clerkUserId, user.id))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(userSettings).values({
            clerkUserId: user.id,
            recipientEmail: email,
          });
        }
      } catch (e) {
        // Non-fatal — webhook should still acknowledge so Clerk doesn't retry forever
        console.warn("[clerk-webhook] failed to seed default email:", e);
      }
    }
  }

  if (event.type === "user.deleted") {
    // GDPR right-to-erasure + data hygiene: when a Clerk user is
    // deleted (via the user's own Account → Delete, the Clerk
    // dashboard, or the API), wipe everything we have on them.
    //
    // Order matters: delete child rows first (invoices, companies)
    // before the parent (userSettings, subscriptions). All four are
    // keyed off clerkUserId so we just iterate.
    const userId = event.data.id;
    if (userId) {
      try {
        const db = getDb();
        // No explicit FK constraints in the schema yet, so just delete
        // each table independently. Wrapped in try/catch so a failure
        // in one table doesn't prevent the rest from running.
        await db.delete(invoices).where(eq(invoices.clerkUserId, userId));
        await db.delete(companies).where(eq(companies.clerkUserId, userId));
        await db.delete(userSettings).where(eq(userSettings.clerkUserId, userId));
        await db.delete(subscriptions).where(eq(subscriptions.clerkUserId, userId));
        console.log(`[clerk-webhook] purged data for deleted user ${userId}`);
      } catch (e) {
        console.warn("[clerk-webhook] failed to purge user data:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
