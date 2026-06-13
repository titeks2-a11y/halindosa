# 무료혜택 실시간 플랫폼 준비 리포트

이 문서는 `npm run benefit:platform:report`로 갱신한다. 정확한 생성 시각은 `reports/free-benefit-platform-readiness.json`의 `generatedAt`을 확인한다.

## 요약

| 항목 | 값 |
| --- | --- |
| 노출 가능한 공식 무료혜택 | 197개 |
| 소비자형 공식 무료혜택 | 165개 |
| 공식 도메인 | 114개 |
| 공식 소스 후보 | 264개 |
| 접근 가능한 공식 소스 | 224개 |
| configured feed URL | 0개 |
| 바로 받을 수 있는 후보 | 117개 |
| 즉시 수령 후보 | 140개 |
| 정확 중복 그룹 | 0개 |
| 검색/비공식 노출 | 0개 |
| 종료/품절 의심 노출 | 0개 |

## 출시 목표별 게이트

| 게이트 | 상태 | 설명 |
| --- | --- | --- |
| free benefit first product direction | PASS | 노출 가능한 공식 혜택 197개, 소비자형 공식 혜택 165개 |
| official link only exposure | PASS | 검색/비공식 노출 0건 |
| expired and invalid exclusion | PASS | 노출 중 종료/품절 의심 0건, 만료 제외 후보 9건 |
| dedupe and scoring | PASS | 정확 중복 0개, 평균 품질 100, 공식성 100 |
| required benefit categories | PASS | 전원증정, 선착순, 샘플, 무료체험, 쿠폰, 기프티콘, 포인트, 무료배송, 신규가입, 오늘/이번주 마감 축이 존재 |
| safe realtime automation | PASS | refresh/verify/report/home realtime 스크립트 6개 확인 |
| free benefit data model | PASS | 목표 무료혜택 핵심 필드를 FreeBenefitEvent 모델이 포함 |
| webview production safety | PASS | Android WebView는 halindosa.com HTTPS 운영 도메인 중심으로 제한 |

## 필수 무료혜택 카테고리

| 카테고리 | 수량 |
| --- | --- |
| everyone | 10 |
| firstCome | 24 |
| sample | 2 |
| freeTrial | 10 |
| coupon | 10 |
| gifticon | 2 |
| pointCashback | 97 |
| freeShipping | 4 |
| signup | 6 |
| today | 1 |
| week | 3 |

## 운영자가 다음에 할 일

- Vercel 일일 배포 제한이 풀리면 최신 main을 Production에 배포하고 /api/health.deployment.shortCommit을 확인
- Vercel/GitHub 환경변수에 승인된 공식 feed URL을 연결해 seed fallback 비중을 낮추기
- 오늘마감 혜택이 0개일 때 편의점/카페/포인트 공식 이벤트 feed를 우선 추가
- 실제 사용자 클릭 로그를 바탕으로 claimReadyCount와 instantClaimCount 상위 후보를 매주 재정렬

## 기준

- 공식 링크 기준: 사용자 CTA에는 검증된 공식 브랜드/공식몰/공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL만 연결한다.
- 사용자 CTA에는 공식 이벤트, 신청, 쿠폰, 샘플, 출석체크, 무료체험 URL만 연결한다.
- 검색 결과, 대표몰 메인, 블로그/카페 중계 링크, 종료/품절/미검증 링크는 노출하지 않는다.
- Android 앱은 운영 웹 `https://www.halindosa.com`을 WebView로 불러오므로 Vercel Production 배포가 반영되면 앱 화면도 함께 바뀐다.
