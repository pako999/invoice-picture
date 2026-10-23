import { readFile } from "node:fs/promises";
import { readWithMistral } from "../lib/invoice-intelligence/providers";
import { mistralPagesForInput } from "../lib/invoice-intelligence/safety";

// Explicit live benchmark; each run makes two billable requests for the same file.
// No DB access or emails. Neither measurement represents Mistral's playground.
async function main() {
  const [filename, repetitions = "1"] = process.argv.slice(2);
  const runs = Number(repetitions);
  if (!filename || !Number.isInteger(runs) || runs < 1 || runs > 5) {
    throw new Error("Usage: node --env-file=.env.local --import tsx scripts/benchmark-invoice-ocr.ts /path/invoice.pdf [1-5 runs]");
  }
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY is required");
  const mimeType = /\.pdf$/i.test(filename) ? "application/pdf" : /\.png$/i.test(filename) ? "image/png" : /\.jpe?g$/i.test(filename) ? "image/jpeg" : null;
  if (!mimeType) throw new Error("Use a PDF, PNG or JPEG");
  const bytes = await readFile(filename);
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("Use a representative file up to 10 MB");
  const input = { filename, mimeType, base64: bytes.toString("base64") };
  const model = process.env.MISTRAL_OCR_MODEL || "mistral-ocr-latest";
  const pages = mistralPagesForInput(input, 500);
  const dataUrl = `data:${mimeType};base64,${input.base64}`;
  const request = {
    model, document: mimeType.startsWith("image/") ? { type: "image_url", image_url: dataUrl } : { type: "document_url", document_url: dataUrl },
    ...(pages ? { pages } : {}), include_image_base64: false, include_blocks: true,
    table_format: "html", confidence_scores_granularity: "block",
  };
  console.log(JSON.stringify({ benchmark: "provider-only", runs, model, inputBytes: bytes.length, annotationComparison: true, excludes: ["upload", "queue", "database", "UI", "email"] }));
  for (let run = 1; run <= runs; run++) {
    // Alternate order to reduce warmup/order bias. Output never includes invoice text.
    const plain = async () => {
      const started = performance.now();
      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(request), signal: AbortSignal.timeout(90_000),
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`Plain OCR HTTP ${response.status}`);
      const raw = JSON.parse(body);
      console.log(JSON.stringify({ run, mode: "ocr-without-annotation", durationMs: Math.round(performance.now() - started), actualModel: raw.model, pages: raw.usage_info?.pages_processed, responseBytes: Buffer.byteLength(body) }));
    };
    const annotated = async () => {
      const started = performance.now();
      const result = await readWithMistral(input, 500);
      console.log(JSON.stringify({ run, mode: "app-annotated-reader", durationMs: Math.round(performance.now() - started), actualModel: result.model, pages: result.pagesProcessed, responseBytes: Buffer.byteLength(JSON.stringify(result.rawResponse)) }));
    };
    for (const operation of run % 2 ? [plain, annotated] : [annotated, plain]) await operation();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Benchmark failed"); process.exitCode = 1; });
