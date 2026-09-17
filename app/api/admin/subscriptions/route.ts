import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getResend } from "@/lib/resend";
import { brandedEmail } from "@/lib/email-template";
import { baseSubscriptionPlan, setCommercialPlanEntitlement } from "@/lib/plan-entitlements";
import { planLabel, type PaidPlan } from "@/lib/plans";

const schema = z.object({
  email: z.string().trim().email().max(320).optional(),
  userId: z.string().trim().min(1).max(255).optional(),
  plan: z.enum(["basic", "pro", "accounting_pro", "accounting_max"]),
  billing: z.enum(["monthly", "yearly"]),
}).refine((data) => data.email || data.userId, { message: "E-pošta ali uporabnik je obvezen." });

function addBillingPeriod(from: Date, billing: "monthly" | "yearly") {
  const result = new Date(from);
  if (billing === "yearly") result.setUTCFullYear(result.getUTCFullYear() + 1);
  else result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}

export async function POST(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());
    const client = await clerkClient();
    const user = data.userId
      ? await client.users.getUser(data.userId).catch(() => null)
      : (await client.users.getUserList({ emailAddress: [data.email!], limit: 10 })).data.find((candidate) =>
          candidate.emailAddresses.some((item) => item.emailAddress.toLowerCase() === data.email!.toLowerCase()),
        );

    if (!user) {
      return NextResponse.json({ error: "Uporabnik s tem e-poštnim naslovom ni registriran." }, { status: 404 });
    }

    const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Uporabnik nima e-poštnega naslova." }, { status: 400 });
    }

    const now = new Date();
    const db = getDb();
    const [existing] = await db.select().from(subscriptions)
      .where(eq(subscriptions.clerkUserId, user.id)).limit(1);
    const extensionBase = existing?.currentPeriodEnd && existing.currentPeriodEnd > now
      ? existing.currentPeriodEnd
      : now;
    const currentPeriodEnd = addBillingPeriod(extensionBase, data.billing);
    const commercialPlan = data.plan as PaidPlan;
    const basePlan = baseSubscriptionPlan(commercialPlan);

    await db.insert(subscriptions).values({
      clerkUserId: user.id,
      plan: basePlan,
      trialEndsAt: now,
      currentPeriodEnd,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: subscriptions.clerkUserId,
      set: {
        plan: basePlan,
        currentPeriodEnd,
        updatedAt: now,
      },
    });
    await setCommercialPlanEntitlement({ clerkUserId: user.id, plan: commercialPlan, billing: data.billing, source: "admin" });

    const label = planLabel(commercialPlan);
    const emailResult = await getResend().emails.send({
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      to: email,
      subject: "Vaš paket Slikaj Račun je aktiviran",
      html: brandedEmail({
        preheader: "Vaš paket Slikaj Račun je aktiviran",
        eyebrow: "Paket je pripravljen",
        title: "Paket je aktiviran",
        introHtml: `<p style="margin:0">Vaš paket <strong>${label}</strong> je aktiviran oziroma podaljšan do <strong>${currentPeriodEnd.toLocaleDateString("sl-SI")}</strong>.</p>`,
        noticeHtml: "Vse funkcije in OCR limiti izbranega paketa so aktivni takoj.",
        cta: { label: "Odpri Slikaj Račun", url: "https://www.posljiracun.si/scan" },
      }),
    });

    return NextResponse.json({
      success: true,
      plan: commercialPlan,
      expiresAt: currentPeriodEnd.toISOString(),
      emailSent: !emailResult.error,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Preverite vnesene podatke."
      : error instanceof Error ? error.message : "Aktivacija ni uspela.";
    console.error("[admin subscription activation]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
