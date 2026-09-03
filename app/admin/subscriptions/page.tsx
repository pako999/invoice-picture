import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin";
import { ActivationForm } from "./activation-form";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isCurrentUserAdmin())) redirect("/");
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const plan = params.plan === "pro" ? "pro" : "basic";
  const billing = params.billing === "yearly" ? "yearly" : "monthly";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Administracija</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Ročna aktivacija paketa</h1>
        <p className="mt-2 text-slate-600">Po prejetem plačilu predračuna vnesite e-pošto registrirane stranke. Paket se aktivira takoj, stranka pa prejme potrditveno sporočilo.</p>
        <ActivationForm initialEmail={email} initialPlan={plan} initialBilling={billing} />
      </div>
    </div>
  );
}
