"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
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
  const clerk = useClerk();
  const pathname = usePathname();
  const isEn = pathname.startsWith("/en");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [method, setMethod] = useState<"choice" | "bank">("choice");
  const [customerType, setCustomerType] = useState<"private" | "company">("private");
  const [bankBusy, setBankBusy] = useState(false);
  const [bankSent, setBankSent] = useState(false);
  const [bankError, setBankError] = useState("");

  const priceId = PRICE_IDS[tier][billing];
  const configured = Boolean(PADDLE_TOKEN && priceId);

  useEffect(() => {
    if (configured) loadPaddle().catch((e) => setError(e.message));
  }, [configured]);

  async function handleClick() {
    if (!isSignedIn) {
      // Carry plan intent through sign-up so /upgrade can pre-select it.
      const dest = `/upgrade?plan=${tier}&billing=${billing}`;
      clerk.openSignUp({
        forceRedirectUrl: dest,
        signInFallbackRedirectUrl: dest,
      });
      return;
    }
    setError(null);
    setMethod("choice");
    setBankSent(false);
    setBankError("");
    setShowPayment(true);
  }

  async function handleCardPayment() {
    if (!configured) {
      setBankError(isEn ? "Card payments are currently unavailable." : "Plačilo s kartico trenutno ni na voljo.");
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
          locale: isEn ? "en" : "sl",
          successUrl: typeof window !== "undefined" ? `${window.location.origin}${isEn ? "/en" : ""}/scan?upgraded=1` : undefined,
        },
      });
      setShowPayment(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri odpiranju plačila");
    } finally {
      setBusy(false);
    }
  }

  async function submitBankOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBankBusy(true);
    setBankError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/bank-transfer-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          billing,
          customerType,
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          streetAddress: form.get("streetAddress"),
          postalCode: form.get("postalCode"),
          city: form.get("city"),
          country: form.get("country"),
          companyName: customerType === "company" ? form.get("companyName") : undefined,
          taxNumber: customerType === "company" ? form.get("taxNumber") : undefined,
          note: form.get("note") || undefined,
          acceptedTerms: form.get("acceptedTerms") === "on",
          locale: isEn ? "en" : "sl",
          website: form.get("website"),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? (isEn ? "The request could not be sent." : "Naročila ni bilo mogoče poslati."));
      }
      setBankSent(true);
    } catch (e) {
      setBankError(e instanceof Error ? e.message : (isEn ? "The request could not be sent." : "Naročila ni bilo mogoče poslati."));
    } finally {
      setBankBusy(false);
    }
  }

  const planName = tier === "basic" ? (isEn ? "Basic" : "Osnovni") : "PRO";
  const price = tier === "basic"
    ? (billing === "monthly" ? "6,99 € / mesec" : "66,90 € / leto")
    : (billing === "monthly" ? "17,99 € / mesec" : "171,99 € / leto");
  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !bankBusy && setShowPayment(false)}>
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">{planName}</p>
                <h2 className="text-2xl font-bold text-slate-900">{isEn ? "Choose payment method" : "Izberite način plačila"}</h2>
                <p className="mt-1 text-sm text-slate-500">{isEn ? price.replace("mesec", "month").replace("leto", "year") : price}</p>
              </div>
              <button type="button" onClick={() => setShowPayment(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100" aria-label={isEn ? "Close" : "Zapri"}>✕</button>
            </div>

            {bankSent ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-5xl">✅</div>
                <h3 className="text-xl font-bold text-slate-900">{isEn ? "Request received" : "Naročilo je prejeto"}</h3>
                <p className="mx-auto mt-2 max-w-md text-slate-600">{isEn ? "We will prepare the pro forma invoice and send it to your email shortly." : "Predračun bomo pripravili in vam ga v kratkem poslali na vpisani e-poštni naslov."}</p>
                <Button type="button" className="mt-6 bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowPayment(false)}>{isEn ? "Close" : "Zapri"}</Button>
              </div>
            ) : method === "choice" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => void handleCardPayment()} className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-3xl">💳</span>
                  <span className="mt-3 block text-lg font-bold text-slate-900">{isEn ? "Card payment" : "Plačilo s kartico"}</span>
                  <span className="mt-1 block text-sm text-slate-500">{isEn ? "Pay securely online now" : "Varno spletno plačilo takoj"}</span>
                </button>
                <button type="button" onClick={() => setMethod("bank")} className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-blue-500 hover:bg-blue-50">
                  <span className="text-3xl">🏦</span>
                  <span className="mt-3 block text-lg font-bold text-slate-900">{isEn ? "Bank transfer" : "Plačilo po predračunu"}</span>
                  <span className="mt-1 block text-sm text-slate-500">{isEn ? "We email you a pro forma invoice" : "Predračun prejmete po e-pošti"}</span>
                </button>
                {bankError && <p className="text-sm font-medium text-red-600 sm:col-span-2">{bankError}</p>}
              </div>
            ) : (
              <form onSubmit={submitBankOrder} className="space-y-4">
                <button type="button" onClick={() => setMethod("choice")} className="text-sm font-semibold text-blue-600 hover:underline">← {isEn ? "Payment methods" : "Načini plačila"}</button>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button type="button" onClick={() => setCustomerType("private")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${customerType === "private" ? "bg-white text-blue-700 shadow" : "text-slate-600"}`}>{isEn ? "Private person" : "Fizična oseba"}</button>
                  <button type="button" onClick={() => setCustomerType("company")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${customerType === "company" ? "bg-white text-blue-700 shadow" : "text-slate-600"}`}>{isEn ? "Company" : "Podjetje"}</button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">{isEn ? "Full name *" : "Ime in priimek *"}<input name="fullName" required minLength={2} maxLength={120} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">{isEn ? "Email *" : "E-pošta *"}<input name="email" type="email" required maxLength={320} defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">{isEn ? "Phone *" : "Telefon *"}<input name="phone" type="tel" required minLength={6} maxLength={40} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">{isEn ? "Street and house number *" : "Ulica in hišna številka *"}<input name="streetAddress" required minLength={3} maxLength={180} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">{isEn ? "Postal code *" : "Poštna številka *"}<input name="postalCode" required minLength={2} maxLength={20} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700">{isEn ? "City *" : "Kraj *"}<input name="city" required minLength={2} maxLength={100} className={inputClass} /></label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">{isEn ? "Country *" : "Država *"}<input name="country" required minLength={2} maxLength={100} defaultValue={isEn ? "Slovenia" : "Slovenija"} className={inputClass} /></label>
                  {customerType === "company" && (
                    <>
                      <label className="text-sm font-medium text-slate-700">{isEn ? "Company name *" : "Naziv podjetja *"}<input name="companyName" required minLength={2} maxLength={180} className={inputClass} /></label>
                      <label className="text-sm font-medium text-slate-700">{isEn ? "Tax/VAT number *" : "Davčna številka *"}<input name="taxNumber" required minLength={2} maxLength={40} className={inputClass} /></label>
                    </>
                  )}
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">{isEn ? "Note (optional)" : "Opomba (neobvezno)"}<textarea name="note" maxLength={1000} rows={3} className={inputClass} /></label>
                </div>

                <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input name="acceptedTerms" type="checkbox" required className="mt-1" />
                  <span>{isEn ? "I confirm that the information is correct and agree to its use for preparing the pro forma invoice." : "Potrjujem pravilnost podatkov in dovoljujem njihovo uporabo za pripravo predračuna."}</span>
                </label>
                {bankError && <p className="text-sm font-medium text-red-600">{bankError}</p>}
                <Button type="submit" disabled={bankBusy} className="w-full bg-blue-600 py-3 text-white hover:bg-blue-700">{bankBusy ? (isEn ? "Sending..." : "Pošiljam...") : (isEn ? "Request pro forma invoice" : "Pošlji naročilo za predračun")}</Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
