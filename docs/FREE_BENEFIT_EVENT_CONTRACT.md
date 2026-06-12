# FreeBenefitEvent 계약

Generated: 2026-06-11T23:58:35.015Z

Status: PASS

## 목적

할인도사의 메인 데이터는 구매 상품보다 무료혜택, 쿠폰, 샘플, 무료체험, 전원증정, 선착순, 출석체크, 룰렛, 공공무료 혜택을 우선합니다. 이 계약은 홈, 무료혜택 API, 검증 스크립트가 같은 기준으로 사용자에게 보여줄 수 있는 혜택만 통과시키는지 검사합니다.

## 노출 조건

- `status=active`
- `validationStatus=passed`
- `isHidden=false`
- `finalUrl` 존재
- 공식 허용 도메인의 `http/https` URL
- 검색 링크, 대표 홈페이지, 커뮤니티 글, 뉴스 기사, private-network URL 아님
- 종료일이 지났거나 종료/품절/마감 문구가 감지되지 않음
- `qualityScore >= 70`

## API 필터

- `type=all|everyone|firstCome|coupon|sample|freeTrial|gifticon|pointCashback|checkIn|roulette|signup|publicFree|experiencePanel|freeShipping|brandEvent`
- `deadline=today|week|soon`
- `endingSoonOnly=true`는 기존 링크 호환용이며 `deadline=week`에 가까운 마감 필터로 처리합니다.
- `noPurchaseOnly=true`, `requiresPurchase=true|false`, `requiresLogin=true|false`
- `sort=recommended|endingSoon|latest|noPurchase|quality`
- 응답 `summary`는 `endingToday`, `endingSoon`, `endingThisWeek`를 함께 제공합니다.

## 필수 필드

- `title`
- `brandName`
- `benefitType`
- `eventUrl`
- `officialUrl`
- `finalUrl`
- `sourceName`
- `sourceType`
- `sourceUrl`
- `startAt`
- `endAt`
- `participationCondition`
- `requiresLogin`
- `requiresPurchase`
- `isEveryoneReward`
- `isFirstComeFirstServed`
- `rewardText`
- `cautionText`
- `claimCtaLabel`
- `trustBadges`
- `collectedAt`
- `updatedAt`
- `verifiedAt`
- `status`
- `validationStatus`
- `validationReason`
- `qualityScore`
- `freshnessScore`
- `officialScore`
- `urgencyScore`
- `rewardScore`
- `priorityScore`
- `isHidden`
- `hiddenReason`
- `tags`

## 검사 결과

| Check | Result | Detail |
| --- | --- | --- |
| FreeBenefitEvent canonical fields | PASS | Missing fields: none |
| FreeBenefitEvent category coverage | PASS | Missing benefit types: none; missing labels: none |
| home page quick filters use canonical benefit and deadline params | PASS | Missing home page params: none |
| home page has live no-store free benefit refresh rail | PASS | Home should keep Android static fallback but hydrate a live rail from /api/home with no-store refresh. |
| FreeBenefitEvent status contract | PASS | Event status and validation status should distinguish active, expired, blocked, unknown, passed, failed, and needs_review. |
| normalizer sanitizes and blocks unsafe URLs | PASS | Normalizer should sanitize external text and reject search, community, news, private-network, and ended-link signals. |
| normalizer infers real benefit conditions | PASS | Normalizer should expose login, purchase, everyone reward, first-come, condition, CTA, and trust metadata. |
| normalizer computes ranking score dimensions | PASS | Normalizer should expose freshness, official source, urgency, and reward value score dimensions for ranking and operator reports. |
| publishable gate hides invalid events | PASS | Publishable gate must require active, passed, visible, safe final URL, unexpired, and quality score. |
| event dedupe uses brand title URL and end date | PASS | Deduplication should merge same brand/title/url/end-date events before publishing. |
| benefits events API is runtime no-store | PASS | Free benefit events API should avoid static cache and expose no-store cache policy. |
| benefits events API is guarded and filterable | PASS | API should rate-limit and support q, type, purchase/login, ending-soon, no-purchase, sorting, category counts, and summary. |
| benefits events API exposes trust policy | PASS | API response should tell clients that only active, passed, non-search, non-homepage, non-community events are publishable. |
| home and freebies surfaces share publishable event selector | PASS | Home and /api/freebies should use the same publishable selector as the benefits events API, and home should expose event category counts. |
| home exposes free benefit quick filters | PASS | Home should expose mobile quick filters for consumer-first free-benefit intents and /free-benefits should hydrate the full filter set, including publicFree, from URL params. |
| home event cards expose claim conditions | PASS | Home free-benefit event cards should show participation condition, login/purchase requirement, and validation state in compact trust badges. |
| free benefits event cards expose claim conditions | PASS | /free-benefits event cards should show participation condition, login/purchase requirement, and validation state in compact trust badges. |
| verify benefits enforces official active event floor | PASS | verify:benefits should produce JSON/Markdown evidence and fail low official active/source/host coverage. |
| smoke covers benefits events API contract | PASS | Smoke should hit the events API and home API, then assert publishable policy, category counts, CTA, trust badges, and no-purchase filtering. |

