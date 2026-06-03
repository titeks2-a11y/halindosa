# 할인도사 웹 배포 가이드

할인도사는 하나의 Next.js App Router 코드베이스로 웹사이트와 Capacitor Android 앱을 함께 운영합니다. 웹 배포는 Vercel을 기준으로 준비되어 있으며, Android 패키징은 `out` 정적 export를 사용합니다.

## 1. 로컬 검증

```bash
npm install
npm run lint
npm run news:feed:doctor
npm run refresh:all
npm run health:readiness
npm run build
npm run build:android
npm run cap:sync
npm run release:doctor
```

상용 출시 후보는 아래 하네스까지 통과해야 합니다.

```bash
npm run harness
```

하네스 결과는 `docs/HARNESS_REPORT.md`, 정적 성능 예산 결과는 `docs/PERFORMANCE_REPORT.md`에 기록됩니다.

로컬 개발 서버는 아래 명령으로 실행합니다.

```bash
npm run dev
```

## 2. 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 등록합니다.

```env
NEXT_PUBLIC_SITE_URL=https://halindosa.com
NEXT_PUBLIC_APP_NAME=할인도사
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPPORT_EMAIL=support@halindosa.com
DEAL_DATA_MODE=hybrid
DEAL_PROVIDER=hybrid
DEAL_LIVE_KEYWORDS=특가 할인,오늘만 특가,쿠폰 할인
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
DEAL_FEED_URLS=
DEAL_NEWS_RSS_URLS=
DEAL_COMMUNITY_RSS_URLS=
DEAL_NEWS_FEED_URLS=
DEAL_EVENT_NEWS_FEED_URLS=
OFFICIAL_EVENT_FEED_URLS=
PUBLIC_COUPON_FEED_URLS=
PPOMPPU_HOTDEAL_ENABLE=false
PPOMPPU_HOTDEAL_RSS_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AFFILIATE_SUB_ID=halindosa-web
DEFAULT_AFFILIATE_URL_TEMPLATE=
COUPANG_PARTNERS_URL_TEMPLATE=
AFFILIATE_URL_TEMPLATES=
TRACKING_SALT=
ADMIN_EXPORT_TOKEN=
```

주의:
- `.env.local`은 Git에 커밋하지 않습니다.
- API 키가 없는 값은 비워 두면 mock/fallback 구조로 동작합니다.
- `NEXT_PUBLIC_SITE_URL`은 배포 도메인이 확정되면 반드시 실제 HTTPS 주소로 설정합니다.
- `NEXT_PUBLIC_SUPPORT_EMAIL`은 Play Store/App Store에 표시할 고객지원 이메일과 동일하게 맞춥니다.
- `DEAL_DATA_MODE`와 `DEAL_PROVIDER`는 운영 전환 기간에는 같은 값으로 맞춰 둡니다.
- 공식 혜택 feed는 `docs/news-feed-contract.md`를 통과하는 JSON만 연결합니다. 뉴스 기사/검색 결과/커뮤니티 원문은 사용자 이동 `finalUrl`로 쓰지 않습니다.
- `TRACKING_SALT`, `ADMIN_EXPORT_TOKEN`은 운영 배포 전에 충분히 긴 랜덤 값으로 교체합니다.

## 3. GitHub Push

```bash
git status
git add .
git commit -m "Prepare Halindosa web deployment"
git push
```

원격 저장소가 없다면 GitHub에서 저장소를 만든 뒤 아래처럼 연결합니다.

```bash
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin master
```

## 4. Vercel 배포

Vercel CLI가 설치되어 있으면 아래 순서로 진행합니다.

```bash
vercel --version
vercel
vercel --prod
```

권장 Vercel 설정:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: 비워 둠
- Install Command: `npm install`
- Node.js Version: Vercel 기본 LTS 또는 프로젝트와 호환되는 최신 LTS

Android 앱용 정적 export는 Vercel 빌드가 아니라 `npm run build:android`에서 별도로 생성합니다. 웹 배포와 Android export가 서로 충돌하지 않도록 `scripts/build-android.mjs`가 앱 전용 빌드에서만 API 라우트를 임시 제외합니다.

## 5. 도메인 연결

예시 도메인:
- `halindosa.com`
- `www.halindosa.com`

Vercel Project > Settings > Domains에서 도메인을 추가한 뒤, 실제 화면에 표시되는 DNS 값을 우선 적용합니다.

일반적인 Vercel DNS 예시:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

DNS 반영 후 확인:
- Vercel Domains 화면에서 Valid Configuration 표시 확인
- HTTPS 인증서 자동 발급 확인
- `https://halindosa.com`
- `https://www.halindosa.com`

## 6. 배포 후 체크리스트

- 홈 페이지가 정상 표시되는지 확인
- 홈 상단 `빠른 상품 검색`에서 검색어 입력, 쇼핑몰 선택, 오늘특가/무료배송/마감임박/직접구매 필터가 화면 점프 없이 적용되는지 확인
- `/?q=애플%20워치`처럼 검색 query 진입 시 결과가 유지되는지 확인
- `/categories`, `/notifications`, `/favorites`, `/mypage` 이동 확인
- `/privacy`, `/terms` 정책 페이지 확인
- `/api/health` 응답 확인
- `/api/deals` 응답 확인
- `/api/news-deals` 응답 확인
- `docs/HEALTH_READINESS_REPORT.md`가 PASS이고 `reports/health-readiness.json`의 `score`가 100인지 확인
- `/api/redirect/[id]`가 검증된 상품 상세 또는 공식 혜택 상세 페이지로 이동하는지 확인
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest` 확인
- 모바일 화면에서 하단 탭바 확인
- PC 화면에서 상단 네비게이션 확인
- Vercel Environment Variables가 production에 반영되었는지 확인
- `npm run verify:links`로 커뮤니티/검색/대표몰 링크가 상품 DB에 섞이지 않았는지 확인

## 6-1. 상품 DB와 링크 검증

신규 상품이나 운영 피드를 추가할 때는 실제 구매/신청 상세 URL만 노출합니다.

```bash
npm run verify:links
npm run verify:products
npm run news:feed:doctor
npm run refresh:news
npm run verify:news
npm run refresh:all
npm run verify:links:live
npm run verify:products
npm run exposure:doctor
npm run health:readiness
npm run feed:validate -- --file ./partner-feed.json
```

- `sourceUrl`: 원문 출처 또는 공식/제휴 피드 출처
- `finalPurchaseUrl`: 사용자가 새 탭/외부 브라우저로 이동할 실제 상품·혜택 상세 URL
- 공식 혜택 feed는 `data/newsFeed.sample.json` 형식을 따르고, `finalUrl`은 공식 이벤트/쿠폰/혜택 안내 페이지여야 합니다.
- 검색 결과, 커뮤니티 글, 블로그, 뉴스, 쇼핑몰 메인 URL은 노출 상품으로 등록하지 않습니다.
- 검증 실패 상품은 운영 피드 dry-run에서 `needs_fix`로 남기고 UI 노출 전에 보강합니다.

## 7. 남은 외부 작업

- GitHub 원격 저장소 URL 확정
- Vercel 로그인 및 프로젝트 연결
- 실제 도메인 구매 또는 DNS 권한 확보
- Play Store 개인정보처리방침 공개 URL에 배포 도메인 반영
- 제휴/광고 SDK 연결 전 정책 고지 문구 최종 검토
