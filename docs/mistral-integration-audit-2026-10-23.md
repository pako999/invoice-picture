# Mistral integration audit — correctness, latency and cost

Audit date: 23 October 2026. Production/code baseline: `1eef3c91b80b83e11f374a29ba3fa5baf8fad9f9`. References below use line numbers at that baseline, before tracing insertions. Only the Phase 2 tracing implementation is changed; all other fixes are proposals.

## Verified result and limits of attribution

Production deployment `dpl_9iL2JgZQoPaaeepa1yWWwL166YoX` was READY on that commit. Its latest measured test was document 231 at 05:24 Europe/Ljubljana (03:24 UTC). Database and runtime logs agree on one PDF page, 83,720 input bytes, two extracted line items, one successful Mistral attempt, no Azure attempt, and no retry. The account email could not be independently joined to this document; do not describe the account identity as verified.

| Measurement | Observed duration |
| --- | ---: |
| Queue wait before claim | 243 ms |
| Deterministic reader operation | 13 ms |
| Mistral annotated request, through response headers | 13,711 ms |
| Response body consumption and JSON decoding | 6 ms |
| Entire Mistral reader including local reconciliation/evidence | 13,736 ms |
| Duplicate check | 657 ms |
| Result persistence | 854 ms |
| Entire processing function | 16,879 ms |
| Source-invoice creation to usable result persistence, database timestamps | 17,323 ms |

Nested measurements overlap: do not sum the Mistral reader and its request/decode components. The 13,717 ms provider HTTP operation accounts for approximately 81% of processing. Approximately 3,162 ms remains inside the processing function, including required database, quota, validation and bookkeeping work. The reported browser-visible ~20 seconds has not been independently measured from the browser; file preparation, request admission, polling and rendering are outside the processing-function timer.

**Attribution: the observed delay is dominated by the Mistral HTTP round-trip for our annotated request, rather than our queue or JSON parser. This is not proof of a Mistral service defect.** The request asks for OCR plus a full invoice annotation; network transfer, provider queueing, OCR and annotation generation are not separately exposed by these logs. No verified 1–4 seconds/page SLA was found in the official sources inspected. A comparable plain-OCR versus annotated-OCR test is required before assigning the remaining provider-side delay to a fault or promising a faster number.

## Corrections to the supplied reference facts

1. Base64 is an encoding, not a literal `document.type="base64"` in the current OCR REST schema. A PDF data URL belongs in `document: {type:"document_url",document_url:"data:application/pdf;base64,..."}`; an image data URL belongs in `image_url`. Uploaded-file inputs are also supported. Our current PDF/image encoding is valid.
2. Batch `endpoint` must be a supported path such as `"/v1/ocr"` or `"/v1/chat/completions"`, not `"1"`.
3. JSONL is an option, not a requirement for a small batch. Official guidance supports inline `requests:[{custom_id,body}]` as well as file batching. Our inline shape is valid.
4. Batch receives a 50% inference discount and does not consume real-time rate limits. It is still subject to batch service limits, asynchronous scheduling and workspace access/billing requirements. It is not unlimited or guaranteed to complete immediately.
5. Concurrency 5–10 is a workload/tier-dependent target, not an unconditional API requirement. A synchronous provider request is compatible with a durable application job and responsive progress UI. Keeping a browser request open until OCR finishes would not make the same inference faster.

