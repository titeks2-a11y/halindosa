# 할인도사 소셜 로그인 설정 가이드

## 환경변수

로컬 `.env.local`과 Vercel 환경변수에 아래 값을 설정한다.

```env
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://127.0.0.1:3000/auth/callback
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

배포 후 예시는 다음과 같다.

```env
NEXT_PUBLIC_SITE_URL=https://halindosa.com
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://halindosa.com/auth/callback
```

앱 출시 후 Android/iOS 딥링크를 도입하면 `halindosa://auth/callback` 같은 앱 스킴을 추가로 설계한다. 단, Supabase Dashboard와 각 Provider 콘솔의 Redirect URI에 웹 URL과 딥링크를 모두 등록해야 한다.

## Supabase Dashboard 공통 설정

1. Supabase Dashboard > Authentication > URL Configuration으로 이동한다.
2. Site URL에 배포 URL을 입력한다.
3. Redirect URLs에 아래를 등록한다.
   - `http://127.0.0.1:3000/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `https://halindosa.com/auth/callback`
   - Vercel Preview URL을 사용할 경우 `https://*.vercel.app/auth/callback`
4. Authentication > Providers에서 사용할 Provider를 켠다.
5. Client ID와 Client Secret은 Supabase Dashboard에만 입력하고 코드나 GitHub에는 저장하지 않는다.

## Google Provider

1. Google Cloud Console에서 OAuth Consent Screen을 설정한다.
2. OAuth Client ID를 생성한다.
3. Authorized JavaScript origins에 로컬/배포 도메인을 등록한다.
4. Authorized redirect URIs에 Supabase가 안내하는 Callback URL을 등록한다.
5. Supabase Dashboard > Authentication > Providers > Google에 Client ID/Secret을 입력한다.

## Kakao Provider

1. Kakao Developers에서 앱을 생성한다.
2. 카카오 로그인 활성화 후 Redirect URI에 Supabase Callback URL을 등록한다.
3. 동의항목에서 이메일 제공 여부를 확인한다.
4. Supabase Dashboard > Providers > Kakao에 REST API Key와 Secret을 입력한다.

## Naver Provider

Supabase 기본 OAuth Provider에는 Naver가 포함되지 않을 수 있다. 출시 전 선택지는 두 가지다.

1. 별도 서버 OAuth 콜백을 구현해 Naver Developers와 직접 연동한다.
2. Supabase에서 지원 가능한 커스텀 OIDC/외부 인증 구조를 검토한다.

현재 앱 UI에는 네이버 버튼과 안내 문구를 준비해 두되, Provider가 설정되기 전에는 사용자에게 자연스럽게 준비 중 메시지를 보여준다.

## 보안 체크

- `NEXT_PUBLIC_AUTH_REDIRECT_URL`은 `http` 또는 `https`만 허용한다.
- `next` 파라미터는 내부 경로(`/`, `/onboarding`, `/mypage`)만 허용한다.
- Client Secret, Service Role Key, Keystore는 GitHub에 올리지 않는다.
- Android/iOS WebView에서는 외부 브라우저 또는 시스템 브라우저 기반 OAuth 흐름을 우선 검토한다.
