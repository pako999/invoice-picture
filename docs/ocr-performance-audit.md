# Invoice OCR performance audit

Audited 23 October 2026. Repository: `pako999/invoice-picture`, starting from `main` commit `85e8fcdaf4d41b5251625bb2ec0cd9434c84afbc`.

## Findings

Two substantial sources of avoidable latency are confirmed in the code: small multi-invoice PDF uploads went through several asynchronous provider batches, and the single-document duplicate check downloaded entire archived documents unnecessarily. Their relative contribution in production has not been measured. No production API key, database connection, representative customer invoice or production timing trace was available in this checkout.

### Full path

| Input/stage | Verified code path | Latency implications |
| --- | --- | --- |
| Image/direct invoice | `app/api/send/route.ts`, `app/api/invoice-reader/route.ts` → `enqueueInvoiceDocument` → `dispatchInvoiceProcessing` | Persists input, then immediately wakes a document-scoped durable job with Next `after`. These uploads already used real-time OCR, not Mistral Batch. |
| Chunked PDF upload | `app/api/finalize-upload/route.ts` → `lib/invoice-upload-queue.ts` | Reassembles 512 KB transport chunks, validates the PDF, persists it, enqueues OCR. Transport chunks are not OCR page splits. Upload workers already have bounded concurrency. |
| Single-document reader | `lib/invoice-intelligence/processor.ts::processInvoiceDocument` | Deterministic XML/text inspection → annotated Mistral OCR → optional Azure fallback → mappings/validation → duplicates → result persistence → separate delivery queue. Plain PDF text extraction is not sufficient to skip the annotated reader; valid structured XML can skip it. |
| Multi-invoice PDF | `app/api/bulk-invoices/register/route.ts` → `lib/bulk-invoices/dispatch.ts` → `neon/functions/bulkpdf/index.ts::drain/work` | Direct private-storage upload → page count → OCR on original PDF page ranges → boundary classification → child PDFs → structured extraction → delivery. Splits are created after classification, not before OCR. |
| Bulk continuation | `neon/functions/bulkpdf/index.ts::drain`, `app/api/internal/bulk/next/route.ts` | Provider-pending/submitted batch responses immediately end the worker invocation. The next scheduled invocation must resume it. Authenticated `/run` starts steps for 60 seconds; scheduled `/work` starts steps for 600 seconds; these are start-loop budgets, not hard total request deadlines. |
| Recovery | `vercel.json`, `app/api/cron/process-invoices/route.ts` | Single-document recovery is configured every 15 minutes. Bulk recovery is a separate Neon schedule; its README specifies once per minute, but the deployed schedule was not verified. Do not confuse these schedules. |
| UI result visibility | `components/invoice-processing-flow.tsx`, `lib/invoice-processing-flow.ts::flowPollDelay` | Read-only status requests every 2 seconds for the first 90 seconds, then 3–15 seconds. Stops while hidden/unmounted. This adds detection lag, but does not run OCR. |

### Confirmed bottlenecks and focused changes

