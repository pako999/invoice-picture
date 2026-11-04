# Bulk PDF worker

This Neon Function owns private bulk-PDF upload/download signing and advances
the durable bulk invoice queue and document Batch results through `/work`.

Bulk jobs start through authenticated `POST /run` immediately after a user
submits a PDF. The worker advances only that job, continuing while it is active
and stopping on completion, an error, or its bounded invocation deadline. It
then calls the authenticated `/api/internal/bulk/*` routes on `posljiracun.si`
with `BULK_INTERNAL_SECRET`.

Do not configure a recurring schedule for `POST /work`: it scans queues even
when no user is working. The trigger-protected `/work` endpoint remains available
for an explicit operational run.

OCR source downloads use a document-scoped HMAC capability valid for 25 hours.
The worker streams a fresh private object read, so a 30-minute storage URL
cannot expire while Mistral waits in its 24-hour batch queue. Public callers
without a valid capability receive 403 before storage access.

Build a deployable archive with:

```sh
npm install
npm run build
zip -j bulkpdf-function.zip dist/index.mjs
```

Required custom environment variables are `APP_BASE_URL`, `BULK_BUCKET`,
`BULK_INTERNAL_SECRET`, and `CLERK_ISSUER`. Neon injects the branch-scoped S3
credentials for Object Storage.
