"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Company } from "@/lib/schema";

function CompanyRow({
  company, onUpdate, onDelete,
}: {
  company: Company;
  onUpdate: (id: number, name: string, email: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [email, setEmail] = useState(company.recipientEmail);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onUpdate(company.id, name, email);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ime podjetja"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ocr@program.si" type="email"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !name.trim() || !email.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50">
            {saving ? "Shranjujem..." : "Shrani"}
          </button>
          <button onClick={() => { setEditing(false); setName(company.name); setEmail(company.recipientEmail); }}
            className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            Prekliči
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-base flex-shrink-0">
        🏢
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{company.name}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{company.recipientEmail}</p>
      </div>
      <button onClick={() => setEditing(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-colors text-sm">
        ✏️
      </button>
      <button onClick={() => onDelete(company.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
        🗑️
      </button>
    </div>
  );
}

function SettingsContent() {
  const params = useSearchParams();
  const isWelcome = params.get("welcome") === "1";

  // Single email (legacy / simple mode)
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Companies
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan: string; isFree: boolean; monthlyUsage: number; monthlyLimit: number | null } | null>(null);

  useEffect(() => {
    const noStore: RequestInit = { cache: "no-store", headers: { "Cache-Control": "no-cache" } };
    Promise.all([
      fetch("/api/settings", noStore).then(r => r.json()).catch(() => ({})),
      fetch("/api/companies", noStore).then(r => r.json()).catch(() => []),
      fetch("/api/subscription", noStore).then(r => r.json()).catch(() => ({})),
    ]).then(([settings, comps, sub]) => {
      setEmail(settings.recipientEmail ?? "");
      setCompanyList(Array.isArray(comps) ? comps : []);
      setIsPro(sub.plan === "pro" && sub.paid === true);
      setPlanInfo({ plan: sub.plan, isFree: sub.isFree, monthlyUsage: sub.monthlyUsage, monthlyLimit: sub.monthlyLimit });
      setLoading(false);
    });
  }, []);

  async function saveEmail() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ recipientEmail: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Napaka."); return; }
      if (json.recipientEmail) setEmail(json.recipientEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Ni povezave.");
    } finally {
      setSaving(false);
    }
  }

  async function addCompany() {
    setAddError("");
    setAdding(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), recipientEmail: newEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "Napaka."); return; }
      setCompanyList(prev => [json, ...prev]);
      setNewName(""); setNewEmail(""); setShowAdd(false);
    } catch {
      setAddError("Ni povezave.");
    } finally {
      setAdding(false);
    }
  }

  async function updateCompany(id: number, name: string, recipientEmail: string) {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, recipientEmail }),
    });
    const json = await res.json();
    if (res.ok) setCompanyList(prev => prev.map(c => c.id === id ? json : c));
  }

  async function deleteCompany(id: number) {
    if (!confirm("Res želiš izbrisati to podjetje?")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    setCompanyList(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Nastavitve</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">Nastavite emails za posredovanje računov.</p>

      {isWelcome && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          🎉 Dobrodošel! Dodaj podjetja ali nastavi privzeti email in začni slikati račune.
        </div>
      )}

      {/* ── COMPANIES ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <h2 className="font-bold text-gray-900 dark:text-white">Podjetja</h2>
          </div>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full">
            Za računovodske pisarne
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5 ml-9">
          Dodajte podjetja s svojimi OCR email naslovi. Pri skeniranju izberete za katero podjetje pošiljate.
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {companyList.map(c => (
              <CompanyRow key={c.id} company={c} onUpdate={updateCompany} onDelete={deleteCompany} />
            ))}

            {!isPro && companyList.length >= 1 ? (
              // PRO upsell hidden — was creating noise on free/basic
              null
            ) : showAdd ? (
              <div className="bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 space-y-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ime podjetja (npr. ABC d.o.o.)"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="OCR email (npr. uvoz@minimax.si)" type="email"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {addError && <p className="text-xs text-red-500">{addError}</p>}
                <div className="flex gap-2">
                  <button onClick={addCompany} disabled={adding || !newName.trim() || !newEmail.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50">
                    {adding ? "Dodajam..." : "Dodaj podjetje"}
                  </button>
                  <button onClick={() => { setShowAdd(false); setNewName(""); setNewEmail(""); setAddError(""); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                    Prekliči
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                + Dodaj podjetje
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── DEFAULT EMAIL (simple / fallback) ── */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📧</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Privzeti email</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 ml-9">
          Uporablja se kadar ne izberete podjetja. Primerno za posameznike z enim računovodskim programom.
        </p>

        {loading ? (
          <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            <input type="email" value={email}
              onChange={e => { setEmail(e.target.value); setSaved(false); setError(""); }}
              placeholder="uvoz@minimax.si"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button onClick={saveEmail} disabled={saving || !email.trim()}
              className={`w-full font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 ${saved ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
              {saved ? "✓ Shranjeno" : saving ? "Shranjujem..." : "Shrani email"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5">
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Kje dobim OCR email?</strong><br />
          V računovodskem programu (Minimax, Birokrat, Pantheon…) poiščite nastavitve za uvoz računov po emailu. Program dodeli poseben email naslov za vsako podjetje.
        </p>
      </div>

      {/* ── CURRENT PLAN ── */}
      {planInfo && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mt-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💳</span>
            <h2 className="font-bold text-gray-900 dark:text-white">Trenutni paket</h2>
          </div>
          {planInfo.isFree ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Brezplačen paket</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {planInfo.monthlyUsage}/{planInfo.monthlyLimit} računi ta mesec
                  </p>
                </div>
                <a href="/upgrade" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                  Nadgradi →
                </a>
              </div>
              {planInfo.monthlyLimit !== null && (
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${planInfo.monthlyUsage >= planInfo.monthlyLimit ? "bg-orange-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, (planInfo.monthlyUsage / planInfo.monthlyLimit) * 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                Brezplačen paket — 3 računi/mesec. <a href="/upgrade" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Nadgradite za neomejeno obdelavo.</a>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {planInfo.plan === "basic" ? "Osnovni paket" : planInfo.plan === "pro" ? "PRO paket" : planInfo.plan === "trial" ? "Preizkusna doba" : planInfo.plan}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Neomejeno pošiljanje računov</p>
              </div>
              {(planInfo.plan === "expired" || planInfo.plan === "canceled") && (
                <a href="/upgrade" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Obnovi →
                </a>
              )}
            </div>
          )}
        </div>
      )}
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
