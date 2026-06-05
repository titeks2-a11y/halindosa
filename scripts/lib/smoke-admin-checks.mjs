import { assert, baseUrl, check, smokeAdminToken } from "./smoke-harness.mjs";

export async function runAdminDashboardSmokeChecks() {
  await check("admin dashboard quality cards", async () => {
    const adminPath = smokeAdminToken ? `/admin?token=${encodeURIComponent(smokeAdminToken)}` : "/admin";
    const response = await fetch(`${baseUrl}${adminPath}`);
    const text = await response.text();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(text.includes("운영 대시보드"), "Admin dashboard missing title");
    assert(text.includes("운영 헬스 리포트") && text.includes("검증 상품·공식 혜택 출시 게이트"), "Admin dashboard missing health readiness panel");
    assert(text.includes("운영 준비 점수") && text.includes("상품 링크") && text.includes("공식 혜택") && text.includes("공식 소스") && text.includes("refresh:all") && text.includes("cron refresh"), "Admin dashboard missing health readiness summary cards");
    assert(text.includes("공식 혜택 카테고리 커버리지") && text.includes("공식 혜택 Provider 상태") && text.includes("공식 혜택 Provider 위험도") && text.includes("공식 소스 통합 준비도") && text.includes("API 보기"), "Admin dashboard missing health readiness category/provider/source risk/API controls");
    assert(text.includes("뉴스 수집 현황") && text.includes("공식 이벤트·무료 혜택 feed 후보"), "Admin dashboard missing news collection status");
    assert(text.includes("공식 feed preview") && text.includes("뉴스 본문 공식 링크 승격") && text.includes("Preview JSON") && text.includes("Preview CSV"), "Admin dashboard missing official news feed preview panel");
    assert(text.includes("공식 뉴스·혜택 feed 붙여넣기 검증") && text.includes("공식 feed dry-run 실행") && text.includes("RSS/JSON을 붙여넣고"), "Admin dashboard missing official news paste dry-run panel");
    assert(text.includes("공식 피드 전환 준비도") && text.includes("공식 API/RSS/제휴 feed") && text.includes("seed fallback") && text.includes("canary"), "Admin dashboard missing official feed transition readiness panel");
    assert(text.includes("Provider별 성공/실패") && text.includes("검증 실패 TOP10") && text.includes("최근 20개 수집 로그"), "Admin dashboard missing news provider/log operation panels");
    assert(text.includes("숨김/종료/공식 링크 없음 큐") && text.includes("수동 숨김/복구/재검증 구조"), "Admin dashboard missing news hide/restore/revalidate operation panels");
    assert(
      text.includes("공식 혜택 수동 운영") &&
        text.includes("숨김, 복구, 링크 재검증을 화면에서 바로 실행") &&
        text.includes("수동 숨김") &&
        text.includes("재검증 기록"),
      "Admin dashboard missing executable news operation controls"
    );
    assert(
      text.includes("필수 혜택 카테고리 커버리지") &&
        text.includes("refresh:all 운영 상태") &&
        text.includes("오늘 운영 리스크") &&
        text.includes("신선도 운영") &&
        text.includes("Provider 위험도") &&
        text.includes("공식 출처 신뢰도") &&
        text.includes("공식 feed 소스 설정") &&
        text.includes("추천 검색어 자동 큐") &&
        text.includes("허용·차단 가드레일") &&
        text.includes("다음 refresh 권장") &&
        text.includes("npm run refresh:all") &&
        text.includes("health:readiness") &&
        text.includes("실패 사유별 운영 액션") &&
        text.includes("수집 로그 바로 점검"),
      "Admin dashboard missing official benefit coverage, provider risk, freshness, and refresh operation summary"
    );
    assert(text.includes("운영 리포트 API 보기"), "Admin dashboard missing news operation report API link");
    assert(text.includes("알림 캠페인 운영 큐") && text.includes("오늘 발송 후보와 FCM 준비 상태"), "Admin dashboard missing notification campaign queue");
    assert(text.includes("푸시 구독·동의 준비도") && text.includes("관심 카테고리 세그먼트") && text.includes("동의/철회 체크"), "Admin dashboard missing push subscription readiness panel");
    assert(text.includes("푸시 준비도 API") && text.includes("dry-run 준비"), "Admin dashboard missing push readiness API/status");
    assert(text.includes("공식 혜택 알림 후보") && text.includes("알림 후보 API") && text.includes("CSV"), "Admin dashboard missing official benefit alert operations panel");
    assert(text.includes("검증 상품 캠페인") && text.includes("공식 혜택 캠페인"), "Admin dashboard missing split notification campaign queues");
    assert(text.includes("공식 이벤트/공공/쿠폰 페이지가 검증된 혜택만 푸시 후보로 편성합니다"), "Admin dashboard missing official benefit campaign trust copy");
    assert(text.includes("FCM 테스트 발송 dry-run") && text.includes("운영 토큰으로 발송 후보를 안전하게 점검"), "Admin dashboard missing push dry-run panel");
    assert(text.includes("dry-run으로만 검증") && text.includes("실제 발송 확인"), "Admin dashboard missing safe push send controls");
    assert(text.includes("구매 링크 확인율"), "Admin dashboard missing verified link rate card");
    assert(text.includes("품질 CSV"), "Admin dashboard missing deal quality CSV export action");
    assert(
      text.includes("노출 정책 감사") &&
        text.includes("문제 노출") &&
        text.includes("노출 감사 JSON") &&
        text.includes("노출 감사 CSV") &&
        text.includes("노출 강한 실패") &&
        text.includes("총 강한 실패") &&
        text.includes("접근 보호 신호") &&
        text.includes("상품별 노출 감사 샘플") &&
        text.includes("전체 행은 CSV로 내려받고"),
      "Admin dashboard missing exposure policy audit panel"
    );
    assert(
      text.includes("최종 링크 출시 게이트") &&
        text.includes("검색·품절·깨진 링크 0건") &&
        text.includes("출시 게이트 JSON") &&
        text.includes("출시 게이트 CSV") &&
        text.includes("Play Store 제출 판정") &&
        text.includes("최종 제출 규칙") &&
        text.includes("라이브 검증 해석") &&
        text.includes("reports/link-launch-gate.json"),
      "Admin dashboard missing final link launch gate panel"
    );
    assert(
      text.includes("링크 재검증 우선순위") &&
        text.includes("접근보호 403/429") &&
        text.includes("재검증 JSON") &&
        text.includes("재검증 CSV") &&
        text.includes("신고 우선") &&
        text.includes("오늘 처리할 링크 재검증 큐") &&
        text.includes("reports/link-revalidation-priority.json"),
      "Admin dashboard missing link revalidation priority panel"
    );
    assert(
      text.includes("live probe 자동 본문 검증") &&
        text.includes("판매처 접근 보호와 hard failure를 분리합니다") &&
        text.includes("live JSON") &&
        text.includes("live CSV") &&
        text.includes("reports/live-probe-review.json") &&
        text.includes("host별 우선 조치") &&
        text.includes("official API") &&
        text.includes("partner feed") &&
        text.includes("manual device check") &&
        text.includes("backoff retry") &&
        text.includes("수동 검수 증거 신선도") &&
        text.includes("7일 이내") &&
        text.includes("stale") &&
        text.includes("missing"),
      "Admin dashboard missing live probe review panel"
    );
    assert(
      text.includes("공식 혜택 재검증 우선순위") &&
        text.includes("무료·쿠폰·공식 이벤트 링크도 출시 큐로 관리합니다") &&
        text.includes("혜택 재검증 JSON") &&
        text.includes("혜택 재검증 CSV") &&
        text.includes("14일 내 종료") &&
        text.includes("오늘 처리할 공식 혜택 재검증 큐") &&
        text.includes("reports/news-revalidation-priority.json"),
      "Admin dashboard missing official benefit revalidation priority panel"
    );
    assert(text.includes("링크 검토 필요"), "Admin dashboard missing link review count card");
    assert(text.includes("오늘 처리할 링크 작업"), "Admin dashboard missing link review action summary");
    assert(text.includes("구매 링크 보강 우선순위"), "Admin dashboard missing link review priority summary");
    assert(text.includes("링크 검수 큐"), "Admin dashboard missing link review queue");
    assert(text.includes("판매처 확인"), "Admin dashboard missing seller review action");
    assert(text.includes("처리 기준"), "Admin dashboard missing report handling guidance");
    assert(text.includes("특가 품질 신고 큐"), "Admin dashboard missing deal quality report queue");
    assert(text.includes("SLA 초과 신고") && text.includes("SLA 우선 처리 목록"), "Admin dashboard missing report SLA triage queue");
    assert(text.includes("VER 2.0 혜택 운영") && text.includes("혜택 데이터 품질 요약"), "Admin dashboard missing benefit quality operation summary");
    assert(text.includes("혜택형 콘텐츠") && text.includes("활성 노출 가능") && text.includes("점검 우선"), "Admin dashboard missing benefit operation cards");
    assert(text.includes("오늘 운영 체크인") && text.includes("무료·쿠폰·링크·재방문 루틴을 먼저 점검합니다"), "Admin dashboard missing daily operations check-in");
    assert(text.includes("무료 혜택 보강") && text.includes("링크 검수") && text.includes("신고·종료 정리") && text.includes("재방문 루틴"), "Admin dashboard missing daily operations check-in cards");
    assert(text.includes("일일 운영 리포트") && text.includes("검증 링크, 공식 혜택, refresh 상태를 한 번에 확인합니다"), "Admin dashboard missing daily operations report panel");
    assert(text.includes("daily JSON") && text.includes("daily CSV") && text.includes("일일 운영 게이트") && text.includes("오늘 우선 처리 큐"), "Admin dashboard missing daily operations API, CSV, gates, or priority queue");
    assert(text.includes("운영 혜택 판단표") && text.includes("고객이 오늘 먼저 보는 4가지 기준을 운영 큐로 점검합니다"), "Admin dashboard missing shared benefit decision operation board");
    assert(text.includes("무료 수령") && text.includes("결제 전 쿠폰") && text.includes("마감 혜택") && text.includes("구매처 확인 상품"), "Admin dashboard missing decision guide operation actions");
    assert(text.includes("수령 난이도 운영 큐") && text.includes("비회원 기준으로 먼저 받을 혜택"), "Admin dashboard missing claim effort operation queue");
    assert(text.includes("수령 난이도 API 보기") && text.includes("간편 수령") && text.includes("조건 확인") && text.includes("마감 주의"), "Admin dashboard missing claim effort operation cards");
    assert(text.includes("주간 혜택 편성 캘린더") && text.includes("요일별로 채워야 할 재방문 루틴"), "Admin dashboard missing weekly benefit calendar operation board");
    assert(text.includes("주간 캘린더 JSON 보기") && text.includes("실구매 특가 재확인"), "Admin dashboard missing weekly calendar API/action guidance");
    assert(text.includes("공식 소스 live 접근성") && text.includes("무단 크롤링 없이 공식 후보 URL의 접근 가능"), "Admin dashboard missing official source live readiness panel");
    assert(text.includes("live JSON") && text.includes("live CSV") && text.includes("protected/guarded 소스"), "Admin dashboard missing official source live API/CSV controls");
    assert(text.includes("공식 소스 온보딩 우선순위") && text.includes("다음 연결 우선순위 TOP 10"), "Admin dashboard missing official source onboarding plan panel");
    assert(text.includes("온보딩 JSON") && text.includes("온보딩 CSV") && text.includes("feed env") && text.includes("/api/admin/source-onboarding"), "Admin dashboard missing official source onboarding API/CSV/env controls");
    assert(text.includes("feed 연결 후보") && text.includes("제휴 확인") && text.includes("차단 이슈"), "Admin dashboard missing official source onboarding summary cards");
    assert(text.includes("공식 feed 환경변수 안전성") && text.includes("운영 env에 검색·커뮤니티 링크가 들어가기 전 차단"), "Admin dashboard missing source feed env readiness panel");
    assert(text.includes("feed env JSON") && text.includes("정책 회귀 샘플 모두 통과"), "Admin dashboard missing source feed env API and regression status controls");
    assert(text.includes("공식 소스 통합 준비도") && text.includes("오늘 공식 feed 전환 판단"), "Admin dashboard missing official source readiness rollup panel");
    assert(text.includes("source readiness JSON") && text.includes("source readiness CSV") && text.includes("통합 게이트") && text.includes("운영 다음 액션"), "Admin dashboard missing official source readiness API, CSV, and gate controls");
    assert(text.includes("공식 소스 보류 증빙") && text.includes("HTTP 상태") && text.includes("운영 사유") && text.includes("officialUrl") && text.includes("finalUrl"), "Admin dashboard missing source readiness guarded-source evidence table");
    assert(text.includes("운영 피드 전환 준비도") && text.includes("공식 API·제휴 피드로 바꿀 때 볼 품질 기준"), "Admin dashboard missing source readiness operation board");
    assert(text.includes("자동 refresh cron 운영") && text.includes("6시간마다 검증 데이터 갱신 상태를 확인합니다"), "Admin dashboard missing cron refresh operation board");
    assert(text.includes("CRON_SECRET") && text.includes("reports/cron-refresh.json") && text.includes("dry-run 확인"), "Admin dashboard missing cron refresh secret/report/dry-run guidance");
    assert(text.includes("liveFeed dry-run") && text.includes("node scripts/news-feed-live-pipeline.mjs"), "Admin dashboard missing live feed cron dry-run guidance");
    assert(text.includes("파트너 피드 사전 검수 리포트") && text.includes("ready / needs_fix 행을 먼저 분리합니다"), "Admin dashboard missing partner feed validation report board");
    assert(text.includes("readyRate") && text.includes("운영 반영 전 목표는 100%"), "Admin dashboard missing partner feed ready rate summary");
    assert(text.includes("feed:validate --report") && text.includes("feed:production:doctor"), "Admin dashboard missing feed validation command guidance");
    assert(text.includes("운영 피드 붙여넣기 검증") && text.includes("JSON을 붙여넣고 노출 가능 여부를 바로 확인합니다"), "Admin dashboard missing paste-in feed dry-run panel");
    assert(text.includes("dry-run 검증 실행") && text.includes("샘플 복원"), "Admin dashboard missing paste-in feed dry-run actions");
    assert(text.includes("행별 검수 결과") && text.includes("ready 행") && text.includes("needs_fix 행"), "Admin dashboard missing row-level feed dry-run review summary");
    assert(text.includes("수정 필요 필드") && text.includes("rows[].status"), "Admin dashboard missing row-level feed dry-run issue guidance");
    assert(text.includes("ready JSON 내보내기") && text.includes("needs_fix 리포트 내보내기"), "Admin dashboard missing feed dry-run export actions");
    assert(text.includes("오늘 혜택 운영 액션 큐") && text.includes("신고·종료·링크 보강"), "Admin dashboard missing benefit operation action queue");
    assert(text.includes("혜택 조건 완성도 점검") && text.includes("제공처·배송비·가입·선착순·쿠폰 조건"), "Admin dashboard missing benefit condition audit");
    assert(text.includes("조건 취약 유형") && text.includes("쿠폰 조건"), "Admin dashboard missing condition readiness details");
    assert(text.includes("혜택 조건 보강 우선순위") && text.includes("수령 단계, 조건 체크"), "Admin dashboard missing benefit condition operation queue");
    assert(text.includes("수령 안내") && text.includes("링크·신고") && text.includes("마감 신호"), "Admin dashboard missing benefit condition operation details");
    assert(text.includes("VER 2.0 재방문 운영") && text.includes("매일 재방문 루틴 점검"), "Admin dashboard missing benefit retention operation summary");
    assert(text.includes("재방문 점수") && text.includes("다음 재방문 개선 액션"), "Admin dashboard missing retention action queue");
    assert(text.includes("VER 2.0 개인화 추천 운영") && text.includes("개인화 준비율"), "Admin dashboard missing personalization readiness operation summary");
    assert(text.includes("개인화 추천 개선 액션"), "Admin dashboard missing personalization action queue");
    assert(text.includes("링크 오류") && text.includes("품절") && text.includes("종료"), "Admin dashboard missing report reason priority summary");
    assert(text.includes("우선 검수"), "Admin dashboard missing urgent report priority copy");
    assert(text.includes("상품 상세 URL 보강 필요"), "Admin dashboard missing localized link review action");
    assert(/우선[\s\S]{0,20}검수|보강[\s\S]{0,20}검수|대기[\s\S]{0,20}검수/.test(text), "Admin dashboard missing link review priority labels");
    assert(text.includes("현재 이동 URL"), "Admin dashboard missing current link review destination");
    assert(text.includes("이미지 보강 실행 계획") && text.includes("주간 보강 목표"), "Admin dashboard missing image sourcing execution plan");
    assert(text.includes("판매처별 피드 보강 우선순위") && text.includes("제휴/운영 피드 imageUrl 필드 확보"), "Admin dashboard missing mall-level image feed operation queue");
    assert(!text.includes("mock, staging, production"), "Admin dashboard exposes raw source pipeline copy");
    assert(!text.includes("· score "), "Admin dashboard exposes raw score copy");
  });
}
