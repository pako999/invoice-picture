# Invoice Intelligence release checklist

- [x] Existing send/email flow preserved
- [x] Additive database migration only
- [x] Non-interactive `drizzle-kit migrate` used in builds
- [x] Strict normalized invoice schema
- [x] Structured XML before OCR
- [x] Factur-X/ZUGFeRD hybrid PDF XML before OCR (including best-effort FlateDecode)
- [x] PDF text layer before OCR
- [x] Mistral primary reader with configurable model
- [x] Optional Azure prebuilt-invoice fallback
- [x] Decimal-safe BigInt financial validation
- [x] VAT, IBAN, dates, amount due, line items and discounts validated
- [x] Duplicate detection
- [x] Confidence-based auto approval
- [x] Durable asynchronous queue + exponential retry
- [x] Backfill uploaded documents after OCR provider enablement
- [x] Review queue and detailed review interface
- [x] Correction history and supplier mappings
- [x] OCR attempt and audit history
- [x] Short-lived tenant-bound signed file URLs
- [x] File size/type/PDF checks and active-content rejection
- [x] Distributed tenant upload rate limit
- [x] Automatic retention and secure deletion path
- [x] Clerk user deletion purges OCR data
- [x] Approved JSON/CSV export
- [x] GDPR metadata export
- [x] Admin processing/cost/quality statistics
- [x] Ground-truth evaluation harness
- [x] TypeScript CI
- [x] Deterministic invoice tests
- [x] Hybrid Factur-X/ZUGFeRD test
- [x] Vercel preview production build

## Production secrets required

The code deliberately does not contain or generate provider credentials. Before live OCR can run, Vercel Production must contain `MISTRAL_API_KEY`. `DOCUMENT_URL_SIGNING_SECRET` and `CRON_SECRET` must also be strong secrets. Azure credentials are optional.

## Integration verification still dependent on external credentials/fixtures

The following cannot be truthfully marked as measured without real anonymized fixtures and/or provider credentials:

- OCR accuracy on rotated mobile photos
- OCR accuracy on real scanned invoices
- real Mistral provider extraction quality/cost
- real Azure fallback quality/cost
- end-to-end Clerk cross-tenant tests with separate authenticated test users
- false-approval rate on a representative ground-truth dataset

Use `pnpm eval:invoice -- ./evaluation-fixtures` after preparing verified anonymized invoice/ground-truth pairs.
