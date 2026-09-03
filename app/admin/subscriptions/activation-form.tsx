"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  initialEmail: string;
  initialPlan: "basic" | "pro";
  initialBilling: "monthly" | "yearly";
};

export function ActivationForm({ initialEmail, initialPlan, initialBilling }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          plan: form.get("plan"),
          billing: form.get("billing"),
        }),
      });
      const body = await response.json() as { error?: string; expiresAt?: string; emailSent?: boolean };
      if (!response.ok) throw new Error(body.error ?? "Aktivacija ni uspela.");
      const until = body.expiresAt ? new Date(body.expiresAt).toLocaleDateString("sl-SI") : "";
      setMessage({ ok: true, text: `Paket je aktiviran do ${until}.${body.emailSent ? " Stranka je prejela e-pošto." : " E-pošte ni bilo mogoče poslati."}` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Aktivacija ni uspela." });
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-slate-700">
        E-pošta registrirane stranke
        <input name="email" type="email" required defaultValue={initialEmail} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Paket
          <select name="plan" defaultValue={initialPlan} className={field}>
            <option value="basic">Osnovni</option>
            <option value="pro">PRO</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Obdobje
          <select name="billing" defaultValue={initialBilling} className={field}>
            <option value="monthly">1 mesec</option>
            <option value="yearly">1 leto</option>
          </select>
        </label>
      </div>
      {message && <p className={`rounded-xl p-3 text-sm font-medium ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{message.text}</p>}
      <Button type="submit" disabled={busy} className="w-full bg-blue-600 text-white hover:bg-blue-700">
        {busy ? "Aktiviram …" : "Aktiviraj paket in obvesti stranko"}
      </Button>
    </form>
  );
}
