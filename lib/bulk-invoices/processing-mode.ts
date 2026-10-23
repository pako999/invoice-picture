/** Small uploads need latency; large packages retain the discounted Batch API.
 * Existing provider batch IDs always take precedence over this policy.
 */
export function useRealtimeBulkProcessing(pageCount: number) {
  const configured = Number(process.env.MISTRAL_BULK_REALTIME_MAX_PAGES ?? 50);
  const limit = Number.isInteger(configured) && configured >= 0 && configured <= 500 ? configured : 50;
  return Number.isInteger(pageCount) && pageCount > 0 && pageCount <= limit;
}
