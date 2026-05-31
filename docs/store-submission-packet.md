# 할인도사 스토어 제출 패킷

이 문서는 Play Console과 App Store Connect에 제출할 때 필요한 파일, 문서, URL, 최종 확인 명령을 한곳에 모은 제출용 인덱스입니다.

## 제출 파일

| 용도 | 경로 | 상태 |
| --- | --- | --- |
| Android debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` | 내부 설치 확인용 |
| Android release AAB | `android/app/build/outputs/bundle/release/app-release.aab` | signed AAB는 Android Studio 또는 로컬 keystore로 재생성 |
| Play Store icon | `assets/store/play-store-icon-512.png` | 스토어 등록정보 업로드 |
| Play Store feature graphic | `assets/store/feature-graphic-1024x500.png` | 스토어 등록정보 업로드 |
| iOS app icon source | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | Xcode Archive 확인 |
| iOS privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | V1 기준 추적 없음/수집 데이터 없음 |

## 제출 문서

- Play Store 등록 문구: `docs/play-store-listing.md`
- App Store 등록 체크리스트: `docs/app-store-checklist.md`
- 개인정보처리방침 초안: `docs/privacy-policy-draft.md`
- 이용약관 초안: `docs/terms-draft.md`
- 데이터 보안 답변 가이드: `docs/data-safety-guide.md`
- 콘텐츠 등급 답변 가이드: `docs/content-rating-guide.md`
- 스토어 심사 메모: `docs/store-review-notes.md`
- 스토어 스크린샷 스토리보드: `docs/store-assets-guide.md`
- 릴리즈 증빙: `docs/release-evidence.md`

## 제출 전 명령

```bash
npm install
npm run env:doctor
node scripts/env-doctor.mjs --strict
npm run qa:release
npm run android:bundle
npm run release:evidence
npm run release:doctor
```

`--strict`는 운영 환경변수가 채워진 환경에서만 통과해야 합니다. 로컬 개발 환경에서 운영 값이 없으면 실패하는 것이 정상입니다.

## Play Console 입력값

- 앱 이름: 할인도사
- 패키지명: `com.halindosa.app`
- 카테고리: 쇼핑
- 개인정보처리방침 URL: 공개 배포 도메인의 `/privacy`
- 앱 액세스: 비회원 열람 가능, 선택 로그인 제공
- 고객 지원: 공개 배포 도메인의 `/support`
- 심사자 메모: `docs/store-review-notes.md`의 Google Play 앱 액세스/데이터 보안 답변 초안 참고
- 데이터 보안: `docs/data-safety-guide.md` 기준으로 실제 운영 여부에 맞춰 입력
- 콘텐츠 등급: `docs/content-rating-guide.md` 기준으로 입력

## App Store Connect 입력값

- 앱 이름: 할인도사
- Bundle ID: `com.halindosa.app`
- 카테고리: Shopping
- 개인정보처리방침 URL: 공개 배포 도메인의 `/privacy`
- Support URL: 공개 배포 도메인의 `/support`
- Sign in requirement: 비회원 열람 가능, 선택 로그인 제공
- Review Notes: `docs/store-review-notes.md`의 App Store Review Notes 문구를 실제 제출 화면에 맞춰 붙여넣기
- App Privacy: V1 기준 개인정보 판매 없음, 추적 없음. Supabase Auth 운영 시 계정 식별자와 사용자 콘텐츠 저장 여부를 실제 값으로 입력

## 최종 수동 확인

- [ ] `docs/device-qa-checklist.md` 기준 Android/iOS 실기기 QA 완료
- [ ] `docs/store-review-notes.md` 기준 심사자 메모, 비회원 접근, 외부 구매 링크, 데이터 처리 안내 입력
- [ ] OAuth Provider와 `halindosa://auth/callback` 딥링크 복귀 확인
- [ ] 상위 노출 상품 10개 이상의 실제 구매 링크 또는 허용된 fallback 확인
- [ ] signed AAB 업로드 후 Play Console pre-launch report 확인
- [ ] Xcode Archive 업로드 후 App Store Connect processing 확인
- [ ] 공개 개인정보처리방침 URL이 외부 네트워크에서 열리는지 확인
