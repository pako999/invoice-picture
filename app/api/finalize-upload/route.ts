import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { companies, invoices, userSettings } from "@/lib/schema";
import { FREE_MONTHLY_LIMIT, getStatus } from "@/lib/subscription";
import { getPlanConfig } from "@/lib/plans";
import { getCompanyDeliverySettings } from "@/lib/invoice-intelligence/delivery-settings";
import type { DeliveryMode } from "@/lib/invoice-intelligence/delivery-format";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_CHUNKS = 24;

const schema = z.object({
  uploadId: z.string().uuid(),
  totalChunks: z.number().int().min(1).max(MAX_TOTAL_CHUNKS),
  byteSize: z.number().int().positive().max(MAX_FILE_BYTES),
  subject: z.string().min(1).max(255).default("Račun"),
  filename: z.string().min(1).max(255),
  mime: z.literal("application/pdf"),
  companyId: z.number().int().positive().optional(),
  messageBody: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = schema.parse(await req.json());
    const status = await getStatus(userId);
    const cfg = getPlanConfig(status.commercialPlan);

    if (!status.canSend) {
      return NextResponse.json({
        success: false,
        error: "Paket ni aktiven. Nadgradite paket za nadaljevanje.",
        code: "subscription_required",
        plan: status.commercialPlan,
      }, { status: 402 });
    }

    if (status.isFree && status.monthlyUsage >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json({
        success: false,
        error: "Dosežena je mesečna omejitev 3 računov na brezplačnem paketu.",
        code: "free_limit_reached",
      }, { status: 403 });
    }

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const sql = neon(url);

    const existing = await sql`
      SELECT "invoiceId", "status"
      FROM "invoiceUploadJobs"
      WHERE "uploadId" = ${input.uploadId}
        AND "clerkUserId" = ${userId}
      LIMIT 1
    `;
    if (existing.length) {
      return NextResponse.json({
        success: true,
        queued: true,
        invoiceId: Number(existing[0].invoiceId),
        queueStatus: existing[0].status,
      }, { status: 202 });
    }

    const [chunkSummary] = await sql`
      SELECT
        count(*)::int AS "chunkCount",
        min("chunkIndex")::int AS "minIndex",
        max("chunkIndex")::int AS "maxIndex",
        min("totalChunks")::int AS "minTotal",
        max("totalChunks")::int AS "maxTotal",
        coalesce(sum(octet_length(decode("data", 'base64'))), 0)::bigint AS "byteSize"
      FROM "invoiceUploadChunks"
      WHERE "uploadId" = ${input.uploadId}
        AND "clerkUserId" = ${userId}
    `;

    const chunkCount = Number(chunkSummary?.chunkCount ?? 0);
    const storedBytes = Number(chunkSummary?.byteSize ?? 0);
    const complete =
      chunkCount === input.totalChunks &&
      Number(chunkSummary?.minIndex ?? -1) === 0 &&
      Number(chunkSummary?.maxIndex ?? -1) === input.totalChunks - 1 &&
      Number(chunkSummary?.minTotal ?? -1) === input.totalChunks &&
      Number(chunkSummary?.maxTotal ?? -1) === input.totalChunks;

    if (!complete) {
      return NextResponse.json({
        success: false,
        error: "Upload ni popoln. Poskusite ponovno.",
        code: "upload_incomplete",
      }, { status: 409 });
    }

    if (storedBytes !== input.byteSize || storedBytes <= 0 || storedBytes > MAX_FILE_BYTES) {
      return NextResponse.json({
        success: false,
        error: "Velikost naloženega PDF-ja se ne ujema ali presega 10 MB.",
        code: "upload_size_mismatch",
      }, { status: 400 });
    }

    const db = getDb();
    let recipientEmail: string | null | undefined;
    let deliveryMode: DeliveryMode = "email_ocr";

    if (input.companyId) {
      const [company] = await db.select().from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.clerkUserId, userId)))
        .limit(1);
      if (!company) {
        return NextResponse.json({ success: false, error: "Podjetje ni bilo najdeno." }, { status: 404 });
      }
      recipientEmail = company.recipientEmail;
      deliveryMode = (await getCompanyDeliverySettings(company.id, userId)).mode;
    } else {
      const [settings] = await db.select().from(userSettings)
        .where(eq(userSettings.clerkUserId, userId))
        .limit(1);
      recipientEmail = settings?.recipientEmail;
    }

    if (!recipientEmail) {
      return NextResponse.json({
        success: false,
        error: "V Nastavitvah določite prejemni e-mail.",
        code: "no_recipient",
      }, { status: 422 });
    }

    if (deliveryMode === "xml_email" && !cfg.structuredDelivery) {
      return NextResponse.json({
        success: false,
        error: "XML/eSLOG pošiljanje ni vključeno v vaš paket.",
        code: "feature_not_in_plan",
        upgradeUrl: "/cenik",
      }, { status: 403 });
    }
    if (deliveryMode === "api_json" && !cfg.apiDelivery) {
      return NextResponse.json({
        success: false,
        error: "JSON API pošiljanje ni vključeno v vaš paket.",
        code: "feature_not_in_plan",
        upgradeUrl: "/cenik",
      }, { status: 403 });
    }

    const filename = sanitizeFilename(input.filename);
    const [invoice] = await db.insert(invoices).values({
      clerkUserId: userId,
      recipientEmail,
      companyId: input.companyId ?? null,
      subject: input.subject,
      imageData: null,
      imageMime: input.mime,
      filename,
      status: "pending",
    }).returning({ id: invoices.id });

    try {
      await sql`
        INSERT INTO "invoiceUploadJobs" (
          "uploadId", "clerkUserId", "invoiceId", "filename", "mimeType",
          "subject", "companyId", "messageBody", "deliveryMode",
          "totalChunks", "byteSize", "status", "attempts", "availableAt",
          "createdAt", "updatedAt"
        ) VALUES (
          ${input.uploadId}, ${userId}, ${invoice.id}, ${filename}, ${input.mime},
          ${input.subject}, ${input.companyId ?? null}, ${input.messageBody ?? null}, ${deliveryMode},
          ${input.totalChunks}, ${storedBytes}, 'queued', 0, now(), now(), now()
        )
      `;
    } catch (error) {
      await db.update(invoices).set({
        status: "failed",
        errorMessage: "Upload queue could not be created",
      }).where(eq(invoices.id, invoice.id));
      throw error;
    }

    return NextResponse.json({
      success: true,
      queued: true,
      invoiceId: invoice.id,
      deliveryMode,
      message: "Dokument je sprejet in čaka na varno obdelavo.",
    }, { status: 202 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Neveljavni podatki za zaključek uploada."
      : error instanceof Error ? error.message : "Napaka pri zaključku uploada.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "invoice.pdf";
  return base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^a-zA-Z0-9._()\- čšžćđČŠŽĆĐ]/g, "_")
    .slice(0, 255);
}
