# Android WebView Release Mode

할인도사 Android 앱은 Capacitor 네이티브 셸 안에서 운영 웹사이트를 로드한다.

## Production URL

- 기본 앱 진입점: `https://www.halindosa.com`
- 설정 파일: `capacitor.config.ts`
- 허용 도메인: `halindosa.com`, `www.halindosa.com`
- 로컬 fallback: `public/offline.html`

이 구조에서는 Vercel에 새 버전이 배포되면 Android 앱도 같은 웹 화면을 바로 본다. 네이티브 권한, 앱 아이콘, 스플래시, 패키지명 변경이 없으면 매번 AAB를 다시 올리지 않아도 된다.

## Local Testing

기본값은 production URL이다. Android Emulator에서 로컬 Next.js 서버를 테스트할 때만 아래처럼 실행한다.

```powershell
$env:APP_WEB_URL="http://10.0.2.2:3000"
npm run build:android
npm run cap:sync
npm run cap:open
```

Production 빌드는 `APP_WEB_URL=https://www.halindosa.com` 또는 환경변수 미설정 상태로 생성한다.

## Security Rules

- Android manifest는 `usesCleartextTraffic=false`로 설정한다.
- `network_security_config.xml`은 `halindosa.com` HTTPS만 허용한다.
- `config.xml`의 wildcard access는 제거한다.
- 외부 혜택/구매 링크는 웹앱의 `/go/*` 또는 공식 URL 정책을 통해 검증한다.

## Verification

```powershell
npm run android:webview:doctor
npm run release:doctor
npm run build:android
npm run cap:sync
```

`npm run cap:sync` 후 `android/app/src/main/assets/capacitor.config.json`에 `server.url`이 `https://www.halindosa.com`으로 들어가면 Android 앱이 홈페이지를 직접 로드한다.

## Play Console Note

이번 변경 후 새 AAB를 만들어 업로드하면, 이후 홈 화면/혜택 데이터/디자인 변경은 Vercel 배포만으로 앱 화면에 반영된다. 단, 앱 아이콘, 권한, 패키지명, 딥링크, 네이티브 플러그인 변경은 다시 AAB 업로드가 필요하다.
