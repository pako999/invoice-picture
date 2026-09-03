import { clerkClient } from "@clerk/nextjs/server";
import { count, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { invoices, subscriptions } from "@/lib/schema";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  plan: string;
  status: "active" | "free" | "expired" | "canceled" | "trial";
  currentPeriodEnd: string | null;
  invoiceCount: number;
  invoiceCountThisMonth: number;
};

export type AdminDashboardData = {
  users: AdminUserRow[];
  stats: {
    totalUsers: number;
    newUsersThisMonth: number;
    activePaid: number;
    activeBasic: number;
    activePro: number;
    freeUsers: number;
    expiredUsers: number;
    expiringSoon: number;
    totalInvoices: number;
    invoicesThisMonth: number;
  };
};

async function getAllUsers() {
  const client = await clerkClient();
  const users = [];
  const limit = 500;
  let offset = 0;

  while (true) {
    const page = await client.users.getUserList({ limit, offset, orderBy: "-created_at" });
    users.push(...page.data);
    offset += page.data.length;
    if (page.data.length < limit || offset >= page.totalCount) break;
  }
  return users;
}

function statusFor(plan: string, periodEnd: Date | null, trialEnd: Date | null): AdminUserRow["status"] {
  const now = Date.now();
  if ((plan === "basic" || plan === "pro") && periodEnd && periodEnd.getTime() > now) return "active";
  if (plan === "basic" || plan === "pro" || plan === "expired") return "expired";
  if (plan === "canceled") return "canceled";
  if (plan === "trial" && trialEnd && trialEnd.getTime() > now) return "trial";
  return "free";
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const db = getDb();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [clerkUsers, subscriptionRows, allInvoiceCounts, monthlyInvoiceCounts, totalResult, monthlyResult] = await Promise.all([
    getAllUsers(),
    db.select().from(subscriptions),
    db.select({ clerkUserId: invoices.clerkUserId, value: count() }).from(invoices).groupBy(invoices.clerkUserId),
    db.select({ clerkUserId: invoices.clerkUserId, value: count() }).from(invoices)
      .where(gte(invoices.createdAt, startOfMonth)).groupBy(invoices.clerkUserId),
    db.select({ value: count() }).from(invoices),
    db.select({ value: count() }).from(invoices).where(gte(invoices.createdAt, startOfMonth)),
  ]);

  const subscriptionMap = new Map(subscriptionRows.map((row) => [row.clerkUserId, row]));
  const invoiceMap = new Map(allInvoiceCounts.map((row) => [row.clerkUserId, Number(row.value)]));
  const monthlyInvoiceMap = new Map(monthlyInvoiceCounts.map((row) => [row.clerkUserId, Number(row.value)]));

  const users: AdminUserRow[] = clerkUsers.map((user) => {
    const subscription = subscriptionMap.get(user.id);
    const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?? user.emailAddresses[0];
    const plan = subscription?.plan ?? "free";
    return {
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Brez imena",
      email: primary?.emailAddress ?? "Brez e-pošte",
      createdAt: new Date(user.createdAt).toISOString(),
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      plan,
      status: statusFor(plan, subscription?.currentPeriodEnd ?? null, subscription?.trialEndsAt ?? null),
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
      invoiceCount: invoiceMap.get(user.id) ?? 0,
      invoiceCountThisMonth: monthlyInvoiceMap.get(user.id) ?? 0,
    };
  });

  const activeUsers = users.filter((user) => user.status === "active");
  const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return {
    users,
    stats: {
      totalUsers: users.length,
      newUsersThisMonth: users.filter((user) => new Date(user.createdAt) >= startOfMonth).length,
      activePaid: activeUsers.length,
      activeBasic: activeUsers.filter((user) => user.plan === "basic").length,
      activePro: activeUsers.filter((user) => user.plan === "pro").length,
      freeUsers: users.filter((user) => user.status === "free" || user.status === "trial").length,
      expiredUsers: users.filter((user) => user.status === "expired" || user.status === "canceled").length,
      expiringSoon: activeUsers.filter((user) => {
        const end = user.currentPeriodEnd ? new Date(user.currentPeriodEnd).getTime() : 0;
        return end > Date.now() && end <= sevenDays;
      }).length,
      totalInvoices: Number(totalResult[0]?.value ?? 0),
      invoicesThisMonth: Number(monthlyResult[0]?.value ?? 0),
    },
  };
}
