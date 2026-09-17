CREATE TABLE IF NOT EXISTS "subscriptionPlanEntitlements" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerkUserId" varchar(255) NOT NULL,
  "planCode" varchar(32) NOT NULL,
  "billing" varchar(16),
  "source" varchar(32) DEFAULT 'system' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptionPlanEntitlements_user_unique" ON "subscriptionPlanEntitlements" USING btree ("clerkUserId");
