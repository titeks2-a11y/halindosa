# 할인도사 일일 운영 리포트

- 생성 시각: 2026-06-06T22:04:59.553Z
- 운영 상태: 오늘 운영 가능
- 상품 링크: 140/140 검증
- 검색 링크 노출: 0건
- 품절/종료 상품 노출: 0건
- 고객 노출 상품: 140개
- 숨김 리뷰 상품: 0개
- 공식 혜택 노출: 101개
- refresh:all: 통과
- release:doctor: 185/185

## 오늘 운영 게이트

| 게이트 | 상태 | 내용 | 실행 명령 |
| --- | --- | --- | --- |
| 검증 구매 링크 | passed | 상품 140개, 검증 링크 140개, 고객 노출 140개, 숨김 리뷰 0개, 검색 링크 0개, 품절 노출 0개 | npm run verify:links && npm run verify:products && npm run exposure:doctor |
| 공식 혜택 노출 | passed | 공식 혜택 101개, 숨김 0개, 종료 0개, 실패 0개 | npm run refresh:news && npm run verify:news |
| refresh:all | passed | refresh:all ok=true, failed=0 | npm run refresh:all |
| 공식 소스 준비도 | passed | 공식 소스 90개, launch gate=passed | npm run source:readiness:report |
| cron/push 운영 준비 | passed | cron=ready, push readiness=100 | npm run cron:refresh:doctor && npm run push:readiness:report |
| release doctor | passed | 185/185 checks | npm run release:doctor |

## 운영 카드

| 영역 | 상태 | 값 | 설명 | 명령 |
| --- | --- | --- | --- | --- |
| 구매 링크 | good | 140/140 | 검색, 대표몰, 품절 링크를 노출하지 않고 mismatch는 숨김 리뷰 큐로 보냅니다. | npm run verify:links |
| 공식 혜택 | good | 101개 | 무료, 쿠폰, 카드, 문화, 공공 혜택의 공식 링크 노출 상태입니다. | npm run verify:news |
| 수집 파이프라인 | good | 정상 | 상품과 혜택 refresh가 같은 증적 흐름으로 갱신되는지 봅니다. | npm run refresh:all |
| 공식 소스 | good | 90개 | 향후 API/RSS/제휴 feed 전환 후보와 정책 게이트입니다. | npm run source:readiness:report |
| 자동 운영 | good | ready | 6시간 refresh와 푸시 준비 상태를 점검합니다. | npm run cron:refresh:doctor |
| 출시 게이트 | good | 185/185 | 스토어 제출 전 회귀 게이트입니다. | npm run release:doctor |

## 우선 처리 큐

| 우선순위 | 영역 | 제목 | 이유 | 작업 |
| --- | --- | --- | --- | --- |
| medium | 공식 소스 | 공식 feed 연결 후보 검토 | 현재 seed/fallback 운영은 안전하지만, 장기 운영은 공식 API/RSS/승인 JSON feed 연결이 필요합니다. | source:onboarding:plan의 env 템플릿에서 우선 공급처를 골라 제휴 또는 공식 feed 연결 |
| medium | 콘텐츠 | 오늘 노출 혜택 freshness 확인 | 공식 혜택은 종료일과 조건이 빠르게 변하므로 매일 갱신 증거가 필요합니다. | npm run refresh:all 실행 후 news freshness와 source readiness 리포트 확인 |
| low | 출시 QA | Play Store 제출 전 최종 증적 갱신 | 최종 AAB 생성 직전 release evidence가 최신 커밋을 가리켜야 합니다. | npm run release:evidence && npm run release:doctor |

## 운영 원칙

- 검색 결과, 대표몰, 커뮤니티 원문, 블로그, 품절/종료 링크는 사용자 노출 링크로 쓰지 않습니다.
- 뉴스나 커뮤니티는 정보 출처로만 쓰고, 사용자 이동은 공식 이벤트·쿠폰·상품 상세 페이지로 제한합니다.
- API 키나 제휴 feed가 없어도 seed/fallback 데이터로 QA와 빌드가 통과해야 합니다.

## 재생성 명령

```bash
npm run refresh:all
npm run daily:operations:report
npm run release:doctor
```
