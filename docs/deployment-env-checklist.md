# 할인도사 운영 환경변수 체크리스트

출시 전 Vercel, Supabase, Android Studio, Xcode 환경에 들어갈 값을 한 번에 확인하기 위한 문서입니다. 비밀키는 GitHub에 커밋하지 않고 Vercel Environment Variables, Supabase Dashboard, 로컬 `android/keystore.properties`처럼 안전한 저장소에만 입력합니다.

## 빠른 점검 명령

```bash
npm run env:doctor
node scripts/env-doctor.mjs --strict
npm run env:doctor:production
```

- `npm run env:doctor`: 현재 환경과 `.env.local`, `.env.production`, `.env`, `.env.example`을 읽어 누락/placeholder 값을 보여줍니다.
- `--strict`: 운영 필수 값이 비어 있거나 placeholder면 실패 코드로 종료합니다. URL 형식, `/auth/callback` 경로, 앱 스킴, 고객지원 이메일 형식도 함께 확인하므로 배포 직전 CI나 로컬 최종 점검에 사용합니다.
- `npm run env:doctor:production`: 스토어 제출 직전 공개 배포 환경 전용입니다. `localhost`와 `127.0.0.1`을 허용하지 않고, `NEXT_PUBLIC_SITE_URL`과 `NEXT_PUBLIC_AUTH_REDIRECT_URL`의 origin이 같은지 확인합니다.

## 필수 공개 환경변수

- `NEXT_PUBLIC_SITE_URL`: 실제 공개 도메인. 예: `https://halindosa.com`
- `NEXT_PUBLIC_AUTH_REDIRECT_URL`: OAuth 완료 후 돌아올 URL. 예: `https://halindosa.com/auth/callback`
- `NEXT_PUBLIC_APP_SCHEME`: 앱 딥링크 스킴. 기본값 `halindosa`
- `NEXT_PUBLIC_SUPPORT_EMAIL`: 스토어와 앱에 표시할 실제 고객지원 이메일

운영 배포에서는 공개 URL을 `https://`로 입력합니다. 로컬 개발 중에는 `localhost`와 `127.0.0.1`만 예외로 허용됩니다. `NEXT_PUBLIC_AUTH_REDIRECT_URL`은 반드시 `/auth/callback` 경로로 끝나야 합니다.

## Supabase Auth

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: 회원 탈퇴와 서버 정리 작업에만 사용하는 서버 전용 키

Supabase Dashboard에는 다음 Redirect URL을 등록합니다.

- `http://127.0.0.1:3000/auth/callback`
- `https://YOUR-DOMAIN/auth/callback`
- `halindosa://auth/callback`

Google, Kakao, Naver Provider 설정은 `docs/OAUTH_SETUP.md`와 `docs/DEEPLINK_AUTH.md`를 함께 확인합니다.

## 데이터 공급

- `DEAL_DATA_MODE`: `mock`, `staging`, `production`, `hybrid` 중 하나
- `DEAL_FEED_URLS`: 허용된 제휴/공식 JSON 피드 URL
- `DEAL_NEWS_RSS_URLS`: 허용된 뉴스 RSS URL
- `DEAL_COMMUNITY_RSS_URLS`: 허용된 커뮤니티 RSS/API/proxy 피드 URL
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`: 네이버 쇼핑 검색 API를 운영에서 사용할 때만 입력

운영 데이터는 공식 API, 제휴 피드, RSS, 허용된 수집 방식만 사용합니다. raw HTML 무단 크롤링이나 커뮤니티 글 URL을 구매 링크처럼 저장하지 않습니다.

## 운영/제휴

- `ADMIN_EXPORT_TOKEN`: `/admin`, CSV export, 운영 import 보호용 토큰
- `TRACKING_SALT`: 클릭 로그 request id 생성용 랜덤 문자열
- `AFFILIATE_SUB_ID`: 승인된 제휴 추적 sub id
- `DEFAULT_AFFILIATE_URL_TEMPLATE`, `COUPANG_PARTNERS_URL_TEMPLATE`, `AFFILIATE_URL_TEMPLATES`: 제휴 승인 후에만 입력

제휴 링크 템플릿은 `{url}`, `{encodedUrl}`, `{dealId}`, `{mall}`, `{campaign}`, `{subId}`, `{title}` placeholder를 사용할 수 있습니다.

## 스토어 제출 전 판정

- [ ] `npm run env:doctor` 결과에서 운영 필수 값이 모두 `OK`
- [ ] `node scripts/env-doctor.mjs --strict` 성공
- [ ] `npm run env:doctor:production` 성공
- [ ] Supabase OAuth Provider Redirect URL과 앱 딥링크 테스트 완료
- [ ] `npm run public:url:doctor`로 `/privacy`, `/support`, sitemap, robots, 스토어 제출 URL 문구 일관성 확인
- [ ] 공개 개인정보처리방침 URL이 Play Console/App Store Connect에 입력됨
- [ ] `docs/device-qa-checklist.md` 기준 실기기 QA 완료
- [ ] `npm run qa:release`와 `npm run release:doctor` 성공
