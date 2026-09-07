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
  const [xmlFormat, setXmlFormat] = useState<XmlFormat>("ubl_2_1");
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
        setXmlFormat(json.delivery.xmlFormat);
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
          xmlFormat,
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
      <p className="mt-2 text-slate-500">{en ? "Choose how approved invoice data is delivered to the accounting platform." : "Izberite, kako se potrjeni podatki računa pošljejo v računovodski sistem."}</p>
    </div>

    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <section className="mt-6 space-y-3">
      <ModeCard active={mode === "email_ocr"} onClick={() => setMode("email_ocr")} title={en ? "OCR email · original document" : "OCR e-mail · originalni dokument"} description={en ? "Sends the original PDF/image immediately to the configured OCR email. Best for Minimax, Birokrat, Pantheon and similar email-import workflows." : "Originalni PDF/sliko takoj pošlje na nastavljen OCR e-mail. Primerno za Minimax, Birokrat, Pantheon in podobne email uvoze."} icon="📧" />
      <ModeCard active={mode === "api_json"} onClick={() => setMode("api_json")} title={en ? "API JSON · structured data" : "API JSON · strukturirani podatki"} description={en ? "After OCR and approval, POSTs normalized JSON plus the original document as Base64 to your HTTPS endpoint." : "Po OCR obdelavi in potrditvi pošlje normaliziran JSON ter originalni dokument kot Base64 na vaš HTTPS endpoint."} icon="{ }" />
      <ModeCard active={mode === "xml_email"} onClick={() => setMode("xml_email")} title={en ? "XML email · UBL/eSLOG" : "XML e-mail · UBL/eSLOG"} description={en ? "After approval, sends structured XML by email. OCR-derived documents can be generated as UBL 2.1; original eSLOG 2.0 XML can be forwarded unchanged." : "Po potrditvi pošlje strukturiran XML po e-mailu. Iz OCR podatkov ustvarimo UBL 2.1; originalni eSLOG 2.0 XML lahko posredujemo nespremenjen."} icon="</>" />
    </section>

    {mode === "api_json" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="text-sm font-bold text-slate-900">API endpoint</label>
      <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://accounting.example.com/api/invoices" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      <p className="mt-2 text-xs text-slate-500">{en ? "HTTPS only. Local/private network addresses are blocked." : "Dovoljen je samo HTTPS. Lokalni in zasebni omrežni naslovi so blokirani."}</p>
      <label className="mt-5 block text-sm font-bold text-slate-900">Bearer token <span className="font-normal text-slate-400">({en ? "optional" : "neobvezno"})</span></label>
      <input value={token} onChange={(e) => setToken(e.target.value)} type="password" autoComplete="new-password" placeholder={data?.delivery.hasApiToken ? (en ? "Token already saved · enter a new one to replace it" : "Token je že shranjen · vnesite novega za zamenjavo") : "Bearer token"} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      {data?.delivery.hasApiToken && <label className="mt-3 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={clearToken} onChange={(e) => setClearToken(e.target.checked)} />{en ? "Remove saved token" : "Odstrani shranjeni token"}</label>}
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
        <strong>{en ? "JSON payload:" : "JSON payload:"}</strong> invoice fields, supplier/buyer, totals, VAT, line items, confidence/validation data and the original file as Base64. Header: <code>X-SlikajRacun-Event: invoice.approved</code>.
      </div>
    </section>}

    {mode === "xml_email" && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="text-sm font-bold text-slate-900">{en ? "XML format" : "XML format"}</label>
      <select value={xmlFormat} onChange={(e) => setXmlFormat(e.target.value as XmlFormat)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
        <option value="ubl_2_1">UBL 2.1 · {en ? "generated from approved data" : "ustvarjen iz potrjenih podatkov"}</option>
        <option value="eslog_2_0_original">eSLOG 2.0 · {en ? "forward original eSLOG XML only" : "posreduj samo originalni eSLOG XML"}</option>
      </select>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
        {en ? "We do not label OCR-generated XML as eSLOG 2.0 unless it is a real original eSLOG document. This prevents sending a structurally invalid eSLOG file to accounting software." : "XML, ustvarjen iz OCR podatkov, ne označimo kot eSLOG 2.0, če ni pravi originalni eSLOG dokument. Tako ne pošljemo računovodskemu programu strukturno neveljavnega eSLOG-a."}
      </div>
      <p className="mt-3 text-xs text-slate-500">{en ? "XML is sent to the company's configured email:" : "XML se pošlje na nastavljen e-mail podjetja:"} <strong>{data?.company.recipientEmail}</strong></p>
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
