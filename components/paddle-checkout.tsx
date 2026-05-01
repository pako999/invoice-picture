"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type Tier = "basic" | "pro";
type Billing = "monthly" | "yearly";

interface Props {
  tier: Tier;
  billing: Billing;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (options: { token: string; eventCallback?: (event: unknown) => void }) => void;
      Checkout: { open: (options: Record<string, unknown>) => void };
    };
  }
}

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const PADDLE_ENV = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";

const PRICE_IDS: Record<Tier, Record<Billing, string | undefined>> = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_BASIC_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_BASIC_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID,
  },
};

let paddleLoaded = false;
function loadPaddle(): Promise<void> {
  if (paddleLoaded || typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (window.Paddle) {
      paddleLoaded = true;
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (!window.Paddle) return reject(new Error("Paddle script loaded but Paddle is undefined"));
      window.Paddle.Environment.set(PADDLE_ENV);
      window.Paddle.Initialize({ token: PADDLE_TOKEN });
      paddleLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Paddle script"));
    document.head.appendChild(script);
  });
}

export function PaddleCheckoutButton({ tier, billing, children, className, variant = "default" }: Props) {
  const { user, isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const priceId = PRICE_IDS[tier][billing];
  const configured = Boolean(PADDLE_TOKEN && priceId);

  useEffect(() => {
    if (configured) loadPaddle().catch((e) => setError(e.message));
  }, [configured]);

  async function handleClick() {
    if (!configured) {
      setError("Plačila trenutno niso na voljo. Prosimo, kontaktirajte podporo.");
      return;
    }
    if (!isSignedIn) {
      window.location.href = "/sign-in?redirect=/upgrade";
      return;
    }
    setBusy(true);
    try {
      await loadPaddle();
      if (!window.Paddle) throw new Error("Paddle not loaded");
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user?.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : undefined,
        customData: { clerkUserId: user?.id, tier, billing },
        settings: {
          locale: "sl",
          successUrl: typeof window !== "undefined" ? `${window.location.origin}/scan?upgraded=1` : undefined,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri odpiranju plačila");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={busy} variant={variant} className={className}>
        {busy ? "Pripravljam..." : children}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!configured && (
        <p className="text-xs text-slate-400 text-center">
          Plačila bodo na voljo kmalu — pripravljamo integracijo.
        </p>
      )}
    </div>
  );
}
