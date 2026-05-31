# 할인도사 OAuth 설정 가이드

이 문서는 할인도사 소셜 로그인을 실제 운영 환경에 연결하기 위한 작업 목록입니다. Client Secret은 코드나 GitHub에 절대 넣지 않고 Supabase Dashboard에만 입력합니다.

## Codex가 구현한 것

- `/login`, `/signup` Google/Kakao 소셜 로그인 버튼
- `/auth/callback` OAuth 완료 처리 페이지
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AUTH_REDIRECT_URL`, `NEXT_PUBLIC_APP_SCHEME` 기반 redirect URL 생성
- `next` 파라미터 open redirect 방지
- Provider 미설정/취소/실패 시 사용자 친화적 메시지
- Android/iOS 딥링크 확장 구조

## 공통 Supabase 설정

Supabase Dashboard에서 `Authentication > URL Configuration`으로 이동합니다.

Site URL:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app
```

Redirect URLs:

```text
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback
halindosa://auth/callback
```

로컬 `.env.local` 예시:

```env
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://127.0.0.1:3000/auth/callback
NEXT_PUBLIC_APP_SCHEME=halindosa
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

Vercel 환경변수 예시:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback
NEXT_PUBLIC_APP_SCHEME=halindosa
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

## Google Provider

1. Google Cloud Console에서 새 프로젝트 또는 기존 프로젝트를 선택합니다.
2. `APIs & Services > OAuth consent screen`에서 앱 이름 `할인도사`, 지원 이메일, 개발자 연락처를 입력합니다.
3. `Credentials > Create Credentials > OAuth client ID`를 선택합니다.
4. Application type은 웹 배포 기준으로 `Web application`을 선택합니다.
5. Authorized JavaScript origins:

```text
http://127.0.0.1:3000
http://localhost:3000
https://YOUR-VERCEL-DOMAIN.vercel.app
```

6. Authorized redirect URIs:

```text
https://PROJECT_ID.supabase.co/auth/v1/callback
```

7. 생성된 Client ID/Client Secret을 Supabase `Authentication > Providers > Google`에 입력하고 활성화합니다.

## Kakao Provider

1. Kakao Developers에서 애플리케이션을 생성합니다.
2. 플랫폼에서 Web 사이트 도메인을 등록합니다.

```text
http://127.0.0.1:3000
http://localhost:3000
https://YOUR-VERCEL-DOMAIN.vercel.app
```

3. `카카오 로그인`을 활성화합니다.
4. Redirect URI에 Supabase callback을 등록합니다.

```text
https://PROJECT_ID.supabase.co/auth/v1/callback
```

5. REST API Key와 Client Secret을 Supabase `Authentication > Providers > Kakao`에 입력합니다.
6. 개인정보 동의항목에서 이메일 제공 가능 여부를 확인합니다.

## Naver Provider

Naver는 Supabase 기본 OAuth Provider 목록에 없는 프로젝트가 많습니다. 운영 방식은 두 가지입니다.

1. Supabase Custom OAuth/OIDC를 사용할 수 있는 요금제/설정으로 Naver를 연결
2. 별도 서버 라우트에서 Naver OAuth를 처리한 뒤 Supabase custom token 또는 자체 세션으로 확장

Naver Developers 설정 예시:

```text
Service URL: https://YOUR-VERCEL-DOMAIN.vercel.app
Callback URL: https://YOUR-VERCEL-DOMAIN.vercel.app/auth/naver/callback
App Callback URL: halindosa://auth/callback
```

현재 앱의 Naver 버튼은 Provider 미설정 상태에서 앱이 죽지 않도록 안내 메시지를 보여줍니다.

## 앱 출시 후 딥링크 TODO

- Supabase Redirect URLs에 `halindosa://auth/callback` 등록
- Google/Kakao/Naver 콘솔에서 앱 스킴 허용 여부 확인
- Android intent-filter와 iOS URL Scheme이 실제 패키지명/번들 ID와 일치하는지 검증
- 실제 기기에서 Google/Kakao 로그인 후 앱 복귀 확인
