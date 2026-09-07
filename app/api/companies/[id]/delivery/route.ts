import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/schema";
import { getCompanyDeliverySettings, saveCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";

const schema = z.object({
  mode: z.enum(["email_ocr", "api_json", "xml_email"]),
  apiEndpoint: z.string().max(2048).nullable().optional(),
  apiBearerToken: z.string().max(4096).nullable().optional(),
  clearApiToken: z.boolean().optional(),
  xmlFormat: z.enum(["ubl_2_1", "eslog_2_0_original"]).optional(),
});

async function ownedCompany(id: number, userId: string) {
  const [company] = await getDb().select({ id: companies.id, name: companies.name, recipientEmail: companies.recipientEmail })
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.clerkUserId, userId)))
    .limit(1);
  return company;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid company id" }, { status: 400 });
  const company = await ownedCompany(id, userId);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const delivery = await getCompanyDeliverySettings(id, userId);
  return NextResponse.json({ company, delivery }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid company id" }, { status: 400 });
  const company = await ownedCompany(id, userId);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const data = schema.parse(await req.json());
    const delivery = await saveCompanyDeliverySettings({ companyId: id, clerkUserId: userId, ...data });
    return NextResponse.json({ company, delivery }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid delivery settings" : error instanceof Error ? error.message : "Could not save delivery settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
