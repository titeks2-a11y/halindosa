# Vercel Production Promote Runbook

할인도사 Android 앱은 `https://www.halindosa.com` 운영 웹을 WebView로 로드한다. 네이티브 설정을 바꾸지 않은 웹 UI/API 개선은 Vercel Production 배포만 성공하면 앱에도 바로 반영된다.

## 최신 Preview를 운영으로 승격

```bash
npm run deploy:promote:latest
```

스크립트가 하는 일:

- `vercel ls --yes`에서 가장 최근 `Ready` Preview 배포를 찾는다.
- `vercel inspect <preview> --wait`로 배포 상태를 확인한다.
- `vercel promote <preview> --yes`로 운영 도메인에 승격한다.
- `https://www.halindosa.com/api/health`를 읽어 운영 반영 상태를 리포트에 남긴다.

결과 리포트:

```text
reports/vercel-promote-latest.json
```

## Vercel Hobby 제한에 걸린 경우

오류 예시:

```text
Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")
```

이 경우 코드와 Preview 배포는 준비되어 있지만 Vercel 계정의 일일 배포 제한 때문에 Production alias를 바꿀 수 없다. 제한이 풀린 뒤 같은 명령을 다시 실행한다.

## 운영 반영 완료 확인

```bash
npm run vercel:doctor
```

또는 운영 health API에서 `deployment.shortCommit`이 최신 커밋인지 확인한다.

```bash
curl https://www.halindosa.com/api/health
```
