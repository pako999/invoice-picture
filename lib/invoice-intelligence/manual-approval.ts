const AUTOMATIC_OVERRIDE_REASON = "Ročno potrjeno kljub validacijskim napakam.";

export function resolveManualApprovalReason(reason: string | undefined, hasValidationErrors: boolean) {
  const trimmed = reason?.trim();
  if (trimmed) return trimmed;
  return hasValidationErrors ? AUTOMATIC_OVERRIDE_REASON : null;
}
