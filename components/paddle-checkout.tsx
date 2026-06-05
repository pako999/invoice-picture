"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
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

// The on-screen error reason from Paddle's own checkout error event. Set by the
// global eventCallback below, read by whichever button opened the checkout.
let onCheckoutError: ((message: string) => void) | null = null;

function paddleEventCallback(event: unknown) {
  const e = event as { name?: string; type?: string; error?: { detail?: string }; data?: { message?: string } };
  const name = e?.name ?? e?.type;
  if (name === "checkout.error") {
    // Surfaces the real reason Paddle rejected the checkout (e.g. domain not
    // approved, price not found, environment/token mismatch) instead of the
    // opaque "Something went wrong" overlay.
    console.error("[paddle] checkout.error:", event);
    const detail = e?.error?.detail ?? e?.data?.message ?? "Plačilo se ni odprlo. Poskusite znova.";
    onCheckoutError?.(detail);
  }
}

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
      // Catch the #1 cause of a post-open "Something went wrong": a live token
      // running in sandbox mode (or vice-versa). Paddle client tokens are
      // prefixed `live_` (production) and `test_` (sandbox).
      const tokenEnv = PADDLE_TOKEN.startsWith("live_") ? "production" : PADDLE_TOKEN.startsWith("test_") ? "sandbox" : null;
      if (tokenEnv && tokenEnv !== PADDLE_ENV) {
        console.warn(
          `[paddle] env mismatch: NEXT_PUBLIC_PADDLE_ENV="${PADDLE_ENV}" but the client token looks like "${tokenEnv}". ` +
          `Set NEXT_PUBLIC_PADDLE_ENV to "${tokenEnv}" (and make sure the price IDs come from that same environment).`,
        );
      }
      window.Paddle.Environment.set(PADDLE_ENV);
      window.Paddle.Initialize({ token: PADDLE_TOKEN, eventCallback: paddleEventCallback });
      paddleLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Paddle script"));
    document.head.appendChild(script);
  });
}

export function PaddleCheckoutButton({ tier, billing, children, className, variant = "default" }: Props) {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();
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
      // Carry plan intent through sign-up so /upgrade can pre-select it.
      const dest = `/upgrade?plan=${tier}&billing=${billing}`;
      clerk.openSignUp({
        forceRedirectUrl: dest,
        signInFallbackRedirectUrl: dest,
      });
      return;
    }
    setBusy(true);
    setError(null);
    // Route Paddle's own checkout.error event to this button's message.
    onCheckoutError = (msg) => setError(msg);
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
