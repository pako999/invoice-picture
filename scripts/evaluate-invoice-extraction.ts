import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { normalizedInvoiceSchema, type NormalizedInvoice } from "../lib/invoice-intelligence/types";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: pnpm eval:invoice -- <evaluation-folder>\nExpected pairs: <name>.ground-truth.json + <name>.extracted.json");
  process.exit(1);
}

const files = await readdir(dir);
const groundTruthFiles = files.filter((f) => f.endsWith(".ground-truth.json"));
if (!groundTruthFiles.length) {
  console.error("No *.ground-truth.json files found.");
  process.exit(1);
}

const critical = ["supplier.name", "supplier.vatNumber", "invoiceNumber", "issueDate", "currency", "totals.netAmount", "totals.vatAmount", "totals.grossAmount"];
let fieldCorrect = 0;
let fieldTotal = 0;
let documentCorrect = 0;
let documents = 0;
let lineTp = 0, lineFp = 0, lineFn = 0;
let autoApproved = 0, falseApproved = 0, manualReview = 0;
let totalCostMicros = 0;
const fieldStats = new Map<string, { correct: number; total: number }>();

for (const gtFile of groundTruthFiles) {
  const stem = gtFile.replace(/\.ground-truth\.json$/, "");
  const extractedFile = `${stem}.extracted.json`;
  if (!files.includes(extractedFile)) {
    console.warn(`SKIP ${stem}: missing ${extractedFile}`);
    continue;
  }
  const gtPayload = JSON.parse(await readFile(join(dir, gtFile), "utf8"));
  const outPayload = JSON.parse(await readFile(join(dir, extractedFile), "utf8"));
  const expected = normalizedInvoiceSchema.parse(gtPayload.invoice ?? gtPayload);
  const actual = normalizedInvoiceSchema.parse(outPayload.invoice ?? outPayload);
  const status = String(outPayload.status ?? actual.validationStatus ?? "needs_review");
  const costMicros = Number(outPayload.costMicros ?? 0);
  if (Number.isFinite(costMicros)) totalCostMicros += costMicros;
  documents += 1;

  const expectedFields = flatten(expected);
  const actualFields = flatten(actual);
  const keys = new Set([...Object.keys(expectedFields), ...Object.keys(actualFields)]);
  let docCriticalCorrect = true;
  for (const key of keys) {
    if (key.startsWith("lineItems") || key.startsWith("vatBreakdown") || key.startsWith("confidence") || key === "warnings") continue;
    const expectedValue = normalize(expectedFields[key]);
    const actualValue = normalize(actualFields[key]);
    if (expectedValue == null && actualValue == null) continue;
    fieldTotal += 1;
    const row = fieldStats.get(key) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (expectedValue === actualValue) { fieldCorrect += 1; row.correct += 1; }
    fieldStats.set(key, row);
  }
  for (const key of critical) if (normalize(getPath(expected, key)) !== normalize(getPath(actual, key))) docCriticalCorrect = false;
  if (docCriticalCorrect) documentCorrect += 1;

  const expectedItems = expected.lineItems.map(lineFingerprint);
  const actualItems = actual.lineItems.map(lineFingerprint);
  const remaining = [...expectedItems];
  for (const item of actualItems) {
    const idx = remaining.indexOf(item);
    if (idx >= 0) { lineTp += 1; remaining.splice(idx, 1); } else lineFp += 1;
  }
  lineFn += remaining.length;

  const auto = status === "approved" || status === "valid" || status === "auto_approved";
  if (auto) autoApproved += 1;
  else manualReview += 1;
  if (auto && !docCriticalCorrect) falseApproved += 1;
}

const precision = safeDiv(lineTp, lineTp + lineFp);
const recall = safeDiv(lineTp, lineTp + lineFn);
const report = {
  evaluatedDocuments: documents,
  fieldLevelAccuracy: safeDiv(fieldCorrect, fieldTotal),
  documentLevelCriticalAccuracy: safeDiv(documentCorrect, documents),
  lineItems: { truePositive: lineTp, falsePositive: lineFp, falseNegative: lineFn, precision, recall },
  automaticApprovalRate: safeDiv(autoApproved, documents),
  falseApprovalRate: safeDiv(falseApproved, Math.max(1, autoApproved)),
  manualReviewRate: safeDiv(manualReview, documents),
  totalCostMicros,
  costPerInvoiceMicros: documents ? Math.round(totalCostMicros / documents) : null,
  fields: [...fieldStats.entries()].map(([field, s]) => ({ field, accuracy: safeDiv(s.correct, s.total), correct: s.correct, total: s.total })).sort((a, b) => a.accuracy - b.accuracy),
};

console.log(JSON.stringify(report, null, 2));
if (falseApproved > 0) {
  console.error(`\nFAIL: ${falseApproved} falsely auto-approved document(s). False approvals are treated as a critical regression.`);
  process.exitCode = 2;
}

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (Array.isArray(value)) { value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out)); return out; }
  if (value && typeof value === "object") { for (const [key, v] of Object.entries(value as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${key}` : key, out); return out; }
  out[prefix] = value;
  return out;
}
function getPath(obj: unknown, path: string): unknown { return path.split(".").reduce<unknown>((v, k) => v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined, obj); }
function normalize(value: unknown) { if (value == null || value === "") return null; return String(value).trim().toLowerCase().replace(/\s+/g, " "); }
function lineFingerprint(item: Record<string, string | null>) { return [item.description, item.quantity, item.unitPriceNet, item.vatRate, item.netAmount, item.vatAmount, item.grossAmount].map(normalize).join("|"); }
function safeDiv(a: number, b: number) { return b ? a / b : 0; }
