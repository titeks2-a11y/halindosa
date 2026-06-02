# Store Metadata QA Report

This report records non-secret Play Console and App Store Connect metadata checks.

## Length Checks

| Field | Limit | Current | Status |
| --- | ---: | ---: | --- |
| Play app name | 30 | 4 | PASS |
| Play short description | 80 | 34 | PASS |
| Play long description | 4000 | 463 | PASS |

## Required Review Copy

| Topic | Status | Evidence |
| --- | --- | --- |
| App access | PASS | Guest review is documented and demo account is not required |
| External seller/payment handling | PASS | Copy says the app does not sell products or process payments directly |
| Final price/stock confirmation | PASS | Copy tells users to confirm seller conditions before purchase |
| Privacy policy URL requirement | PASS | Play listing and submission packet mention the public privacy URL |
| Developer contact requirement | PASS | Play listing mentions developer contact email |
| App Store category | PASS | Shopping category and optional login are documented |
| Data safety | PASS | Sensitive data non-collection answers are covered |
| Content rating | PASS | Gambling and user-generated content answers are covered |

## Risky Phrase Scan

- 무조건 최저가: not present
- 최저가 보장: not present
- 100% 실시간 보장: not present
- 공식 판매처 보장: not present
- 수익 보장: not present
- 무료 현금: not present
- 확정 수익: not present

## Manual Work That Must Not Be Faked

- Paste the final short and long descriptions into Play Console and App Store Connect exactly after reviewing current screenshots.
- Confirm the public privacy/support URLs are reachable before store submission.
- Re-run this doctor after any change to listing copy, review notes, data safety, or content rating documents.
- Do not paste store-console credentials, tester passwords, OAuth secrets, or support mailbox passwords into repository documents.
