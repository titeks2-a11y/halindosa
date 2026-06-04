# 할인도사 Push Notification Design

## 목표

사용자가 놓치기 쉬운 할인 정보를 과도하지 않게 전달한다.

## FCM 구조

- App: 알림 권한 요청, 토큰 등록, 관심 카테고리 저장
- API Server: 토큰 저장, 세그먼트 계산, 발송 예약
- Worker: 마감 임박, 오늘의 특가, 무료배송 이벤트 감지
- FCM: Android push 발송
- Admin API: `GET /api/admin/push/send?token=...`으로 발송 준비 상태를 확인하고, `POST /api/admin/push/send?token=...`으로 dry-run 또는 실제 FCM 발송을 실행한다.
- Push Readiness API: `GET /api/admin/push-readiness?token=...`으로 동의/철회, 관심 카테고리 세그먼트, 캠페인 큐, DB 테이블 준비도를 발송 전 확인한다.

## 알림 유형

- 마감임박 특가: 종료 1~3시간 전
- 오늘의 특가: 하루 1회 큐레이션
- 무료배송 특가: 카테고리 관심 기반
- 사용자 관심 카테고리: 식품, 생활용품, 디지털, 패션, 육아, 여행, 기타

## 권한 요청 타이밍

첫 실행 즉시 요청하지 않는다. 사용자가 찜을 1회 이상 하거나 알림 탭에서 직접 설정할 때 요청한다.

## 동의/철회

마이 > 알림 설정에서 카테고리별 수신 여부와 전체 수신 여부를 변경한다. 토큰 삭제 요청 시 서버에서 비활성 처리한다.

## V1.0 범위

실제 FCM SDK 토큰 등록은 앱 권한/동의 UX 검토 후 연결한다. 서버 측 발송 어댑터는 `PUSH_SEND_ENABLED=true`와 `FCM_SERVER_KEY`가 설정된 경우에만 FCM으로 요청을 보내며, 기본값은 dry-run/readiness 검증이다.

## 운영 환경변수

```bash
PUSH_SEND_ENABLED=false
FCM_SERVER_KEY=
FCM_PROJECT_ID=
```

발송 토큰은 `push_subscriptions` 테이블에 저장하고, 사용자가 철회하면 `enabled=false`, `revoked_at=now()`로 처리한다. dry-run/live 발송 시도는 `push_delivery_logs`에 감사 로그로 남기되, 토큰 원문은 저장하지 않고 대상 수, 차단 사유, 정책 경고, provider 메시지만 기록한다.

## 구독/큐 데이터 모델

- `push_subscriptions`: 사용자, 플랫폼, FCM/Web Push 토큰, 관심 카테고리, 알림 유형, 동의/철회 시각을 저장한다.
- `push_notification_queue`: `source_kind=product_deal|official_benefit`, `campaign_id`, `deal_id`, `benefit_id`, `source_names`, `target_categories`, `dry_run_only`를 저장한다.
- `push_delivery_logs`: 큐/캠페인, dry-run/live 모드, 발송 상태, 대상 수, 성공/실패 수, 동의 확인, quiet hours/동의/토큰 제한 차단 사유를 토큰 원문 없이 저장한다.
- 실제 발송 작업자는 `dry_run_only=false`, `status=queued`, 사용자 동의가 확인된 구독만 대상으로 처리한다.
- 공식 혜택 뉴스/이벤트는 `benefit_id`와 `source_kind=official_benefit`로 상품 알림과 분리한다.
- V1은 `dry_run_ready` 상태를 출시 기준으로 삼고, `send_ready`는 FCM 키, 테스트 토큰, 사용자 동의 플로우가 모두 검증된 뒤에만 활성화한다.

## 운영 리포트

```bash
npm run push:readiness:report
npm run push:delivery:audit
```

- `reports/push-readiness.json`: 검증 상품 수, 공식 혜택 수, 캠페인 후보, 큐 후보 행, 관심 세그먼트 커버리지, 동의/철회 체크, DB 테이블 준비도를 기록한다.
- `docs/PUSH_READINESS_REPORT.md`: 운영자가 출시 전 확인할 수 있는 Markdown 요약이다.
- `reports/push-delivery-audit.json`: 발송 시도 감사 구조, 토큰 최소화, 차단 사유 샘플, 관리자 dry-run 응답의 감사 이벤트 노출 여부를 기록한다.
- `docs/PUSH_DELIVERY_AUDIT.md`: 실제 FCM 전환 전 운영자가 확인할 감사 로그 기준이다.
- 출시 전 기준: `launchStatus`가 `dry_run_ready` 이상, `queueRows >= 30`, 관심 세그먼트 10개 이상, `push_subscriptions`/`push_notification_queue`/`price_drop_alerts` RLS 준비.
