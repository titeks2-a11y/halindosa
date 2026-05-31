# 할인도사 App Store 출시 체크리스트

## 현재 준비 상태

- [x] Capacitor iOS 플랫폼 생성: `ios/App`
- [x] Bundle Identifier: `com.halindosa.app`
- [x] 앱 표시 이름: `할인도사`
- [x] 버전: `1.0.0`
- [x] 빌드 번호: `1`
- [x] App Icon asset 구조 생성
- [x] Splash asset 구조 생성
- [x] Next.js 정적 export 결과물을 iOS 프로젝트에 sync 가능
- [x] 개인정보처리방침, 이용약관 페이지 준비
- [x] iOS Info.plist에 추적, 카메라, 마이크, 위치, 연락처, 사진 권한 미선언
- [x] `ios/App/App/PrivacyInfo.xcprivacy` 추가: V1 기준 추적 없음, 수집 데이터 없음
- [x] 모바일 터치 지연, iOS 입력 줌, safe-area 기본 대응

## Mac/Xcode에서 해야 할 작업

Windows에서는 iOS 앱 빌드와 App Store 업로드를 완료할 수 없다. 아래 작업은 macOS와 Xcode가 필요하다.

1. 저장소를 Mac에 clone한다.
2. `npm install`을 실행한다.
3. `npm run build:android` 또는 `npm run build` 후 `npm run cap:sync:ios`를 실행한다.
4. `npm run cap:open:ios`로 Xcode를 연다.
5. Xcode Signing & Capabilities에서 Apple Developer Team을 선택한다.
6. Bundle Identifier가 `com.halindosa.app`인지 확인한다.
7. Display Name이 `할인도사`인지 확인한다.
8. 실제 iPhone 시뮬레이터와 실제 기기에서 홈, 상세, 찜, 마이, 정책 페이지를 확인한다.
9. Product > Archive를 실행한다.
10. Organizer에서 App Store Connect로 업로드한다.

## App Store Connect 등록정보

- 앱 이름: 할인도사
- 부제: 실시간 할인 특가 정보를 가장 빠르게 찾는 방법
- 기본 카테고리: Shopping
- 보조 카테고리: Lifestyle
- 연령 등급: 4+ 예상
- 가격: 무료
- 로그인 필요 여부: 아니오. 비회원 열람 가능, 찜/최근 본 상품 동기화와 개인화 설정에만 로그인 사용
- 계정 삭제 URL: 공개 배포 도메인의 `/mypage` 또는 고객지원 안내. 앱 내 마이페이지에 회원 탈퇴 기능 제공
- 개인정보처리방침 URL: 공개 배포 도메인의 `/privacy`

## App Privacy 작성 기준

현재 V1 기준:

- 비회원 열람 가능
- 이메일/소셜 로그인 사용 시 이메일, 사용자 ID, 닉네임 또는 프로필 이름 일부 처리
- 찜, 최근 본 특가, 관심 카테고리, 알림/마케팅 수신 설정은 로그인 사용자의 계정 데이터로 저장 가능
- 전화번호, 주소, 결제 정보, 위치 정보 수집 없음
- 외부 구매 링크는 판매처 또는 제휴 링크로 열릴 수 있음
- 분석/광고 SDK는 아직 연결하지 않음
- iOS 번들에는 `PrivacyInfo.xcprivacy`가 포함되어 있으며 V1 기준 `NSPrivacyTracking=false`로 선언함. App Store Connect의 수집 데이터 답변은 실제 Supabase Auth 운영 여부와 맞춰 입력해야 함

운영에서 GA4, Firebase Analytics, AdMob, FCM, 제휴 SDK를 연결하면 App Privacy를 다시 작성해야 한다.

## ATT와 추적 동의

현재 앱은 iOS IDFA 기반 추적을 사용하지 않는다. 따라서 App Tracking Transparency 권한 요청은 넣지 않는다.

향후 광고 SDK가 앱 외부 데이터와 결합해 사용자를 추적하면:

- `NSUserTrackingUsageDescription` 문구 추가
- ATT 권한 요청 UI 구현
- 개인정보처리방침과 App Privacy 수정

## 스크린샷 준비

권장 6장:

1. 홈: 오늘의 특가, 인기 급상승, 링크 품질 안내
2. 검색/필터: 구매링크 확인만, 무료배송, 마감임박 필터
3. 상세: 가격, 배송, 구매 전 확인 안내
4. 찜: 관심 특가 목록
5. 마이: 정책 링크와 기기 데이터 관리
6. 알림: 마감임박, 신규, 인기 특가 알림 구조

## 심사 리스크

- `실시간`, `최저가`, `역대가` 표현은 과장으로 보이지 않게 구매 전 최종 확인 안내를 함께 표시한다.
- 커뮤니티 게시글을 구매 링크처럼 표시하지 않는다.
- 판매처 검색 링크는 `판매처 검색 확인` 또는 `확인 필요`로 명확히 표시한다.
- 실제 결제, 환불, 배송은 판매처 책임임을 이용약관과 이동 전 확인 화면에 표시한다.

## 출시 전 명령

```bash
npm install
npm run lint
npm run smoke:local
npm run qa
npm run qa:release
npm run build:android
npm run cap:sync
npm run cap:sync:ios
npm run release:doctor
```
