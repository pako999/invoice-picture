"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface SubStatus {
  plan: "trial" | "basic" | "pro" | "expired" | "canceled" | "free";
  daysRemaining: number;
  trialActive: boolean;
  paid: boolean;
  canSend: boolean;
  isFree: boolean;
  monthlyUsage: number;
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

  // Free plan — show usage counter
  if (status.isFree && status.monthlyLimit !== null) {
    const atLimit = status.monthlyUsage >= status.monthlyLimit;
    return (
      <div className={`px-4 py-2.5 text-sm border-b ${atLimit ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <span className={atLimit ? "text-orange-900" : "text-blue-900"}>
            {atLimit
              ? `⚠️ Mesečna omejitev dosežena — ${status.monthlyUsage}/${status.monthlyLimit} računov`
              : `📊 Brezplačen paket — ${status.monthlyUsage}/${status.monthlyLimit} računov ta mesec`}
          </span>
          <Link
            href="/upgrade?plan=basic"
            className={`font-semibold hover:underline flex-shrink-0 ${atLimit ? "text-orange-700" : "text-blue-700"}`}
          >
            Nadgradi na Osnovni →
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
            🎁 <strong>Brezplačna preizkusna doba</strong> — {days === 1 ? "preostal 1 dan" : `preostali še ${days} ${days < 5 ? "dni" : "dni"}`}
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
