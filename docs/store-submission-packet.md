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
- 실기기 QA 체크리스트: `docs/device-qa-checklist.md`
- 실기기 QA 기록 양식: `docs/device-qa-record-template.md`
- 실기기 QA 실행 매니페스트: `docs/DEVICE_QA_MANIFEST.md`, `DEVICE_QA_MANIFEST.json`
- 릴리즈 증빙: `docs/release-evidence.md`
- 공개 URL 제출 리포트: `docs/PUBLIC_URL_REPORT.md`
- 스토어 메타데이터 QA 리포트: `docs/STORE_METADATA_REPORT.md`
- 스토어 이미지 QA 리포트: `docs/STORE_ASSETS_REPORT.md`
- 스토어 스크린샷 QA 리포트: `docs/STORE_SCREENSHOTS_REPORT.md`
- 스토어 스크린샷 촬영 매니페스트: `docs/STORE_SCREENSHOT_MANIFEST.md`, `STORE_SCREENSHOT_MANIFEST.json`
- 스토어 제출 준비 리포트: `docs/STORE_SUBMISSION_REPORT.md`
- 스토어 제출 패킷 QA 리포트: `docs/STORE_PACKET_REPORT.md`
- 스토어 콘솔 입력 필드 매니페스트: `docs/STORE_CONSOLE_FIELDS.md`, `STORE_CONSOLE_FIELDS.json`
- 수동 제출 체크리스트: `docs/STORE_MANUAL_CHECKLIST.md`, `STORE_MANUAL_CHECKLIST.md`, `STORE_MANUAL_CHECKLIST.json`
- 스토어 출시 인수인계 리포트: `docs/STORE_HANDOFF_REPORT.md`, `STORE_HANDOFF_REPORT.md`
- 릴리즈 노트: `docs/RELEASE_NOTES.md`, `RELEASE_NOTES.md`, `RELEASE_NOTES.json`
- 고객지원 플레이북: `docs/SUPPORT_PLAYBOOK.md`, `SUPPORT_PLAYBOOK.md`, `SUPPORT_PLAYBOOK.json`

## 제출 전 명령

```bash
npm install
npm run env:doctor
node scripts/env-doctor.mjs --strict
npm run env:doctor:production
npm run test:env
npm run public:url:doctor
npm run device:qa:manifest
npm run device:qa:doctor
npm run device:qa:report
npm run store:metadata:doctor
npm run store:assets:doctor
npm run store:screenshots:manifest
npm run store:screenshots:doctor
npm run store:submission:report
npm run store:packet:doctor
npm run store:console:fields
npm run store:manual:checklist
npm run store:manual:doctor
npm run store:handoff:report
npm run release:notes
npm run support:playbook
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
- 테스트 계정: 필요 없음. 앱 액세스 항목에는 “주요 기능은 비회원으로 검토 가능하며 로그인은 선택 기능”이라고 입력
- 데이터 보안: `docs/data-safety-guide.md` 기준으로 실제 운영 여부에 맞춰 입력
- 콘텐츠 등급: `docs/content-rating-guide.md` 기준으로 입력

### Play Console 복사 입력 블록

앱 액세스:

```text
할인도사는 비회원으로 홈, 검색, 카테고리, 상세, 찜, 알림, 마이 화면을 확인할 수 있습니다. 로그인은 찜한 특가, 최근 본 상품, 관심 카테고리를 계정으로 이어보기 위한 선택 기능입니다. 테스트 계정은 필요하지 않습니다.
```

심사자 메모:

```text
앱은 직접 상품을 판매하거나 결제를 처리하지 않습니다. 상품의 구매, 결제, 배송, 환불은 외부 판매처에서 처리됩니다. 상품 카드 또는 상세 화면의 구매 버튼을 누르면 이동 예정 도메인과 가격 확인 안내가 먼저 표시되고, 사용자가 확인하면 외부 브라우저 또는 판매처 페이지로 이동합니다.
```

개인정보처리방침 URL:

```text
https://halindosa.com/privacy
```

고객 지원 URL:

```text
https://halindosa.com/support
```

## App Store Connect 입력값

- 앱 이름: 할인도사
- Bundle ID: `com.halindosa.app`
- 카테고리: Shopping
- 개인정보처리방침 URL: 공개 배포 도메인의 `/privacy`
- Support URL: 공개 배포 도메인의 `/support`
- Sign in requirement: 비회원 열람 가능, 선택 로그인 제공
- Review Notes: `docs/store-review-notes.md`의 App Store Review Notes 문구를 실제 제출 화면에 맞춰 붙여넣기
- Demo Account: 필요 없음. Review Notes에 “No demo account is required”와 비회원 확인 경로를 함께 입력
- App Privacy: V1 기준 개인정보 판매 없음, 추적 없음. Supabase Auth 운영 시 계정 식별자와 사용자 콘텐츠 저장 여부를 실제 값으로 입력

### App Store Connect 복사 입력 블록

Review Notes:

```text
The app can be reviewed without a required account. Login is optional and only used to sync saved deals, recent views, and preferred categories. The app does not sell products or process payments directly. Purchase buttons show a confirmation sheet first, then open an external seller page in the browser. No demo account is required.
```

Support URL:

```text
https://halindosa.com/support
```

Privacy Policy URL:

```text
https://halindosa.com/privacy
```

## 최종 수동 확인

- [ ] `docs/DEVICE_QA_MANIFEST.md`의 대상 기기, 빌드 산출물, 구매 링크 샘플 기준으로 Android/iOS 실기기 QA 완료
- [ ] `docs/store-review-notes.md` 기준 심사자 메모, 비회원 접근, 외부 구매 링크, 데이터 처리 안내 입력
- [ ] OAuth Provider와 `halindosa://auth/callback` 딥링크 복귀 확인
- [ ] 상위 노출 상품 10개 이상의 실제 구매 링크 또는 공식 혜택 상세 URL 확인
- [ ] signed AAB 업로드 후 Play Console pre-launch report 확인
- [ ] Xcode Archive 업로드 후 App Store Connect processing 확인
- [ ] 공개 개인정보처리방침 URL이 외부 네트워크에서 열리는지 확인
