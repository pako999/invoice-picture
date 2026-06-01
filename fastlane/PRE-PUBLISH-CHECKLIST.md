# App Store pre-publish checklist

Checks the app's metadata against what fastlane
[`deliver` / `upload_to_app_store`](https://docs.fastlane.tools/actions/deliver/)
uploads to App Store Connect. Values pre-filled in `fastlane/metadata/` were
pulled from this repo (`app/layout.tsx`, `lib/i18n/*`, `public/llms.txt`,
`public/site.webmanifest`). Review before submitting.

Legend: ✅ filled from repo · ⚠️ needs your input · ❌ blocker for review.

## Localized metadata (`metadata/sl`, `metadata/en-US`)

| Field | Required | Status | Notes |
| --- | --- | --- | --- |
| `name.txt` | ✅ Yes | ✅ | "Slikaj Račun" (≤ 30 chars). |
| `subtitle.txt` | No | ✅ | ≤ 30 chars — verify it fits. |
| `description.txt` | ✅ Yes | ✅ | Drafted from the home/features copy. |
| `keywords.txt` | ✅ Yes | ⚠️ | Comma-separated, **≤ 100 chars total**. Trim if over. |
| `privacy_url.txt` | ✅ Yes* | ✅ | `/zasebnost` · `/en/privacy`. Required (app has accounts + IAP). |
| `support_url.txt` | ✅ Yes | ✅ | `/pomoc-pri-nastavitvi` · `/en/setup-help`. |
| `marketing_url.txt` | No | ✅ | Site root. |
| `promotional_text.txt` | No | ✅ | Editable without a new build. |
| `release_notes.txt` | Yes for updates | ⚠️ | Placeholder "first release" — rewrite per version. |

## Global metadata

| Field | Required | Status | Notes |
| --- | --- | --- | --- |
| `copyright.txt` | Often | ✅ | "2026 Sport Group d.o.o." |
| `primary_category.txt` | ✅ Yes | ⚠️ | Set to `BUSINESS` — confirm vs `FINANCE`. |
| `secondary_category.txt` | No | ✅ | `FINANCE`. |

## App Review information (`metadata/review_information`)

| Field | Required | Status | Notes |
| --- | --- | --- | --- |
| `email_address.txt` | ✅ Yes | ✅ | info@posljiracun.si |
| `phone_number.txt` | ✅ Yes | ✅ | +386 41 580 250 |
| `first_name` / `last_name` | ✅ Yes | ⚠️ | Placeholder — use a real contact name. |
| `demo_user` / `demo_password` | ✅ Yes** | ❌ | **The app requires Clerk sign-in, so App Review needs a working demo account.** Replace the `TODO-*` placeholders or the build will be rejected. |
| `notes.txt` | No | ⚠️ | Explain the demo flow / that an accounting-program email is needed. |

\* Required by Apple whenever the app has accounts or in-app purchases.
\** Required when the app is behind a login.

## Assets — NOT in this repo, attach in App Store Connect

| Asset | Required | Notes |
| --- | --- | --- |
| App icon 1024×1024 | ✅ Yes | Only `/icon.svg` + logos exist here; export a 1024 PNG, no alpha. |
| Screenshots (6.7" + 6.5" iPhone; 5.5" if supporting older; iPad if universal) | ✅ Yes | At least one per required device size, per localization. |
| App previews (video) | No | Optional. |
| Age rating questionnaire | ✅ Yes | Set in App Store Connect (likely 4+). |
| Privacy "Nutrition Label" | ✅ Yes | Declare data collected (account email, invoice images). Match `/zasebnost`. |
| In-app purchases | ✅ Yes (you sell subs) | Create/submit the subscription products; tiers must match the app. |

## ✅ Data inconsistencies — RESOLVED

These were fixed in the codebase so the store listing won't contradict the site.
Source of truth: `TRIAL_DAYS = 7` (`lib/subscription.ts:5`) and the price
constants in `app/cenik/page.tsx` / `app/upgrade/page.tsx`.

1. **Trial length → 7 days everywhere.** The stray **14-day** copy in the hero
   trust-badge and final CTA (`lib/i18n/sl.ts`, `en.ts`) now reads **7-day**,
   matching `/cenik` and `TRIAL_DAYS`. The unused key `heroTrust14Day` was
   renamed to `heroTrust7Day`.
2. **Prices → 6,99 € / 17,99 €.** The stale **6,90 / 17,90** values in
   `public/llms.txt` and `public/llms-full.txt` (incl. yearly totals and the
   FAQ/positioning lines) now match the real subscription tiers.
3. **FAQ trial answer.** `llms-full.txt` previously claimed there is no free
   trial ("Trenutno ne"); updated to reflect the 7-day trial.
4. **Contact email.** Site/JSON-LD consistently use `info@posljiracun.si`
   (also used in `review_information/email_address.txt`). Left as-is — confirm
   it's the address you want on the listing, since your account email differs.
