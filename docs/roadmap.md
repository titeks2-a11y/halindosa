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
- 홈 상단에 데이터 상태, 구매 링크 확인 수, 판매처 검색 확인 필요 수, 최근 가격 기준 요약 추가
- 마이 화면에 기기 데이터 삭제, 최근 본 특가 삭제, 동의 설정 초기화, 앱 공유 기능 추가
- 홈 상단에 온라인/오프라인 네트워크 상태와 복구 안내 추가
- 홈/API에 구매링크 확인만 필터와 옥션, 알리, 롯데온, 인터파크 등 쇼핑몰 필터 확장 추가
- `/api/deals`와 운영 지표에 구매 링크 품질 요약, 확인율, 검토 필요 링크 수 추가
- 운영 대시보드에 구매 링크 확인율, 링크 검토 필요 수, 품절/오류 링크 카드 추가
- Capacitor iOS 플랫폼, App Store 체크리스트, iOS sync/open 스크립트와 release doctor 점검 추가
- iOS 권한/ATT 미선언 검사와 모바일 터치, 입력 줌, overscroll polish CSS 추가
- `/guide` 서비스 안내 페이지 추가, 구매 전 확인/외부 판매처 이동/제휴 고지 기준을 마이와 푸터에 연결
- `/guide`를 sitemap, SEO 전략, Play Store 등록 문구에 반영
- `qa`에 로컬 smoke를 포함하고 `qa:release`로 Android/iOS sync까지 검증하는 출시 후보 명령 추가
- 알림 화면의 미완성 표현을 제거하고 기기 저장 기반 관심 알림 설정 UI를 추가
- 커뮤니티/placeholder 링크 차단 범위를 확대하고 옥션, 이마트몰, 알리익스프레스 판매처 검색 fallback을 공용 리다이렉트에 반영
- 홈 상단 데이터 품질 카드를 모바일 가로 신뢰 배지로 압축해 첫 화면 특가 노출을 앞당김
- 사용자 화면의 내부 `mock` 표현을 제거하고 기본 특가/운영 피드처럼 서비스형 문구로 정리
- 상세 페이지 구매 이동도 저장된 분석/제휴 동의 설정을 따르도록 수정하고 smoke 검증 추가
- 판매처 이동 확인 모달에서 가격/품절 신고로 바로 연결하고 신고 사유 URL prefill 및 smoke 검증 추가
- 찜 페이지 판매처 이동도 저장된 분석/제휴 동의 설정을 따르고 공유/찜 상태 메시지를 표시하도록 개선
- 마이 화면 기기 데이터 관리에 삭제 범위와 운영 검수용 신고 기록 안내를 추가하고 개인정보처리방침에 반영
- release doctor에 개인정보처리방침, 이용약관, 서비스 안내, 데이터 보안 가이드 핵심 문구 검사를 추가
- `.gitignore`에 Android/iOS 민감 파일과 빌드 산출물 보호 범위를 확장하고 release doctor에 추적 민감 파일 검사를 추가
- `.env.example`과 Vercel 배포 가이드에 `DEAL_DATA_MODE`를 반영하고 release doctor에 환경변수 예시 검사 추가
- 운영 대시보드에 링크 검수 큐를 추가해 판매처 검색 fallback 상품을 우선 보강할 수 있도록 개선하고 smoke 검증 추가
- 홈 상단의 내부 링크 검수 수치 노출을 제거하고 일반 사용자에게 구매 전 판매처 확인/가격 재고 변동 안내 중심으로 표시
- 링크 품질 요약과 검수 큐 산출 기준을 공용 품질 레이어로 분리하고 운영 지표 API와 관리자 화면이 같은 기준을 사용하도록 정리
- 테스트 계획을 자동 검증/수동 확인/데이터 링크 신뢰도 기준으로 재정리하고 release doctor가 테스트 종료 기준 문구를 검사하도록 보강
- 문의 이메일을 `NEXT_PUBLIC_SUPPORT_EMAIL`로 중앙화하고 공개 앱 화면에 `.example` 주소가 노출되지 않도록 release doctor와 smoke 검증 추가
- 특가 카드 이미지 alt, 찜/공유/판매처 이동/상세 링크의 상품별 접근성 라벨을 보강하고 release doctor와 smoke 검증 추가
- 검색/필터 결과 없음과 찜 목록 빈 상태에 다음 행동 CTA와 구매 전 확인 안내를 추가하고 release doctor 검증 추가
- 사용자 화면의 `최저가` 단정 표현을 `가격 주목`과 `가격 하락 신호` 중심으로 완화하고 release doctor에 과장 문구 방지 검사를 추가
- 쇼핑몰 필터 로직을 공용 함수로 정리하고 드롭다운에 판매처별 특가 수를 표시하도록 개선
- 공개 상품 신뢰 배지에서 내부 숫자 점수 노출을 제거하고 release doctor에 재노출 방지 검사를 추가
- 독립 `/mypage` 화면에도 분석/제휴 설정 패널을 추가해 마이 설정에서 직접 동의 상태를 바꿀 수 있도록 개선
- 파트너 피드 import dry-run에서 placeholder와 커뮤니티 게시글 링크를 거부하도록 검증을 강화하고 smoke 테스트를 추가
- 운영 신고 큐에 한국어 신고 사유, 접수번호, 처리 기준 안내를 추가해 가격 오류 처리 흐름을 명확히 개선
- 운영 링크 검수 큐의 내부 상태 코드를 한국어 상태와 보강 액션으로 바꿔 직접 구매 URL 보강 우선순위를 명확히 표시
- 홈 추천 점수와 주요 섹션 정렬에 구매 링크 확인 상태를 반영해 직접 구매 URL이 검증된 특가를 더 우선 노출
- 핫시그널 버튼 접근성 라벨과 링크 상태 배지 색상을 상품/상태별로 정리하고 상세 가격 문구의 단정 표현을 완화
- 카테고리와 알림 페이지가 기본 데이터 배열이 아니라 Deal repository를 통해 운영/검수 피드 전환 구조를 따르도록 개선
- 찜 페이지도 `/api/deals` 카탈로그와 동기화해 운영 피드 전환 시 저장된 관심 특가 목록이 같은 데이터 기준을 사용하도록 개선
- `.env.example`의 데이터 공급 모드를 실제 repository 런타임 모드와 일치시키고 release doctor가 잘못된 모드 예시를 잡도록 보강
- `/api/deals` fallback 응답도 canonical Deal 정규화를 거치고 사용자 화면에 `mock` 표현이 노출되지 않도록 개선
- Capacitor 정적 export 빌드에서 적용되지 않는 headers 설정을 제외해 Android/iOS 패키징 경고를 줄이고, 빌드 스크립트가 `DEAL_DATA_MODE`를 명시하도록 개선
- 전역 하단 탭, 홈 내부 주요 메뉴, 데스크톱 주요 메뉴에 현재 위치/배지 수 접근성 라벨을 추가하고, 모바일 푸터 정책 링크가 작은 화면에서 자연스럽게 줄바꿈되도록 개선
- 데스크톱 상단 메뉴의 검색/새로고침/현재 위치 라벨과 라이브 특가·핫딜 브리핑 이미지 대체 텍스트 및 키보드 진입성을 보강
- 검증 구매 링크 판정과 링크 품질 점수를 공용 함수로 중앙화해 홈 필터, 추천 섹션, 카드, 라이브 피드, 이동 확인 모달, 운영 지표가 같은 기준을 따르도록 정리
- 검색창, 정렬, 쇼핑몰 필터, 빠른 필터, 카테고리 탭에 접근성 이름과 선택 상태 라벨을 보강해 모바일 커머스 탐색 경험을 개선
- 상세 페이지의 관심 특가/공유/판매처 확인 액션에 접근성 라벨, 눌림 상태, 성공·취소 피드백을 추가해 반복 사용 UX를 개선
- 특가 카드, 라이브 피드, 브리핑, 상세 이미지에 프록시 헬퍼와 lazy/eager 로딩, async decoding, referrer 정책을 적용해 이미지 많은 화면의 안정성을 개선
- iOS `PrivacyInfo.xcprivacy`를 추가하고 Xcode 리소스에 포함해 V1 기준 추적 없음/수집 데이터 없음 상태를 App Store 제출 표면에 명시
- `lib/deals/linkValidator.ts`와 구매 링크 검증 필드를 추가해 상품 상세 URL, 검색 fallback, 커뮤니티/placeholder 링크를 API와 UI에서 명확히 구분
- 커뮤니티 출처 본문에서 실제 쇼핑몰 상품 상세 URL만 추출하는 `communityLinkExtractor` 구조를 준비하고 원본 글은 `sourceUrl/sourceName`으로 분리하는 정책을 문서화
- 관리자 링크 검수 큐에 우선순위, 보강 사유, 구매 링크 신뢰도, 현재 이동 URL을 추가해 실제 운영자가 먼저 처리할 상품을 판단할 수 있도록 개선

