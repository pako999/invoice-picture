import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getOrCreateSubscription } from "@/lib/subscription";
import { getDb } from "@/lib/db";
import {
  userSettings,
  subscriptions,
  companies,
  invoices,
  invoiceAuditLogs,
  invoiceDocuments,
  supplierMappings,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

type ClerkUser = {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id: string; email_address: string }>;
};

type WebhookEvent = { type: string; data: ClerkUser };

function primaryEmailOf(user: ClerkUser): string | null {
  const emails = user.email_addresses ?? [];
  if (emails.length === 0) return null;
  const primary = emails.find((e) => e.id === user.primary_email_address_id);
  return (primary ?? emails[0]).email_address ?? null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });

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
    await getOrCreateSubscription(user.id);
    const email = primaryEmailOf(user);
    if (email) {
      try {
        const db = getDb();
        const existing = await db.select().from(userSettings).where(eq(userSettings.clerkUserId, user.id)).limit(1);
        if (existing.length === 0) await db.insert(userSettings).values({ clerkUserId: user.id, recipientEmail: email });
      } catch (e) {
        console.warn("[clerk-webhook] failed to seed default email:", e instanceof Error ? e.message : "unknown");
      }
    }
  }

  if (event.type === "user.deleted") {
    const userId = event.data.id;
    if (userId) {
      try {
        const db = getDb();
        // New invoice-intelligence child tables cascade from invoiceDocuments.
        // Audit logs and supplier mappings are keyed directly by Clerk user and
        // must be removed explicitly for a complete GDPR erasure.
        await db.delete(invoiceAuditLogs).where(eq(invoiceAuditLogs.clerkUserId, userId));
        await db.delete(supplierMappings).where(eq(supplierMappings.clerkUserId, userId));
        await db.delete(invoiceDocuments).where(eq(invoiceDocuments.clerkUserId, userId));
        await db.delete(invoices).where(eq(invoices.clerkUserId, userId));
        await db.delete(companies).where(eq(companies.clerkUserId, userId));
        await db.delete(userSettings).where(eq(userSettings.clerkUserId, userId));
        await db.delete(subscriptions).where(eq(subscriptions.clerkUserId, userId));
        console.log("[clerk-webhook] purged deleted user data");
      } catch (e) {
        console.warn("[clerk-webhook] failed to purge user data:", e instanceof Error ? e.message : "unknown");
      }
    }
  }

  return NextResponse.json({ received: true });
}
