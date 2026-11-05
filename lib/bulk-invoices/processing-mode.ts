/** Bulk jobs use Mistral Batch by default to absorb traffic spikes without
 * sending one realtime inference request per user. Operators can opt small
 * packages back into realtime mode by explicitly setting a positive limit.
 */
export function useRealtimeBulkProcessing(pageCount: number, preferBatch = false) {
  if (preferBatch) return false;
  const configured = Number(process.env.MISTRAL_BULK_REALTIME_MAX_PAGES ?? 0);
  const limit = Number.isInteger(configured) && configured >= 0 && configured <= 500 ? configured : 0;
  return limit > 0 && Number.isInteger(pageCount) && pageCount > 0 && pageCount <= limit;
}