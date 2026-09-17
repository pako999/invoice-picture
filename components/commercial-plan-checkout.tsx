"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PLAN_CONFIGS,
  formatEur,
  planLabel,
  type BillingPeriod,
  type PaidPlan,
} from "@/lib/plans";

export function CommercialPlanCheckout({
  tier,
  billing,
  className = "",
  children,
}: {
  tier: PaidPlan;
  billing: BillingPeriod;
  className?: string;
  children?: React.ReactNode;
}) {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();
  const isEn = usePathname().startsWith("/en");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choice" | "bank">("choice");
  const [customerType, setCustomerType] = useState<"private" | "company">("company");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const config = PLAN_CONFIGS[tier];
  async function start() {
    if (!isSignedIn) {
      const destination = `${isEn ? "/en" : ""}/upgrade?plan=${tier}&billing=${billing}`;
      clerk.openSignUp({
        forceRedirectUrl: destination,
        signInFallbackRedirectUrl: destination,
      });
      return;
    }
    setMode("choice");
    setSent(false);
    setError("");
    setOpen(true);
  }

  async function payByCard() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing, locale: isEn ? "en" : "sl" }),
      });
      const body = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? (isEn ? "Card payment could not be started" : "Kartičnega plačila ni bilo mogoče začeti"));
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isEn ? "Stripe error" : "Napaka pri plačilu Stripe"));
    } finally {
      setBusy(false);
    }
  }

  async function orderByBankTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/bank-transfer-order", {
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
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? (isEn ? "Order failed" : "Naročilo ni uspelo"));
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Napaka");
    } finally {
      setBusy(false);
    }
  }

  const price = billing === "monthly" ? config.monthlyPrice! : config.yearlyPrice!;
  const inputClass = "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm";

  return (
    <>
      <Button onClick={start} className={`w-full ${className}`}>
        {children ?? (isEn ? "Choose plan →" : "Izberi paket →")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-bold text-blue-600">{planLabel(tier, isEn ? "en" : "sl")}</p>
                <h2 className="text-2xl font-extrabold">
                  {formatEur(price, isEn ? "en" : "sl")} + DDV / {billing === "monthly" ? (isEn ? "month" : "mesec") : (isEn ? "year" : "leto")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  AI OCR: {config.ocrDocumentsMonthly} {isEn ? "documents" : "dokumentov"} / {config.ocrPagesMonthly} {isEn ? "pages monthly" : "strani mesečno"}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 rounded-xl hover:bg-slate-100">✕</button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <div className="text-5xl">✅</div>
                <h3 className="mt-3 text-xl font-bold">{isEn ? "Request received" : "Naročilo je prejeto"}</h3>
                <p className="mt-2 text-slate-600">{isEn ? "We will email your pro forma invoice shortly." : "Predračun vam bomo poslali po e-pošti."}</p>
              </div>
            ) : mode === "choice" ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void payByCard()} className="rounded-2xl border-2 p-5 text-left hover:border-blue-500">
                  <span className="text-3xl">💳</span>
                  <strong className="mt-2 block">{isEn ? "Card" : "Kartica"}</strong>
                  <span className="text-xs text-slate-500">
                    {isEn ? "Secure Stripe Checkout" : "Varno plačilo prek Stripe"}
                  </span>
                </button>
                <button type="button" onClick={() => setMode("bank")} className="rounded-2xl border-2 p-5 text-left hover:border-blue-500">
                  <span className="text-3xl">🏦</span>
                  <strong className="mt-2 block">{isEn ? "Bank transfer" : "Predračun"}</strong>
                  <span className="text-xs text-slate-500">{isEn ? "We send a pro forma invoice" : "Pošljemo vam predračun"}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={orderByBankTransfer} className="mt-5 grid gap-3 sm:grid-cols-2">
                <input name="website" className="hidden" tabIndex={-1} />
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 sm:col-span-2">
                  <button type="button" onClick={() => setCustomerType("private")} className={`rounded-lg px-3 py-2 text-sm font-bold ${customerType === "private" ? "bg-white shadow" : ""}`}>{isEn ? "Private" : "Fizična oseba"}</button>
                  <button type="button" onClick={() => setCustomerType("company")} className={`rounded-lg px-3 py-2 text-sm font-bold ${customerType === "company" ? "bg-white shadow" : ""}`}>{isEn ? "Company" : "Podjetje"}</button>
                </div>
                <input name="fullName" required placeholder={isEn ? "Full name" : "Ime in priimek"} className={inputClass} />
                <input name="email" type="email" required defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""} placeholder="Email" className={inputClass} />
                <input name="phone" required placeholder={isEn ? "Phone" : "Telefon"} className={inputClass} />
                {customerType === "company" && <>
                  <input name="companyName" required placeholder={isEn ? "Company" : "Podjetje"} className={inputClass} />
                  <input name="taxNumber" required placeholder={isEn ? "Tax number" : "Davčna številka"} className={inputClass} />
                </>}
                <input name="streetAddress" required placeholder={isEn ? "Street and number" : "Ulica in hišna številka"} className={inputClass} />
                <input name="postalCode" required placeholder={isEn ? "Postal code" : "Poštna številka"} className={inputClass} />
                <input name="city" required placeholder={isEn ? "City" : "Kraj"} className={inputClass} />
                <input name="country" required defaultValue={isEn ? "Slovenia" : "Slovenija"} className={inputClass} />
                <textarea name="note" placeholder={isEn ? "Note (optional)" : "Opomba (neobvezno)"} className={`${inputClass} sm:col-span-2`} />
                <label className="flex gap-2 text-xs sm:col-span-2"><input name="acceptedTerms" type="checkbox" required /> {isEn ? "I accept the terms and privacy policy." : "Sprejemam pogoje uporabe in politiko zasebnosti."}</label>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="button" onClick={() => setMode("choice")} className="rounded-xl border px-4 py-2">←</button>
                  <Button type="submit" disabled={busy} className="flex-1 bg-blue-600 text-white">{busy ? "..." : (isEn ? "Request pro forma invoice" : "Naroči po predračunu")}</Button>
                </div>
              </form>
            )}

            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
