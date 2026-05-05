"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookieConsent";

type Consent = "accepted" | "rejected";

const COPY = {
  sl: {
    title: "Piškotki na tej spletni strani",
    body:
      "Uporabljamo nujno potrebne piškotke za delovanje strani in z vašim soglasjem analitične piškotke za izboljšanje izkušnje. Več o tem si lahko preberete v naši politiki piškotkov.",
    accept: "Sprejmi vse",
    reject: "Samo nujno potrebni",
    learnMore: "Politika piškotkov",
    learnMoreHref: "/piskotki",
    closeAria: "Zapri",
  },
  en: {
    title: "Cookies on this website",
    body:
      "We use strictly necessary cookies to run the site and, with your consent, analytics cookies to improve your experience. Read more in our cookie policy.",
    accept: "Accept all",
    reject: "Only necessary",
    learnMore: "Cookie policy",
    learnMoreHref: "/en/cookies",
    closeAria: "Close",
  },
};

function detectLocale(path: string): "sl" | "en" {
  return path === "/en" || path.startsWith("/en/") ? "en" : "sl";
}

export function CookieBanner() {
  const pathname = usePathname();
  const locale = detectLocale(pathname || "/");
  const t = COPY[locale];

  // Start hidden to avoid SSR/CSR flash; only show after we've checked storage.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== "accepted" && stored !== "rejected") {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — show banner anyway.
      setVisible(true);
    }
  }, []);

  function persist(value: Consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Cookie className="h-5 w-5 text-blue-600" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{t.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {t.body}{" "}
              <Link
                href={t.learnMoreHref}
                className="font-medium text-blue-600 underline-offset-2 hover:underline"
              >
                {t.learnMore}
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => persist("rejected")}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {t.reject}
              </button>
              <button
                type="button"
                onClick={() => persist("accepted")}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-blue-700 hover:to-indigo-700"
              >
                {t.accept}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => persist("rejected")}
            aria-label={t.closeAria}
            className="ml-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
