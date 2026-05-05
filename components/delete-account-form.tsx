"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, useUser, useClerk } from "@clerk/nextjs";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

type Locale = "sl" | "en";

const COPY = {
  sl: {
    signInTitle: "Prijavite se za izbris računa",
    signInBody:
      "Za izbris računa se morate najprej prijaviti z istim e-naslovom, s katerim ste se registrirali v aplikaciji.",
    signInBtn: "Prijava",
    homeBtn: "Nazaj na domačo stran",
    signedInTitle: "Izbris uporabniškega računa",
    signedInAs: "Prijavljeni ste kot",
    whatWillBeDeleted: "Kaj bo izbrisano",
    deletedItems: [
      "Vaš uporabniški račun (e-naslov, geslo, OAuth povezave)",
      "Vsi poslani računi in njihov arhiv (vključno s slikami)",
      "Seznam podjetij in OCR e-naslovi",
      "Privzeti e-naslov za pošiljanje",
      "Aktivna naročnina (preklicana takoj — vrnitve preteklih plačil ne izvajamo)",
    ],
    irreversibleWarning:
      "To dejanje je trajno in ga ni mogoče razveljaviti. Vsi podatki bodo izbrisani v 24 urah.",
    confirmCheckbox: "Razumem, da bo moj račun in vsi podatki trajno izbrisani.",
    confirmTypeLabel: "Za potrditev v polje vnesite",
    confirmTypeWord: "IZBRIŠI",
    confirmInputPlaceholder: "Vnesite IZBRIŠI",
    deleteBtn: "Trajno izbriši moj račun",
    deletingBtn: "Brišem…",
    cancelBtn: "Prekliči",
    successTitle: "Račun je bil izbrisan",
    successBody:
      "Vaš uporabniški račun in vsi povezani podatki so bili trajno odstranjeni iz našega sistema.",
    errorTitle: "Napaka pri brisanju",
    errorBody: "Računa nismo mogli izbrisati. Poskusite znova ali nas kontaktirajte na info@posljiracun.si.",
    alternateMethodTitle: "Brisanje iz mobilne aplikacije",
    alternateMethodBody:
      "Račun lahko izbrišete tudi neposredno v mobilni aplikaciji: Nastavitve → Nevarno območje → Izbriši moj račun.",
  },
  en: {
    signInTitle: "Sign in to delete your account",
    signInBody:
      "To delete your account, you must first sign in with the same email address you used to register in the app.",
    signInBtn: "Sign in",
    homeBtn: "Back to homepage",
    signedInTitle: "Delete your account",
    signedInAs: "You are signed in as",
    whatWillBeDeleted: "What will be deleted",
    deletedItems: [
      "Your user account (email, password, OAuth connections)",
      "All sent invoices and their archive (including images)",
      "Companies and OCR email addresses",
      "Default recipient email",
      "Active subscription (cancelled immediately — past payments are non-refundable)",
    ],
    irreversibleWarning:
      "This action is permanent and cannot be undone. All data will be erased within 24 hours.",
    confirmCheckbox: "I understand that my account and all data will be permanently deleted.",
    confirmTypeLabel: "To confirm, type",
    confirmTypeWord: "DELETE",
    confirmInputPlaceholder: "Type DELETE",
    deleteBtn: "Permanently delete my account",
    deletingBtn: "Deleting…",
    cancelBtn: "Cancel",
    successTitle: "Account deleted",
    successBody:
      "Your account and all related data have been permanently removed from our system.",
    errorTitle: "Deletion failed",
    errorBody: "We couldn't delete the account. Please try again or contact us at info@posljiracun.si.",
    alternateMethodTitle: "Delete from the mobile app",
    alternateMethodBody:
      "You can also delete your account directly in the mobile app: Settings → Danger zone → Delete my account.",
  },
} as const;

export function DeleteAccountForm({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [confirmed, setConfirmed] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-900">{t.successTitle}</h2>
        <p className="mt-3 text-emerald-800">{t.successBody}</p>
        <Link
          href={locale === "sl" ? "/" : "/en"}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
        >
          {t.homeBtn}
        </Link>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{t.signInTitle}</h2>
        <p className="mt-3 text-slate-600">{t.signInBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
            >
              {t.signInBtn}
            </button>
          </SignInButton>
          <Link
            href={locale === "sl" ? "/" : "/en"}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.homeBtn}
          </Link>
        </div>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">{t.alternateMethodTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{t.alternateMethodBody}</p>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    setError(null);
    try {
      // Clerk fires `user.deleted` webhook → cascades DB cleanup on our side.
      await user.delete();
      // Sign out locally so cookies/sessions clear.
      await signOut();
      setDone(true);
      // Hard navigate after a beat so any cached client state is reset.
      setTimeout(() => {
        router.replace(locale === "sl" ? "/" : "/en");
      }, 4000);
    } catch (e) {
      console.error(e);
      setError(t.errorBody);
      setDeleting(false);
    }
  }

  const canDelete = confirmed && typedConfirm.trim().toUpperCase() === t.confirmTypeWord;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{t.signedInTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {t.signedInAs}{" "}
          <span className="font-mono font-semibold text-slate-900">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </span>
        </p>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t.whatWillBeDeleted}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {t.deletedItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Trash2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" aria-hidden />
          <p className="text-sm font-medium text-rose-900">{t.irreversibleWarning}</p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>{t.confirmCheckbox}</span>
          </label>

          <div>
            <label className="text-sm text-slate-700">
              {t.confirmTypeLabel}{" "}
              <span className="font-mono font-bold text-rose-700">{t.confirmTypeWord}</span>
            </label>
            <input
              type="text"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={t.confirmInputPlaceholder}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="font-semibold">{t.errorTitle}</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={locale === "sl" ? "/" : "/en"}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.cancelBtn}
          </Link>
          <button
            type="button"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.deletingBtn}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {t.deleteBtn}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">{t.alternateMethodTitle}</p>
        <p className="mt-1 text-sm text-slate-600">{t.alternateMethodBody}</p>
      </div>
    </div>
  );
}