Primary sources checked: [OCR API](https://docs.mistral.ai/api/endpoint/ocr), [OCR processor](https://docs.mistral.ai/studio/document-processing/basic_ocr), [Batch API](https://docs.mistral.ai/api/endpoint/batch), [Batch OCR cookbook](https://docs.mistral.ai/resources/cookbooks/mistral-ocr-batch_ocr), [known limits](https://docs.mistral.ai/resources/known-limitations), [OCR 4.1 model/pricing](https://docs.mistral.ai/models/ocr-4-1), [Node fetch](https://nodejs.org/api/globals.html#fetch), [Vercel payload limits](https://vercel.com/docs/functions/limitations).

## Phase 1 — discovery

### Full pipeline

| Stage | Paths and behavior |
| --- | --- |
| Intake and file read | `app/scan/page.tsx:28–46,213–266`, English equivalent `app/en/scan/page.tsx`. PDFs are read to estimate page count; single-page PDFs are read again as a data URL. Images are decoded through an Image/canvas. The outer selected-files loop awaits each file's admission. |
| Preprocessing | `app/scan/page.tsx:49–72`: JPEG at quality 0.8, longest edge at most 1600 pixels. This is a pixel limit, not a measured 300 DPI policy. PDF contents are not rasterized/downsampled. `lib/invoice-intelligence/queue.ts:10–13` decodes and hashes; `providers.ts:19–77` tries structured XML, embedded XML, then limited PDF text parsing. |
| Inline upload | `app/scan/page.tsx:233–244` → `app/api/send/route.ts:19–26`; direct-reader API is `app/api/invoice-reader/route.ts:13`. Base64 JSON is validated and persisted. A single-page PDF up to 10 MB can take this route. |
| Private storage upload | Multi-page, unknown-page-count or >10 MB PDF → `lib/client-pdf-upload.ts:10–66` → `app/api/bulk-invoices/sign-upload/route.ts` → Neon `/sign-upload` → direct browser storage PUT → `app/api/bulk-invoices/register/route.ts`. No Mistral file upload is used. |
| Older chunked intake | `app/api/upload-chunk/route.ts`, `app/api/finalize-upload/route.ts`, `lib/invoice-upload-queue.ts:28–167`: retrieve chunks, assemble/validate bytes, persist original, enqueue reader. These are transport chunks, not OCR page splitting. |
| Interactive scheduling | `queue.ts:10–44` → `lib/invoice-intelligence/dispatch.ts:6–14` → `processor.ts:202–321`. Durable job, immediately woken through Next `after`; compare-and-set claim avoids two workers claiming the same job. Cron in `vercel.json` is a 15-minute recovery path, not the normal start mechanism. |
| Interactive OCR and extraction | `processor.ts:48–154` → `providers.ts:80–165`. Valid structured XML can avoid OCR; ordinary PDF text does not bypass Mistral merely because the local parser found some fields. Mistral reads the document and returns a document annotation in one request. Optional Azure can add a second provider attempt if configured and the primary result is missing/low-confidence/invalid. |
| Parsing and persistence | `providers.ts:133–165,426,715–742`, `types.ts`, `validation.ts`, `processor.ts:155–197,361–418`. Parse annotation, normalize values, reconcile tables/receipt amounts, build confidence evidence, apply mappings, validate, check duplicates, write detail tables and usable document status, then audit/delivery queue. |
| Bulk OCR and grouping | `neon/functions/bulkpdf/index.ts:116–238` → `app/api/internal/bulk/{page-count,ocr,classify,ranges,split-complete,extract}/route.ts`. Up to 50-page packages use real-time services; larger ones use Batch. Original-PDF OCR ranges are at most 25 pages, falling to one page after 429. Classification uses page text with prior-page context; child PDFs are created only after grouping. |
| Bulk structured extraction | `service.ts:314–318,441–486`, `app/api/internal/bulk/extract/route.ts:45–140`. Normal extraction reuses existing OCR markdown through a separate chat schema request, one invoice per worker step. Stored batch IDs are polled rather than replaced. Document OCR is a fallback for unusable markdown or explicitly forced reprocessing. |
| Bulk continuation and delivery | Worker `/run` starts steps for 60 seconds; scheduled `/work` for 600 seconds, both at most 100 steps. A submitted/pending batch yields until another invocation. Separate private-PDF delivery and structured delivery are in `app/api/internal/bulk/deliver-email/route.ts` and `lib/invoice-intelligence/delivery.ts`. Deployed Neon trigger cadence was not verified. |
| Response to user | `components/invoice-processing-flow.tsx:36–85`, `lib/invoice-processing-flow.ts:66–67`, `app/api/invoice-processing/status/route.ts`: poll every 2 seconds initially, then 3–15 seconds after 90 seconds. Hidden/unmounted views stop polling. The result is usable at `needs_review`/`approved`, which is separate from email completion. |

### Every Mistral HTTP call site

All production requests use the process/runtime's native `fetch`; there is no Mistral SDK client created per request, no explicit `Connection: close`, and no custom dispatcher in this code. Default Node fetch pooling is expected within a warm runtime; actual TCP/TLS reuse was not measured across serverless invocations. No production caller uses Mistral uploaded document files; `/files/.../content` below downloads batch results.

`OCR_MODEL` below means `MISTRAL_OCR_MODEL || "mistral-ocr-latest"`. The observed production request used the alias. `CLASSIFIER_MODEL` means `MISTRAL_BULK_CLASSIFIER_MODEL || "mistral-small-latest"`; `EXTRACT_MODEL` similarly uses `MISTRAL_BULK_EXTRACT_MODEL`. Their deployed overrides were not decrypted/verified.

| Caller at baseline | Endpoint and model | Input / payload | HTTP attempts, timeout, concurrency |
| --- | --- | --- | --- |
| `providers.ts:94`, `readWithMistral` | POST `/v1/ocr`; OCR_MODEL | PDF `document_url` or image `image_url`, both Base64 data URLs. Observed original 83,720 B → 111,628 Base64 characters; response 16,505 B. Schema alone is 4,091 B; VAT prompt alone is 1,697 B. No population-wide typical size measured. | One immediate attempt, 90 s default; durable job can run four times. One request per document job; multiple jobs can overlap without a global 5–10 pool. |
| `service.ts:63`, `ocrBulkPages` | POST `/v1/ocr`; OCR_MODEL | Signed original-PDF URL, zero-based page range; no inline file bytes. Actual source size unavailable in this helper. HTML tables and page confidence; no blocks/images Base64. | Up to three attempts, 90 s default per attempt inside 150 s total operation budget. Serial page ranges; 25 pages/request default, one after 429. Outer stage permits further deferred retries. |
| `service.ts:156`, `createMistralOcrBatch` | POST `/v1/batch/jobs`; top-level OCR_MODEL, `endpoint:"/v1/ocr"` | One inline request containing a signed original-PDF URL/page range. No JSONL or input Base64. Batch timeout 24 h. | One HTTP submission, 90 s timeout. One stored in-flight OCR batch per job; many jobs may coexist. |
| `service.ts:208`, `pollMistralOcrBatch` | GET `/v1/batch/jobs/{id}?inline=true`; no model/input document | Batch status/optional inline outputs. No file payload. | One HTTP read, 60 s; repeated only through worker continuation. |
| `service.ts:234`, OCR output-file branch | GET `/v1/files/{output_file}/content`; no model | JSONL result download if inline outputs absent. Response size variable/unmeasured. | One HTTP read, 90 s; serial with status read. |
| `service.ts:563`, `extractBulkInvoiceFromDocument` | POST `/v1/ocr`; OCR_MODEL | Downloads child PDF first, validates it, converts to Base64 `document_url` and requests annotation. Child sizes not sampled. | Up to three attempts; per-attempt at most 90 s within a 150 s operation budget including the source download. One child per extract step. |
| `service.ts:605`, `mistralStructured` for classification | POST `/v1/chat/completions`; CLASSIFIER_MODEL | Text/schema only. At most 5,000 characters per supplied page, plus at most 3,500 of previous-page context. Typical payload not measured. | Up to three attempts, 90 s per attempt inside 150 s budget. Sequential classification windows preserve prior-page context. |
| Same fetch, `mistralStructured` for extraction | POST `/v1/chat/completions`; EXTRACT_MODEL | OCR markdown up to 120,000 characters, prompts and invoice schema; no file Base64. | Same retry/time budget; one invoice per worker step, not a 5–10 extraction pool. |
| `service.ts:596`, `createMistralStructuredBatch` | POST `/v1/batch/jobs`; CLASSIFIER_MODEL or EXTRACT_MODEL, `endpoint:"/v1/chat/completions"` | One inline structured request; no input JSONL file. | One HTTP submission, 90 s; batch timeout 24 h. Extraction submits one invoice batch at a time. |
| `service.ts:597`, structured poll | GET `/v1/batch/jobs/{id}?inline=true`; no model | Status and inline output. | One HTTP read, 60 s. |
| Same function, structured output-file branch | GET `/v1/files/{output_file}/content`; no model | JSONL output fallback. | One HTTP read, 90 s. |
| `scripts/benchmark-invoice-ocr.ts:33` | POST `/v1/ocr`; OCR_MODEL | Offline explicit benchmark, same Base64 document/options, no annotation in this branch. Paired annotated request calls `readWithMistral`. | One attempt each, 90 s. Sequential alternating order, 1–5 runs; not a production upload path. |

### Structured invoice fields

- Interactive: Document AI annotation with the full `normalized_invoice` JSON schema, then Zod parsing, deterministic reconciliation and validation. No separate Mistral chat request in the measured test.
- XML/embedded XML: deterministic parsing first; only a valid structured result is accepted as the fast path.
- Multi-invoice packages: OCR text → boundary classifier → split → structured chat extraction using stored text. This extra work is necessary with the current single-invoice annotation schema; simply deleting it would break invoice splitting/extraction.
- Real-time extraction 429 can return an explicitly warned deterministic fallback requiring review. Classification outages use conservative boundaries requiring review for uncertainty. Neither fallback is equivalent to a successful full AI extraction.

## Phase 2 — tracing-only patch

The patch adds `lib/invoice-intelligence/trace.ts`, browser correlation in `lib/client-invoice-trace.ts`, targeted call-site wrappers and tests. It changes no endpoint, model, request body, timeout, retry, concurrency, image processing rule, database statement content, approval rule, UI polling schedule or delivery policy.

Enable server/worker traces with `INVOICE_OCR_TRACE=1`. Enable browser traces with build-time `NEXT_PUBLIC_INVOICE_OCR_TRACE=1`. Both default to `0`; existing operational `invoice_stage_timing` logs are preserved. Deploying worker source separately is required for its tracing. No production flags were changed while collecting the existing measurements.

Every new event is one JSON string with exactly `{stage,input_bytes,ms,notes}`. Example format, not a new production sample:

```json
{"stage":"ocr_ttfb","input_bytes":83720,"ms":13711,"notes":{"operation":"annotated_ocr","boundary":"response_headers_received","http_status":200}}
```

| Stage | Measurement boundary |
| --- | --- |
| `file_read` | Browser PDF/FileReader; server JSON intake; stored upload chunks; worker object download; child PDF response reads. Unknown byte sizes are `null`, not guessed. |
| `preprocess` | Existing page-count decoding, image compression, Base64 decode, chunk assembly, PDF loading and child splitting. |
| `upload` | Browser app admission through response headers; private storage PUT including its existing retries; worker child PUT. Notes distinguish these operations. |
| `ocr_ttfb` | Start of the existing OCR fetch until response headers are available. Includes outbound request upload, network and provider wait; it is not an internal model-compute timer or an exact first-response-body-byte measurement. |
| `ocr_total` | Same start until body consumption/JSON decoding completes. Does not clone or read the body twice. |
| `parse` | Deterministic reader, annotation schema validation/reconciliation/evidence, structured chat-content parsing. JSON transport decoding remains inside `ocr_total`. |
| `db_write` | Processing-job enqueue and result persistence, with separate operations for detail tables and usable document status. Existing audit/timing logs cover broader bookkeeping. |
| `end_to_end` | Browser: upload start → first usable result observed by polling. Server: document creation → usable result persistence, explicitly excluding pre-creation browser upload. These are different boundaries and are labelled. |

Batch submission/poll/result downloads and chat requests use `mistral_http_ttfb` / `mistral_http_total` rather than falsely labelling a status poll as OCR inference. Browser events remain in the browser console; server events remain in runtime logs. Correlate document/job IDs with existing request-scoped logs. No content, filename, signed URL, header, key or provider error text is logged by this instrumentation. Logging failure never replaces application success/error. Disabled tracing makes no additional HTTP calls and adds no extra response read.

Measurement plan: enable tracing only for a short controlled window; use the same non-sensitive one-page PDF, one multi-page invoice, ten documents, and a bulk package; record model/tier/options, repeat at least three times, and alternate configurations. Compare medians/tails and validate fields/line items/totals. For the provider-only comparison use the existing benchmark script, remembering that its two calls/run are billable and exclude app upload/DB/UI. Preserve a complete invoice-extraction path when evaluating plain OCR: a plain-text-only result is not equivalent to a ready invoice.

Reproducible provider-only timing test (requires a local API credential and incurs two billable calls per run):

```bash
INVOICE_OCR_TRACE=1 MISTRAL_OCR_MODEL=mistral-ocr-4-1 node --env-file=.env.local --import tsx scripts/benchmark-invoice-ocr.ts /absolute/path/to/representative-invoice.pdf 3
```

Do not paste credentials into logs or commit `.env.local`. For app timing, set the server flag, build with the public flag, upload that identical document and capture the existing status polls plus browser `end_to_end` and server stage events. No representative before/after live run of the tracing patch was possible here: the local checkout has no usable live provider credential, and this patch deliberately changes no inference behavior. Existing production measurements above are the baseline, not a claimed speedup.

## Phase 3 — findings

FINDING 1: The dominant measured delay is an annotated OCR round-trip, not plain OCR
Severity: major
Evidence: `lib/invoice-intelligence/providers.ts:94–130`, `processor.ts:90`; document 231 recorded 13,711 ms to response headers, 6 ms to consume/decode, 16,879 ms total processing. One page, 83,720 B, one provider attempt.
Why it's wrong: The production workflow is being compared with an unverified playground workflow. The app requests a large invoice schema, prompt, blocks and block confidence in addition to OCR. This is a comparison/measurement defect, not evidence that the valid annotation API is misused or that Mistral violated a latency guarantee.
Fix: Collect the new `ocr_ttfb`/`ocr_total`/`parse` events; run `scripts/benchmark-invoice-ocr.ts` on the identical file/model/options. Compare annotated OCR against plain OCR plus the complete proposed extraction path. Only then change `readWithMistral` options/schema with invoice-quality regressions.
Expected impact: No promised speedup from tracing. At most the measured ~13,717 ms provider component is the optimization target; the saving from any alternative is currently unknown.

FINDING 2: Production OCR uses a floating model alias
Severity: major
Evidence: `providers.ts:83`, `service.ts:51,147,537`, `processor.ts:90`; production log and stored model for document 231 are `mistral-ocr-latest`. `.env.example` naming `mistral-ocr-4-1` does not establish the deployed setting.
Why it's wrong: Results, cost and latency can change when an alias moves. It makes comparisons hard to reproduce. Pinning is an operational recommendation, not an OCR schema requirement.
Fix: After a representative validation set, set production `MISTRAL_OCR_MODEL=mistral-ocr-4-1` and replace OCR fallback literals in `providers.ts` and `service.ts` with the same validated version. Pin classifier/extractor models separately after checking their current supported snapshot names. Do not infer that the alias response proves which snapshot ran.
Expected impact: Approximately 0 ms direct saving claimed; prevents unreviewed model changes and makes benchmarks reproducible. Not applied in this patch.

FINDING 3: Inline upload limits allow payloads larger than Vercel accepts
Severity: major
Evidence: `app/scan/page.tsx:25,233–241`, English equivalent, `app/api/send/route.ts:16–20`: a one-page PDF up to 10 MB can be Base64 JSON. Vercel documents a 4.5 MB function-body limit. The observed 83,720 B PDF is small and is not this failure case.
Why it's wrong: Base64 adds approximately one third before JSON overhead. A valid 4 MB source can exceed the platform limit before application validation runs. Large inline transport can also add upload latency. The small measured payload is justified; blanket conversion to URLs is not a proven fix for its 13.7 seconds.
Fix: Route PDFs over a conservative 2.5 MB inline-source threshold through the existing signed storage upload; calculate/check serialized wire size before sending. Enforce a matching limit for direct JSON clients or offer the same storage path. Keep small Base64 inputs where appropriate.
Expected impact: Prevents 413 failures for oversized JSON; avoids roughly 33% encoding overhead for rerouted sources. Millisecond savings for the 84 KB test are unmeasured and likely not dominant. Not applied.

FINDING 4: Multi-file admission has no explicit bounded provider concurrency policy
Severity: major
Evidence: `app/scan/page.tsx:225–266` and English counterpart await each file; `processor.ts:216` processes recovery jobs serially; `app/api/internal/bulk/extract/route.ts:45–47` clamps extraction to one invoice. Independent `after` callbacks can nevertheless overlap across requests.
Why it's wrong: The implementation has neither a predictable 5–10 provider pool for ten documents nor an organization-wide provider limiter. Serial admission can slow a batch, while overlapping callbacks can still cause 429. It is incorrect to claim every OCR request is serialized or that ten documents necessarily take 10 × 20 seconds.
Fix: Replace the outer admission loop with a bounded worker pool initially sized from verified organization limits; preserve per-file statuses and stop/cancellation behavior. Centralize provider admission across jobs before increasing concurrency; separate upload concurrency from inference concurrency. Apply the same control to bulk extraction only after measurement.
Expected impact: For ten files and admission time A, ideal admission falls from approximately 10A to 2A at concurrency five; this is a model, not a measured OCR speedup. Per-invoice inference latency may remain unchanged. Not applied.

FINDING 5: Bulk page ranges refetch the same original PDF instead of one whole-document OCR call
Severity: minor
Evidence: `service.ts:39–57`, `app/api/internal/bulk/ocr/route.ts:35–60`, worker `index.ts:162–169`: 25-page ranges by default, one-page fallback after 429. `providers.ts:94–130` already processes a normal single invoice in one call with a page array.
Why it's wrong: The strict one-call-per-document requirement is not globally met, and range-based requests may cause repeated source download/provider overhead. The current quota/rate-limit guards are intentional; eliminating them blindly can cause failures or uncontrolled spend. There is no accidental single-page OCR loop on the measured one-page invoice.
Fix: For documents within verified API byte/page/tier limits and available quota, submit the original PDF once and use its returned page list for boundary analysis. Keep explicitly selected chunking for true size/rate/quota constraints. Update service, route limits and worker request size together; preserve original page indices and coverage tests.
Expected impact: A 32-page PDF could reduce two successful OCR calls to one, eliminating one request/source-fetch overhead. Actual milliseconds are unknown; this cannot improve the already one-call sample. Not applied.

FINDING 6: Retry limits are layered, and permanent bulk errors can remain retryable indefinitely
Severity: major
Evidence: `service.ts:62–100,563–588,603–628` permits three HTTP attempts; `schema.ts:275–276` defaults document jobs to four attempts; `processor.ts:297–306` uses exponential minutes plus 15-minute cron recovery. Bulk OCR has up to twelve rate-limit stage failures, while `internal/bulk/next/route.ts:25–49` does not cap generic-error attempts. `internal/bulk/ocr/route.ts:80–81` leaves non-quota/non-rate-limit errors in processing/ocr. `internal/bulk/release/route.ts:20–25` correctly preserves rate-limit markers; that part is not broken.
Why it's wrong: The requested ≤1 retry policy is not met end-to-end. A permanent 400/401/415 can be retried unnecessarily; ambiguous timeout retries can repeat accepted work. Repeated batch status GETs are normal polling and should not be counted as repeated billed OCR submissions.
Fix: Introduce typed provider errors/status codes and one total attempt budget across HTTP and durable-job layers. Terminalize permanent input/auth errors. Permit at most one automatic retry for retryable failures under a deadline, honour `Retry-After`, and record unknown-completion state rather than assuming a timed-out POST did no work. Keep durable job claims and stored batch IDs.
Expected impact: Removes minutes of needless recovery delay on permanent errors and limits repeated attempts/cost. There were no retries in the measured test, so its expected saving is 0 ms. Not applied.

FINDING 7: Quota reservations are not refunded for rejected known-page interactive inputs
Severity: major
Evidence: `processor.ts:89,109–114`: after reserving pages, failure releases only when `estimatedPages == null`. `safety.ts:46–103` increments user usage/cost buckets before the provider call.
Why it's wrong: A definitely rejected known-page document, such as HTTP 429, can consume internal pages/cost on every retry despite no OCR output. This is internal quota/accounting, not proof Mistral billed those failed calls. Blindly refunding an ambiguous timeout would also be incorrect.
Fix: Use the typed rejection classification from Finding 6 to refund reserved pages for known non-accepted responses regardless of whether page count was known; retain/reconcile ambiguous accepted-or-unknown work. Add regressions for a one-page 429, a successful retry and an unknown-completion timeout.
Expected impact: Prevents internal quota/cost inflation by rejected attempts; no measured successful-call latency saving. Not applied.

FINDING 8: Bulk signed URLs can expire before the provider's allowed batch window ends
Severity: major
Evidence: `neon/functions/bulkpdf/index.ts:12,163,297–299` signs downloads for 30 minutes; `service.ts:163,596` allows 24-hour provider batches.
Why it's wrong: A batch may wait until its original document URL expires. This can fail large/busy bulk workloads even though the request schema is valid. A real failure due to expiry was not observed in the one-page test.
Fix: Prefer an appropriate retained Mistral uploaded-file input for queued bulk work, with cleanup after completion. Alternatively choose a signed-URL lifetime covering the batch window only after verifying storage credential expiry and access policy; changing only the numerical expiry may be insufficient.
Expected impact: Prevents avoidable failed/resubmitted large batches and their long delays; 0 ms expected on the measured immediate small input. Not applied.

FINDING 9: Stored cost estimates omit chat work and overestimate plain real-time OCR
Severity: minor
Evidence: `safety.ts:58` defaults every Mistral reservation to 5,000 micro-units/page; `service.ts:48` uses that for plain page OCR. Batch plain OCR reserves 2,000/page at `service.ts:152`. Bulk extraction persists `processingCostMicros:null` in `internal/bulk/extract/route.ts:119`, and `mistralStructured` discards the provider usage envelope. Document 231 stores 5,000, an estimate rather than a billing receipt.
Why it's wrong: Current OCR 4.1 public reference prices are $0.004/plain page and $0.005/annotated page; discounted plain batch is $0.002/page. The plain real-time estimate is therefore 25% above that reference, while classification/extraction tokens can be missing entirely. The total account bill cannot be inferred from these page counters.
Fix: Pass a dedicated plain-page cost to `reserveOcrProviderBudget` in `ocrBulkPages`; keep the separate annotated and batch rates. Preserve chat model/usage and aggregate all OCR/classification/extraction attempts into an explicitly labelled estimate; reconcile against actual billing separately.
Expected impact: Corrects a 1,000-micro-unit/page reference overestimate for plain real-time OCR and exposes omitted token costs. It does not itself reduce Mistral charges. Removing annotation may save 20% of the OCR component but can add extraction cost, so no total saving is promised. Not applied.

FINDING 10: Image resolution is not validated as DPI across all intake paths
Severity: minor
Evidence: `app/scan/page.tsx:49–72` resizes to 1600 px; `app/api/invoice-reader/route.ts:13` and PDF paths do not enforce physical dimensions/DPI. No 600+ DPI input was demonstrated for document 231.
Why it's wrong: The literal ≤300 DPI checklist item cannot pass. Pixel dimensions do not prove physical DPI, and blindly rasterizing a digital/text PDF can make both quality and performance worse.
Fix: Inspect effective image dimensions and physical page size for scanned inputs; conditionally downsample truly oversized scans toward a validated 150–300 DPI range. Preserve vector/text PDFs and require small-text/line-item accuracy tests before changing compression.
Expected impact: Potentially smaller request/provider work for high-resolution scans; unknown milliseconds and no demonstrated saving on the small sample. Not applied.

FINDING 11: Necessary persistence and unrelated original-email sending extend different latency boundaries
Severity: minor
Evidence: `processor.ts:155–197,361–385`: duplicate check 657 ms and result persistence 854 ms in the sample. `app/api/send/route.ts:26` awaits original email delivery before returning in non-structured delivery mode, so its `after` OCR callback cannot start until that response is sent. The sample followed structured delivery; no such email delay was proven there.
Why it's wrong: The literal zero-blocking-work criterion cannot pass. Authentication, quotas and durable persistence are necessary; original-email network work is not necessary to obtain OCR results. Treating all 20 seconds as model inference hides both kinds of latency.
Fix: Measure write substeps, batch independent persistence operations transactionally where appropriate, and keep ownership/quota/duplicate checks. Move original-email work to a separate durable delivery step if product behavior permits, preserving ordering/idempotency. Do not remove persistence to make an API timer look faster.
Expected impact: The measured duplicate-plus-persistence budget is 1,511 ms, an upper bound rather than an achievable promise. Email-path saving depends on measured delivery time and is unknown for this test. Not applied.

## Phase 4 — correctness checklist

FAIL means the literal global criterion is not proven/met; it does not imply every invoice follows the failing path.

| Check | Pass/fail | Evidence |
| --- | --- | --- |
| One OCR call/document, no page loops | **FAIL globally; PASS measured interactive case** | `providers.ts:94` uses one multi-page-capable call. Bulk uses page-range continuation (`service.ts:39`), and forced child reprocessing can OCR an already-read group. One Mistral attempt for document 231. |
| Production model pinned | **FAIL** | Actual request used `mistral-ocr-latest`; `.env.example` is not runtime proof. |
| URL/upload or justified Base64 | **PASS for measured input; FAIL for full accepted range** | Small 83,720 B private PDF is valid inline input. Bulk uses signed URLs. Accepted one-page 10 MB input can exceed Vercel's 4.5 MB wire-body limit. |
| Images downscaled to ≤300 DPI | **FAIL / not verified** | 1600 px UI limit, no universal DPI measurement or server/PDF scan policy. |
| One HTTP client, keep-alive, timeout, ≤1 retry | **FAIL combined** | Native global fetch, no per-request SDK, explicit provider timeouts; actual connection reuse unmeasured. Three-attempt bulk calls/four-attempt document jobs violate the retry criterion. |
| No blocking work in OCR path | **FAIL literally** | Required quota/validation/DB work remains; original email can also delay the response/`after` callback in one delivery mode. |
| Correct volume pattern | **FAIL globally; PASS interactive provider choice** | Real-time annotated request for one invoice; bulk over 50 pages uses valid Batch API. Ten-file admission is sequential without a shared pool; 100 separate small uploads do not become one provider batch automatically. Page-count routing is not the same as document-count routing. |
| Errors surfaced, 429/5xx handled | **FAIL fully; substantial protections PASS** | Warnings, failed statuses, rate-limit cooldowns, stored batch IDs and bounded terminal batch failures exist. Generic permanent bulk errors can remain retryable; JSON `.catch(()=>({}))` obscures malformed-body diagnostics. No error/retry occurred in the sample. |
| No secrets/API keys in code | **PASS for audited tracked source** | Mistral key read from server env; no Mistral key in browser requests. Tracked-source scan found no matching literal live/test secret patterns. Dummy test keys/placeholders and a secret hash are not live credentials. This is not an audit of full Git history or external secret stores. |

## Validation

The tracer has tests for disabled pass-through, identical fetch options/response, one body consumption, separate header/total boundaries, error identity, failure-safe logging, no secret/document logging, and one browser completion event. Existing invoice correctness tests remain unchanged in their assertions; isolated-module fixtures were updated to inject their mocked transport into the added tracing module, avoiding real network calls. Validation passed: TypeScript (`npm run check`); 132 invoice tests (129 passed, 3 skipped, 0 failed); production Next build with a 4 GB Node heap; and the Neon bulk worker esbuild bundle. `git diff --check` passed. The build is invoked through Next directly because `npm run build` also runs database migrations; no migrations are part of this audit.

## Ranked TODO list — impact weighted by implementation effort

1. **Complete the controlled trace/A-B sample** — highest diagnostic impact, low effort; directly targets the observed 13.7-second request. Keep the entire extraction result comparable.
2. **Pin validated OCR and chat snapshots** — low effort, high reproducibility/correctness value; no speedup promised.
3. **Fix the inline wire-size boundary** — low effort, high reliability impact for larger one-page inputs; reuse existing storage intake.
4. **Classify errors, cap total retries and correct reservation refunds together** — medium effort, high reliability/quota impact.
5. **Make queued bulk documents available for the full batch lifetime** — medium effort, high impact on long-waiting bulk jobs.
6. **Add measured bounded provider concurrency and document-count bulk routing** — medium effort; improves multi-document throughput, not necessarily single-document latency.
7. **Reconcile plain/annotated/chat cost accounting** — low-to-medium effort; establishes honest unit economics before further architecture changes.
8. **Optimize measured DB round trips and separate original email** — medium effort; smaller ceiling than the observed provider wait.
9. **Evaluate whole-PDF bulk OCR and scan-resolution tuning** — medium effort; only where verified limits, grouping accuracy and actual oversized inputs justify it.

**Final attribution: the observed sample points primarily to the Mistral API round-trip for the annotated workload. It does not establish a provider bug or a universal 1–4 seconds/page expectation. Our own integration still chooses the annotation workload and adds roughly 3.16 seconds inside processing, plus unmeasured intake/UI time.**
