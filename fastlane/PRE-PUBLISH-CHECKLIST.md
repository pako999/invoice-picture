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

## ⚠️ Data inconsistencies found in the repo — fix before publishing

These would make the store listing contradict the site:

1. **Trial length disagrees.** Hero & final CTA say **14-day**
   (`lib/i18n/sl.ts:73`, `:129`; `en.ts:73`, `:129`), but the pricing page says
   **7-day** (`app/cenik/page.tsx:141`, `:178`) and so does
   `public/llms.txt:17`. Pick one number and make it consistent everywhere,
   then use it in the App Store description / review notes.
2. **Prices disagree.** Home pricing shows **6,99 €** / **17,99 €**
   (`lib/i18n/sl.ts:113`, `:121`), while `public/llms.txt:17` says
   **6,90 €** / **17,90 €**. Align these with the actual App Store / Play Store
   subscription tiers (commit `bb509b0` updated tiers).
3. **Contact email.** Site/JSON-LD use `info@posljiracun.si`; confirm that is
   the address you want on the App Store listing and review contact.