### PHASE 2 코드 품질

- Deal 타입에 배송 정보, 설명, 유의사항 추가
- Deal canonical 필드 표준화: `mallName`, `thumbnail`, `shipping`, `expireAt`, `isFreeShipping`
- 구매 링크 검증 필드 표준화: `linkVerified`, `finalUrl`, `checkedAt`, `purchaseConfidence`, `purchaseLinkVerified`, `finalPurchaseUrl`
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
- `docs/link-policy.md`

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
- smoke 30개 항목으로 확장: category/notification pages, report validation, home query filters, deal link integrity, partner feed unsafe link guard, redirect fallback, affiliate status, admin export, metrics link review queue 포함
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
9. 커뮤니티 출처는 원문 링크만 저장하지 않고 본문 내 실제 쇼핑몰 상품 상세 URL 추출 결과를 우선 저장

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

## 최근 진행

- Supabase OAuth, 딥링크, 회원 탈퇴, 찜/최근 본 상품 DB 동기화 구조를 release doctor 75개 항목과 smoke 34개 항목으로 검증하도록 출시 게이트를 확장했다.
- `/auth/callback`, `/onboarding`, `/api/account/delete` guard를 smoke에 추가해 소셜 로그인 진입, 온보딩, 탈퇴 보안 실패 흐름을 자동 확인한다.
- 회원 데이터 동기화 로직을 `lib/memberSync.ts`로 분리해 Supabase 연결 시 DB 우선, 실패 시 기기 저장 fallback 구조를 유지한다.
- OAuth redirect URL 생성과 open redirect 방지를 `lib/auth/redirect.ts`로 중앙화하고, Android/iOS 딥링크 설정 문서를 release doctor가 확인하도록 보강했다.
