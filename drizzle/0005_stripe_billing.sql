DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'stripeCustomerId'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "stripeCustomerId" varchar(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'stripeSubscriptionId'
  ) THEN
    ALTER TABLE "subscriptions" ADD COLUMN "stripeSubscriptionId" varchar(255);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddleCustomerId'
  ) THEN
    ALTER TABLE "subscriptions" DROP COLUMN "paddleCustomerId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddleSubscriptionId'
  ) THEN
    ALTER TABLE "subscriptions" DROP COLUMN "paddleSubscriptionId";
  END IF;
END $$;
