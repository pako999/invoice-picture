# Slikaj Račun

Photograph a paper invoice and send it to your accounting software's e-mail in
one click. Next.js (App Router) marketing site **and** signed-in app surface
(`/scan`, `/invoices`, `/settings`), with a tRPC API, Drizzle ORM on Neon
Postgres, Clerk auth, Resend e-mail, and App Store / Play Store subscriptions.

## Run it locally

This runs the app **as-is** on your machine, pointing at your real cloud
accounts (Neon, Clerk, Resend). No code changes — you just need the env vars.

### 1. Prerequisites

- Node.js 20+
- A package manager — this repo ships both a `package-lock.json` and a
  `pnpm-lock.yaml`; pick one and stick with it. Examples below use `npm`
  (`.npmrc` sets `legacy-peer-deps=true` for it).

### 2. Install dependencies

```bash
npm install
```

### 3. Create your local env file

Copy the template and fill in the values:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored. Required values:

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | [Neon](https://neon.tech) → project → Connection string (pooled) |
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) |
| `RESEND_FROM` | A from-address verified in Resend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk](https://clerk.com/dashboard) → API Keys |
| `CLERK_SECRET_KEY` | Clerk → API Keys |

> A free Neon database + a Clerk development instance + a Resend account are
> enough to run everything locally.

### 4. Push the database schema

The schema lives in `lib/schema.ts` (Drizzle). Create the tables in your Neon
database:

```bash
npm run db:push
```

### 5. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. The Slovenian site is at `/`, English at `/en`.
Sign in to reach the app routes (`/scan`, `/invoices`, `/settings`) — these are
protected by Clerk middleware.

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | `drizzle-kit push` then `next build` |
| `npm run start` | Serve the production build |
| `npm run check` | TypeScript type-check (`tsc --noEmit`) |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run grant-pro` | Grant a user the PRO plan (`tsx scripts/grant-pro.ts`) |

## Notes

- **Webhooks & subscriptions** (Clerk, Google Play, Apple IAP, Paddle, the
  daily cron) call out to or are called by external services. They aren't
  needed to develop the UI locally; to exercise them you'd tunnel
  (e.g. `ngrok`) the relevant `/api/*` route to the provider.
- The app is Slovenian-first; English lives under `/en` with translated slugs
  (see `lib/i18n/config.ts`).
