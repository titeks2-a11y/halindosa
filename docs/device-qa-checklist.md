# 할인도사 실기기 QA 체크리스트

이 문서는 Play Store 내부 테스트와 App Store TestFlight 제출 전에 실제 기기에서 확인할 항목을 한 장으로 정리한 체크리스트입니다. 자동 검증이 통과해도 아래 항목은 Android Emulator, 실제 Android 기기, 가능하면 iPhone Simulator 또는 실제 iPhone에서 직접 확인합니다.
확인 결과는 `docs/device-qa-record-template.md`에 기준 커밋과 기기별 결과로 남깁니다.

## 준비

- 최신 커밋 기준으로 `npm run qa:release`와 `npm run release:doctor`가 통과했는지 확인
- 모바일 첫 화면 회귀는 `npm run test:mobile-ux`와 `MOBILE_UX_REPORT.md` 10개 게이트가 통과했는지 확인
- Android는 Android Studio에서 `android` 폴더를 열고 Gradle Sync 완료
- iOS는 macOS/Xcode 환경에서 `ios/App` 프로젝트를 열고 Signing Team 선택
- 테스트 계정 이메일, Google/Kakao/Naver OAuth 테스트 계정, Supabase 프로젝트 URL 준비
- 네트워크 정상 상태와 비행기 모드 또는 네트워크 불안정 상태를 각각 확인

## Android 기기 확인

- [ ] 앱 설치 후 첫 실행에서 스플래시와 홈 화면이 자연스럽게 이어진다.
- [ ] 하단 탭바가 제스처 영역, 내비게이션 바, safe area와 겹치지 않는다.
- [ ] 홈의 오늘 볼 특가, 구매 전 체크, 쇼핑몰 필터, 최근 본 특가 영역이 작은 화면에서 잘리지 않는다.
- [ ] 상품 카드의 가격 변동 가능 안내, 쇼핑몰명, 업데이트 시간이 작은 화면에서도 읽힌다.
- [ ] 상품 상세에서 구매 전 판매처 확인 버튼을 누르면 외부 브라우저 또는 Custom Tab이 열린다.
- [ ] 뒤로가기 버튼으로 외부 브라우저에서 앱으로 돌아왔을 때 홈/상세 상태가 어색하게 초기화되지 않는다.
- [ ] 공유하기 버튼이 Android 공유 시트를 연다.
- [ ] 찜 추가 후 앱 종료/재실행 시 찜 상태가 유지된다.
- [ ] 최근 본 특가 기록이 상세 진입 후 홈과 마이페이지에 반영된다.
- [ ] 알림 화면의 가격 알림 조건 저장/해제가 기기 저장 기준으로 유지된다.
- [ ] 개인정보처리방침, 이용약관, 서비스 안내 링크가 앱 안에서 접근 가능하다.

## iOS 기기 또는 Simulator 확인

- [ ] 앱 아이콘, 스플래시, 표시 이름 `할인도사`가 정상 표시된다.
- [ ] iOS safe area에서 홈, 상세, 하단 탭바가 겹치지 않는다.
- [ ] iOS 입력창 포커스 시 화면 확대가 발생하지 않는다.
- [ ] 외부 판매처 이동이 Safari View 또는 외부 브라우저로 자연스럽게 열린다.
- [ ] 공유하기 버튼이 iOS 공유 시트를 연다.
- [ ] `halindosa://auth/callback` 딥링크가 OAuth callback으로 복귀할 수 있다.
- [ ] `PrivacyInfo.xcprivacy` 기준과 다르게 추적 권한 요청 팝업이 뜨지 않는다.

## 로그인과 계정 데이터

- [ ] 이메일 회원가입 후 온보딩에서 관심 카테고리를 선택할 수 있다.
- [ ] 이메일 로그인 후 찜/최근 본 상품이 마이페이지에 표시된다.
- [ ] Google OAuth 로그인 후 앱으로 복귀한다.
- [ ] Kakao OAuth 로그인 후 앱으로 복귀한다.
- [ ] Naver OAuth 로그인 후 앱으로 복귀한다.
- [ ] 로그아웃 후 비회원 상태에서도 특가 목록과 상세를 볼 수 있다.
- [ ] 회원 탈퇴 테스트 계정은 `user_profiles`, `user_favorite_deals`, `user_recent_deals`, `price_drop_alerts`가 삭제되고 `deal_click_logs`는 익명화된다.

## 구매 링크와 신고

- [ ] 홈 상위 노출 상품 10개 이상에서 판매처 이동 URL이 실제 상품 상세 또는 공식 혜택/이벤트 상세 URL로 열린다.
- [ ] 판매처 이동 전 모달의 예정 도메인이 실제 열리는 도메인과 일치한다.
- [ ] 가격/품절 신고 화면에서 상품 ID와 신고 사유가 미리 채워진다.
- [ ] 신고 접수 후 접수번호와 다음 행동 안내가 표시된다.
- [ ] 커뮤니티 글, placeholder, `javascript:`, `data:`, `file:` 링크가 구매 링크로 열리지 않는다.

## 스토어 제출 직전 판정

- [ ] `docs/release-evidence.md`의 최신 커밋과 현재 Git 커밋이 일치한다.
- [ ] `android/app/build/outputs/bundle/release/app-release.aab` 또는 Android Studio signed AAB가 준비됐다.
- [ ] App Store Connect용 Archive가 Xcode Organizer에 생성됐다.
- [ ] Play Console 개인정보처리방침 URL이 실제 공개 URL로 입력됐다.
- [ ] 스토어 스크린샷은 `docs/store-assets-guide.md`의 금지 문구와 내부 점수 노출 금지 기준을 따른다.
- [ ] 링크 검수 큐 상위 항목은 출시 전 직접 구매/공식 혜택 URL로 보강하고, 검색 fallback 항목은 기본 상품 목록에 노출하지 않는다.
