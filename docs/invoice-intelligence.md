# SlikajRačun Invoice Intelligence

## Existing flow before this upgrade

The production application already used:

1. Clerk for authentication.
2. `/scan` for phone/photo/PDF capture and company selection.
3. `/api/send` to validate subscription state, resolve the company's OCR/import email, persist an `invoices` archive row and send the original attachment through Resend.
4. Neon PostgreSQL + Drizzle for subscriptions, settings, companies and sent-invoice history.
5. `/invoices` for the archive of sent documents.

The existing send flow is intentionally preserved. Invoice reading is an additional asynchronous pipeline; a reader outage does not block delivery to the accounting email.

## Implementation plan / architecture

### Ingestion

Every supported source document is stored privately in `invoiceDocuments`, checksummed with SHA-256 and assigned a deterministic idempotency key. Existing `/api/send` automatically enqueues its copy after the legacy archive row is created. A dedicated `/api/invoice-reader` upload endpoint is also available for reader-only ingestion.

Accepted server-side MIME types are PDF, JPEG, PNG, WebP, HEIC/HEIF and XML. The existing browser scan UI remains backward-compatible with its current photo/PDF workflow. HEIC conversion is not done unsafely in the browser; providers receive the original supported file when used through the reader API.

### Reader priority

1. **Structured data first** — XML/e-invoice data is parsed before OCR where visible to the application.
2. **Usable PDF text layer** — a deterministic text-layer reader is attempted before OCR.
3. **Mistral OCR** — primary OCR/document reader with strict JSON Schema annotations.
4. **Azure Document Intelligence `prebuilt-invoice`** — optional fallback only when Mistral fails, critical confidence is low, or validation conflicts.

Provider results are never blindly field-merged. When both providers return results, the processor compares complete candidates using deterministic validation, critical-field completeness and confidence. Material disagreement sends the document to manual review.

### Normalization and validation

All financial values are stored as decimal strings. Validation converts decimal strings to scaled `BigInt` values, so invoice arithmetic never relies on JavaScript floating-point math.

Validation includes:

- net + VAT = gross
- VAT breakdown reconciliation
- line-item sums
- amount-due logic
- ISO currency check
- date normalization/order
- IBAN MOD-97
- country-aware VAT-number formatting
- supplier/buyer reversal heuristic
- credit-note sign warning
- duplicate checks by SHA-256 and supplier VAT + invoice number + issue date + gross total + currency

Default monetary tolerance: `0.02`, configurable by `INVOICE_MONETARY_TOLERANCE`.

### Automatic approval

A document is automatically approved only if:

- required accounting fields are present
- deterministic validation is valid
- no duplicate match exists
- all critical fields meet `INVOICE_CONFIDENCE_THRESHOLD` (default `0.92`)
- there is no provider conflict

Critical fields: supplier name, supplier VAT number, invoice number, issue date, currency, net amount, VAT amount and gross amount.

Structured XML can be auto-approved without model confidence when deterministic validation passes. Anything uncertain becomes `needs_review`.

### Durable asynchronous worker

`invoiceProcessingJobs` is a database-backed durable queue. `/api/cron/process-invoices` runs every minute on Vercel and processes a small configurable batch. Jobs are unique per document, locked before work, retried with exponential backoff and capped attempts.

States are exactly:

- `uploaded`
- `queued`
- `processing`
- `needs_review`
- `approved`
- `failed`

The browser request is never kept open while OCR is running.

### Manual review

`/invoice-review` shows the queue and processing statistics. `/invoice-review/[id]` provides:

- original private PDF/image on the left
- extracted fields on the right
- field confidence
- page/bounding-box evidence where returned by the provider
- validation warnings and differences
- duplicate warning
- approve/edit/reject/reprocess
- previous/next navigation
- keyboard shortcuts (`Cmd/Ctrl+S`, `Alt+A`, `Alt+←/→`)
- mobile-responsive layout

Every correction stores old value, new value, Clerk user ID, timestamp and optional reason. Reusable supplier mappings are stored for recurring supplier-specific corrections.

### Security / privacy

