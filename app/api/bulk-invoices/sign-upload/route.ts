import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { BULK_PDF_GATEWAY_URL, BULK_PDF_MAX_BYTES } from "@/lib/bulk-invoices/config";

const schema = z.object({
  filename: z.string().min(1).max(255),
  byteSize: z.number().int().positive().max(BULK_PDF_MAX_BYTES),
  mimeType: z.literal("application/pdf").default("application/pdf"),
});

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = schema.parse(await req.json());
    const token = await getToken();
    if (!token) return NextResponse.json({ error: "Seja je potekla." }, { status: 401 });

    const attempts = [
      { filename: input.filename, byteSize: input.byteSize, mimeType: input.mimeType },
      { filename: input.filename, size: input.byteSize, contentType: input.mimeType },
    ];

    let lastStatus = 502;
    let lastBody: Record<string, any> = {};

    for (const body of attempts) {
      const response = await fetch(`${BULK_PDF_GATEWAY_URL}/sign-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const json = await response.json().catch(() => ({})) as Record<string, any>;
      lastStatus = response.status;
      lastBody = json;

      if (response.ok) {
        const url = json.url ?? json.uploadUrl;
        const objectKey = json.objectKey ?? json.key;
        if (typeof url !== "string" || typeof objectKey !== "string") {
          return NextResponse.json({ error: "Storage gateway ni vrnil veljavnega upload URL-ja." }, { status: 502 });
        }
        return NextResponse.json({
          success: true,
          url,
          objectKey,
          method: typeof json.method === "string" ? json.method : "PUT",
          headers: json.headers && typeof json.headers === "object" ? json.headers : { "Content-Type": "application/pdf" },
        }, { headers: { "Cache-Control": "no-store" } });
      }

      if (response.status !== 400 && response.status !== 422) break;
    }

    return NextResponse.json({
      error: String(lastBody.error ?? lastBody.message ?? "Bulk storage upload ni na voljo."),
    }, { status: lastStatus >= 400 ? lastStatus : 502 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Priprava bulk uploada ni uspela.",
    }, { status: 400 });
  }
}
