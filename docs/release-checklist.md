# 할인도사 출시 체크리스트

## 빌드 전

- [x] `npm install`
- [x] `npm run build`
- [x] `npm run build:android`
- [x] `npm run cap:sync`
- [x] `npm run android:doctor`
- [x] `npm run android:debug`
- [x] `npm run android:bundle`
- [x] `npm run release:doctor`
- [x] `npm run smoke:local`
- [x] `npm run qa`
- [x] `npm run audit:commercial`
- [x] `npm run perf:budget`
- [x] `npm run release:evidence`
- [x] `npm run qa:release`는 `audit:commercial`, `perf:budget`, Android/iOS sync, release doctor까지 포함

## Android 설정

- [x] 앱 이름: 할인도사
- [x] 패키지명/applicationId: `com.halindosa.app`
- [x] versionCode: 1
- [x] versionName: 1.0.0
- [x] Capacitor webDir: `out`
- [x] 앱 아이콘 구조 준비
- [x] 스플래시 구조 준비
- [x] INTERNET 권한만 사용
- [ ] release keystore 생성
- [ ] signed AAB 생성
- [ ] `android/keystore.properties`는 로컬에만 보관
- [x] `android/keystore.properties.example` 기준으로 서명 설정 확인

## iOS / App Store 설정

- [x] Capacitor iOS 플랫폼 생성: `ios/App`
- [x] Bundle Identifier: `com.halindosa.app`
- [x] 앱 표시 이름: 할인도사
- [x] iOS version: `1.0.0`
- [x] iOS build number: `1`
- [x] App Icon asset 구조 준비
- [x] Splash asset 구조 준비
- [x] `PrivacyInfo.xcprivacy` 번들 포함: V1 기준 추적 없음, 수집 데이터 없음
- [x] `npm run cap:sync:ios` 스크립트 준비
- [x] `npm run cap:open:ios` 스크립트 준비
- [x] 불필요한 iOS 권한/ATT 문구 없음
- [x] 모바일 터치, safe-area, iOS 입력 줌 방지 CSS 적용
- [ ] Mac/Xcode에서 Signing Team 선택
- [ ] 실제 iPhone 또는 Simulator에서 실행 확인
- [ ] Xcode Archive 생성
- [ ] App Store Connect 업로드
- [ ] `docs/app-store-checklist.md` 기준으로 App Privacy 작성

## Play Console

- [ ] 앱 등록
- [ ] 앱 카테고리: 쇼핑
- [ ] 짧은 설명 입력
- [ ] 긴 설명 입력
- [ ] `docs/play-store-listing.md` 내용 검토
- [ ] `docs/data-safety-guide.md` 기준으로 데이터 보안 섹션 작성
- [ ] `docs/content-rating-guide.md` 기준으로 콘텐츠 등급 설문 작성
- [ ] `docs/test-plan.md` 기준으로 내부 테스트 진행
- [ ] 스크린샷 업로드
- [ ] 기능 그래픽 업로드
- [ ] `docs/store-assets-guide.md` 기준으로 이미지 문구 검수
- [ ] 개인정보처리방침 URL 입력
- [ ] 테스트 트랙 생성
- [ ] 내부 테스트 업로드

## 출시 전 품질

- [ ] Android Studio Emulator 실행 확인
- [ ] 실제 기기 설치 확인
- [ ] 홈, 카테고리, 검색, 찜, 알림, 마이 화면 확인
- [ ] 외부 링크가 외부 브라우저 또는 Custom Tab으로 열리는지 확인
- [ ] 개인정보처리방침과 이용약관 접근 확인
- [ ] 앱 아이콘과 스플래시 확인
- [ ] 네트워크 오류 시 fallback 표시 확인

## 운영 전

- [ ] 실제 데이터 제공 방식 확정
- [ ] 공식 API, RSS, 제휴 피드, 허용된 수집 방식만 사용
- [ ] 제휴/광고 고지 문구 법무 검토
- [ ] 고객 문의 이메일 준비
- [ ] 개인정보처리방침 실제 도메인 배포

## 현재 확인된 산출물

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Roadmap: `docs/roadmap.md`
- Store asset guide: `docs/store-assets-guide.md`
- Release evidence: `docs/release-evidence.md`
- Play Store icon draft: `assets/store/play-store-icon-512.png`
- Feature graphic draft: `assets/store/feature-graphic-1024x500.png`

## 남은 Critical Issue

현재 코드와 자동 검증 기준에서 남은 Critical Issue 없음.
