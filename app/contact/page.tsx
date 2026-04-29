"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("sent");
      } else {
        setError(json.error ?? "Napaka pri pošiljanju.");
        setStatus("error");
      }
    } catch {
      setError("Napaka pri pošiljanju. Poskusite znova.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-3">Kontakt</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Pišite nam
          </h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* Company info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🧾</div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">Invoice Picture</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">Sport Group d.o.o.</div>
                </div>
              </div>

              <div className="flex flex-col gap-5 text-sm">
                <ContactRow icon="🏢" label="Podjetje">
                  Sport Group d.o.o.
                </ContactRow>
                <ContactRow icon="📧" label="Email">
                  <a href="mailto:info@futurecode.si" className="text-blue-600 dark:text-blue-400 hover:underline">
                    info@futurecode.si
                  </a>
                </ContactRow>
                <ContactRow icon="🌐" label="Spletna stran">
                  <a href="https://futurecode.si" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    futurecode.si
                  </a>
                </ContactRow>
                <ContactRow icon="📞" label="Telefon">
                  <a href="tel:+38641580250" className="text-blue-600 dark:text-blue-400 hover:underline">
                    041 580 250
                  </a>
                </ContactRow>
                <ContactRow icon="⏰" label="Povprečni odzivni čas">
                  ~ 2 uri
                </ContactRow>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              <strong className="block mb-2 text-gray-900 dark:text-white">Tehnična podpora</strong>
              Za vprašanja glede nastavitev, integracije z računovodskim programom ali težav pri pošiljanju nam opišite situacijo — pomagamo pri vsem.
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {status === "sent" ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-10 text-center flex flex-col items-center gap-5">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-3xl">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sporočilo poslano!</h2>
                <p className="text-gray-500 dark:text-slate-400">Odgovorimo v enem delovnem dnevu.</p>
                <Link href="/" className="mt-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm">
                  ← Nazaj na začetek
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Ime in priimek *">
                    <input
                      type="text"
                      required
                      placeholder="Janez Novak"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </Field>
                  <Field label="Email naslov *">
                    <input
                      type="email"
                      required
                      placeholder="janez@podjetje.si"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </Field>
                </div>

                <Field label="Podjetje">
                  <input
                    type="text"
                    placeholder="Vaše podjetje d.o.o."
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </Field>

                <Field label="Sporočilo *">
                  <textarea
                    required
                    rows={5}
                    placeholder="Opišite vprašanje ali zahtevo..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </Field>

                {status === "error" && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Pošiljam...
                    </>
                  ) : (
                    "📨 Pošlji sporočilo"
                  )}
                </button>

                <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                  Z oddajo obrazca soglašate z obdelavo osebnih podatkov za namen odgovora na vaše vprašanje.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ContactRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</div>
        <div className="text-gray-700 dark:text-slate-300 font-medium">{children}</div>
      </div>
    </div>
  );
}