- Source bytes are never exposed in list APIs.
- Original documents are served only after Clerk authorization, tenant ownership validation and a short-lived HMAC signature.
- File responses use `private, no-store`, `nosniff` and sandboxed content-security headers.
- Filenames are sanitized server-side.
- MIME, size and PDF magic bytes are validated.
- API keys are server-only environment variables.
- Application logs must not include OCR document text or raw invoice content.
- Clerk `user.deleted` removes all invoice-reader data, supplier mappings and audit logs for that user.
- `INVOICE_RETENTION_DAYS` creates an automatic retention deadline; the cron worker purges expired private documents.
- View/edit/download/export/delete/reprocess actions generate audit events.

The current private storage implementation uses encrypted-at-rest Neon PostgreSQL because that is the project's existing data infrastructure. For very high document volume, move `originalBase64` to private object storage and keep only an object key in Postgres; the API contract and signed route can stay unchanged.

## Database additions

Additive tables only:

- `invoiceDocuments`
- `invoiceLineItems`
- `invoiceVatBreakdown`
- `invoiceFieldEvidence`
- `invoiceValidationResults`
- `invoiceProcessingAttempts`
- `invoiceProcessingJobs`
- `invoiceCorrections`
- `supplierMappings`
- `invoiceDuplicateRelations`
- `invoiceAuditLogs`

No existing production table is renamed or deleted.

## Required production environment variables

Primary:

```text
MISTRAL_API_KEY
MISTRAL_OCR_MODEL=mistral-ocr-latest
INVOICE_CONFIDENCE_THRESHOLD=0.92
INVOICE_MONETARY_TOLERANCE=0.02
INVOICE_OCR_TIMEOUT_MS=90000
INVOICE_CRON_BATCH_SIZE=3
INVOICE_RETENTION_DAYS=365
DOCUMENT_URL_SIGNING_SECRET=<random 32+ bytes>
CRON_SECRET=<random 32+ bytes>
```

Optional Azure fallback:

```text
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
AZURE_DOCUMENT_INTELLIGENCE_KEY
AZURE_DOCUMENT_INTELLIGENCE_MODEL=prebuilt-invoice
AZURE_DOCUMENT_INTELLIGENCE_API_VERSION=2024-11-30
```

Cost tracking:

```text
MISTRAL_ANNOTATED_PAGE_COST_MICROS=5000
AZURE_PAGE_COST_MICROS=0
```

Set cost values to the actual provider/contract price before relying on monthly cost projections.

## Production enablement

1. Add environment variables in Vercel Production and Preview environments.
2. Deploy the additive Drizzle schema and confirm `/api/health` reports `invoiceReaderTables: true`.
3. Confirm `CRON_SECRET` is configured so `/api/cron/process-invoices` is authorized by Vercel Cron.
4. Test with synthetic/anonymized invoices first.
5. Run `pnpm test:invoice`.
6. Run `pnpm check`.
7. Run the production build.
8. For measured quality, prepare ground-truth pairs and run:

```bash
pnpm eval:invoice -- ./evaluation-fixtures
```

Ground-truth format:

```text
invoice-001.ground-truth.json
invoice-001.extracted.json
```

The evaluation command reports field-level accuracy, critical document-level accuracy, line-item precision/recall, automatic approval rate, false approval rate, manual review rate and cost per invoice. A false automatic approval exits with a non-zero status because false approvals are considered more serious than manual review.

## Known limitations

- Generic PDF text extraction intentionally handles only a safe/simple text-layer subset; complex PDFs fall through to OCR.
- Embedded Factur-X/ZUGFeRD XML is detected only when the XML is directly visible in the PDF byte stream. Fully compressed/encoded PDF attachments may require a dedicated PDF attachment parser in a future iteration.
- Bounding-box formats differ by provider. Image highlighting is best-effort; PDF review currently relies on page evidence plus the native PDF viewer rather than pixel-perfect overlay coordinates.
- HEIC is accepted by the reader API but is not converted in-browser; provider support/normalization should be verified with real anonymized HEIC samples.
- Rotated-photo quality, real duplicate isolation and full Clerk tenant-route tests require anonymized integration fixtures/test credentials and are explicitly not represented as passing unit tests.
- Supplier VAT-format validation covers common European country patterns and falls back to a generic EU pattern for countries without a dedicated rule.
