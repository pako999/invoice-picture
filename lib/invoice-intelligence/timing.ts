type TimingContext = Record<string, string | number | boolean | null>;

/** Operational metadata only: never log document text, credentials or URLs. */
export async function measureInvoiceStage<T>(stage: string, context: TimingContext, operation: () => PromiseLike<T>): Promise<T> {
  const started = performance.now();
  let ok = false;
  try {
    const result = await operation();
    ok = !(result instanceof Response) || result.ok;
    return result;
  } finally {
    console.info("invoice_stage_timing", { ...context, stage, ok, durationMs: Math.round(performance.now() - started) });
  }
}