| Finding and code reference | Change | Expected effect / tradeoff |
| --- | --- | --- |
| `app/api/internal/bulk/ocr/route.ts::POST`, `classify/route.ts::POST`, `extract/route.ts::POST`: all PDF package sizes submitted asynchronous batches. Extraction submitted just one invoice batch per worker step. | `lib/bulk-invoices/processing-mode.ts::useRealtimeBulkProcessing` selects real-time OCR, classification and extraction for packages up to 50 pages. Larger packages retain Batch API processing. Already-submitted batch IDs are always polled. | Removes provider-batch queue/scheduler waits for small packages without duplicating in-flight batches. Real-time requests lose the batch discount and use the workspace's real-time rate limits. |
| `lib/invoice-intelligence/processor.ts::detectDuplicates`: `select()` loaded every column for up to 250 prior documents, including `originalBase64` and raw OCR. Only ID, checksum and normalized JSON were used. | Explicitly selects those three columns. Matching rules and candidate limit remain unchanged. | Removes archived file/response payloads from every single-document duplicate check. Benefit grows with document sizes and archive size. |
| `lib/bulk-invoices/service.ts::ocrBulkPages`: previously unused by the active batch-only route and defaulted to one page per request. | The real-time path reads up to 25 pages from the original PDF per request; drops to one page on HTTP 429 and refunds unprocessed reserved pages. | A 32-page package can use two successful OCR requests on an adequately provisioned workspace. A lower page-rate limit can still force slower processing. `MISTRAL_BULK_OCR_PAGES_PER_REQUEST=1` remains supported. |
| `ocrBulkPages`, `mistralStructured`, `extractBulkInvoiceFromDocument`: per-attempt timeouts plus sleeps could outlast the worker's 180-second app request; annotation allowed three 180-second attempts plus source download. | Shared 150-second provider-operation retry budget. Child source download is included in its operation budget. Long `Retry-After` yields to durable recovery rather than retrying early. | Reduces overlapping requests and abandoned long retries. Database/quota/persistence time remains outside the provider budget, so this is not a whole-request deadline guarantee. |
| Bulk OCR requested paragraph blocks but only consumed markdown/tables/page confidence. | Sets `include_blocks=false` for bulk page OCR, both real-time and batch. Keeps HTML tables and page confidence. | Smaller response. Annotated single-document/reprocess readers retain block output and confidence because field evidence and approval/fallback decisions use them. Image Base64 output was already disabled. |
| `neon/functions/bulkpdf/index.ts::work`: loaded the original PDF for page counting, then downloaded and parsed it again for each split chunk of up to 20 invoices. | One invocation-local parsed-PDF cache, replaced when the source changes. | Avoids repeated download/parse within a drain. No persistent cross-user/process cache. The PDF still must be reloaded after a worker invocation ends. Requires deployment of the Neon worker source. |
| Failed OCR batches were resubmitted indefinitely; terminal extraction batch IDs were repeatedly polled. | Stops after three terminal OCR batch failures; stops on terminal extraction failure. Existing resume route can clear failed IDs and resume the correct stage. | Replaces an endless processing state with an actionable failure. Pending/running batches are not resubmitted. |
| Boundary review only considered the first page's confidence in a group. An ambiguous continuation could hide another invoice. | `lib/bulk-invoices/config.ts::buildBulkRanges` requires review when any page in the range has an uncertain/missing classification. | Preserves correctness when real-time classification uses the existing conservative fallback. May require more manual boundary reviews. |

API concurrency was deliberately not increased across invoices or OCR requests without knowing workspace request/page limits. Boundary classification is sequential across page groups because each group needs the previous page. Structured extraction remains one invoice per worker step. The largest improvement here is removing unnecessary asynchronous waits, not issuing an unbounded burst of provider calls.

## Official Mistral API comparison

Documentation checked on 23 October 2026:

