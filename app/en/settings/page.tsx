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
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ocr@program.com" type="email"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !name.trim() || !email.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={() => { setEditing(false); setName(company.name); setEmail(company.recipientEmail); }}
            className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            Cancel
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

  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan: string; isFree: boolean; monthlyUsage: number; monthlyLimit: number | null } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
      fetch("/api/companies").then(r => r.json()).catch(() => []),
      fetch("/api/subscription").then(r => r.json()).catch(() => ({})),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("No connection.");
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
      if (!res.ok) { setAddError(json.error ?? "Error."); return; }
      setCompanyList(prev => [json, ...prev]);
      setNewName(""); setNewEmail(""); setShowAdd(false);
    } catch {
      setAddError("No connection.");
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
    if (!confirm("Are you sure you want to delete this company?")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    setCompanyList(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Settings</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">Configure the email addresses invoices are forwarded to.</p>

      {isWelcome && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          🎉 Welcome! Add a company or set the default email and start scanning invoices.
        </div>
      )}

      {/* COMPANIES */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <h2 className="font-bold text-gray-900 dark:text-white">Companies</h2>
          </div>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full">
            For accounting firms
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5 ml-9">
          Add companies with their own OCR email addresses. When scanning, you pick the company to send to.
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
              null
            ) : showAdd ? (
              <div className="bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 space-y-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Company name (e.g. ABC Ltd.)"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="OCR email (e.g. import@minimax.si)" type="email"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {addError && <p className="text-xs text-red-500">{addError}</p>}
                <div className="flex gap-2">
                  <button onClick={addCompany} disabled={adding || !newName.trim() || !newEmail.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50">
                    {adding ? "Adding..." : "Add company"}
                  </button>
                  <button onClick={() => { setShowAdd(false); setNewName(""); setNewEmail(""); setAddError(""); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                + Add company
              </button>
            )}
          </div>
        )}
      </div>

      {/* DEFAULT EMAIL */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📧</span>
          <h2 className="font-bold text-gray-900 dark:text-white">Default email</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 ml-9">
          Used when no company is selected. Suitable for individuals with a single accounting program.
        </p>

        {loading ? (
          <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); saveEmail(); }} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            <input type="email" value={email}
              onChange={e => { setEmail(e.target.value); setSaved(false); setError(""); }}
              placeholder="import@minimax.si"
              autoComplete="email"
              enterKeyHint="done"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button type="submit" disabled={saving || !email.trim()}
              className={`w-full font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 ${saved ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
              {saved ? "✓ Saved" : saving ? "Saving..." : "Save email"}
            </button>
          </form>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5">
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Where do I find the OCR email?</strong><br />
          In your accounting program (Minimax, Birokrat, Pantheon…) look for the settings to import invoices via email. The program assigns a dedicated address per company.
        </p>
      </div>

      {/* CURRENT PLAN */}
      {planInfo && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mt-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💳</span>
            <h2 className="font-bold text-gray-900 dark:text-white">Current plan</h2>
          </div>
          {planInfo.isFree ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Free plan</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {planInfo.monthlyUsage}/{planInfo.monthlyLimit} invoices this month
                  </p>
                </div>
                <a href="/en/upgrade" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                  Upgrade →
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
                Free plan — 3 invoices/month. <a href="/en/upgrade" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Upgrade for unlimited processing.</a>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {planInfo.plan === "basic" ? "Basic plan" : planInfo.plan === "pro" ? "PRO plan" : planInfo.plan === "trial" ? "Trial" : planInfo.plan}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Unlimited invoice sending</p>
              </div>
              {(planInfo.plan === "expired" || planInfo.plan === "canceled") && (
                <a href="/en/upgrade" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Renew →
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
