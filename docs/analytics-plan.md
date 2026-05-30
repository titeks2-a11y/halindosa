# 할인도사 Analytics Plan

## 원칙

회원가입 없이 사용할 수 있는 구조를 유지하고, 개인을 식별하지 않는 집계 이벤트부터 시작한다.

## 후보 도구

- GA4: 기본 유입/화면/전환 분석
- Firebase Analytics: Android 앱 이벤트와 Play Console 연계
- Mixpanel: 퍼널, 코호트, 기능 사용성 분석

## 핵심 이벤트

- `app_open`
- `deal_impression`
- `deal_click`
- `deal_share`
- `favorite_add`
- `favorite_remove`
- `filter_apply`
- `category_select`
- `external_open`
- `report_submit`

## 개인정보 최소화

- 이름, 이메일, 전화번호, 위치 수집 없음
- 광고 ID 또는 기기 ID를 쓰는 경우 Play Console 데이터 보안 섹션 재작성
- 동의하지 않은 사용자의 제휴/분석 파라미터는 사용하지 않음

## V1.0 범위

현재 `/api/track` 구조는 smoke 검증용이며 외부 분석 SDK는 연결하지 않는다.
