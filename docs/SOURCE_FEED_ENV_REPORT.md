# 공식 feed 환경변수 안전성 리포트

- 생성 시각: 2026-06-06T22:48:38.717Z
- 검사한 env key: DEAL_NEWS_FEED_URLS, DEAL_NEWS_RSS_URLS, DEAL_EVENT_NEWS_FEED_URLS, OFFICIAL_EVENT_FEED_URLS, DEAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS
- 설정된 feed URL: 0개
- 통과: 0개
- 실패: 0개
- 승인 추가 host: 없음

## 운영 원칙

- 공식 API, RSS, Atom, 승인된 JSON/파트너 feed만 연결합니다.
- 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 또는 HTML 이벤트 페이지 직접 수집은 금지합니다.
- 승인된 외부 feed host는 `HALINDOSA_APPROVED_FEED_HOSTS`에 host만 기록하고, 토큰·query 값은 리포트에 남기지 않습니다.

## 검사 결과

| Env key | URL(민감 query 제거) | Host | 상태 | 사유 | 다음 작업 |
| --- | --- | --- | --- | --- | --- |
| - | - | - | passed | no_configured_feed_urls | 공식 feed가 설정되기 전에는 seed fallback으로 운영합니다. |

## 정책 회귀 샘플

| 샘플 | 기대 상태 | 기대 사유 | 실제 상태 | 실제 사유 | 결과 |
| --- | --- | --- | --- | --- | --- |
| official_machine_feed_allowed | passed | official_catalog_host_feed | passed | official_catalog_host_feed | pass |
| search_url_blocked | failed | search_or_result_url | failed | search_or_result_url | pass |
| community_host_blocked | failed | community_or_blog_host | failed | community_or_blog_host | pass |
| official_html_page_blocked | failed | not_machine_readable_feed | failed | not_machine_readable_feed | pass |
| unlisted_host_blocked | failed | unlisted_feed_host | failed | unlisted_feed_host | pass |
| unsafe_protocol_blocked | failed | unsafe_protocol | failed | unsafe_protocol | pass |

## 재검증

```bash
npm run source:feed-env:doctor
npm run refresh:news
npm run verify:news
npm run refresh:all
```
