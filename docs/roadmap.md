# 할인도사 Roadmap

## 현재 상태

할인도사는 Next.js + Capacitor 기반 Android 앱으로 실행 가능하며, Play Store 내부 테스트에 올릴 수 있는 기본 구조를 갖췄다. 앱 이름, 패키지명, 버전, 아이콘, 스플래시, 정책 페이지, 하단 탭, 찜, 알림, 마이 화면, Android sync, APK/AAB 빌드 검증이 완료되어 있다. V1.0 기준 Deal canonical 모델, mock/staging/production provider 구조, 운영/수익화/푸시/SEO 문서, 홈 discovery 섹션까지 추가되었다.

## 완료 작업

### PHASE 1 UI/UX

- 홈 화면 실시간 할인 정보 피드 구성
- 오늘의 추천, 인기 특가, 마감 임박, 무료배송 특가 섹션 구성
- 상품 카드 이미지 비율 고정
- 할인율, 원가, 할인가, 쇼핑몰명, 배송 정보, 등록/마감 시간 표시
- 찜, 공유, 외부 이동 버튼 배치
- 검색 결과 없음, 로딩, fallback 오류 상태 구현
- 오늘의 특가 배너, 실시간 인기 TOP10, 카테고리별 인기, 최근 본 특가, 추천 특가 구성
- 특가 카드와 상세 화면에 검수 신뢰 배지 추가
- 외부 판매처 이동 전 앱 내부 확인 시트 추가
- 상세 페이지 진입과 구매 이동 시 최근 본 특가 자동 저장
- 카테고리/검색 URL query 진입 시 홈 필터 자동 반영
- 찜 페이지 판매처 이동도 동일한 앱 내부 확인 시트 사용
- 홈 검색/필터 영역에 적용 조건 요약과 전체 초기화 UX 추가
- 오류 신고 폼에 글자 수 제한, 접수번호 안내, 판매처 문의 고지, 접근성 상태 메시지 추가

### PHASE 2 코드 품질

- Deal 타입에 배송 정보, 설명, 유의사항 추가
- Deal canonical 필드 표준화: `mallName`, `thumbnail`, `shipping`, `expireAt`, `isFreeShipping`
- mock/staging/production/hybrid 데이터 provider 레이어 분리
- `/api/sources` 공급원 상태 API와 관리자 공급원 상태 패널 추가
- 실시간/파트너 피드 정규화 경로에 Deal 필수 필드 반영
- 린트 오류 제거
- 하단 탭 safe-area 대응
- Android WebView 외부 링크는 Capacitor Browser 구조 사용
- 최근 본 특가 localStorage 로직을 공용 유틸로 분리

### PHASE 3 Play Store 문서

- `docs/play-store-listing.md`
- `docs/release-checklist.md`
- `docs/privacy-policy-draft.md`
- `docs/terms-draft.md`
- `docs/data-safety-guide.md`
- `docs/content-rating-guide.md`
- `docs/test-plan.md`
- `docs/admin-system-design.md`
- `docs/monetization.md`
- `docs/push-notification-design.md`
- `docs/seo-strategy.md`
- `docs/competitor-analysis.md`
- `docs/analytics-plan.md`
- `docs/launch-day-checklist.md`
- `docs/weekly-operation-guide.md`
- `docs/customer-support-guide.md`
- `docs/v1-1-roadmap.md`
- `docs/data-source-runbook.md`

### PHASE 4 Android 출시 준비

- Capacitor appId: `com.halindosa.app`
- Android applicationId: `com.halindosa.app`
- 앱 이름: `할인도사`
- versionCode: `1`
- versionName: `1.0.0`
- Android 권한 최소화: `INTERNET`
- launcher icon/splash 리소스 존재 확인
- `android/keystore.properties.example` 추가
- `npm run android:debug`, `npm run android:bundle` 성공

### PHASE 5 QA 자동화

- `npm run lint`
- `npm run build`
- `npm run build:android`
- `npm run cap:sync`
- `npm run smoke`
- `npm run release:doctor`
- `npm run audit:commercial`
- `npm run qa`
- `npm run smoke:local`
- smoke 22개 항목으로 확장: report validation, home query filters, deal link integrity, redirect fallback, affiliate status, admin export 포함
- Play Store 이미지 제작 기준 문서화
- Play Store 512 아이콘과 기능 그래픽 초안 생성
- PWA/iOS 홈 화면 설치용 manifest icon, shortcut, apple web app metadata 보강

## 진행 중 작업

- Play Store 제출 직전 실기기/스토어 작업만 남음
- 출시 이미지와 스크린샷 기준 유지
- 실제 상품별 direct purchase URL 확보 전까지는 검증 링크와 판매처 검색 fallback을 명확히 구분

## 다음 작업

1. 실제 기기/에뮬레이터에서 Play Store 스크린샷 6장 촬영
2. signed release AAB 생성을 위한 실제 keystore 생성
3. 내부 테스트 트랙 업로드
4. 실제 기기 2종 이상 설치 확인
5. 개인정보처리방침 실제 URL 배포
6. 운영 데이터 공급 방식 확정 및 Supabase/API 연결
7. 제휴/광고 고지 문구 법무 검토
8. 실제 제휴 피드 도입 후 direct purchase URL 비율을 높이고 `needs_review` 상품 축소

## 출시 전 남은 작업

### Critical

- 현재 코드 기준 남은 Critical Issue 없음

### High

- 실제 Play Store 업로드용 signed AAB는 Android Studio 또는 로컬 keystore로 다시 생성해야 함
- 개인정보처리방침 URL을 실제 공개 URL로 배포해야 함

### Medium

- `npm install`에서 moderate 취약점 2개가 보고됨. 강제 수정은 breaking change 가능성이 있어 프레임워크 패치 확인 후 처리
- 실제 운영 데이터는 공식 API, RSS, 제휴 피드, 허용된 수집 방식만 사용해야 함
- 현재 일부 상품은 판매처 검색 fallback으로 이동하므로, 출시 전 제휴/공식 피드로 실제 상품 상세 URL을 보강해야 함

### Low

- 기능 그래픽, 스크린샷, 소개 이미지 제작 필요
- 테스트 사용자 피드백 반영 필요

## 우선순위

1. Play Console 필수 입력값과 정책 문서 완성도 유지
2. Android signed AAB 생성 가능 상태 유지
3. 홈/검색/찜/알림/마이 핵심 흐름 안정화
4. 외부 링크와 제휴 고지 리스크 관리
5. 실제 운영 데이터 전환 설계
