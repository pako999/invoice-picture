import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { workspaceAuth } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { companyBankProfile, companyBankProfileSchema } from "@/lib/company-bank-profile";

const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: Context) {
  const { userId } = await workspaceAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const [company] = await getDb().select().from(companies).where(and(eq(companies.id, id), eq(companies.clerkUserId, userId))).limit(1);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ companyId: id, companyName: company.name, bank: companyBankProfile(company) }, { headers });
}
export async function PUT(req: NextRequest, { params }: Context) {
  const { userId } = await workspaceAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const result = companyBankProfileSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Preverite bančne podatke." }, { status: 400 });
  const bank = result.data;
  const [company] = await getDb().update(companies).set({ bankPayerName: bank.name || null, bankIban: bank.iban || null, bankBic: bank.bic || null, bankCity: bank.city || null, bankCountry: bank.country })
    .where(and(eq(companies.id, id), eq(companies.clerkUserId, userId))).returning();
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ companyId: id, companyName: company.name, bank: companyBankProfile(company) }, { headers });
}
