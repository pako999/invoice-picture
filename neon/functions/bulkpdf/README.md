# Bulk PDF worker

This Neon Function owns private bulk-PDF upload/download signing and advances
the durable bulk invoice queue and document Batch results through `/work`.

The production Neon schedule must call `POST /work` once per minute. Scheduled
requests are accepted only when Neon supplies `X-Neon-Trigger-Invocation-Id`.
The worker then calls the authenticated `/api/internal/bulk/*` routes on
`posljiracun.si` with `BULK_INTERNAL_SECRET`.

OCR source downloads use a document-scoped HMAC capability valid for 25 hours.
The worker streams a fresh private object read, so a 30-minute storage URL
cannot expire while Mistral waits in its 24-hour batch queue. Public callers
without a valid capability receive 403 before storage access.

The existing one-minute schedule checks both queues in one idle SQL read. It
performs no recurring per-document polling while those queues are empty.

Build a deployable archive with:

```sh
npm install
npm run build
zip -j bulkpdf-function.zip dist/index.mjs
```

Required custom environment variables are `APP_BASE_URL`, `BULK_BUCKET`,
`BULK_INTERNAL_SECRET`, and `CLERK_ISSUER`. Neon injects the branch-scoped S3
credentials for Object Storage.
