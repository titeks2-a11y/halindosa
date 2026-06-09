# Device QA Execution Manifest

Generated: npm run device:qa:manifest

This manifest turns the launch-device checklist into concrete targets, commands, artifacts, and purchase-link samples. It does not claim that manual device QA has passed.

## Baseline

| Item | Value |
| --- | --- |
| Branch | `codex/12h-product-ux-growth-hardening` |
| Commit | `0f8c44f1` |
| App version | `1.0.1` |
| Record template | `docs/device-qa-record-template.md` |
| Checklist | `docs/device-qa-checklist.md` |

## Build And Evidence

| Artifact | Status | Bytes |
| --- | --- | ---: |
| `android/app/build/outputs/apk/debug/app-debug.apk` | missing | 0 |
| `android/app/build/outputs/bundle/release/app-release.aab` | missing | 0 |
| `MOBILE_UX_REPORT.md` | present | 4993 |
| `docs/release-evidence.md` | present | 10261 |
| `STORE_SCREENSHOT_MANIFEST.json` | present | 4961 |
| `docs/STORE_SCREENSHOT_MANIFEST.md` | present | 4496 |

## Required Commands Before Manual QA

- `npm run qa:release`
- `npm run release:doctor`
- `npm run device:qa:doctor`
- `npm run device:qa:report`
- `npm run test:mobile-ux`

## Required Device Targets

| Target | Install path | Required checks |
| --- | --- | --- |
| Android Emulator | APK / AAB / Play internal | home_safe_area, purchase_link, share_sheet, favorites_recent, policy_links |
| 실제 Android 기기 | APK / AAB / Play internal | home_safe_area, purchase_link, share_sheet, favorites_recent, oauth_callback, offline_recovery |
| iPhone Simulator 또는 실제 iPhone | Xcode Run / TestFlight | ios_safe_area, safari_or_browser, share_sheet, oauth_deeplink, privacy_manifest |

## Manual Check Matrix

| Area | Android Emulator | Real Android | iOS Simulator/TestFlight |
| --- | --- | --- | --- |
| Safe area and bottom tabs | Required | Required | Required |
| Home deal rail touch scroll and fade cue | Required | Required | Required |
| Purchase link opens external browser | Required | Required | Required |
| Native share sheet | Required | Required | Required |
| Favorites and recent persistence | Required | Required | Required |
| OAuth callback or deep link | Optional | Required | Required |
| Public privacy/support URL | Required | Required | Required |
| Store screenshot story consistency | Required | Required | Required |

## Purchase Link Samples

Open these deals through the app UI and write the actual destination domain into `docs/device-qa-record-template.md`.

| # | Deal ID | Seller | Expected host | Type | App route | Redirect route |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | d001 | 롯데온 | lotteon.com | product_detail | `/deals/d001` | `/go/d001?source=device_qa` |
| 2 | d002 | 지마켓 | item.gmarket.co.kr | product_detail | `/deals/d002` | `/go/d002?source=device_qa` |
| 3 | d003 | g마켓 | item.gmarket.co.kr | product_detail | `/deals/d003` | `/go/d003?source=device_qa` |
| 4 | d004 | 쿠팡 | coupang.com | product_detail | `/deals/d004` | `/go/d004?source=device_qa` |
| 5 | d005 | 베네베딩 | benebedding.com | product_detail | `/deals/d005` | `/go/d005?source=device_qa` |
| 6 | d006 | 쿠팡 | coupang.com | product_detail | `/deals/d006` | `/go/d006?source=device_qa` |
| 7 | d007 | 토스 | item.gmarket.co.kr | product_detail | `/deals/d007` | `/go/d007?source=device_qa` |
| 8 | d008 | LF몰 | lfmall.co.kr | product_detail | `/deals/d008` | `/go/d008?source=device_qa` |
| 9 | d009 | 지마켓 | item.gmarket.co.kr | product_detail | `/deals/d009` | `/go/d009?source=device_qa` |
| 10 | d010 | 쿠팡 | coupang.com | product_detail | `/deals/d010` | `/go/d010?source=device_qa` |

## Sensitive Data Rule

Do not record order numbers, addresses, payment data, passwords, auth codes, `.env` values, service-role keys, or keystore passwords.

## Manual Evidence Rules

- 실제 기기 결과를 통과로 꾸미지 않고 확인한 항목만 기록
- 주문번호, 주소, 결제 정보, 비밀번호, 인증 코드, .env, keystore, service-role key 기록 금지
- OAuth는 Provider 이름, redirect 통과 여부, 오류 요약만 기록
- 구매 링크 샘플은 앱 UI에서 열고 실제 열린 도메인을 기록
- 남은 Critical Issue가 있으면 출시 가능으로 판정하지 않음

## Manual Work That Must Not Be Faked

- This manifest is a plan and evidence checklist, not proof that QA passed.
- Keep the final device QA record separate from secrets, credentials, order data, and private keystore information.
- Re-run `npm run device:qa:manifest`, `npm run device:qa:report`, and `npm run release:doctor` after changing release builds, purchase samples, OAuth settings, or store screenshots.
