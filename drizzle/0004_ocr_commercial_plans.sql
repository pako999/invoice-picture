CREATE TABLE IF NOT EXISTS "subscriptionPlanEntitlements" (
  "clerkUserId" varchar(255) PRIMARY KEY NOT NULL,
  "planCode" varchar(32) NOT NULL,
  "billing" varchar(16),
  "source" varchar(32) NOT NULL DEFAULT 'admin',
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "subscriptionPlanEntitlements_plan_idx"
  ON "subscriptionPlanEntitlements" ("planCode");
