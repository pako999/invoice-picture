"use client";

import { useCallback, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { BankTransferForm } from "@/components/bank-transfer-form";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PLAN_CONFIGS, formatEur, isPaidPlan, type BillingPeriod } from "@/lib/plans";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function EmbeddedPlanCheckout({ locale, plan, billing }: { locale: "sl" | "en"; plan: string; billing: string }) {
  const en = locale === "en";
  const tier = isPaidPlan(plan) ? plan : "basic";
  const period: BillingPeriod = billing === "yearly" ? "yearly" : "monthly";
  const config = PLAN_CONFIGS[tier];
  const price = period === "yearly" ? config.yearlyPrice! : config.monthlyPrice!;
  const destination = `${en ? "/en" : ""}/checkout?plan=${tier}&billing=${period}`;
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [error, setError] = useState("");

  const fetchClientSecret = useCallback(async () => {
    setError("");
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, billing: period, locale }),
    });
    const body = (await response.json().catch(() => ({}))) as { clientSecret?: string; error?: string };
    if (!response.ok || !body.clientSecret) {
      const message = body.error ?? (en ? "Card payment could not be started." : "Kartičnega plačila ni bilo mogoče začeti.");
      setError(message);
      throw new Error(message);
    }
    return body.clientSecret;
  }, [en, locale, period, tier]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href={en ? "/en/upgrade" : "/upgrade"} className="text-sm font-bold text-blue-700 hover:underline">
          ← {en ? "Back to plans" : "Nazaj na pakete"}
        </Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">{en ? "Selected plan" : "Izbrani paket"}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{en ? config.nameEn : config.nameSl}</h1>
            <p className="mt-3 text-4xl font-black text-slate-950">{formatEur(price, locale)}</p>
            <p className="text-xs text-slate-500">+ {en ? "VAT" : "DDV"} / {period === "monthly" ? (en ? "month" : "mesec") : (en ? "year" : "leto")}</p>
            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
              <strong>{config.ocrPagesMonthly.toLocaleString(en ? "en-IE" : "sl-SI")} {en ? "OCR pages" : "OCR strani"}</strong>
              <span className="mt-1 block">{en ? "per month · no separate invoice limit" : "na mesec · brez ločene omejitve računov"}</span>
            </div>
            <p className="mt-4 text-sm font-bold">{config.userLimit} {en ? "users including owner" : "uporabnikov vključno z lastnikom"} · {config.companyLimit === null ? (en ? "unlimited companies" : "neomejeno podjetij") : `${config.companyLimit} ${en ? "companies" : "podjetij"}`}</p>
            <p className="mt-2 text-xs text-slate-500">{en ? "One shared allowance for the whole team. Included seats do not add to the price." : "Ena skupna kvota za celo ekipo. Vključena uporabniška mesta ne zvišajo cene."}</p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">{en ? "Your plan is activated only after Stripe confirms a successful payment." : "Paket se aktivira šele, ko Stripe potrdi uspešno plačilo."}</p>
          </aside>
          <section className="min-h-[560px] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl sm:p-6">
            <h2 className="mb-4 px-2 text-xl font-extrabold text-slate-950">{en ? "Secure card payment" : "Varno kartično plačilo"}</h2>
            {!isLoaded ? (
              <div className="h-[460px] animate-pulse rounded-2xl bg-slate-100" />
            ) : !isSignedIn ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl bg-blue-50 px-6 text-center">
                <h3 className="text-2xl font-black text-slate-950">{en ? "Sign in to continue" : "Prijavite se za nadaljevanje"}</h3>
                <p className="mt-2 max-w-md text-sm text-slate-600">{en ? "We need your account to activate the selected plan after Stripe confirms payment." : "Vaš račun potrebujemo, da po potrjenem plačilu aktiviramo izbrani paket."}</p>
                <button
                  type="button"
                  onClick={() => clerk.openSignIn({ forceRedirectUrl: destination, signUpForceRedirectUrl: destination })}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-extrabold text-white shadow-lg hover:bg-blue-700"
                >
                  {en ? "Sign in or create account" : "Prijava ali registracija"}
                </button>
              </div>
            ) : !stripePromise ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{en ? "Stripe is not configured yet." : "Stripe še ni nastavljen."}</div>
            ) : (
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
            <BankTransferForm tier={tier} billing={period} locale={locale} />
            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
