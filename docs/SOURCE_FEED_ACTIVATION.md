# 무료혜택 Feed Activation 리포트

- 생성 시각: 2026-06-12T04:05:44.997Z
- 상태: seed_ready
- 설정 feed URL: 0개
- 설정 provider: 0개
- canary 노출 후보: 0개
- canary 상태: seed_fallback_only

## 의미

- `seed_ready`: 승인된 운영 feed URL은 아직 없지만, seed fallback과 안전 게이트로 출시 운영이 가능한 상태입니다.
- `live_feed_ready`: 승인 feed가 실제 노출 가능한 공식 혜택 후보를 만들고 홈 실시간 반영 게이트도 통과한 상태입니다.
- `needs_attention` 또는 `failed`: feed URL, parser, finalUrl, 종료/검색/커뮤니티 차단 정책 중 하나를 먼저 고쳐야 합니다.

## 필수 확인

| 검사 | 결과 | 근거 | 다음 작업 |
| --- | --- | --- | --- |
| feed env safety | PASS | configured=0, failed=0 | Run npm run source:feed-env:doctor and fix any unsafe, search, community, private, or non-machine-readable feed URL. |
| feed handoff readiness | PASS | lanes=13, commands=8 | Run npm run source:feed:handoff so Vercel env keys and verification commands stay current. |
| official source live readiness | PASS | reachable=190, guarded=27, stale=0 | Run npm run source:live:doctor and replace or remove any stale_or_removed official source before feed activation. |
| official source breadth readiness | PASS | lanes=12/12, brandSignals=57/57, consumer=78%, publicPolicy=22% | Run npm run source:breadth:doctor so telecom, convenience, beauty, cafe, delivery, pay, mart, open-market, public, education, pet, sample lanes, and consumer-first source mix stay covered. |
| free benefit event contract | PASS | checks=21/21 | Run npm run benefit:event:contract so FreeBenefitEvent fields, sanitizer, publishable gate, no-store API, filters, and card trust badges remain enforced. |
| feed canary activation | PASS | status=seed_fallback_only, configured=0, providers=0, visible=0 | Seed fallback is allowed until approved JSON/RSS/Atom feeds are connected. Connect OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, or BENEFIT_REFRESH_FEED_URLS next. |
| home realtime reflection | PASS | homeChecks=20/20 | Run npm run test:home-realtime after each feed activation to prove /api/home reflects refreshed snapshots without restart. |
| free benefit refresh command | PASS | refresh:benefits is present and QA keeps it in the free-benefit pipeline. | Keep refresh:benefits in QA so freebies/events/verify steps remain release-blocking. |
| benefit cron route | PASS | Vercel cron includes dedicated benefits refresh and full refresh routes. | Keep /api/cron/benefits for free-benefit-first refresh and /api/cron/refresh for full refresh. |
| official benefit floor | PASS | visible=197, threshold=95 | Run npm run health:readiness after activation to confirm visible official benefits and freshness. |

## 운영 연결 순서

```bash
npm run source:catalog:report
npm run source:live:doctor
npm run source:breadth:doctor
npm run source:feed-env:doctor
npm run news:feed:canary
npm run refresh:benefits
npm run verify:benefits
npm run benefit:event:contract
npm run test:home-realtime
npm run health:readiness
```

## 다음 작업

- 운영 feed URL이 아직 없습니다. 공식 API/RSS/Atom 또는 승인 JSON endpoint를 Vercel env에 연결하세요.
- 연결 전에는 seed fallback과 공식 source catalog만 사용자에게 노출합니다.
