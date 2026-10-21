"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { paymentIbanError } from "@/lib/invoice-intelligence/iban";

type PaymentInvoice = {
  supplier: Record<string, string | null>; buyer: Record<string, string | null>;
  totals: Record<string, string | null>; paymentReference: string | null;
  dueDate: string | null; currency: string | null;
};
export function SepaPaymentExport({ documentId, invoice, ready, onEditRecipient }: { documentId: number; invoice: PaymentInvoice; ready: boolean; onEditRecipient?: () => void }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Ljubljana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [payer, setPayer] = useState(() => ({ name: invoice.buyer.name || "", iban: "", bic: "", city: invoice.buyer.city || "", country: invoice.buyer.countryCode || "SI", executionDate: invoice.dueDate && invoice.dueDate > today ? invoice.dueDate : today }));
  const [loadingPayer, setLoadingPayer] = useState(true);
  const [company, setCompany] = useState<{ id: number; name: string } | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recipientIbanError = paymentIbanError(invoice.supplier.iban, "prejemnika");
  const payerIbanError = loadingPayer ? null : paymentIbanError(payer.iban, "plačnika");
  useEffect(() => {
    let active = true;
    fetch(`/api/invoice-reader/${documentId}/sepa`, { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error("Bančnih podatkov podjetja ni mogoče naložiti. Vnesite jih ročno ali osvežite stran.");
      if (!active) return;
      setCompany(data.companyId ? { id: data.companyId, name: data.companyName } : null);
      if (data.bank) { setPayer(value => ({ ...value, ...data.bank })); setPrefilled(true); setConfirmed(false); }
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Podatkov plačnika ni mogoče naložiti."); }).finally(() => { if (active) setLoadingPayer(false); });
    return () => { active = false; };
  }, [documentId]);
  async function download() {
    if (!ready || loadingPayer || !confirmed || recipientIbanError || payerIbanError) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/invoice-reader/${documentId}/sepa`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payer, confirmed }) });
      if (!res.ok) { const body = await res.json(); throw new Error(body.error || "Izvoz ni uspel."); }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = `SEPA-${documentId}.xml`; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Izvoz ni uspel."); }
    finally { setBusy(false); }
  }
  return <details id="sepa-payment-export" className="scroll-mt-6 rounded-2xl border border-blue-200 bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-white">
    <summary className="cursor-pointer text-lg font-extrabold">SEPA plačilo · izvoz za banko</summary>
    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Prenesite plačilni nalog XML (pain.001.001.09) in ga uvozite v banko, ki podpira ta format. Plačilo potrdite v banki; izvoz računa ne označi kot plačanega.</p>
    <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
      {[["Prejemnik", invoice.supplier.name], ["IBAN prejemnika", invoice.supplier.iban], ["Mesto / država", [invoice.supplier.city, invoice.supplier.countryCode].filter(Boolean).join(" / ")], ["Preostalo za plačilo", `${invoice.totals.amountDue ?? "—"} ${invoice.currency ?? ""}`], ["Sklic", invoice.paymentReference || "Brez sklica: namen bo številka računa"], ["Rok plačila", invoice.dueDate]].map(([label, value]) => <div key={label} className="grid gap-1 sm:grid-cols-2"><dt className="text-slate-500">{label}</dt><dd className="break-words font-semibold">{value || "Manjka — dopolnite podatke računa"}</dd></div>)}
    </dl>
    {recipientIbanError ? <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">{recipientIbanError}</p><p className="mt-2">IBAN prejemnika je bančni račun dobavitelja {invoice.supplier.name || "na računu"}. Če na izvirniku ni naveden, ga pridobite neposredno od dobavitelja.</p>{onEditRecipient ? <button type="button" onClick={onEditRecipient} className="mt-3 min-h-10 rounded-lg border border-amber-400 bg-white px-3 py-2 font-bold">Dopolni IBAN dobavitelja</button> : null}</div> : null}
    <p className="mt-3 text-xs text-slate-500">SI/RF sklic prepišite v celoti, vključno z modelom. Sklic brez predpone SI ali RF se prenese kot nestrukturirana informacija. Manjkajoče podatke prejemnika popravite zgoraj in račun znova potrdite.</p>
    {!ready ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pred izvozom shranite spremembe in potrdite podatke računa.</p> : null}
    <p role="status" className="mt-4 text-sm text-blue-700 dark:text-blue-300">{loadingPayer ? "Nalaganje bančnih podatkov podjetja…" : prefilled ? `Izpolnjeno iz shranjenih bančnih podatkov: ${company?.name}. Podatke pred izvozom preverite.` : company ? "Bančni račun za to podjetje še ni shranjen. Podatke lahko vnesete spodaj." : "Račun ni povezan s podjetjem. Podatke plačnika vnesite spodaj."} {company ? <a href={`/settings/company/${company.id}#bank-account`} className="font-bold underline">Uredi bančne podatke</a> : <a href="/settings" className="font-bold underline">Nastavitve podjetij</a>}</p>
    <fieldset disabled={!ready || busy || loadingPayer} className="mt-4 space-y-4 disabled:opacity-60">
      <legend className="font-bold">Plačnik</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {([ ["name", "Naziv plačnika", "text"], ["iban", "Vaš IBAN", "text"], ["bic", "BIC / SWIFT (neobvezno)", "text"], ["city", "Mesto plačnika", "text"], ["country", "Država (npr. SI)", "text"], ["executionDate", "Datum izvršitve", "date"] ] as const).map(([key,label,type]) => <label key={key} className="min-w-0 text-sm"><span className="mb-1 block">{label}</span><input type={type} value={payer[key]} min={type === "date" ? today : undefined} maxLength={key === "country" ? 2 : key === "bic" ? 11 : key === "city" ? 35 : 70} onChange={e => { setError(null); setConfirmed(false); setPayer(p => ({...p, [key]: e.target.value})); }} className="w-full min-w-0 rounded-lg border border-slate-300 bg-transparent px-3 py-2" /></label>)}
      </div>
      {payerIbanError ? <p role="alert" className="text-sm font-semibold text-red-600">{payerIbanError}</p> : null}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={Boolean(recipientIbanError || payerIbanError)} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>Primerjal sem prejemnika, IBAN, preostali znesek, sklic in datum z izvirnim računom ter preveril podatke plačnika.</span></label>
      <button type="button" disabled={!confirmed || busy || Boolean(recipientIbanError || payerIbanError)} onClick={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}Prenesi SEPA XML</button>
    </fieldset>
    {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
  </details>;
}
