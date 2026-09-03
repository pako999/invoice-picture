import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { isCurrentUserAdmin } from "@/lib/admin";
import { getResend } from "@/lib/resend";

const schema = z.object({
  email: z.string().trim().email().max(320),
  plan: z.enum(["basic", "pro"]),
  billing: z.enum(["monthly", "yearly"]),
});

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
    const result = await client.users.getUserList({ emailAddress: [data.email], limit: 10 });
    const user = result.data.find((candidate) =>
      candidate.emailAddresses.some((item) => item.emailAddress.toLowerCase() === data.email.toLowerCase()),
    );

    if (!user) {
      return NextResponse.json({ error: "Uporabnik s tem e-poštnim naslovom ni registriran." }, { status: 404 });
    }

    const now = new Date();
    const currentPeriodEnd = addBillingPeriod(now, data.billing);
    await getDb().insert(subscriptions).values({
      clerkUserId: user.id,
      plan: data.plan,
      trialEndsAt: now,
      currentPeriodEnd,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: subscriptions.clerkUserId,
      set: {
        plan: data.plan,
        currentPeriodEnd,
        updatedAt: now,
      },
    });

    const emailResult = await getResend().emails.send({
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      to: data.email,
      subject: "Vaš paket Slikaj Račun je aktiviran",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a"><h1>Paket je aktiviran</h1><p>Vaš paket <strong>${data.plan === "pro" ? "PRO" : "Osnovni"}</strong> je aktiviran in ga lahko takoj uporabljate.</p><p><a href="https://www.posljiracun.si/scan" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Odpri Slikaj Račun</a></p></div>`,
    });

    return NextResponse.json({
      success: true,
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
