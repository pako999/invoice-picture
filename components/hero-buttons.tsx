"use client";
import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export function HeroButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className="flex flex-wrap gap-4 justify-center mb-16">
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
        >
          📷 Začni skenirati
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center mb-16">
      <SignUpButton mode="modal">
        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
          📷 Začni brezplačno
        </button>
      </SignUpButton>
      <SignInButton mode="modal">
        <button className="inline-flex items-center gap-2 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
          Prijava →
        </button>
      </SignInButton>
    </div>
  );
}
