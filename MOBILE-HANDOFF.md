# SlikajRačun — iOS / mobile handoff

The iOS app lives in a **separate repo**: `pako999/slikajracun-mobile`
(Expo / React Native). This web repo (`invoice-picture`) only holds the
Next.js site + the backend API routes the app calls (`/api/apple-iap/verify`,
`/api/google-play`, `/api/send`, …).

This file is a handoff: copy the metadata and run the checklist **in the mobile
repo** to publish to the App Store. To work on it, start a Claude Code session
scoped to `pako999/slikajracun-mobile` (this session can't reach that repo).

## Store-listing metadata (ready to reuse)

Drafted in `fastlane/metadata/` in this repo — same listing text works for
EAS Submit or fastlane `deliver`. Summary:

| Field | sl | en-US |
| --- | --- | --- |
| Name | Slikaj Račun | Slikaj Račun |
| Subtitle | Pošlji račun z enim klikom | Send invoices in one click |
| Privacy URL | https://www.posljiracun.si/zasebnost | https://www.posljiracun.si/en/privacy |
| Support URL | https://www.posljiracun.si/pomoc-pri-nastavitvi | https://www.posljiracun.si/en/setup-help |
| Marketing URL | https://www.posljiracun.si | https://www.posljiracun.si/en |
| Keywords | see `fastlane/metadata/sl/keywords.txt` | `…/en-US/keywords.txt` |
| Description / promo / release notes | see `fastlane/metadata/sl/*` | `…/en-US/*` |

Global: primary category **Business**, secondary **Finance**,
copyright **Sport Group d.o.o.**, review contact **info@posljiracun.si /
+386 41 580 250**. Full required/optional breakdown:
`fastlane/PRE-PUBLISH-CHECKLIST.md`.

## What the new session should verify in `slikajracun-mobile`

### App config (`app.json` / `app.config.js`)
- [ ] `expo.name` = "Slikaj Račun"
- [ ] `ios.bundleIdentifier` set and matches App Store Connect
- [ ] `version` (marketing version) — keep in sync with the release
- [ ] `ios.buildNumber` — **bump for every submission**
- [ ] `ios.infoPlist.NSCameraUsageDescription` present (app photographs
      invoices) — Apple rejects camera apps without a clear usage string
- [ ] `ios.icon` → 1024×1024 PNG, **no alpha channel**

### Build & submit (`eas.json`)
- [ ] `build.production` profile exists
- [ ] `submit.production` has App Store Connect app ID, Apple Team ID, and ASC
      API key (or App-specific password)
- [ ] `eas build -p ios --profile production` then `eas submit -p ios`
      (or use the `pako999/blitz-submit-app-store` tool)

### In-app purchases / subscriptions
- [ ] StoreKit product IDs in the app match the App Store Connect subscription
      tiers **and** the prices shown on the web pricing page:
      **Osnovno 6,99 €/mo (66,90 €/yr)**, **PRO 17,99 €/mo (171,99 €/yr)**
- [ ] The receipt the app sends is verified by this repo's
      `/api/apple-iap/verify` route — confirm the shared secret / bundle ID line
      up between the app and the backend
- [ ] Trial length is **7 days** (source of truth: `TRIAL_DAYS = 7` in this
      repo's `lib/subscription.ts`) — make the StoreKit intro offer match

### App Store Connect (manual, can't be set from code)
- [ ] Demo account for App Review (the app requires Clerk sign-in — **required**
      or the build is rejected). Fill `fastlane/metadata/review_information/`
      `demo_user.txt` / `demo_password.txt`.
- [ ] Screenshots per required device size (6.7" + 6.5" iPhone; iPad if
      universal), per localization
- [ ] Age rating questionnaire (likely 4+)
- [ ] Privacy "nutrition label" — declare account email + invoice images;
      must match https://www.posljiracun.si/zasebnost

## Notes
- The web-side data inconsistencies (trial length, prices) were already fixed in
  this repo so the store listing won't contradict the site.
- Slovenian is the primary locale (`sl`); English (`en-US`) is secondary.
