# 할인도사 딥링크 인증 구조

할인도사는 웹과 앱 OAuth redirect를 분리할 수 있도록 아래 구조를 사용합니다.

## Redirect URL 구조

웹:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback?next=/onboarding
```

로컬:

```text
http://127.0.0.1:3000/auth/callback?next=/onboarding
```

앱:

```text
halindosa://auth/callback?next=/onboarding
```

## 코드 구조

- `lib/auth/redirect.ts`
  - `getSafeNextPath`: 외부 URL, `//evil.com`, `https://...` 형태 차단
  - `getAuthRedirectUrl`: 웹 redirect URL 생성
  - `getNativeAuthRedirectUrl`: 앱 스킴 redirect URL 생성
  - `getRuntimeAuthRedirectUrl`: Capacitor 앱이면 앱 스킴, 웹이면 웹 callback 사용

- `components/AuthDeepLinkHandler.tsx`
  - Capacitor `App.addListener("appUrlOpen")`
  - `halindosa://auth/callback` 수신 시 `/auth/callback`으로 내부 이동

## Android 설정

파일:

```text
android/app/src/main/AndroidManifest.xml
```

적용된 intent-filter:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="halindosa" android:host="auth" android:pathPrefix="/callback" />
</intent-filter>
```

## iOS 설정

파일:

```text
ios/App/App/Info.plist
```

적용된 URL Scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.halindosa.app.auth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>halindosa</string>
    </array>
  </dict>
</array>
```

## Supabase에 등록할 Redirect URL

```text
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback
halindosa://auth/callback
```

## 출시 전 테스트 체크리스트

- Android 실제 기기에서 Google 로그인 후 앱으로 복귀
- Android 실제 기기에서 Kakao 로그인 후 앱으로 복귀
- iOS 실제 기기에서 Google 로그인 후 앱으로 복귀
- iOS 실제 기기에서 Kakao 로그인 후 앱으로 복귀
- 로그인 취소 시 `/login`에서 오류 메시지가 자연스럽게 보이는지 확인
- 앱 스킴을 악용한 외부 `next` URL이 홈(`/`)으로 정리되는지 확인
