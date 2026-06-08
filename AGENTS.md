# AGENTS.md

- 이전 대화는 resume하지 않는다. 새 세션은 먼저 `docs/CURRENT_STATE.md`만 읽고 시작한다.
- 사용자에게 추가 질문하지 말고, 상업 출시 가능성이 가장 높은 안전한 방향으로 직접 판단한다.
- 기존 정상 기능, 환경변수, 배포 설정, Android/Capacitor 설정을 깨뜨리지 않는다.
- 할인도사의 핵심 방향은 무료혜택, 무료 이벤트, 쿠폰, 샘플, 체험, 전원증정 플랫폼이다.
- 검색 링크, 대표몰 메인, 커뮤니티 글, 종료/품절/미검증 링크는 사용자 화면에 노출하지 않는다.
- 공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL만 혜택 CTA에 연결한다.
- secret 하드코딩, open redirect, SSRF, XSS, 무단 스크래핑을 금지하고 보안 게이트를 낮추지 않는다.
- 테스트 통과를 위해 기능을 제거하거나 검증 기준을 낮추지 않는다.
- 주요 수정 후 필요한 범위에서 `lint`, `smoke:local`, `release:doctor`, `qa`, `build`, `build:android`, `cap:sync`를 실행한다.
- `next-env.d.ts`가 build 후 `./.next/types/routes.d.ts`로 바뀌면 기존 dev 타입 경로 정책으로 되돌린다.
- 안정 상태마다 작게 commit하고 가능하면 push한다.
