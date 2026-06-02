# 할인도사 릴리즈 증빙

이 문서는 Play Store/App Store 제출 전 자동 검증 결과와 산출물 위치를 한곳에 남기기 위한 스냅샷입니다.

## 기본 정보

- 생성 시각: 2026-06-02T17:39:41.369Z
- Git 브랜치: codex/12h-product-ux-growth-hardening
- 최신 커밋: c2b28ed
- Git 상태: clean
- 패키지 버전: 1.0.0
- 앱 이름: 할인도사
- 앱 ID / 패키지명: com.halindosa.app
- Capacitor webDir: out
- Android versionCode: 1
- Android versionName: 1.0.0

## 산출물

| 항목 | 경로 | 크기 |
| --- | --- | --- |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` | 10.12MB |
| Release AAB | `android/app/build/outputs/bundle/release/app-release.aab` | 6.20MB |
| Play Store icon | `assets/store/play-store-icon-512.png` | 26KB |
| Feature graphic | `assets/store/feature-graphic-1024x500.png` | 47KB |
| iOS App icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 61KB |
| iOS privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | 373B |
| Commercial audit report | `docs/AUDIT_REPORT.md` | 291B |
| Environment doctor report | `docs/ENV_DOCTOR_REPORT.md` | 581B |
| Public URL submission report | `docs/PUBLIC_URL_REPORT.md` | 2KB |
| Store metadata QA report | `docs/STORE_METADATA_REPORT.md` | 2KB |
| Store asset QA report | `docs/STORE_ASSETS_REPORT.md` | 1KB |
| Device QA readiness report | `docs/DEVICE_QA_REPORT.md` | 3KB |
| Store submission readiness report | `docs/STORE_SUBMISSION_REPORT.md` | 5KB |
| Store screenshot QA report | `docs/STORE_SCREENSHOTS_REPORT.md` | 2KB |
| Harness report | `docs/HARNESS_REPORT.md` | 20KB |
| Link coverage report | `docs/link-coverage-report.md` | 7KB |

## 제출 전 검증 명령

아래 명령은 릴리즈 후보를 확인할 때 사용합니다.

```bash
npm install
npm run env:doctor
npm run env:doctor:production
npm run test:env
npm run public:url:doctor
npm run device:qa:doctor
npm run android:signing:doctor
npm run harness
npm run qa:release
npm run android:bundle
npm run release:evidence
```

## 자동 검증 범위

- harness: lint, build, 링크/이미지/검색/UI/모바일/SEO/성능/smoke/release doctor 종합 검증
- lint, smoke, Next.js build, release doctor
- environment doctor: 공개 URL, OAuth redirect, Supabase, 운영 토큰, 데이터 모드 점검
- production environment doctor: 공개 HTTPS URL, 동일 origin OAuth callback, 운영 Supabase/토큰 placeholder 차단
- env doctor regression: localhost, OAuth callback origin 불일치, 위험한 앱 스킴 차단 검증
- public URL doctor: /privacy, /support, sitemap, robots, 스토어 제출 URL 문구 일관성 점검
- commercial security audit: npm audit 취약점 0건 기준 차단
- device QA doctor: 실제 기기 기록 템플릿, 구매 링크 샘플, 남은 Critical Issue 기록 기준 점검
- Android signing doctor: 로컬 keystore 미커밋, signing config 예시, release AAB 서명 준비 기준 점검
- Android 정적 export 및 Capacitor Android sync
- Capacitor iOS sync
- performance budget: 정적 export, JS/CSS, APK/AAB, 스토어 이미지 크기 검사
- Android/iOS 앱 ID, 버전, 아이콘, 스플래시, 권한, 딥링크, 개인정보 manifest 점검
- 구매 링크 커버리지 보고서: 검증된 실제 구매 상세 URL과 보강 대기 상품 목록 점검
- 정책 페이지, 스토어 등록 문서, 데이터 보안/콘텐츠 등급/스크린샷 가이드 점검

## 남은 수동 확인

- Android Studio 또는 Play Console에서 signed AAB 업로드
- macOS/Xcode에서 iOS Archive 및 App Store Connect 업로드
- docs/device-qa-checklist.md 기준 실제 기기에서 홈, 검색, 상세, 찜, 알림, 마이, 외부 브라우저 이동 확인
- docs/deployment-env-checklist.md 기준 운영 환경변수 strict 점검
- Supabase OAuth Provider와 공개 개인정보처리방침/고객지원 URL을 운영 값으로 설정
- 공개 도메인에서 /privacy, /support, /sitemap.xml, /robots.txt 외부 네트워크 접근 확인
- Android release keystore를 로컬 파일 또는 Android Studio signing wizard로 설정하고 signed AAB 생성
- 링크 검수 큐 상위 상품의 실제 구매 URL 직접 확인

