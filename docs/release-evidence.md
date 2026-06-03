# 할인도사 릴리즈 증빙

이 문서는 Play Store/App Store 제출 전 자동 검증 결과와 산출물 위치를 한곳에 남기기 위한 스냅샷입니다.

## 기본 정보

- 생성 시각: 2026-06-03T20:52:06.959Z
- Git 브랜치: codex/12h-product-ux-growth-hardening
- 최신 커밋: fa7ad89
- Git 상태: clean
- 패키지 버전: 1.0.1
- 앱 이름: 할인도사
- 앱 ID / 패키지명: com.halindosa.app
- Capacitor webDir: out
- Android versionCode: 2
- Android versionName: 1.0.1

## 산출물

| 항목 | 경로 | 크기 |
| --- | --- | --- |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` | 10.12MB |
| Release AAB | `android/app/build/outputs/bundle/release/app-release.aab` | 13.58MB |
| Play Store icon | `assets/store/play-store-icon-512.png` | 26KB |
| Feature graphic | `assets/store/feature-graphic-1024x500.png` | 47KB |
| iOS App icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | 61KB |
| iOS privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | 373B |
| Commercial audit report | `docs/AUDIT_REPORT.md` | 291B |
| Environment doctor report | `docs/ENV_DOCTOR_REPORT.md` | 581B |
| Public URL submission report | `docs/PUBLIC_URL_REPORT.md` | 3KB |
| Store metadata QA report | `docs/STORE_METADATA_REPORT.md` | 2KB |
| Store asset QA report | `docs/STORE_ASSETS_REPORT.md` | 1KB |
| Device QA execution manifest | `docs/DEVICE_QA_MANIFEST.md` | 5KB |
| Device QA execution manifest JSON | `DEVICE_QA_MANIFEST.json` | 6KB |
| Device QA readiness report | `docs/DEVICE_QA_REPORT.md` | 4KB |
| Store submission readiness report | `docs/STORE_SUBMISSION_REPORT.md` | 5KB |
| Store submission packet QA report | `docs/STORE_PACKET_REPORT.md` | 6KB |
| Store console fields manifest | `docs/STORE_CONSOLE_FIELDS.md` | 4KB |
| Store console fields manifest JSON | `STORE_CONSOLE_FIELDS.json` | 4KB |
| Store manual submission checklist | `docs/STORE_MANUAL_CHECKLIST.md` | 5KB |
| Store manual submission checklist JSON | `STORE_MANUAL_CHECKLIST.json` | 6KB |
| Store launch handoff report | `docs/STORE_HANDOFF_REPORT.md` | 5KB |
| Release notes | `docs/RELEASE_NOTES.md` | 5KB |
| Release notes JSON | `RELEASE_NOTES.json` | 5KB |
| Support playbook | `docs/SUPPORT_PLAYBOOK.md` | 6KB |
| Support playbook JSON | `SUPPORT_PLAYBOOK.json` | 5KB |
| Known issues report | `docs/KNOWN_ISSUES.md` | 3KB |
| Known issues report root copy | `KNOWN_ISSUES.md` | 3KB |
| Store screenshot QA report | `docs/STORE_SCREENSHOTS_REPORT.md` | 3KB |
| Store screenshot manifest | `docs/STORE_SCREENSHOT_MANIFEST.md` | 4KB |
| Store screenshot manifest JSON | `STORE_SCREENSHOT_MANIFEST.json` | 5KB |
| Harness report | `docs/HARNESS_REPORT.md` | 20KB |
| Operational health readiness report | `docs/HEALTH_READINESS_REPORT.md` | 4KB |
| Operational health readiness JSON | `reports/health-readiness.json` | 8KB |
| Push readiness report | `docs/PUSH_READINESS_REPORT.md` | 5KB |
| Push readiness JSON | `reports/push-readiness.json` | 11KB |
| Push delivery policy report | `docs/PUSH_DELIVERY_POLICY.md` | 3KB |
| Push delivery policy JSON | `reports/push-delivery-policy.json` | 5KB |
| Link quality regression JSON | `reports/link-quality-regression.json` | 5KB |
| Official source live check report | `docs/OFFICIAL_SOURCE_LIVE_CHECK.md` | 5KB |
| Official source live check JSON | `reports/official-source-live-check.json` | 16KB |
| Official source live check CSV | `reports/official-source-live-check.csv` | 7KB |
| Image backlog report | `docs/IMAGE_BACKLOG_REPORT.md` | 25KB |
| Image backlog CSV | `IMAGE_BACKLOG.csv` | 53KB |
| Image backlog next batch CSV | `IMAGE_BACKLOG_NEXT_BATCH.csv` | 12KB |
| Image backlog mall request CSV | `IMAGE_BACKLOG_MALL_REQUESTS.csv` | 15KB |
| Link coverage report | `docs/link-coverage-report.md` | 7KB |

## 제출 전 검증 명령

아래 명령은 릴리즈 후보를 확인할 때 사용합니다.

```bash
npm install
npm run env:doctor
npm run env:doctor:production
npm run test:env
npm run public:url:doctor
npm run device:qa:manifest
npm run device:qa:doctor
npm run android:signing:doctor
npm run image:backlog:report
npm run source:live:doctor
npm run store:screenshots:manifest
npm run store:console:fields
npm run store:manual:checklist
npm run store:manual:doctor
npm run store:handoff:report
npm run health:readiness
npm run release:notes
npm run support:playbook
npm run known:issues
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
- operational health readiness: 상품 링크, 공식 혜택 카테고리, refresh:all, 24시간 신선도 기준 점검
- official source live doctor: 공식 이벤트/혜택 소스 후보의 접근 가능, WAF/권한 차단, 404/410 교체 필요 상태를 non-strict 리포트로 기록
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

