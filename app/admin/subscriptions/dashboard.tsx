"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AdminDashboardData, AdminUserRow } from "@/lib/admin-dashboard";

type Props = {
  data: AdminDashboardData;
  initialEmail: string;
  initialPlan: "basic" | "pro";
  initialBilling: "monthly" | "yearly";
};

const planNames: Record<string, string> = {
  basic: "Osnovni", pro: "PRO", free: "Brezplačen", trial: "Preizkusni",
  expired: "Potekel", canceled: "Preklican",
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("sl-SI") : "—";
}

function StatusBadge({ user }: { user: AdminUserRow }) {
  const styles = {
    active: "bg-green-100 text-green-800",
    free: "bg-slate-100 text-slate-700",
    expired: "bg-red-100 text-red-700",
    canceled: "bg-orange-100 text-orange-800",
    trial: "bg-blue-100 text-blue-800",
  };
  const labels = { active: "Aktiven", free: "Brezplačen", expired: "Potekel", canceled: "Preklican", trial: "Preizkus" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[user.status]}`}>{labels[user.status]}</span>;
}

function UserAction({ user, onDone }: { user: AdminUserRow; onDone: (message: string) => void }) {
  const [plan, setPlan] = useState<"basic" | "pro">(user.plan === "pro" ? "pro" : "basic");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);

  async function activate() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan, billing }),
      });
      const body = await response.json() as { error?: string; expiresAt?: string };
      if (!response.ok) throw new Error(body.error ?? "Aktivacija ni uspela.");
      onDone(`${user.email}: paket je podaljšan do ${formatDate(body.expiresAt ?? null)}.`);
    } catch (error) {
      onDone(error instanceof Error ? error.message : "Aktivacija ni uspela.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-[290px] items-center gap-2">
      <select value={plan} onChange={(event) => setPlan(event.target.value as "basic" | "pro")} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs">
        <option value="basic">Osnovni</option>
        <option value="pro">PRO</option>
      </select>
      <select value={billing} onChange={(event) => setBilling(event.target.value as "monthly" | "yearly")} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs">
        <option value="monthly">+1 mesec</option>
        <option value="yearly">+1 leto</option>
      </select>
      <button onClick={() => void activate()} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? "…" : user.status === "active" ? "Podaljšaj" : "Aktiviraj"}
      </button>
    </div>
  );
}

export function AdminDashboard({ data, initialEmail, initialPlan, initialBilling }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showManual, setShowManual] = useState(Boolean(initialEmail));
  const [message, setMessage] = useState("");
  const pageSize = 25;

  const filtered = useMemo(() => data.users.filter((user) => {
    const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all"
      || (filter === "paid" && user.status === "active")
      || (filter === "free" && (user.status === "free" || user.status === "trial"))
      || (filter === "expired" && (user.status === "expired" || user.status === "canceled"))
      || user.plan === filter;
    return matchesSearch && matchesFilter;
  }), [data.users, filter, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function manualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("Aktiviram paket …");
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), plan: form.get("plan"), billing: form.get("billing") }),
      });
      const body = await response.json() as { error?: string; expiresAt?: string };
      if (!response.ok) throw new Error(body.error ?? "Aktivacija ni uspela.");
      setMessage(`Paket je aktiviran do ${formatDate(body.expiresAt ?? null)} in stranka je obveščena.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aktivacija ni uspela.");
    }
  }

  function actionDone(text: string) {
    setMessage(text);
    router.refresh();
  }

  const cards = [
    ["Uporabniki", data.stats.totalUsers, `+${data.stats.newUsersThisMonth} ta mesec`, "text-slate-900"],
    ["Aktivni paketi", data.stats.activePaid, `${data.stats.activeBasic} Osnovni · ${data.stats.activePro} PRO`, "text-green-700"],
    ["Brezplačni", data.stats.freeUsers, "brez aktivnega plačljivega paketa", "text-blue-700"],
    ["Potekli", data.stats.expiredUsers, `${data.stats.expiringSoon} poteče v 7 dneh`, "text-red-700"],
    ["Vsi poslani računi", data.stats.totalInvoices, `${data.stats.invoicesThisMonth} ta mesec`, "text-violet-700"],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Administracija</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">360° pregled uporabnikov</h1>
            <p className="mt-2 text-slate-600">Paketi, poteki, uporaba in ročno upravljanje naročnin.</p>
          </div>
          <Button onClick={() => setShowManual((value) => !value)} className="bg-blue-600 text-white hover:bg-blue-700">
            {showManual ? "Zapri ročno aktivacijo" : "+ Ročna aktivacija"}
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(([label, value, detail, color]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>

        {showManual && (
          <form onSubmit={manualSubmit} className="mt-6 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-[1fr_160px_160px_auto] sm:items-end">
            <label className="text-sm font-semibold text-slate-700">E-pošta registrirane stranke
              <input name="email" type="email" required defaultValue={initialEmail} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Paket
              <select name="plan" defaultValue={initialPlan} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="basic">Osnovni</option><option value="pro">PRO</option></select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Obdobje
              <select name="billing" defaultValue={initialBilling} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="monthly">+1 mesec</option><option value="yearly">+1 leto</option></select>
            </label>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Aktiviraj</Button>
          </form>
        )}

        {message && <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</div>}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row">
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Išči po imenu ali e-pošti …" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5" />
            <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5">
              <option value="all">Vsi uporabniki</option><option value="paid">Aktivni plačljivi</option><option value="basic">Osnovni</option><option value="pro">PRO</option><option value="free">Brezplačni</option><option value="expired">Potekli/preklicani</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Uporabnik</th><th className="px-4 py-3">Registracija</th><th className="px-4 py-3">Paket</th><th className="px-4 py-3">Poteče</th><th className="px-4 py-3">Računi</th><th className="px-4 py-3">Zadnja prijava</th><th className="px-4 py-3">Upravljanje</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4"><p className="mb-1 font-semibold">{planNames[user.plan] ?? user.plan}</p><StatusBadge user={user} /></td>
                    <td className="px-4 py-4 font-medium text-slate-700">{formatDate(user.currentPeriodEnd)}</td>
                    <td className="px-4 py-4"><strong>{user.invoiceCount}</strong><span className="block text-xs text-slate-500">{user.invoiceCountThisMonth} ta mesec</span></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.lastSignInAt)}</td>
                    <td className="px-4 py-4"><UserAction user={user} onDone={actionDone} /></td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Ni najdenih uporabnikov.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-600">
            <span>Prikazanih {visibleUsers.length} od {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Prejšnja</button>
              <span>{page} / {pages}</span>
              <button onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page === pages} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Naslednja</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
