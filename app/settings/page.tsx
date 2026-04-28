"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmail(localStorage.getItem("invoice_email") ?? "");
  }, []);

  function save() {
    localStorage.setItem("invoice_email", email.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Nastavitve</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-10">
        Konfiguracija Invoice Picture aplikacije.
      </p>

      {/* Email section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📧</span>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Privzeti email prejemnika</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Shranjen lokalno v brskalniku</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
              placeholder="racuni@podjetje.si"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={save}
            className={`w-full font-bold py-3 rounded-xl text-sm transition-colors ${
              saved
                ? "bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {saved ? "✓ Shranjeno" : "Shrani email"}
          </button>
        </div>
      </div>

      {/* Resend info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🔑</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Resend API ključ</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          API ključ se nastavi kot okoljska spremenljivka <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code> na strežniku.
          Na Vercel ga dodaj v <strong>Settings → Environment Variables</strong>.
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
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          Nastavi <code className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">DATABASE_URL</code> na MySQL connection string.
          Priporočeno: <strong>PlanetScale</strong>, <strong>Railway</strong> ali <strong>Clever Cloud</strong>.
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          Po nastavitvi poženi: <code className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">pnpm db:push</code>
        </p>
      </div>
    </div>
  );
}
