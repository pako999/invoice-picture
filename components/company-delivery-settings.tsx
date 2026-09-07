"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DeliveryMode = "email_ocr" | "api_json" | "xml_email";
type XmlFormat = "ubl_2_1" | "eslog_2_0_original";

type Payload = {
  company: { id: number; name: string; recipientEmail: string };
  delivery: {
    mode: DeliveryMode;
    apiEndpoint: string | null;
    hasApiToken: boolean;
    xmlFormat: XmlFormat;
  };
};

export function CompanyDeliverySettings({ companyId, locale }: { companyId: number; locale: "sl" | "en" }) {
  const en = locale === "en";
  const back = en ? "/en/settings" : "/settings";
  const [data, setData] = useState<Payload | null>(null);
  const [mode, setMode] = useState<DeliveryMode>("email_ocr");
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [xmlFormat, setXmlFormat] = useState<XmlFormat>("eslog_2_0_original");
  const [clearToken, setClearToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/companies/${companyId}/delivery`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Could not load settings");
        return json as Payload;
      })
      .then((json) => {
        setData(json);
        setMode(json.delivery.mode);
        setEndpoint(json.delivery.apiEndpoint || "");
        setXmlFormat(json.delivery.mode === "xml_email" ? "eslog_2_0_original" : json.delivery.xmlFormat);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [companyId]);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    try {
      const r = await fetch(`/api/companies/${companyId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          apiEndpoint: endpoint.trim() || null,
          apiBearerToken: token.trim() || null,
          clearApiToken: clearToken,
          // XML mode now always produces an eSLOG 2.0 ZIP batch. Keep the
          // legacy value for backwards compatibility with older stored rows.
          xmlFormat: mode === "xml_email" ? "eslog_2_0_original" : xmlFormat,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Could not save settings");
      setData(json);
      setToken("");
      setClearToken(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-10"><div className="h-56 animate-pulse rounded-2xl bg-slate-100" /></main>;

  return <main className="mx-auto max-w-2xl px-4 py-10">
    <Link href={back} className="text-sm font-semibold text-blue-600 hover:underline">← {en ? "Back to settings" : "Nazaj na nastavitve"}</Link>
    <div className="mt-5">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">{en ? "Company delivery" : "Pošiljanje za podjetje"}</p>
      <h1 className="mt-1 text-3xl font-extrabold text-slate-950">{data?.company.name || (en ? "Company" : "Podjetje")}</h1>
      <p className="mt-2 text-slate-500">{en ? "Choose how invoice data is delivered to the accounting platform." : "Izberite, kako se podatki računov pošljejo v računovodski sistem."}</p>
    </div>

    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <section className="mt-6 space-y-3">
      <ModeCard active={mode === "email_ocr"} onClick={() => setMode("email_ocr")} title={en ? "OCR email · original document" : "OCR e-mail · originalni dokument"} description={en ? "Sends each original PDF/image immediately to the configured OCR email." : "Vsak originalni PDF/sliko takoj pošlje na nastavljen OCR e-mail."} icon="📧" />
      <ModeCard active={mode === "api_json"} onClick={() => setMode("api_json")} title={en ? "API JSON · structured data" : "API JSON · strukturirani podatki"} description={en ? "After OCR and approval, POSTs normalized JSON plus the original document to your HTTPS endpoint." : "Po OCR obdelavi in potrditvi pošlje normaliziran JSON ter originalni dokument na vaš HTTPS endpoint."} icon="{ }" />
      <ModeCard
        active={mode === "xml_email"}
        onClick={() => { setMode("xml_email"); setXmlFormat("eslog_2_0_original"); }}
        title={en ? "eSLOG 2.0 · batch ZIP" : "eSLOG 2.0 · paketni ZIP"}
        description={en
          ? "PDF/images are OCR-converted to eSLOG 2.0. Multiple invoices inside one PDF are separated, multi-page invoices stay together, and all XML files are sent in one ZIP."
          : "PDF/slike se z OCR pretvorijo v eSLOG 2.0. Več računov v enem PDF-ju se loči, večstranski račun ostane skupaj, vsi XML računi pa se pošljejo v enem ZIP-u."}
        icon="</>"
      />
    </section>

    {mode === "api_json" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="text-sm font-bold text-slate-900">API endpoint</label>
      <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://accounting.example.com/api/invoices" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      <p className="mt-2 text-xs text-slate-500">{en ? "HTTPS only. Local/private network addresses are blocked." : "Dovoljen je samo HTTPS. Lokalni in zasebni omrežni naslovi so blokirani."}</p>
      <label className="mt-5 block text-sm font-bold text-slate-900">Bearer token <span className="font-normal text-slate-400">({en ? "optional" : "neobvezno"})</span></label>
      <input value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="new-password" placeholder={data?.delivery.hasApiToken ? (en ? "Token already saved · enter a new one to replace it" : "Token je že shranjen · vnesite novega za zamenjavo") : "Bearer token"} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      {data?.delivery.hasApiToken && <label className="mt-3 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={clearToken} onChange={(e) => setClearToken(e.target.checked)} />{en ? "Remove saved token" : "Odstrani shranjeni token"}</label>}
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
        <strong>JSON payload:</strong> invoice fields, supplier/buyer, totals, VAT, line items, confidence/validation data and the original file as Base64. Header: <code>X-SlikajRacun-Event: invoice.approved</code>.
      </div>
    </section>}

    {mode === "xml_email" && <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h2 className="font-extrabold text-emerald-950">{en ? "Automatic eSLOG 2.0 batch conversion" : "Samodejna eSLOG 2.0 paketna pretvorba"}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-emerald-900">
        <p>✓ {en ? "One PDF can contain several different invoices — they are detected and separated automatically." : "En PDF lahko vsebuje več različnih računov — sistem jih sam zazna in loči."}</p>
        <p>✓ {en ? "A multi-page invoice remains one invoice." : "Večstranski račun ostane en račun."}</p>
        <p>✓ {en ? "Several uploaded PDFs/images are combined into one final ZIP." : "Več naloženih PDF/slik se združi v en končni ZIP."}</p>
        <p>✓ {en ? "A real original eSLOG 2.0 XML is forwarded unchanged." : "Pravi originalni eSLOG 2.0 XML se posreduje nespremenjen."}</p>
      </div>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
        {en ? "Output: one ZIP containing one eSLOG 2.0 XML file for every detected invoice." : "Izhod: en ZIP, v katerem je za vsak zaznan račun ena ločena eSLOG 2.0 XML datoteka."}
      </div>
      <p className="mt-3 text-xs text-slate-500">{en ? "The ZIP is sent to:" : "ZIP se pošlje na:"} <strong>{data?.company.recipientEmail}</strong></p>
    </section>}

    <button onClick={save} disabled={saving || (mode === "api_json" && !endpoint.trim())} className={`mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-50 ${saved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"}`}>
      {saved ? (en ? "✓ Saved" : "✓ Shranjeno") : saving ? (en ? "Saving..." : "Shranjujem...") : (en ? "Save delivery method" : "Shrani način pošiljanja")}
    </button>
  </main>;
}

function ModeCard({ active, onClick, title, description, icon }: { active: boolean; onClick: () => void; title: string; description: string; icon: string }) {
  return <button type="button" onClick={onClick} className={`w-full rounded-2xl border p-5 text-left transition ${active ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
    <div className="flex gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{icon}</div><div><div className="font-extrabold text-slate-950">{title}</div><div className="mt-1 text-sm leading-relaxed text-slate-500">{description}</div></div></div>
  </button>;
}
