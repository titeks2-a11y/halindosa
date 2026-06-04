# Push Delivery Audit

FCM/Web Push 발송 전환 시 운영자가 dry-run, 차단, 실패, 성공을 추적할 수 있도록 남기는 감사 리포트입니다. 토큰 원문은 저장하지 않고 대상 수와 정책 판단만 기록합니다.

- 생성 시각: 2026-06-04T01:33:16.750Z
- 상태: PASS
- 샘플 감사 이벤트: 4개
- 차단 사유: missing_explicit_consent 1, quiet_hours 1

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| database audit table | PASS | push_delivery_logs table, indexes, and service-role RLS policy are present. |
| token separation | PASS | Push tokens remain in subscriptions; delivery logs store counts and policy evidence only. |
| runtime audit model | PASS | Runtime audit entry builder and summary helper are present. |
| send adapter audit output | PASS | sendPushNotification returns a deliveryAudit entry for every result path. |
| admin audit visibility | PASS | Admin dry-run panel shows audit event id, status, and blocked reasons. |
| design documentation | PASS | Push design document covers audit log storage and token minimization. |
| runbook documentation | PASS | Runbook includes push delivery audit command and output. |
| package script wiring | PASS | push:delivery:audit is wired into QA. |
| release doctor coverage | PASS | release:doctor checks push delivery audit evidence. |

## Sample Audit Events

| Event | Mode | Status | Source | Alert | Reasons | Token Count |
| --- | --- | --- | --- | --- | --- | ---: |
| push-audit-sample-dry-run | dry_run | allowed | product_deal | free_event | - | 1 |
| push-audit-sample-missing-consent | live | blocked | product_deal | free_event | missing_explicit_consent | 1 |
| push-audit-sample-quiet-hours | live | blocked | product_deal | ending_soon | quiet_hours | 1 |
| push-audit-sample-official-benefit | dry_run | allowed | official_benefit | free_event | - | 1 |

## 운영 원칙

- 실제 토큰 값은 `push_subscriptions`에만 저장하고 delivery log에는 저장하지 않습니다.
- `push_delivery_logs`는 service role 작업자만 insert/update/select합니다.
- live send 차단 사유는 `blocked_reasons`와 `policy_warnings`로 남겨 다음 발송 시간과 동의 상태를 추적합니다.
- 관리자 dry-run 화면은 API 응답의 `deliveryAudit.eventId`로 운영자가 같은 발송 시도를 추적할 수 있게 합니다.

