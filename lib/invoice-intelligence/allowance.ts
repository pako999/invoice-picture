/** Document counts remain telemetry on paid plans; only OCR pages consume their allowance. */
export function ocrAllowanceUsage(input: {
  monthlyDocumentLimit: number | null;
  monthlyPageLimit: number;
  monthDocuments: number;
  monthPages: number;
}) {
  const { monthlyDocumentLimit, monthlyPageLimit, monthDocuments, monthPages } = input;
  const documentPercent = monthlyDocumentLimit === null ? 0 : percent(monthDocuments, monthlyDocumentLimit);
  const pagePercent = percent(monthPages, monthlyPageLimit);
  const usagePercent = Math.max(documentPercent, pagePercent);
  const warningLevel = usagePercent >= 100 ? "blocked" : usagePercent >= 95 ? "critical" : usagePercent >= 80 ? "warning" : "ok";
  return {
    documentPercent, pagePercent, usagePercent, warningLevel,
    remainingDocuments: monthlyDocumentLimit === null ? null : Math.max(0, monthlyDocumentLimit - monthDocuments),
    remainingPages: Math.max(0, monthlyPageLimit - monthPages),
  } as const;
}

export function hasOcrDocumentCapacity(limit: number | null, used: number, requested = 1) {
  return limit === null || used + requested <= limit;
}

function percent(used: number, limit: number) {
  return limit <= 0 ? 100 : Math.min(100, used / limit * 100);
}
