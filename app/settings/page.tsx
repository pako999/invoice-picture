"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SettingsContent() {
  const params = useSearchParams();
  const isWelcome = params.get("welcome") === "1";

  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setEmail(d.recipientEmail ?? ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Napaka"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Napaka pri shranjevanju");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Nastavitve</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">Konfiguracija tvojega računa.</p>

      {isWelcome && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          🎉 Dobrodošel! Nastavi email, na katerega bodo prihajali računi.
        </div>
      )}

      {/* Recipient email */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📧</span>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Email za prejemanje računov</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Na ta naslov bodo poslani vsi tvoji računi</p>
          </div>
        </div>

        {loading ? (
          <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
              placeholder="racuni@podjetje.si"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={save}
              disabled={saving || !email.trim()}
              className={`w-full font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {saved ? "✓ Shranjeno" : saving ? "Shranjujem..." : "Shrani email"}
            </button>
          </div>
        )}
      </div>

      {/* Resend info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🔑</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Resend API ključ</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          Nastavi <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code> in{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_FROM</code> v{" "}
          Vercel → Settings → Environment Variables.
        </p>
        <a
          href="https://resend.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
        >
          Ustvari ključ na resend.com →
        </a>
      </div>

      {/* DB info */}
      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🗄️</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Baza podatkov</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          <code className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">DATABASE_URL</code>{" "}
          nastavi v Vercel. Po nastavitvi poženi:{" "}
          <code className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">npm run db:push</code>
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
