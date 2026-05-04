// One-off admin script: grant a PRO subscription to a user identified
// by email.
//
// Usage:
//   DATABASE_URL=postgres://... \
//   CLERK_SECRET_KEY=sk_live_... \
//     npx tsx scripts/grant-pro.ts <email>
//
// Or, if your .env.local has the vars set:
//   npx tsx --env-file .env.local scripts/grant-pro.ts <email>

import { createClerkClient } from "@clerk/backend";
import { getDb } from "../lib/db";
import { subscriptions } from "../lib/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/grant-pro.ts <email>");
    process.exit(1);
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    console.error("CLERK_SECRET_KEY is not set in the environment");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in the environment");
    process.exit(1);
  }

  // 1. Find the Clerk user by email
  const clerk = createClerkClient({ secretKey: clerkSecret });
  const usersList = await clerk.users.getUserList({ emailAddress: [email] });
  const user = usersList.data[0];
  if (!user) {
    console.error(`No Clerk user found with email ${email}`);
    process.exit(1);
  }
  console.log(`Found Clerk user: ${user.id} (${user.emailAddresses[0]?.emailAddress})`);

  // 2. Upsert the subscription row → plan: "pro", period: 1 year out
  const db = getDb();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clerkUserId, user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set({
        plan: "pro",
        currentPeriodEnd: oneYearFromNow,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.clerkUserId, user.id));
    console.log(`✅ Updated existing subscription → PRO, expires ${oneYearFromNow.toISOString()}`);
  } else {
    await db.insert(subscriptions).values({
      clerkUserId: user.id,
      plan: "pro",
      trialStartedAt: new Date(),
      trialEndsAt: oneYearFromNow,
      currentPeriodEnd: oneYearFromNow,
    });
    console.log(`✅ Created new subscription → PRO, expires ${oneYearFromNow.toISOString()}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
