# Store Submission Packet QA Report

This report verifies that the store submission packet points to the expected non-secret files, reports, commands, and reviewer copy.

## File References

| File | Status | Packet reference |
| --- | --- | --- |
| `docs/play-store-listing.md` | present | referenced |
| `docs/app-store-checklist.md` | present | referenced |
| `docs/privacy-policy-draft.md` | present | referenced |
| `docs/terms-draft.md` | present | referenced |
| `docs/data-safety-guide.md` | present | referenced |
| `docs/content-rating-guide.md` | present | referenced |
| `docs/store-review-notes.md` | present | referenced |
| `docs/store-assets-guide.md` | present | referenced |
| `docs/device-qa-record-template.md` | present | referenced |
| `docs/release-evidence.md` | present | referenced |
| `docs/PUBLIC_URL_REPORT.md` | present | referenced |
| `docs/STORE_METADATA_REPORT.md` | present | referenced |
| `docs/STORE_ASSETS_REPORT.md` | present | referenced |
| `docs/STORE_SCREENSHOTS_REPORT.md` | present | referenced |
| `docs/STORE_SCREENSHOT_MANIFEST.md` | present | referenced |
| `docs/STORE_SUBMISSION_REPORT.md` | present | referenced |
| `docs/STORE_HANDOFF_REPORT.md` | present | referenced |
| `docs/STORE_CONSOLE_FIELDS.md` | present | referenced |
| `docs/STORE_MANUAL_CHECKLIST.md` | present | referenced |
| `docs/RELEASE_NOTES.md` | present | referenced |
| `docs/SUPPORT_PLAYBOOK.md` | present | referenced |
| `docs/KNOWN_ISSUES.md` | present | referenced |
| `android/app/build/outputs/apk/debug/app-debug.apk` | present | referenced |
| `android/app/build/outputs/bundle/release/app-release.aab` | present | referenced |
| `assets/store/play-store-icon-512.png` | present | referenced |
| `assets/store/feature-graphic-1024x500.png` | present | referenced |
| `STORE_SCREENSHOT_MANIFEST.json` | present | referenced |
| `STORE_HANDOFF_REPORT.md` | present | referenced |
| `STORE_CONSOLE_FIELDS.json` | present | referenced |
| `STORE_MANUAL_CHECKLIST.md` | present | referenced |
| `STORE_MANUAL_CHECKLIST.json` | present | referenced |
| `RELEASE_NOTES.md` | present | referenced |
| `RELEASE_NOTES.json` | present | referenced |
| `SUPPORT_PLAYBOOK.md` | present | referenced |
| `SUPPORT_PLAYBOOK.json` | present | referenced |
| `KNOWN_ISSUES.md` | present | referenced |
| `ios/App/App/PrivacyInfo.xcprivacy` | present | referenced |

## Command References

| Command | Packet reference |
| --- | --- |
| `npm run env:doctor` | referenced |
| `node scripts/env-doctor.mjs --strict` | referenced |
| `npm run env:doctor:production` | referenced |
| `npm run test:env` | referenced |
| `npm run public:url:doctor` | referenced |
| `npm run device:qa:doctor` | referenced |
| `npm run device:qa:report` | referenced |
| `npm run store:metadata:doctor` | referenced |
| `npm run store:assets:doctor` | referenced |
| `npm run store:screenshots:manifest` | referenced |
| `npm run store:screenshots:doctor` | referenced |
| `npm run store:submission:report` | referenced |
| `npm run qa:release` | referenced |
| `npm run store:console:fields` | referenced |
| `npm run store:manual:checklist` | referenced |
| `npm run store:manual:doctor` | referenced |
| `npm run store:handoff:report` | referenced |
| `npm run release:notes` | referenced |
| `npm run support:playbook` | referenced |
| `npm run known:issues` | referenced |
| `npm run android:bundle` | referenced |
| `npm run release:evidence` | referenced |
| `npm run release:doctor` | referenced |

## Reviewer Copy Checks

- Guest access and no-demo-account copy: PASS
- External seller/payment handling copy: PASS
- Public privacy/support URL placeholders: PASS
- Signed AAB and store processing manual checks: PASS
- Localhost/example domain scan: PASS

## Manual Work That Must Not Be Faked

- The packet proves repository readiness only; it does not prove Play Console or App Store Connect submission has happened.
- Keep signed AAB keystore secrets, store-console credentials, OAuth client secrets, and support mailbox passwords outside Git.
- Re-run `npm run store:packet:doctor` after changing any store document, release report, binary path, or submission command.
