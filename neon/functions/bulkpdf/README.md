# Bulk PDF worker

This Neon Function owns private bulk-PDF upload/download signing and advances
the durable bulk invoice queue through `/work`.

The production Neon schedule must call `POST /work` once per minute. Scheduled
requests are accepted only when Neon supplies `X-Neon-Trigger-Invocation-Id`.
The worker then calls the authenticated `/api/internal/bulk/*` routes on
`posljiracun.si` with `BULK_INTERNAL_SECRET`.

Build a deployable archive with:

```sh
npm install
npm run build
zip -j bulkpdf-function.zip dist/index.mjs
```

Required custom environment variables are `APP_BASE_URL`, `BULK_BUCKET`,
`BULK_INTERNAL_SECRET`, and `CLERK_ISSUER`. Neon injects the branch-scoped S3
credentials for Object Storage.
