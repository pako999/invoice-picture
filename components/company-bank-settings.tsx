"use client";

import { useEffect, useState } from "react";
import type { CompanyBankProfile } from "@/lib/company-bank-profile";

export function CompanyBankSettings({ companyId, locale }: { companyId: number; locale: "sl" | "en" }) {
  const en = locale === "en";
  const [bank, setBank] = useState<CompanyBankProfile>({ name: "", iban: "", bic: "", city: "", country: "SI" });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/companies/${companyId}/bank`, { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load bank details");
      if (active) setBank(data.bank);
    }).catch(() => { if (active) { setLoadFailed(true); setError(en ? "Bank details could not be loaded. Refresh the page to retry." : "Bančnih podatkov ni mogoče naložiti. Osvežite stran in poskusite znova."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [companyId, en]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setSaved(false); setError("");
    try {
      const response = await fetch(`/api/companies/${companyId}/bank`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bank) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (en ? "Could not save bank details" : "Bančnih podatkov ni mogoče shraniti."));
      setBank(data.bank); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }
  return <section id="bank-account" className="scroll-mt-24 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm dark:bg-slate-900">
    <h2 className="text-xl font-extrabold">{en ? "Company bank account · SEPA" : "Bančni račun podjetja · SEPA"}</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{en ? "Save the paying company’s details once. SEPA exports for invoices assigned to this company will prefill them automatically." : "Podatke podjetja plačnika vnesite enkrat. Pri SEPA izvozu računov tega podjetja se bodo samodejno izpolnili."}</p>
    <form onSubmit={save} className="mt-5">
      <fieldset disabled={loading || busy || loadFailed} className="grid min-w-0 gap-4 sm:grid-cols-2 disabled:opacity-60">
        <legend className="sr-only">{en ? "Payer bank details" : "Bančni podatki plačnika"}</legend>
        {([["name", en ? "Payer’s legal name" : "Uradni naziv plačnika", 70], ["iban", "IBAN", 50], ["bic", en ? "BIC / SWIFT (optional)" : "BIC / SWIFT (neobvezno)", 11], ["city", en ? "City" : "Mesto", 35], ["country", en ? "Country code (e.g. SI)" : "Država (npr. SI)", 2]] as const).map(([key, label, maxLength]) => <label key={key} className="min-w-0 text-sm font-medium"><span className="mb-1 block">{label}</span><input name={key} value={bank[key]} maxLength={maxLength} autoCapitalize={key === "iban" || key === "bic" || key === "country" ? "characters" : "words"} spellCheck={false} onChange={e => { setSaved(false); setBank(value => ({ ...value, [key]: e.target.value })); }} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-transparent px-3 py-2" /></label>)}
        <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">{en ? "Enter the account from which this company pays, not the supplier’s account. Supplier details are read from each invoice. Clear the IBAN to remove the saved account." : "Vnesite račun, s katerega to podjetje plačuje. Podatki dobavitelja se preberejo iz posameznega računa. Za odstranitev shranjenega računa izpraznite IBAN."}</p>
        <button type="submit" className="min-h-11 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{loading ? (en ? "Loading…" : "Nalaganje…") : busy ? (en ? "Saving…" : "Shranjujem…") : (en ? "Save bank details" : "Shrani bančne podatke")}</button>
      </fieldset>
    </form>
    {saved ? <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{en ? "Saved. These details will prefill future SEPA exports." : "Shranjeno. Podatki se bodo samodejno izpolnili pri naslednjem SEPA izvozu."}</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
  </section>;
}
