# Store Asset QA Report

This report records non-secret Play Store, PWA, and iOS app icon asset readiness.

## Asset Dimension Checks

| Asset | Path | Actual dimensions | Required dimensions | Size | Status |
| --- | --- | --- | --- | ---: | --- |
| Play Store icon | `assets/store/play-store-icon-512.png` | 512x512 | 512x512 | 26KB | PASS |
| Play Store feature graphic | `assets/store/feature-graphic-1024x500.png` | 1024x500 | 1024x500 | 47KB | PASS |
| PWA 192 icon | `public/halindosa-icon-192.png` | 192x192 | 192x192 | 8KB | PASS |
| PWA 512 icon | `public/halindosa-icon-512.png` | 512x512 | 512x512 | 26KB | PASS |
| iOS App Store icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 1024x1024 | 1024x1024 | 61KB | PASS |

## Manual Work That Must Not Be Faked

- Review the final icon at small sizes in Play Console and App Store Connect before submission.
- Confirm the feature graphic does not include unauthorized third-party logos, personal data, or guarantee language.
- Regenerate brand assets with `npm run store:assets:generate` only after confirming the source artwork is approved.
- Do not commit store-console credentials, signing secrets, or unpublished partner branding approvals.
