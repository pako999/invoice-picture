"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface SubStatus {
  plan: "free" | "trial" | "basic" | "pro" | "expired" | "canceled";
  daysRemaining: number;
  trialActive: boolean;
  paid: boolean;
  canSend: boolean;
  monthlyCount: number;
  monthlyLimit: number | null;
}

const APP_PATHS = ["/scan", "/invoices", "/settings"];

export function TrialBanner() {
  const path = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [status, setStatus] = useState<SubStatus | null>(null);

  const isAppRoute = APP_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isAppRoute) {
      setStatus(null);
      return;
    }
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d));
  }, [isLoaded, isSignedIn, isAppRoute, path]);

  if (!status || status.paid) return null;

  // Free plan — show monthly usage
  if (status.plan === "free" && status.monthlyLimit !== null) {
    const used = status.monthlyCount;
    const limit = status.monthlyLimit;
    const remaining = limit - used;
    const atLimit = remaining <= 0;

    if (atLimit) {
      return (
        <div className="bg-amber-500 text-white px-4 py-3 text-sm font-medium">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <span>🔒 Mesečna omejitev dosežena ({used}/{limit} računov) / Monthly limit reached — Brezplačen paket</span>
            <Link
              href="/upgrade?plan=basic"
              className="bg-white text-amber-700 font-bold px-4 py-1.5 rounded-lg hover:bg-amber-50 transition-colors flex-shrink-0"
            >
              Nadgradi na Osnovni →
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <span className="text-blue-900">
            📊 <strong>Brezplačen paket / Free plan</strong> — {used}/{limit} računov ta mesec / invoices this month
            {remaining === 1 && " · Preostane 1 / 1 remaining"}
          </span>
          <Link href="/upgrade?plan=basic" className="text-blue-700 font-semibold hover:underline flex-shrink-0">
            Nadgradi na Osnovni →
          </Link>
        </div>
      </div>
    );
  }

  // Trial expired — block banner
  if (!status.canSend) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 text-sm font-medium">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <span>⛔ Vaša brezplačna preizkusna doba je potekla. Pošiljanje računov je onemogočeno.</span>
          <Link
            href="/upgrade"
            className="bg-white text-red-700 font-bold px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
          >
            Nadgradi paket →
          </Link>
        </div>
      </div>
    );
  }

  // Trial active — info banner
  if (status.trialActive) {
    const days = status.daysRemaining;
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <span className="text-blue-900">
            🎁 <strong>Brezplačna preizkusna doba</strong> — {days === 1 ? "preostal 1 dan" : `preostali še ${days} dni`}
          </span>
          <Link
            href="/upgrade"
            className="text-blue-700 font-semibold hover:underline flex-shrink-0"
          >
            Nadgradi že zdaj →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
