# 실시간 공식 feed 운영 파이프라인

공식 API/RSS/Atom/제휴 JSON feed를 할인도사에 연결한 뒤 사용자 노출 전 반드시 실행하는 end-to-end 검증 리포트입니다.

- 생성 시각: 2026-06-07T15:43:56.358Z
- 상태: seed_launch_ready
- 전체 결과: 통과
- 설정 feed URL: 0개
- feed env 실패: 0개
- canary: seed_fallback_only · fresh · 후보 0개
- 공식 혜택 노출: 105개
- 검색/비공식/종료 노출: 0/0/0

## 실행 Step

| Step | 결과 | 목적 |
| --- | --- | --- |
| source:feed-env:doctor | pass | 환경변수에 검색 결과, 커뮤니티, HTML 랜딩, 비 HTTPS URL이 섞였는지 차단 |
| news:feed:doctor | pass | JSON/RSS/Atom 계약, 공식 링크 승격, 회귀 샘플 확인 |
| news:feed:canary | pass | 연결된 공식 feed가 노출 가능한 후보를 만들 수 있는지 사전 점검 |
| refresh:news | pass | 공식/승인 feed와 seed fallback을 같은 스키마로 정규화 |
| verify:news | pass | 검색 URL, 뉴스 원문 단독, 커뮤니티, 종료 혜택 노출 차단 |
| refresh:all | pass | 상품 링크와 공식 혜택을 같은 출시 파이프라인으로 묶음 |
| verify:links:live | pass | refresh:all 이후 출시 증거용 non-strict 판매처 live probe 리포트 복원 |
| health:readiness | pass | 상품/공식 혜택/소스/refresh/canary 상태를 출시 게이트로 확인 |

## 다음 액션

- 아직 운영 feed URL이 없어 승인 seed fallback으로 안전하게 노출 중입니다.
- PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS부터 공식 JSON/RSS/Atom feed를 연결하세요.
- 무단 HTML 크롤링 대신 공식 API, RSS, Atom, 승인된 제휴 JSON만 연결하세요.

## 운영 명령

```bash
npm run news:feed:live
```

## 가드레일

- 검색 결과 URL, 커뮤니티 글, 블로그 글, 뉴스 기사 원문 단독 링크는 사용자 이동 URL로 쓰지 않습니다.
- 공식 혜택/이벤트/쿠폰/구매 상세 URL이 finalUrl로 확인된 항목만 사용자에게 노출합니다.
- protected/guarded 페이지는 브라우저 자동 수집 대상이 아니라 공식 API, RSS, Atom, 제휴 feed 또는 담당자 승인 JSON으로 연결합니다.

