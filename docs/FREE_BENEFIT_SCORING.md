# 무료혜택 점수와 노출 정책

할인도사는 구매 상품보다 오늘 받을 수 있는 무료혜택을 먼저 보여준다. 홈 상단에 올라오는 혜택은 단순 최신순이 아니라 아래 다섯 가지 점수를 함께 본다.

## 점수 필드

- `qualityScore`: 기존 링크 검증, 이미지, 노출 가능 상태를 반영한 기본 품질 점수
- `freshnessScore`: 최근에 확인된 혜택일수록 높은 점수
- `officialScore`: 공식 브랜드, 공식몰, 공식 이벤트 URL일수록 높은 점수
- `urgencyScore`: 오늘마감, 이번주 마감처럼 놓치기 쉬운 혜택일수록 높은 점수
- `rewardScore`: 기프티콘, 샘플, 무료체험, 전원증정처럼 사용자가 바로 이득을 느끼는 혜택일수록 높은 점수

## 홈 상단 노출 조건

아래 조건을 모두 만족해야 사용자 화면에 노출된다.

- `status=active`
- `validationStatus=passed`
- `isHidden=false`
- `finalUrl`이 존재해야 함
- 공식 허용 도메인의 `http` 또는 `https` URL이어야 함
- 검색 결과, 대표몰 메인, 커뮤니티 글, 뉴스 기사, private-network URL은 제외
- 종료일이 지났거나 `마감`, `종료`, `품절`, `이벤트 종료`, `선착순 마감` 문구가 감지되면 제외
- `qualityScore >= 70`

## 우선순위

상단에는 다음 혜택을 더 먼저 보여준다.

- 전원증정
- 구매 없이 받을 수 있는 혜택
- 선착순 또는 오늘마감 혜택
- 기프티콘, 샘플, 무료체험, 포인트, 신규가입 쿠폰
- 공식 링크 검증이 최근에 성공한 혜택

구매가 필요한 이벤트, 로그인 없이는 조건 확인이 어려운 이벤트, 공공성 정보는 기본 홈 상단에서 우선순위를 낮춘다. 공공성 혜택은 사용자가 명시적으로 공공 카테고리를 선택하거나 `includePublic=true` 요청을 보낼 때 포함한다.

## 운영 확인 명령

```bash
npm run refresh:benefits
npm run verify:freebies
npm run verify:benefits
```

주요 리포트는 아래 파일에 저장된다.

- `reports/freebies-verification.json`
- `reports/free-benefit-events.json`
- `reports/benefits-refresh.json`
- `docs/FREEBIES_VERIFICATION_REPORT.md`
- `docs/FREE_BENEFIT_EVENTS_REPORT.md`