- [OCR API](https://docs.mistral.ai/api/endpoint/ocr)
- [OCR processor](https://docs.mistral.ai/studio/document-processing/basic_ocr)
- [Batch OCR guidance](https://docs.mistral.ai/resources/cookbooks/mistral-ocr-batch_ocr)
- [Batch API](https://docs.mistral.ai/api/endpoint/batch)
- [OCR 4.1](https://docs.mistral.ai/models/ocr-4-1)

The verified REST formats match the docs: `POST /v1/ocr`; PDFs as `document_url` with an accessible URL or Base64 data URL; images as `image_url`; zero-based `pages`; `table_format`; optional blocks/confidence and document annotations. Batch uses `POST /v1/batch/jobs`, top-level `model`/`endpoint` and `requests: [{custom_id, body}]`, then status polling and inline outputs or output-file JSONL. No request-format rewrite was necessary.

Code defaults to `mistral-ocr-latest`; `.env.example` already names `mistral-ocr-4-1`, the current documented model. A deployed `MISTRAL_OCR_MODEL` override was not inspected. No forced model migration is included.

Mistral describes batch inference as asynchronous and suited to high throughput with lower latency sensitivity. The app's annotated schema, validation, splitting, optional second provider, persistence and delivery are additional work beyond plain OCR. The playground's actual model, options, file and timing boundary are unknown. Equivalence to playground latency is not claimed.

## Timing and reproduction

New operational logs use `invoice_stage_timing` and omit invoice text, URLs, filenames and credentials:

- Single document: queue age, scheduler lag after `availableAt`, reader duration, provider request/decode, duplicate check, result persistence and total processing.
- Upload assembly/enqueue: duration and byte count.
- Bulk: worker-step duration with job/stage, real-time OCR/classification/extraction, structured-request attempt/payload size. Batch polls record provider queue and processing durations from Mistral's `created_at`, `started_at`, `completed_at` when available. A not-yet-started batch's queue duration is a lower bound at polling time.
- Status API: `Server-Timing: invoice_status;dur=...` measures status response time. Browser network timing supplies transport/upload latency and UI polling intervals.

Nested durations overlap: do not add reader duration to its provider request duration, or worker-step time to all nested operations. Queue logs distinguish the time since original enqueue from scheduler lag; original queue age includes deliberate retry delays. Database attempt records already retain per-reader durations.

Live before/after end-to-end timings could not be measured. Deterministic tests verify a 32-page upload advances through page ranges 0–24 and 25–31 without batch submission, existing batch IDs are reused, throttled OCR advances by one page with the correct quota refund, and counting/splitting a 21-invoice package downloads/parses its source only once per invocation. These are behavioral/call-count results, not provider latency measurements.

An explicit provider-only benchmark is included:

```sh
node --env-file=.env.local --import tsx scripts/benchmark-invoice-ocr.ts /absolute/path/invoice.pdf 3
```

It makes two billable requests per run against the same file/model/options: OCR without document annotation, then the app's annotated reader, alternating order across runs. It reports actual returned model, pages, response size and elapsed time without invoice content. It excludes upload, queues, database, UI and email; it does not benchmark the playground or splitting multiple invoices.

To measure the complete app before/after:

1. Use isolated test deployments of the baseline commit and this branch, the same workspace tier/region/configuration and the same non-sensitive fixtures: one image, one multi-page invoice, and a package containing both single-page and multi-page invoices. Use a test recipient because the normal flow can send email. Avoid reusing a completed idempotency key when comparing processing.
2. Record browser upload start, accepted response, first usable `needs_review`/`approved` result, all results ready, and email completion separately. Keep the progress view visible. Repeat at least three times, alternating deployments.
3. Correlate job/document IDs with stage logs and `invoiceProcessingAttempts`. Compare medians and tail latencies. Separate provider queue wait, recovery-schedule lag and UI detection lag from OCR inference.
4. Verify exact original page coverage, multi-page grouping, line items, totals, review requirements and lack of duplicate provider jobs or emails. Record the returned provider model and all environment overrides.

## Validation and release notes

Validation: all 127 invoice tests ran (124 passed, 3 existing tests skipped); TypeScript check passed; Next production build passed with `NODE_OPTIONS=--max-old-space-size=4096`; Neon worker bundle passed; `git diff --check` passed. The default `tsx --test` command cannot create its IPC Unix socket in this environment; the same suite runs using `node --import tsx --test tests/invoice-*.test.ts`. `npm run check` is the existing TypeScript check. The Neon worker bundles with its existing `npm run build`.

The app build was invoked directly through Next rather than `npm run build`, because the package build first runs database migrations. No database migrations were applied by this audit. The first full build compiled but exhausted the default 2 GB Node heap during type validation; the second attempt passed with `NODE_OPTIONS=--max-old-space-size=4096`. A local production build does not establish a working production deployment.

Deploy app changes to activate routing/query fixes. Deploy `neon/functions/bulkpdf` separately to activate source reuse/worker timing. The source README's required Neon recovery schedule must be checked against the actual deployed schedule. No production deployment or environment changes are part of this patch.

`MISTRAL_BULK_REALTIME_MAX_PAGES=0` restores batch-only handling for new bulk stages; `50` is the default. Existing provider batch IDs still take precedence. Real-time cost can be higher than discounted Batch API processing; billing/plans/quota definitions are unchanged.

Remaining limitations: provider rate limits and real inference time; optional Azure fallback latency; serial structured extraction; per-page database writes; worker budget/100-step continuation; recovery scheduler cadence; up to 15 seconds of UI detection lag; manual boundary review; and 30-minute signed PDF URLs used by potentially 24-hour bulk batches. The last issue is a retained availability risk for long-waiting large batches, not an observed failure in this audit. Changing bulk signed-URL lifetime or switching to provider file uploads requires a separate storage/credential-lifetime check.
