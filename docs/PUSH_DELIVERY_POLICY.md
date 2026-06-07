# Push Delivery Policy

할인도사는 실제 FCM 발송 전에도 사용자 피로도와 심사 리스크를 낮추기 위해 발송 정책을 코드와 QA에 연결합니다.

- 생성 시각: 2026-06-07T20:07:57.076Z
- Timezone: Asia/Seoul
- Quiet hours: 22:00-8:00
- Live token limit: 50
- Dry-run token limit: 500
- Daily campaign cap per user: 3

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| policy timezone and quiet hours | PASS | 22:00-07:59 KST live sends are blocked. |
| consent and dry-run requirement | PASS | Live sends require explicit consent and dry-run-first operation. |
| runtime policy library | PASS | Runtime notification delivery policy evaluator is present. |
| send adapter policy enforcement | PASS | sendPushNotification blocks unsafe live sends before FCM. |
| admin send API policy fields | PASS | Admin push send route passes consent, scheduledAt, and priority to the adapter. |
| admin panel consent UX | PASS | Admin dry-run panel requires consent confirmation for live tests and shows policy output. |
| package script wiring | PASS | push:delivery:doctor is part of QA. |
| runbook delivery policy | PASS | Runbook documents quiet hours and consent-safe push operation. |
| release doctor coverage | PASS | Release doctor checks push delivery policy evidence. |
| quiet live send blocked | PASS | {"ok":false,"mode":"live","tokenCount":1,"maxTokens":50,"isQuietHours":true,"nextAllowedAt":"2026-06-03T23:00:00.000Z","reasons":["quiet_hours"],"warnings":[]} |
| business hour consented live send allowed | PASS | {"ok":true,"mode":"live","tokenCount":1,"maxTokens":50,"isQuietHours":false,"nextAllowedAt":"2026-06-03T02:00:00.000Z","reasons":[],"warnings":[]} |
| live send without consent blocked | PASS | {"ok":false,"mode":"live","tokenCount":1,"maxTokens":50,"isQuietHours":false,"nextAllowedAt":"2026-06-03T02:00:00.000Z","reasons":["missing_explicit_consent","dry_run_required_before_live"],"warnings":[]} |
| dry-run during quiet hours allowed with warning | PASS | {"ok":true,"mode":"dry_run","tokenCount":1,"maxTokens":500,"isQuietHours":true,"nextAllowedAt":"2026-06-03T23:00:00.000Z","reasons":[],"warnings":["dry_run_during_quiet_hours"]} |
| live token limit blocked | PASS | {"ok":false,"mode":"live","tokenCount":51,"maxTokens":50,"isQuietHours":false,"nextAllowedAt":"2026-06-03T02:00:00.000Z","reasons":["token_limit_exceeded"],"warnings":[]} |

## Scenarios

| Scenario | Result | Reasons | Warnings | Next Allowed |
| --- | --- | --- | --- | --- |
| quiet live send blocked | blocked | quiet_hours | - | 2026-06-03T23:00:00.000Z |
| business hour consented live send allowed | allowed | - | - | 2026-06-03T02:00:00.000Z |
| live send without consent blocked | blocked | missing_explicit_consent, dry_run_required_before_live | - | 2026-06-03T02:00:00.000Z |
| dry-run during quiet hours allowed with warning | allowed | - | dry_run_during_quiet_hours | 2026-06-03T23:00:00.000Z |
| live token limit blocked | blocked | token_limit_exceeded | - | 2026-06-03T02:00:00.000Z |

## 운영 원칙

- 실제 발송은 명시 동의가 확인된 토큰만 사용합니다.
- 22:00-07:59 KST에는 live send를 차단하고 다음 안전 시간대로 재예약합니다.
- FCM 키 설정 전에는 dry-run과 앱 내 알림 큐만 운영합니다.
- 긴급 캠페인도 quiet hours를 우회하지 않습니다.

