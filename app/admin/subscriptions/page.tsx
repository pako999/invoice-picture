import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { AdminDashboard } from "./dashboard";

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
  const data = await getAdminDashboardData();

  return (
    <AdminDashboard data={data} initialEmail={email} initialPlan={plan} initialBilling={billing} />
  );
}
