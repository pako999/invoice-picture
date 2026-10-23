export class ProviderRequestError extends Error {
  constructor(message: string, readonly status: number | null, readonly acceptance: "rejected" | "unknown", readonly retryAfterMs = 0, readonly attemptsExhausted = false) {
    super(message); this.name = "ProviderRequestError";
  }
  get retryable() { return !this.attemptsExhausted && this.acceptance === "rejected" && this.status === 429; }
}

export class ProviderCapacityError extends ProviderRequestError {
  constructor() { super("Mistral local capacity is busy; no provider request was sent", 429, "rejected", 1000); this.name = "ProviderCapacityError"; }
}

export function retryAfterMs(value: string | null, fallback = 2000, now = Date.now()) {
  if (!value) return fallback;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Number.isFinite(ms) && ms >= 0 ? Math.ceil(ms) : fallback;
}

export function providerResponseError(response: Response, operation: string, exhausted = false) {
  return new ProviderRequestError(`${operation} failed (${response.status})`, response.status,
    response.status >= 400 && response.status < 500 && response.status !== 408 ? "rejected" : "unknown",
    retryAfterMs(response.headers.get("Retry-After")), exhausted);
}

export function reservationWasRejected(error: unknown) {
  return error instanceof ProviderRequestError && error.acceptance === "rejected";
}

export function mayRetryProviderError(error: unknown, completedAttempts: number) {
  return error instanceof ProviderRequestError && error.retryable && completedAttempts < 2;
}
