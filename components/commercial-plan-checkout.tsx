"use client";

import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIGS, formatEur, planLabel, type BillingPeriod, type PaidPlan } from "@/lib/plans";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (options: { token: string; eventCallback?: (event: { name?: string }) => void }) => void;
      Checkout: { open: (options: Record<string, unknown>) => void };
    };
  }
}

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const PADDLE_ENV = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";
const PRICE_IDS: Record<PaidPlan, Record<BillingPeriod, string | undefined>> = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_V2_BASIC_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_V2_BASIC_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_V2_PRO_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_V2_PRO_YEARLY_PRICE_ID,
  },
  accounting_pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_V2_ACCOUNTING_PRO_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_V2_ACCOUNTING_PRO_YEARLY_PRICE_ID,
  },
  accounting_max: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_V2_ACCOUNTING_MAX_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_PADDLE_V2_ACCOUNTING_MAX_YEARLY_PRICE_ID,
  },
};

let paddleReady = false;
let paddlePromise: Promise<void> | null = null;
function loadPaddle() {
  if (typeof window === "undefined" || paddleReady) return Promise.resolve();
  if (paddlePromise) return paddlePromise;
  paddlePromise = new Promise<void>((resolve, reject) => {
    const init = () => {
      if (!window.Paddle) return reject(new Error("Paddle ni na voljo"));
      if (!paddleReady) {
        window.Paddle.Environment.set(PADDLE_ENV);
        window.Paddle.Initialize({ token: PADDLE_TOKEN });
        paddleReady = true;
      }
      resolve();
    };
    if (window.Paddle) return init();
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = init;
    script.onerror = () => reject(new Error("Paddle se ni naložil"));
    document.head.appendChild(script);
  });
  return paddlePromise;
}

