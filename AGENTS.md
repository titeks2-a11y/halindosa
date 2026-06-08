# AGENTS.md

- 이전 대화는 resume하지 말고 `docs/CURRENT_STATE.md`를 먼저 읽고 이어간다.
- 사용자에게 추가 질문하지 말고 상업 출시 가능성이 가장 높은 방향으로 직접 판단해 진행한다.
- 기존 정상 기능, 환경변수, 배포 설정, Android/Capacitor 설정을 깨뜨리지 않는다.
- 할인도사의 우선순위는 상품 링크 앱이 아니라 무료혜택, 무료 이벤트, 쿠폰, 샘플, 체험, 전원증정 플랫폼이다.
- 홈 상단은 무료혜택을 먼저 보여주고 구매 상품은 보조 `추가 할인 상품` 영역으로 둔다.
- 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크는 사용자 화면에 노출하지 않는다.
- 공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL만 `무료 혜택 받기` 버튼에 연결한다.
- 보안 기준을 낮추지 않는다. secret 하드코딩 금지, open redirect 금지, SSRF 방지, XSS sanitize, rate limit, origin/cron/method/input 검증을 유지한다.
- 테스트를 통과시키려고 기능을 제거하거나 기준을 낮추지 않는다.
- 주요 수정 후 `npm run lint`, `npm run test:mobile-ux`, `npm run smoke:local`, `npm run release:doctor`, `npm run qa`, `npm run build`, `npm run build:android`, `npm run cap:sync`를 필요한 순서로 실행한다.
- `next-env.d.ts`가 build 후 `./.next/types/routes.d.ts`로 바뀌면 기존 dev 타입 경로 정책에 맞게 되돌린다.
- 안정 상태마다 작게 commit하고 가능하면 push한다.