export function CommercialPlanCheckout({ tier, billing, className = "" }: { tier: PaidPlan; billing: BillingPeriod; className?: string }) {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();
  const path = usePathname();
  const en = path.startsWith("/en");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choice" | "bank">("choice");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const cfg = PLAN_CONFIGS[tier];
  const priceId = PRICE_IDS[tier][billing];
  const cardConfigured = Boolean(PADDLE_TOKEN && priceId);

  useEffect(() => { if (cardConfigured) void loadPaddle().catch(() => undefined); }, [cardConfigured]);

  async function start() {
    if (!isSignedIn) {
      const dest = `${en ? "/en" : ""}/upgrade?plan=${tier}&billing=${billing}`;
      clerk.openSignUp({ forceRedirectUrl: dest, signInFallbackRedirectUrl: dest });
      return;
    }
    setMode("choice"); setSent(false); setError(""); setOpen(true);
  }

  async function card() {
    if (!cardConfigured) {
      setError(en ? "Card payment for this new price is not configured yet. Choose bank transfer." : "Kartično plačilo za novo ceno še ni nastavljeno. Izberi plačilo po predračunu.");
      return;
    }
    setBusy(true); setError("");
    try {
      await loadPaddle();
      window.Paddle!.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user?.primaryEmailAddress?.emailAddress ? { email: user.primaryEmailAddress.emailAddress } : undefined,
        customData: { clerkUserId: user?.id, customerEmail: user?.primaryEmailAddress?.emailAddress, tier, billing },
        settings: { locale: en ? "en" : "sl", successUrl: `${window.location.origin}${en ? "/en" : ""}/scan?upgraded=1` },
      });
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Paddle error"); }
    finally { setBusy(false); }
  }

  async function bank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/bank-transfer-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier, billing, customerType: "company",
          fullName: form.get("fullName"), email: form.get("email"), phone: form.get("phone"),
          streetAddress: form.get("streetAddress"), postalCode: form.get("postalCode"), city: form.get("city"), country: form.get("country"),
          companyName: form.get("companyName"), taxNumber: form.get("taxNumber"), note: form.get("note") || undefined,
          acceptedTerms: form.get("acceptedTerms") === "on", locale: en ? "en" : "sl", website: form.get("website"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? (en ? "Order failed" : "Naročilo ni uspelo"));
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Napaka"); }
    finally { setBusy(false); }
  }

  const price = billing === "monthly" ? cfg.monthlyPrice! : cfg.yearlyPrice!;
  const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";
  return <>
    <Button onClick={start} className={`w-full ${className}`}>{en ? "Choose plan →" : "Izberi paket →"}</Button>
    {open && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={() => !busy && setOpen(false)}>
      <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between gap-4"><div><p className="font-bold text-blue-600">{planLabel(tier, en ? "en" : "sl")}</p><h2 className="text-2xl font-extrabold">{formatEur(price, en ? "en" : "sl")} / {billing === "monthly" ? (en ? "month" : "mesec") : (en ? "year" : "leto")}</h2><p className="mt-1 text-sm text-slate-500">AI OCR: {cfg.ocrDocumentsMonthly} {en ? "documents" : "dokumentov"} / {cfg.ocrPagesMonthly} {en ? "pages monthly" : "strani mesečno"}</p></div><button onClick={() => setOpen(false)} className="h-10 w-10 rounded-xl hover:bg-slate-100">✕</button></div>
        {sent ? <div className="py-10 text-center"><div className="text-5xl">✅</div><h3 className="mt-3 text-xl font-bold">{en ? "Request received" : "Naročilo je prejeto"}</h3><p className="mt-2 text-slate-600">{en ? "We will email your pro forma invoice shortly." : "Predračun vam bomo poslali po e-pošti."}</p></div> : mode === "choice" ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => void card()} className="rounded-2xl border-2 p-5 text-left hover:border-blue-500"><span className="text-3xl">💳</span><strong className="mt-2 block">{en ? "Card" : "Kartica"}</strong><span className="text-xs text-slate-500">{cardConfigured ? (en ? "Pay now" : "Plačaj takoj") : (en ? "New price ID required" : "Potreben je novi Paddle Price ID")}</span></button><button onClick={() => setMode("bank")} className="rounded-2xl border-2 p-5 text-left hover:border-blue-500"><span className="text-3xl">🏦</span><strong className="mt-2 block">{en ? "Bank transfer" : "Predračun"}</strong><span className="text-xs text-slate-500">{en ? "We send an invoice" : "Pošljemo vam predračun"}</span></button></div> : <form onSubmit={bank} className="mt-5 grid gap-3 sm:grid-cols-2"><input name="website" className="hidden" tabIndex={-1} autoComplete="off"/><input name="fullName" required placeholder={en ? "Full name" : "Ime in priimek"} className={input}/><input name="email" type="email" required defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""} placeholder="Email" className={input}/><input name="phone" required placeholder={en ? "Phone" : "Telefon"} className={input}/><input name="companyName" required placeholder={en ? "Company" : "Podjetje"} className={input}/><input name="taxNumber" required placeholder={en ? "Tax number" : "Davčna številka"} className={input}/><input name="streetAddress" required placeholder={en ? "Street and number" : "Ulica in hišna številka"} className={input}/><input name="postalCode" required placeholder={en ? "Postal code" : "Poštna številka"} className={input}/><input name="city" required placeholder={en ? "City" : "Kraj"} className={input}/><input name="country" required defaultValue={en ? "Slovenia" : "Slovenija"} className={`${input} sm:col-span-2`}/><textarea name="note" placeholder={en ? "Note (optional)" : "Opomba (neobvezno)"} className={`${input} sm:col-span-2`}/><label className="sm:col-span-2 flex gap-2 text-xs"><input name="acceptedTerms" type="checkbox" required/> {en ? "I accept the terms and privacy policy." : "Sprejemam pogoje uporabe in politiko zasebnosti."}</label><div className="sm:col-span-2 flex gap-2"><button type="button" onClick={() => setMode("choice")} className="rounded-xl border px-4 py-2">←</button><Button type="submit" disabled={busy} className="flex-1 bg-blue-600 text-white">{busy ? "..." : (en ? "Request pro forma invoice" : "Naroči po predračunu")}</Button></div></form>}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </div>}
  </>;
}
