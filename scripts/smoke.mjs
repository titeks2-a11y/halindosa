import { readFileSync } from "node:fs";

const loopbackHost = ["127", "0", "0", "1"].join(".");
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;
const smokeFetchTimeoutMs = Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? 30000);
const nativeFetch = globalThis.fetch.bind(globalThis);
const homePageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const bottomNavigationSource = readFileSync(new URL("../components/BottomNavigation.tsx", import.meta.url), "utf8");
const topNavigationSource = readFileSync(new URL("../components/TopNavigation.tsx", import.meta.url), "utf8");
const mypageSource = readFileSync(new URL("../app/mypage/page.tsx", import.meta.url), "utf8");

globalThis.fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), smokeFetchTimeoutMs);

  try {
    return await nativeFetch(input, {
      ...init,
      signal: init.signal ?? controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

const checks = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function check(name, fn) {
  const startedAt = Date.now();

  try {
    await fn();
    checks.push({ name, ok: true, latencyMs: Date.now() - startedAt });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function fetchJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = await response.json();
  return { response, data };
}

function isUnsafeDealUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const communityHosts = [
      "ppomppu.co.kr",
      "fmkorea.com",
      "quasarzone.com",
      "algumon.com",
      "clien.net",
      "ruliweb.com",
      "dcinside.com",
      "theqoo.net",
      "instiz.net",
      "coolenjoy.net"
    ];

    return (
      !["http:", "https:"].includes(url.protocol) ||
      host === "example.com" ||
      host.endsWith(".example.com") ||
      communityHosts.some((communityHost) => host === communityHost || host.endsWith(`.${communityHost}`) || host.includes(communityHost))
    );
  } catch {
    return true;
  }
}

function isMallHomeOnlyUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    return path === "" || path === "/" || path === "/main" || path === "/index";
  } catch {
    return true;
  }
}

await check("home page", async () => {
  const response = await fetch(`${baseUrl}/`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사"), "Home page missing brand text");
  assert(text.includes("샤오미 86인치") || text.includes("새우깡"), "Home page missing initial deal cards");
  assert(
    text.includes("데이터 상태") || (text.includes("상태") && text.includes("네트워크 정상")),
    "Home page missing compact data quality summary"
  );
  assert(text.includes("구매 전 판매처 확인"), "Home page missing purchase verification guidance");
  assert(text.includes("빠른 상품 검색"), "Home page missing above-the-fold quick search panel");
  assert(text.includes("상품명, 브랜드, 쇼핑몰, 카테고리 통합 검색"), "Home page missing integrated search guidance");
  assert(text.includes("상품 이동은 모두 새 탭"), "Home page missing new-tab purchase movement guidance");
  assert(text.includes("카테고리 바로가기") && text.includes("원하는 분야만 빠르게 보기"), "Home page missing quick category shortcuts");
  assert(text.includes("판매처 확인"), "Home page deal cards missing visible seller confirmation CTA");
  assert(text.includes("상세 보기"), "Home page deal cards missing visible detail CTA");
  assert(text.includes("구매 전 체크"), "Home page deal cards missing compact purchase check summary");
  assert(text.includes("출처") && text.includes("신고 상태"), "Home page deal cards missing source and report status summary");
  assert(text.includes("신고 처리 기준") && text.includes("운영 점검 큐"), "Home page deal cards missing report handling guidance");
  assert(text.includes("실제 링크 확인") && text.includes("바로 신고"), "Home page deal cards missing link review and report action chips");
  assert(
    text.includes("혜택 조건") && text.includes("회원가입") && text.includes("선착순") && text.includes("배송비") && text.includes("쿠폰 조건"),
    "Home page deal cards missing benefit condition summary"
  );
  assert(text.includes("가격/재고 변동") || text.includes("가격 변동"), "Home page missing price stock risk guidance");
  assert(text.includes("구매 이동 안내"), "Home page missing purchase link overview");
  assert(text.includes("구매처 바로 확인 상품을 먼저 보여드려요"), "Home page missing customer-facing purchase link explanation");
  assert(text.includes("판매처 확인 단계"), "Home page missing review-needed purchase path explanation");
  assert(text.includes("오늘 바로 볼 할인 지도"), "Home page missing quick discovery guide");
  assert(text.includes("오늘 놓치면 아쉬운 혜택"), "Home page missing V2 benefit-first discovery section");
  assert(
    text.includes("오늘 혜택 1분 시작") &&
      text.includes("앱을 열자마자 무료, 쿠폰, 생활비, 마감 순서로 바로 갑니다") &&
      text.includes("첫 화면에서 가장 체감이 큰 혜택만 먼저 압축했습니다."),
    "Home page missing one-minute benefit start rail"
  );
  assert(text.includes("10초 혜택 바로가기") && text.includes("오늘 받을 혜택을 바로 고르세요"), "Home page missing fast benefit shortcut rail");
  assert(text.includes("무료 샘플") && text.includes("결제 전 쿠폰") && text.includes("앱테크 포인트"), "Home page missing fast benefit shortcut choices");
  assert(text.includes("무료로 받을 수 있는 혜택"), "Home page missing free benefit discovery card");
  assert(text.includes("무료혜택/쿠폰"), "Home page missing free benefit and coupon section");
  assert(text.includes("0원"), "Home navigation missing free benefit badge");
  assert(text.includes("오늘 절약 요약") && text.includes("오늘 절약 후보") && text.includes("무료·무배"), "Home page missing daily savings summary");
  assert(text.includes("홈 혜택 헛걸음 방지") && text.includes("누르기 전 놓치기 쉬운 조건을 먼저 봅니다"), "Home page missing benefit risk review rail");
  assert(text.includes("숨은 비용 먼저 보기") && text.includes("가입 조건 있는 혜택") && text.includes("선착순·마감 주의") && text.includes("신고 상태 확인"), "Home page missing benefit risk review cards");
  assert(text.includes("오늘 절약 영수증") && text.includes("무료, 쿠폰, 배송비, 큰 절약을 한 번에 챙기세요"), "Home page missing daily savings receipt");
  assert(text.includes("무료 혜택") && text.includes("쿠폰 절약") && text.includes("배송비 절약") && text.includes("큰 절약 후보"), "Home page missing savings receipt actions");
  assert(text.includes("3분 혜택 루틴") && text.includes("앱을 열자마자 이 순서로 받으세요"), "Home page missing daily claim routine");
  assert(text.includes("오늘 혜택 미션 보드") && text.includes("처음 들어왔다면 이 3가지만 먼저 보세요"), "Home page missing first-visit benefit mission board");
  assert(text.includes("돈 쓰기 전 무료 혜택") && text.includes("쿠폰·포인트 먼저 적용") && text.includes("오늘 끝날 수 있는 혜택"), "Home page missing daily benefit mission actions");
  assert(text.includes("오늘 바로 실행할 혜택 액션 큐") && text.includes("무료 수령, 쿠폰 적용, 생활 혜택, 마감 확인 순서로 봅니다"), "Home page missing daily benefit action queue");
  assert(text.includes("무료 혜택 받기") && text.includes("쿠폰 조건 보기") && text.includes("생활 혜택 보기") && text.includes("마감 혜택 확인"), "Home page missing daily benefit action queue buttons");
  assert(text.includes("첫 화면 혜택 우선순위 큐") && text.includes("오늘 받을 혜택 큐"), "Home page missing first-screen benefit priority queue");
  assert(text.includes("스크롤 전에 먼저 고를 5가지") && text.includes("무료, 쿠폰, 무배, 마감, 실제 구매처 이동"), "Home page missing compressed benefit queue guidance");
  assert(text.includes("무료 혜택 먼저") && text.includes("쿠폰·포인트 적용") && text.includes("배송비 줄이기") && text.includes("구매처 바로 이동"), "Home page missing compressed benefit queue actions");
  assert(text.includes("첫 방문 혜택 판단 가이드") && text.includes("오늘 먼저 챙길 혜택 판단표"), "Home page missing first-visit benefit decision guide");
  assert(text.includes("돈 안 쓰고 받을 것") && text.includes("결제 전 적용할 것") && text.includes("오늘 놓치기 쉬운 것") && text.includes("구매처가 확인된 것"), "Home page missing first-visit decision guide cards");
  assert(text.includes("무료로 받을 것, 결제 전 적용할 것, 오늘 끝날 것, 바로 이동할 상품"), "Home page missing first-visit decision guide copy");
  assert(text.includes("오늘 혜택 브리핑") && text.includes("이번 주 혜택 캘린더에서 오늘 먼저 챙길 루틴"), "Home page missing daily benefit briefing");
  assert(text.includes("브리핑 API 보기") && text.includes("오늘 대표 큐") && text.includes("가입 없이 전체 혜택 확인"), "Home page missing daily briefing actions");
  assert(text.includes("루틴 API 보기") && text.includes("오늘 3분 혜택 루틴") && text.includes("실행") && text.includes("단계"), "Home page missing daily routine API and step summary");
  assert(text.includes("1<!-- -->단계") && text.includes("무료 혜택 보기") && text.includes("5<!-- -->단계") && text.includes("검증 링크 보기") && text.includes("실제 구매처 확인 특가"), "Home page missing full five-step daily benefit routine");
  assert(text.includes("품질 안내"), "Home page missing deal quality notice");
  assert(text.includes("무료혜택 TOP 5") && text.includes("쿠폰·앱테크 TOP 5"), "Home page missing free coupon top ranking section");
  assert(
    text.includes("오늘 눌러둘 적립 혜택") &&
      text.includes("포인트 루틴 보기") &&
      text.includes("앱테크 적립 혜택 확인"),
    "Home page missing apptech reward routine rail"
  );
  assert(text.includes("회원들이 많이 찜한 혜택") && text.includes("인기 찜") && text.includes("내 찜"), "Home page missing member favorite benefit section");
  assert(text.includes("관심 카테고리 추천") && text.includes("비회원도 모두 보고") && text.includes("관심 설정하기"), "Home page missing interest category personalization");
  assert(text.includes("홈 빠른 관심 설정") && text.includes("비회원 기기 저장") && text.includes("관심사는 홈 추천과 알림 후보에 바로 반영"), "Home page missing quick interest setup");
  assert(text.includes("개인화 혜택 추천 API") && text.includes("추천 API 보기") && text.includes("최근/찜 흐름"), "Home page missing reusable personalized benefit API card");
  assert(text.includes("오늘 혜택 체크리스트") && text.includes("앱을 열면 이 순서로 챙기세요"), "Home page missing daily benefit checklist");
  assert(text.includes("무료 혜택 먼저 받기") && text.includes("쿠폰 조건 확인") && text.includes("앱테크 포인트 적립"), "Home page missing checklist benefit actions");
  assert(text.includes("실제 구매 링크로 보기") && text.includes("비회원 전체 열람 · 저장만 로그인"), "Home page missing checklist trust and non-member guidance");
  assert(text.includes("오늘 혜택 출석 체크") && text.includes("매일 1분만 확인해도 놓치는 혜택이 줄어듭니다"), "Home page missing benefit check-in card");
  assert(text.includes("무료·체험 먼저") && text.includes("쿠폰 적용") && text.includes("알림 큐"), "Home page missing check-in routine actions");
  assert(text.includes("오늘 챙긴 혜택 기록") && text.includes("루틴 완료") && text.includes("기기 저장"), "Home page missing daily benefit completion record");
  assert(text.includes("비회원도 기기에만 출석 기록을 저장합니다") && text.includes("무료 혜택 전용 탭에서 이번 주 루틴 보기"), "Home page missing non-member check-in guidance");
  assert(text.includes("오늘 챙긴 혜택 요약") && text.includes("아직 챙길 만한 무료 혜택") && text.includes("무료 혜택 더 챙기기"), "Home page missing claimed benefit summary");
  assert(text.includes("홈 무료 혜택 방문 요약") && text.includes("무료 혜택 방문 루틴 계속하기"), "Home page missing free benefit visit streak summary");
  assert(
    text.includes("홈 오늘 혜택 미션") &&
      text.includes("무료 혜택 1개 챙기기") &&
      text.includes("쿠폰 1개 저장하기") &&
      text.includes("내일 볼 루틴 예약"),
    "Home page missing linked daily benefit mission progress"
  );
  assert(text.includes("홈 재방문 예약 요약") && text.includes("재방문 루틴 더 저장") && text.includes("알림에서 이어보기"), "Home page missing return reservation summary");
  assert(text.includes("쿠폰·이벤트·앱테크"), "Home page missing coupon event apptech playbook");
  assert(text.includes("쇼핑몰 쿠폰") && text.includes("배달앱 쿠폰") && text.includes("출석체크 포인트"), "Home page missing daily benefit playbook items");
  assert(text.includes("오늘의 진짜 특가") && text.includes("가격, 혜택, 링크까지 먼저 확인한 추천"), "Home page missing true deal spotlight");
  assert(text.includes("절약 예상") && text.includes("같이 보면 좋은 특가"), "Home page missing commerce-focused deal spotlight details");
  assert(text.includes("네이버페이·카카오페이·토스·페이코"), "Home page missing pay event discovery copy");
  assert(text.includes("통신사 멤버십"), "Home page missing membership benefit discovery");
  assert(text.includes("편의점/마트"), "Home page missing convenience and mart benefit section");
  assert(text.includes("혜택 유형 필터"), "Home page missing benefit type filter");
  assert(text.includes("구매처 바로 확인"), "Home page missing verified purchase quick filter");
  assert(text.includes("쇼핑몰별 특가 바로가기"), "Home page missing mall discovery section");
  assert(text.includes("자주 쓰는 판매처만 골라보기"), "Home page missing mall discovery guide copy");
  assert(text.includes("구매처 확인"), "Home page missing mall verified purchase link summary");
  assert(text.includes("쇼핑몰 빠른 선택") && text.includes("가격 빠른 선택") && text.includes("혜택 빠른 선택"), "Home page missing fast mall, price, and benefit filter chips");
  assert(text.includes("홈 탐색 바로가기") && text.includes("전체상품") && text.includes("구매처확인"), "Home page missing jump-to-deal-list navigation shortcuts");
  assert(
    text.includes("오늘 바로 볼 특가") && (text.includes("검색 결과에서 먼저 확인할 상품") || text.includes("먼저 확인할 상품")),
    "Home page missing compact instant deal rail"
  );
  assert(text.includes("오늘의 실시간 할인뉴스") && text.includes("공식 혜택 페이지로 바로 이동"), "Home page missing verified realtime discount news section");
  assert(text.includes("공식 링크") && text.includes("공식 페이지"), "Home page missing official event/news link trust actions");
  assert(text.includes("재방문 혜택 큐") && text.includes("최근 본 공식 혜택") && text.includes("관심 카테고리 공식 혜택"), "Home page missing recent official benefit return queue");
  assert(text.includes("심화 혜택 탐색") && text.includes("상품 목록을 먼저 보고"), "Home page missing collapsible deep discovery summary");
  assert(text.includes("상세 필터와 결과 분석") && text.includes("상품 목록을 먼저 보고, 더 좁힐 때 펼치세요"), "Home page missing collapsible advanced filter summary");
  assert(text.includes("검색 도우미"), "Home page missing search discovery panel");
  assert(text.includes("인기 검색어") && text.includes("최근 검색어"), "Home page missing popular/recent search keyword sections");
  assert(text.includes("추천 검색어"), "Home page missing inline guided search suggestions");
  assert(text.includes("검색어 빠른 초기화 지원"), "Home page missing fast search reset accessibility hint");
  assert(text.includes("로켓") && text.includes("배달쿠폰") && text.includes("커피쿠폰"), "Home page missing high-intent lifestyle search suggestions");
  assert(text.includes("라면") && text.includes("햇반"), "Home page missing high-intent grocery search suggestions");
  assert(text.includes("계란") && text.includes("우유") && text.includes("충전케이블"), "Home page missing practical grocery/electronics search suggestions");
  assert(text.includes("화장지") && text.includes("청소포") && text.includes("김자반"), "Home page missing newly expanded catalog search suggestions");
  assert(text.includes("키친타월") && text.includes("참치") && text.includes("가글"), "Home page missing practical household and grocery search suggestions");
  assert(text.includes("많은 판매처") && text.includes("최대 할인") && text.includes("낮은 현재가") && text.includes("마감 임박"), "Home page missing compact search result snapshot");
  assert(text.includes("검색 결과 추천 판단") && text.includes("먼저 볼 기준"), "Home page missing search decision guide");
  assert(text.includes("현재 결과"), "Home page missing search result count summary");
  assert(text.includes("구매하기"), "Home page missing compact commerce purchase buttons");
  assert(text.includes("구매 전 한눈에") && text.includes("링크 확인"), "Home page missing quick deal card purchase snapshot");
  assert(text.includes("가격 요약") && text.includes("아낌") && text.includes("압축 가격 카드"), "Home page missing quick deal card price summary");
  assert(
    text.includes("혜택 목적 빠른 필터") &&
      text.includes("무료, 쿠폰, 앱테크, 문화 초대권을 한 번에 좁힙니다") &&
      text.includes("무료·0원 먼저") &&
      text.includes("쿠폰 조건 확인") &&
      text.includes("앱테크 적립") &&
      text.includes("문화 초대권") &&
      text.includes("검증 링크만"),
    "Home page missing purpose quick benefit filters"
  );
  assert(text.includes("조건별 결과 요약") && text.includes("현재 필터가 보여주는 혜택을 먼저 해석합니다"), "Home page missing filter outcome summary");
  assert(text.includes("현재 조건으로 볼 혜택") && text.includes("마감 전 확인") && text.includes("배송비 부담 낮음"), "Home page missing filter outcome cards");
  assert(text.includes("현재 조건 빠른 추천") && text.includes("목록을 길게 보기 전 먼저 확인할 3개"), "Home page missing quick result picks");
  assert(text.includes("현재 결과 바로 실행 큐") && text.includes("지금 조건에서 먼저 눌러볼 혜택") && text.includes("가장 안전한 이동"), "Home page missing filter action queue");
  assert(
    text.includes("상품 목록 적용 조건") && (text.includes("조건을 눌러 바로 해제") || text.includes("전체 특가를 보고 있습니다")),
    "Home page missing visible list active filter chips"
  );
  assert(text.includes("현재 결과 빠른 좁히기") && text.includes("목록 안에서 많이 나온 기준"), "Home page missing current result refinement chips");
  assert(text.includes("상품 목록 빠른 스캔") && text.includes("낮은 가격 후보") && text.includes("할인율 최고"), "Home page missing product list scan shortcuts");
  assert(text.includes("현재 목록 가격 비교") && text.includes("절약액 큼") && text.includes("마감 먼저"), "Home page missing product list price comparison shortcuts");
  assert(text.includes("최근 기록 관리") && text.includes("찜 목록 보기"), "Home page missing recent deal management actions");
  assert(!text.includes("직접 구매 링크 비율"), "Home page should not expose internal link coverage ratio copy");
  assert(!text.includes(">상업화<"), "Home page should not expose internal commercialization link in public footer");
  assert(text.includes("aria-pressed="), "Home deal favorite buttons missing pressed state");
  assert(text.includes("판매처 이동 전 확인"), "Home deal open buttons missing accessible purchase label");
  assert(text.includes("네트워크 정상") || text.includes("오프라인 상태"), "Home page missing network status summary");
  assert(text.includes("전체 쇼핑몰") && text.includes("쿠팡 ("), "Home page missing mall filter counts");
  assert(text.includes("전체 가격대") && text.includes("1만원 미만"), "Home page missing price band filter");
});

await check("customer navigation simplification", async () => {
  assert(bottomNavigationSource.includes("grid-cols-4"), "Bottom navigation should have exactly four tabs");
  assert(bottomNavigationSource.includes('href: "/popular"') && topNavigationSource.includes('href: "/popular"'), "Popular tab should be wired in top and bottom navigation");
  assert(!bottomNavigationSource.includes('href: "/free-benefits"'), "Bottom navigation should not expose free-benefits as a standalone tab");
  assert(!bottomNavigationSource.includes('href: "/notifications"'), "Bottom navigation should not expose notifications before push is complete");
  assert(!bottomNavigationSource.includes('href: "/favorites"'), "Bottom navigation should not expose favorites as a standalone tab");
  assert(!topNavigationSource.includes('href: "/free-benefits"') && !topNavigationSource.includes("무료혜택"), "Top navigation should not expose free-benefits as a standalone tab");
  assert(!mypageSource.includes("Android 패키지") && !mypageSource.includes("앱 버전") && !mypageSource.includes("개인정보처리방침 준비"), "Mypage should not expose developer release checklist wording");
});

await check("home query filters", async () => {
  const response = await fetch(`${baseUrl}/?category=식품&sort=discount&q=새우깡&verifiedOnly=true`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사"), "Filtered home missing brand text");
  assert(text.includes("새우깡") || text.includes("검색"), "Filtered home missing query result context");
  assert(text.includes("적용된 조건"), "Filtered home missing active filter summary");
  assert(text.includes("조건 개별 해제"), "Filtered home missing removable active filter chips");
  assert(text.includes("구매링크 확인"), "Filtered home missing restored verifiedOnly filter label");
  assert(text.includes("조건별 결과 요약"), "Filtered home missing active filter outcome summary");
  assert(text.includes("검색 결과 빠른 분류") && text.includes("많이 나온 쇼핑몰") && text.includes("가까운 카테고리"), "Filtered home missing search result grouping shortcuts");
  assert(text.includes("판매처 집중") && text.includes("카테고리 집중") && text.includes("안전 이동"), "Filtered home missing result decision cards");
  assert(text.includes("조건 초기화"), "Filtered home missing filter reset action");
});

await check("home empty search recovery", async () => {
  const result = await fetchJson(`/api/deals?q=${encodeURIComponent("zzznomatch987")}&verifiedOnly=true&limit=20`);
  assert(result.response.status === 200, `Expected 200, got ${result.response.status}`);
  assert(result.data.deals.length === 0, "Impossible search query should return no API deals");
  assert(homePageSource.includes("조건에 맞는 특가가 없습니다."), "Home source missing empty result title");
  assert(homePageSource.includes("검색 결과 없음 복구"), "Home source missing recovery region");
  assert(homePageSource.includes("바로 다시 찾아볼 검색어"), "Home source missing recovery keyword suggestions");
  assert(homePageSource.includes("먼저 볼 만한 검증 특가"), "Home source missing verified deal recovery suggestions");
  assert(homePageSource.includes("검색 결과 대신 실제 구매 링크가 확인된 상품"), "Home source missing verified-link recovery copy");
});

await check("mypage data controls", async () => {
  const response = await fetch(`${baseUrl}/mypage`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("비회원으로 이용 중") || text.includes("로그인하고 관심 특가"), "Mypage missing account auth panel");
  assert(text.includes("계정 활동 요약"), "Mypage missing account activity summary");
  assert(text.includes("비회원 저장을 계정으로 이어보기"), "Mypage missing account carryover plan");
  assert(text.includes("모든 혜택은 그대로 볼 수 있고") && text.includes("저장한 기록만 로그인하면 이어집니다"), "Mypage missing optional account carryover copy");
  assert(text.includes("찜한 혜택") && text.includes("가격 알림 조건") && text.includes("재방문 예약"), "Mypage missing carryover saved benefit, alert, and return reservation metrics");
  assert(text.includes("내 혜택 저장 루틴"), "Mypage missing benefit save routine");
  assert(text.includes("찜한 혜택 다시 보기") && text.includes("최근 본 상품 이어보기"), "Mypage missing saved and recent benefit routine actions");
  assert(text.includes("마이 최근 본 공식 혜택") && text.includes("공식 이벤트와 쿠폰 혜택도 다시 이어봅니다"), "Mypage missing recent official benefit panel");
  assert(text.includes("관심 카테고리 조정") && text.includes("가격 알림 조건 확인"), "Mypage missing interest and alert routine actions");
  assert(text.includes("마이 혜택 수령 난이도") && text.includes("오늘 먼저 챙길 혜택을 쉬운 순서로 정리"), "Mypage missing account claim effort board");
  assert(text.includes("간편 수령") && text.includes("조건 확인") && text.includes("마감 주의"), "Mypage missing account claim effort categories");
  assert(text.includes("이번 주 혜택 루틴 기록") && text.includes("오늘 챙긴 혜택") && text.includes("홈에서 오늘 루틴 계속하기"), "Mypage missing weekly benefit routine record");
  assert(text.includes("오늘 챙김") && text.includes("누적 혜택") && text.includes("절약 후보"), "Mypage missing claimed benefit record summary");
  assert(text.includes("절약 다이어리") && text.includes("다음 절약 행동"), "Mypage missing savings diary");
  assert(text.includes("비회원도 기기에 저장") && text.includes("가입해야만 볼 수 있는 혜택은 없습니다"), "Mypage missing non-member storage guidance");
  assert(text.includes("홈 화면에 할인도사 고정"), "Mypage missing app install guide");
  assert(text.includes("앱으로 설치하기") && text.includes("공유 링크 복사"), "Mypage missing install/share actions");
  assert(text.includes("설정 점검 요약"), "Mypage missing settings summary");
  assert(text.includes("내 데이터와 알림을 한눈에 관리"), "Mypage missing data and notification management summary");
  assert(text.includes("빠른 작업"), "Mypage missing quick actions section");
  assert(text.includes("내 찜") && text.includes("가격 알림") && text.includes("카테고리"), "Mypage missing simplified quick action links");
  assert(text.includes("기기 데이터 관리"), "Mypage missing local data controls");
  assert(text.includes("찜/최근 본 특가/공식 혜택 기록 삭제"), "Mypage missing local deal and official benefit data delete action");
  assert(text.includes("무료 혜택 방문 기록") && text.includes("무료 혜택 방문 루틴 이어보기"), "Mypage missing free benefit visit streak summary");
  assert(text.includes("최근 본 공식 혜택") && text.includes("가격 알림 조건") && text.includes("혜택 출석 기록") && text.includes("무료 혜택 방문 기록") && text.includes("챙긴 혜택 기록") && text.includes("재방문 예약"), "Mypage missing official benefit, price alert, check-in, visit streak, claimed benefit, and return reservation deletion scope");
  assert(text.includes("분석/제휴 동의 초기화"), "Mypage missing consent reset action");
  assert(text.includes("서비스 안내"), "Mypage missing service guide link");
  assert(text.includes("가격/품절 정보 신고"), "Mypage missing report entry point");
  assert(text.includes("support@halindosa.com"), "Mypage missing production support email");
  assert(!text.includes("halindosa.example"), "Mypage still exposes example support email");
  assert(text.includes("개인정보/추적 설정"), "Mypage missing consent settings panel");
  assert(text.includes("삭제 대상"), "Mypage missing local data deletion scope");
  assert(text.includes("가격 신고는 할인 정보 품질 확인 기록"), "Mypage missing report retention notice");
});

await check("auth pages", async () => {
  const [login, signup] = await Promise.all([
    fetch(`${baseUrl}/login`).then(async (response) => ({ response, text: await response.text() })),
    fetch(`${baseUrl}/signup`).then(async (response) => ({ response, text: await response.text() }))
  ]);

  assert(login.response.status === 200, `Expected login 200, got ${login.response.status}`);
  assert(signup.response.status === 200, `Expected signup 200, got ${signup.response.status}`);
  assert(login.text.includes("로그인") && login.text.includes("이메일") && login.text.includes("비밀번호"), "Login page missing email/password form");
  assert(signup.text.includes("회원가입") && signup.text.includes("닉네임") && signup.text.includes("영문+숫자 포함 8자 이상"), "Signup page missing nickname/password policy");
  for (const provider of ["구글", "카카오", "네이버"]) {
    assert(login.text.includes(provider), `Login page missing ${provider} social login entry`);
    assert(signup.text.includes(provider), `Signup page missing ${provider} social login entry`);
  }
  assert(login.text.includes("관심 특가") || signup.text.includes("관심 특가"), "Auth pages missing conversion copy");
});

await check("oauth callback and onboarding pages", async () => {
  const [callback, onboarding] = await Promise.all([
    fetch(`${baseUrl}/auth/callback?next=https://evil.example`).then(async (response) => ({ response, text: await response.text() })),
    fetch(`${baseUrl}/onboarding`).then(async (response) => ({ response, text: await response.text() }))
  ]);

  assert(callback.response.status === 200, `Expected callback 200, got ${callback.response.status}`);
  assert(callback.text.includes("소셜 로그인"), "OAuth callback page missing title");
  assert(callback.text.includes("로그인 정보를 확인"), "OAuth callback page missing safe processing copy");
  assert(onboarding.response.status === 200, `Expected onboarding 200, got ${onboarding.response.status}`);
  assert(onboarding.text.includes("관심 카테고리") && onboarding.text.includes("무료/체험"), "Onboarding page missing category setup");
});

await check("account deletion guard", async () => {
  const badConfirm = await fetchJson("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmText: "삭제" })
  });
  assert(badConfirm.response.status === 400, `Expected bad confirm 400, got ${badConfirm.response.status}`);
  assert(badConfirm.data.ok === false, "Bad confirm should fail");

  const noSession = await fetchJson("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmText: "탈퇴" })
  });
  assert([401, 503].includes(noSession.response.status), `Expected no-session 401/503, got ${noSession.response.status}`);
  assert(noSession.data.ok === false, "No-session account deletion should fail safely");
});

await check("service guide page", async () => {
  const response = await fetch(`${baseUrl}/guide`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("서비스 안내"), "Guide page missing title");
  assert(text.includes("구매 전 꼭 확인하세요"), "Guide page missing purchase warning");
  assert(text.includes("외부 판매처 이동 방식"), "Guide page missing redirect explanation");
  assert(text.includes("이동 전 판매처 확인"), "Guide page missing pre-purchase destination check explanation");
  assert(text.includes("구매 전 10초 체크"), "Guide page missing purchase safety checklist");
  assert(text.includes("최종 결제 금액") && text.includes("취소·반품"), "Guide page missing safety checklist details");
  assert(text.includes("계정과 데이터 관리"), "Guide page missing account and data management guidance");
  assert(text.includes("회원 탈퇴") && text.includes("가격 알림 데이터"), "Guide page missing account deletion data scope");
  assert(text.includes("신고와 고객 문의") && text.includes("support@halindosa.com"), "Guide page missing report/support guidance");
});

await check("support page", async () => {
  const response = await fetch(`${baseUrl}/support`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("고객센터"), "Support page missing title");
  assert(text.includes("가격·품절·링크 신고"), "Support page missing report entry");
  assert(text.includes("구매 전 확인 기준"), "Support page missing purchase guidance entry");
  assert(text.includes("support@halindosa.com"), "Support page missing support email");
  assert(text.includes("자주 묻는 질문"), "Support page missing FAQ section");
  assert(text.includes("로그인 없이 사용할 수 있나요"), "Support page missing non-member FAQ");
  assert(text.includes("개인정보처리방침") && text.includes("이용약관") && text.includes("마이 설정"), "Support page missing policy and data management links");
});

await check("store screenshot preview", async () => {
  const response = await fetch(`${baseUrl}/store-preview`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("스크린샷 촬영 보드"), "Store preview missing title");
  assert(text.includes("오늘 먼저 볼 특가") && text.includes("검색과 필터") && text.includes("구매 전 상세 확인"), "Store preview missing primary capture scenes");
  assert(text.includes("관심 특가 저장") && text.includes("마감임박과 무료배송") && text.includes("정책과 설정"), "Store preview missing secondary capture scenes");
  assert(text.includes("촬영 화면 열기"), "Store preview missing capture links");
});

await check("not found page", async () => {
  const response = await fetch(`${baseUrl}/missing-launch-page`);
  const text = await response.text();
  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(text.includes("페이지를 찾을 수 없습니다"), "Not-found page missing user-facing title");
  assert(text.includes("홈으로 돌아가기"), "Not-found page missing home action");
  assert(text.includes("고객센터에서 문의하기"), "Not-found page missing support action");
});

await check("category and notification pages", async () => {
  const categories = await fetch(`${baseUrl}/categories`);
  const categoriesText = await categories.text();
  assert(categories.status === 200, `Expected categories 200, got ${categories.status}`);
  assert(categoriesText.includes("원하는 할인 정보만 빠르게 보기"), "Categories page missing title");
  assert(categoriesText.includes("전체") && categoriesText.includes("쿠팡") && categoriesText.includes("여행"), "Categories page missing key channels");
  assert(categoriesText.includes("개 특가"), "Categories page missing deal counts");
  assert(categoriesText.includes("구매 링크 확인"), "Categories page missing purchase link quality count");
  assert(categoriesText.includes("대표 특가"), "Categories page missing representative deal summary");
  assert(categoriesText.includes("추천 탐색") && categoriesText.includes("카테고리 묶음"), "Categories page missing grouped discovery sections");
  assert(categoriesText.includes("구매 링크 확인이 많은 영역부터 보기"), "Categories page missing verified-first discovery guide");
  assert(
    categoriesText.includes("생활 혜택 빠른 지도") && categoriesText.includes("무료 샘플·0원 혜택") && categoriesText.includes("앱테크·포인트 적립"),
    "Categories page missing benefit type quick map"
  );
  assert(
    categoriesText.includes("문화 초대권·무료 관람") &&
      categoriesText.includes("문화 초대권 보기") &&
      categoriesText.includes("앱테크 적립 루틴"),
    "Categories page missing culture and apptech benefit journeys"
  );
  assert(categoriesText.includes("오늘 목적별 탐색 루틴") && categoriesText.includes("무엇을 아끼고 싶은지부터 고르세요"), "Categories page missing purpose-based discovery routine");
  assert(categoriesText.includes("무료 먼저 받기") && categoriesText.includes("결제 전 쿠폰 찾기") && categoriesText.includes("장보기 전 행사 보기"), "Categories page missing purpose journey cards");
  assert(
    categoriesText.includes("혜택 목적별 추천 큐") &&
      categoriesText.includes("오늘 아낄 목적에 맞춰 대표 혜택부터 봅니다"),
    "Categories page missing purpose recommendation queue"
  );
  assert(
    categoriesText.includes("지금 무료로 받을 것") &&
      categoriesText.includes("결제 전 적용할 것") &&
      categoriesText.includes("생활비 줄일 것") &&
      categoriesText.includes("오늘 놓치면 아쉬운 것"),
    "Categories page missing purpose recommendation cards"
  );
  assert(
      categoriesText.includes("혜택 유형별 비교표") &&
      categoriesText.includes("무료·쿠폰·포인트를 비교해서 고르세요") &&
      categoriesText.includes("활성 혜택") &&
      categoriesText.includes("마감 신호") &&
      categoriesText.includes("문화 초대권"),
    "Categories page missing benefit comparison matrix"
  );
  assert(categoriesText.includes("카테고리별 오늘 혜택 요약") && categoriesText.includes("무료·쿠폰·마감 신호가 많은 영역부터 보세요"), "Categories page missing category benefit summary");
  assert(categoriesText.includes("무료·무배") && categoriesText.includes("쿠폰·포인트") && categoriesText.includes("예상 절약 후보"), "Categories page missing category benefit matrix metrics");
  assert(categoriesText.includes("카테고리별 수령 난이도") && categoriesText.includes("처음이라면 받기 쉬운 영역부터 시작하세요"), "Categories page missing category claim effort map");
  assert(categoriesText.includes("간편 수령") && categoriesText.includes("조건 확인") && categoriesText.includes("마감 주의"), "Categories page missing category claim effort metrics");
  assert(
    categoriesText.includes("카테고리 조건 점검 지도") && categoriesText.includes("숨은 비용·가입·마감 신호를 카테고리별로 봅니다"),
    "Categories page missing category condition risk map"
  );
  assert(
    categoriesText.includes("숨은 비용") && categoriesText.includes("가입 조건") && categoriesText.includes("선착순·마감") && categoriesText.includes("신고/확인"),
    "Categories page missing category condition risk metrics"
  );

  const notifications = await fetch(`${baseUrl}/notifications`);
  const notificationsText = await notifications.text();
  assert(notifications.status === 200, `Expected notifications 200, got ${notifications.status}`);
  assert(notificationsText.includes("알림 센터"), "Notifications page missing title");
  assert(notificationsText.includes("마감임박") && notificationsText.includes("인기") && notificationsText.includes("신규") && notificationsText.includes("무료배송"), "Notifications page missing alert summary chips");
  assert(notificationsText.includes("전체 보기"), "Notifications page missing alert group deep links");
  assert(notificationsText.includes("저장한 가격 알림"), "Notifications page missing saved price alert list");
  assert(notificationsText.includes("무료 혜택 방문 알림 요약") && notificationsText.includes("무료 혜택을 다시 확인할 타이밍입니다"), "Notifications page missing free benefit visit alert summary");
  assert(notificationsText.includes("연속 확인") && notificationsText.includes("누적 방문") && notificationsText.includes("무료 혜택 이어보기"), "Notifications page missing free benefit visit alert cards");
  assert(notificationsText.includes("챙긴 혜택 알림 요약") && notificationsText.includes("아직 챙길 만한 혜택"), "Notifications page missing claimed benefit alert summary");
  assert(notificationsText.includes("챙긴 혜택 다음 알림 후보") && notificationsText.includes("무료 혜택 다시 알림"), "Notifications page missing claimed benefit next alert queue");
  assert(notificationsText.includes("쿠폰·포인트 재확인") && notificationsText.includes("마감 전 확인 알림"), "Notifications page missing claimed benefit next alert cards");
  assert(notificationsText.includes("저장한 재방문 혜택 알림") && notificationsText.includes("기기에 저장한 무료·쿠폰·마감 루틴을 이어봅니다"), "Notifications page missing saved benefit return reservation list");
  assert(notificationsText.includes("오늘 이어볼 재방문 루틴 요약") && notificationsText.includes("저장된 루틴") && notificationsText.includes("저녁 확인"), "Notifications page missing return reservation routine summary");
  assert(notificationsText.includes("재방문 루틴 추가") && notificationsText.includes("아침 무료 혜택") && notificationsText.includes("저녁 쿠폰 점검"), "Notifications page missing benefit return reservation fallback actions");
  assert(notificationsText.includes("관심 카테고리 알림"), "Notifications page missing interest category alert preview");
  assert(notificationsText.includes("관심 설정하기"), "Notifications page missing interest settings link");
  assert(notificationsText.includes("알림 받을 카테고리") && notificationsText.includes("기기에 저장한 관심 알림 카테고리"), "Notifications page missing local notification category preferences");
  assert(notificationsText.includes("기기 저장 알림 신호") && notificationsText.includes("찜 반영") && notificationsText.includes("최근 본 상품"), "Notifications page missing favorite and recent signal personalization summary");
  assert(notificationsText.includes("알림 개인화 추천 API") && notificationsText.includes("개인화 API 보기"), "Notifications page missing reusable personalized recommendation API card");
  assert(notificationsText.includes("관심 알림 실행 카드"), "Notifications page missing interest alert action cards");
  assert(notificationsText.includes("무료·체험 먼저") && notificationsText.includes("쿠폰·포인트 챙기기") && notificationsText.includes("마감 전 확인"), "Notifications page missing personalized alert action steps");
  assert(notificationsText.includes("알림 혜택 판단표") && notificationsText.includes("오늘 먼저 열어볼 알림을 4가지로 좁혔습니다"), "Notifications page missing shared benefit decision guide");
  assert(notificationsText.includes("판단표 API 보기") && notificationsText.includes("무료 수령, 결제 전 쿠폰, 마감 혜택, 구매처 확인 상품"), "Notifications page missing decision guide API action");
  assert(notificationsText.includes("돈 안 쓰고 받을 것") && notificationsText.includes("구매처가 확인된 것"), "Notifications page missing decision guide cards");
  assert(notificationsText.includes("실제 푸시 발송은 FCM 연결 후 별도 동의"), "Notifications page missing push readiness copy");
  assert(
    notificationsText.includes("오늘 알림 시간표") &&
      notificationsText.includes("푸시 없이도 하루 세 번 열어볼 이유를 만듭니다") &&
      notificationsText.includes("아침 9시") &&
      notificationsText.includes("마감 전 22시"),
    "Notifications page missing alert time routine"
  );
  assert(
    notificationsText.includes("API 기준 오늘 혜택 큐") &&
      notificationsText.includes("비회원 기준 혜택 큐") &&
      notificationsText.includes("API 응답 확인"),
    "Notifications page missing shared today benefit API queue"
  );
  assert(
    notificationsText.includes("비회원 알림 조건 요약") &&
      notificationsText.includes("가입 없이도 오늘 볼 알림 조건을 먼저 고릅니다") &&
      notificationsText.includes("무료·체험 조건") &&
      notificationsText.includes("찜·가격 알림 조건"),
    "Notifications page missing non-member alert condition board"
  );
  assert(notificationsText.includes("알림 수령 난이도") && notificationsText.includes("지금 열어볼 알림을 받기 쉬운 순서로 정리했습니다"), "Notifications page missing alert claim effort board");
  assert(notificationsText.includes("간편 수령 알림") && notificationsText.includes("조건 확인 알림") && notificationsText.includes("마감 주의 알림"), "Notifications page missing alert claim effort cards");
  assert(notificationsText.includes("오늘 알림 실행 순서") && notificationsText.includes("앱을 열면 이 순서로 혜택을 확인하세요"), "Notifications page missing alert action routine");
  assert(notificationsText.includes("무료 혜택 먼저 확인") && notificationsText.includes("쿠폰·포인트 챙기기") && notificationsText.includes("마감 임박 놓치지 않기"), "Notifications page missing alert action steps");
  assert(notificationsText.includes("알림 운영 방식") && notificationsText.includes("권한 요청 없이 먼저 쓸 수 있게 준비했습니다"), "Notifications page missing push readiness operating guide");
  assert(notificationsText.includes("오늘 알림 큐"), "Notifications page missing daily benefit alert queue");
  assert(notificationsText.includes("무료 혜택 알림") && notificationsText.includes("쿠폰·포인트 알림"), "Notifications page missing free benefit and coupon alert queues");
  assert(notificationsText.includes("비회원도 모두 볼 수 있고"), "Notifications page missing non-member alert access copy");
  assert(notificationsText.includes("오늘 먼저 확인할 알림"), "Notifications page missing priority alert queue");
  assert(notificationsText.includes("마감과 인기 반응이 겹친 특가부터 보기"), "Notifications page missing priority alert guide copy");
  assert(notificationsText.includes("마감 임박 특가"), "Notifications page missing ending group");
  assert(notificationsText.includes("무료배송 특가"), "Notifications page missing free shipping group");
});

await check("admin dashboard quality cards", async () => {
  const response = await fetch(`${baseUrl}/admin`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("운영 대시보드"), "Admin dashboard missing title");
  assert(text.includes("운영 헬스 리포트") && text.includes("검증 상품·공식 혜택 출시 게이트"), "Admin dashboard missing health readiness panel");
  assert(text.includes("운영 준비 점수") && text.includes("상품 링크") && text.includes("공식 혜택") && text.includes("refresh:all"), "Admin dashboard missing health readiness summary cards");
  assert(text.includes("공식 혜택 카테고리 커버리지") && text.includes("공식 혜택 Provider 상태") && text.includes("API 보기"), "Admin dashboard missing health readiness category/provider/API controls");
  assert(text.includes("뉴스 수집 현황") && text.includes("공식 이벤트·무료 혜택 feed 후보"), "Admin dashboard missing news collection status");
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
      text.includes("다음 refresh 권장") &&
      text.includes("npm run refresh:all") &&
      text.includes("health:readiness"),
    "Admin dashboard missing official benefit coverage, provider risk, freshness, and refresh operation summary"
  );
  assert(text.includes("운영 리포트 API 보기"), "Admin dashboard missing news operation report API link");
  assert(text.includes("알림 캠페인 운영 큐") && text.includes("오늘 발송 후보와 FCM 준비 상태"), "Admin dashboard missing notification campaign queue");
  assert(text.includes("푸시 구독·동의 준비도") && text.includes("관심 카테고리 세그먼트") && text.includes("동의/철회 체크"), "Admin dashboard missing push subscription readiness panel");
  assert(text.includes("푸시 준비도 API") && text.includes("dry-run 준비"), "Admin dashboard missing push readiness API/status");
  assert(text.includes("검증 상품 캠페인") && text.includes("공식 혜택 캠페인"), "Admin dashboard missing split notification campaign queues");
  assert(text.includes("공식 이벤트/공공/쿠폰 페이지가 검증된 혜택만 푸시 후보로 편성합니다"), "Admin dashboard missing official benefit campaign trust copy");
  assert(text.includes("FCM 테스트 발송 dry-run") && text.includes("운영 토큰으로 발송 후보를 안전하게 점검"), "Admin dashboard missing push dry-run panel");
  assert(text.includes("dry-run으로만 검증") && text.includes("실제 발송 확인"), "Admin dashboard missing safe push send controls");
  assert(text.includes("구매 링크 확인율"), "Admin dashboard missing verified link rate card");
  assert(text.includes("링크 검토 필요"), "Admin dashboard missing link review count card");
  assert(text.includes("오늘 처리할 링크 작업"), "Admin dashboard missing link review action summary");
  assert(text.includes("구매 링크 보강 우선순위"), "Admin dashboard missing link review priority summary");
  assert(text.includes("링크 검수 큐"), "Admin dashboard missing link review queue");
  assert(text.includes("판매처 확인"), "Admin dashboard missing seller review action");
  assert(text.includes("처리 기준"), "Admin dashboard missing report handling guidance");
  assert(text.includes("특가 품질 신고 큐"), "Admin dashboard missing deal quality report queue");
  assert(text.includes("VER 2.0 혜택 운영") && text.includes("혜택 데이터 품질 요약"), "Admin dashboard missing benefit quality operation summary");
  assert(text.includes("혜택형 콘텐츠") && text.includes("활성 노출 가능") && text.includes("점검 우선"), "Admin dashboard missing benefit operation cards");
  assert(text.includes("오늘 운영 체크인") && text.includes("무료·쿠폰·링크·재방문 루틴을 먼저 점검합니다"), "Admin dashboard missing daily operations check-in");
  assert(text.includes("무료 혜택 보강") && text.includes("링크 검수") && text.includes("신고·종료 정리") && text.includes("재방문 루틴"), "Admin dashboard missing daily operations check-in cards");
  assert(text.includes("운영 혜택 판단표") && text.includes("고객이 오늘 먼저 보는 4가지 기준을 운영 큐로 점검합니다"), "Admin dashboard missing shared benefit decision operation board");
  assert(text.includes("무료 수령") && text.includes("결제 전 쿠폰") && text.includes("마감 혜택") && text.includes("구매처 확인 상품"), "Admin dashboard missing decision guide operation actions");
  assert(text.includes("수령 난이도 운영 큐") && text.includes("비회원 기준으로 먼저 받을 혜택"), "Admin dashboard missing claim effort operation queue");
  assert(text.includes("수령 난이도 API 보기") && text.includes("간편 수령") && text.includes("조건 확인") && text.includes("마감 주의"), "Admin dashboard missing claim effort operation cards");
  assert(text.includes("주간 혜택 편성 캘린더") && text.includes("요일별로 채워야 할 재방문 루틴"), "Admin dashboard missing weekly benefit calendar operation board");
  assert(text.includes("주간 캘린더 JSON 보기") && text.includes("실구매 특가 재확인"), "Admin dashboard missing weekly calendar API/action guidance");
  assert(text.includes("운영 피드 전환 준비도") && text.includes("공식 API·제휴 피드로 바꿀 때 볼 품질 기준"), "Admin dashboard missing source readiness operation board");
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

await check("commercial launch readiness page", async () => {
  const response = await fetch(`${baseUrl}/commercialization`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사 출시 준비 보드"), "Commercialization page missing launch readiness title");
  assert(text.includes("출시 직전 체크"), "Commercialization page missing release checklist");
  assert(text.includes("실제 운영 전환"), "Commercialization page missing operating transition guidance");
  assert(text.includes("Supabase OAuth Provider"), "Commercialization page missing OAuth provider external setup");
  assert(text.includes("남은 링크 검수"), "Commercialization page missing link review risk section");
  assert(text.includes("구매 링크 확인율"), "Commercialization page missing verified link rate metric");
  assert(text.includes("출시 준비 단계"), "Commercialization page missing launch readiness phase");
  assert(text.includes("다음 우선 조치"), "Commercialization page missing next action queue");
  assert(text.includes("오늘 혜택 큐 운영 준비도") && text.includes("홈, 알림 센터, 향후 푸시가 같은"), "Commercialization page missing daily benefit queue readiness");
  assert(text.includes("비회원 열람 큐") && text.includes("API 응답 확인"), "Commercialization page missing daily benefit queue metrics");
  assert(text.includes("출시 전 혜택 판단표 준비도") && text.includes("고객이 먼저 누르는 4가지 혜택 축"), "Commercialization page missing launch benefit decision readiness");
  assert(text.includes("무료 수령") && text.includes("결제 전 쿠폰") && text.includes("마감 혜택") && text.includes("구매처 확인 상품"), "Commercialization page missing launch decision action axes");
  assert(text.includes("판단표 API 확인"), "Commercialization page missing decision guide API link");
  assert(text.includes("수령 난이도 출시 점검") && text.includes("간편 수령, 조건 확인, 마감 주의 균형"), "Commercialization page missing claim effort launch readiness");
  assert(text.includes("수령 난이도 API 확인") && text.includes("대표 후보"), "Commercialization page missing claim effort API and sample candidate");
  assert(text.includes("주간 재방문 혜택 캘린더") && text.includes("포인트, 무료 샘플, 쿠폰, 장보기"), "Commercialization page missing weekly benefit calendar readiness");
  assert(text.includes("캘린더 API 확인") && text.includes("가입 없는 혜택"), "Commercialization page missing weekly calendar API action");
  assert(text.includes("실기기 QA 체크리스트"), "Commercialization page missing device QA checklist reminder");
  assert(text.includes("운영 환경변수 확인"), "Commercialization page missing environment doctor reminder");
  assert(text.includes("혜택 데이터 품질 요약"), "Commercialization page missing benefit data quality summary");
  assert(text.includes("무료·쿠폰·포인트") && text.includes("구매 링크 확인") && text.includes("신고/종료 점검"), "Commercialization page missing benefit quality operating cards");
  assert(text.includes("혜택형 콘텐츠 커버리지"), "Commercialization page missing benefit coverage guide");
  assert(text.includes("운영 액션 큐") && text.includes("출시 전 먼저 점검할 혜택 유형"), "Commercialization page missing benefit operation action queue");
  assert(text.includes("매일 재방문 루틴 준비도") && text.includes("재방문 점수"), "Commercialization page missing benefit retention readiness");
  assert(text.includes("무료·쿠폰·포인트·마트·마감") && text.includes("다음 재방문 개선 액션"), "Commercialization page missing retention operation actions");
  assert(text.includes("개인화 추천 출시 준비도") && text.includes("홈, 알림, 무료혜택 탭에서 같은 개인화 추천 큐"), "Commercialization page missing personalization readiness");
  assert(text.includes("다음 개인화 개선 액션"), "Commercialization page missing personalization operation actions");
  assert(text.includes("운영 환경 설정 준비도") && text.includes("공개 URL, Supabase Auth, 데이터 공급"), "Commercialization page missing operational env readiness");
  assert(text.includes("운영 환경 다음 액션") && text.includes("npm run env:doctor -- --strict"), "Commercialization page missing env doctor action guidance");
});

await check("deals api", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=3&sort=discount");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.count === 3, `Expected 3 deals, got ${data.count}`);
  assert(data.deals[0].discountRate >= data.deals[1].discountRate, "Deals are not sorted by discount");
  assert(data.quality?.total === data.count, "Deals API quality summary should match returned count");
  assert(data.quality?.verifiedRate >= 0, "Deals API quality summary missing verified rate");
  assert(data.quality?.averagePurchaseConfidence >= 0, "Deals API quality summary missing purchase confidence");
  for (const field of ["mallName", "thumbnail", "shipping", "expireAt", "isFreeShipping", "productUrl", "searchUrl", "originalUrl", "clickCount", "likeCount", "isSoldOut", "updatedAt"]) {
    assert(field in data.deals[0], `Canonical Deal field missing: ${field}`);
  }
  for (const field of ["linkVerified", "finalUrl", "checkedAt", "purchaseConfidence", "purchaseLinkVerified", "finalPurchaseUrl"]) {
    assert(field in data.deals[0], `Purchase link verification field missing: ${field}`);
  }
  assert(!data.message.includes("mock"), "Deals API should not expose mock wording in success message");
  for (const field of ["mall", "imageUrl", "shippingInfo", "expiresAt"]) {
    assert(field in data.deals[0], `Legacy Deal alias missing: ${field}`);
  }
});

await check("news deals api", async () => {
  const { response, data } = await fetchJson("/api/news-deals?limit=25");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "News deals API ok should be true");
  assert(data.count >= 25, `Expected at least 25 official news/event benefits, got ${data.count}`);
  assert(data.deals.every((deal) => deal.validationStatus === "passed" && deal.isHidden === false), "News deals API returned hidden or unverified items");
  assert(data.deals.every((deal) => /^https?:\/\//.test(deal.finalUrl)), "News deals API returned invalid finalUrl");
  assert(data.deals.every((deal) => !/search|query=|keyword=|msearch|result/i.test(deal.finalUrl)), "News deals API returned a search/result URL");
  assert(data.deals.some((deal) => deal.category === "마트/편의점"), "News deals API missing mart/convenience official benefits");
  assert(data.deals.some((deal) => deal.category === "영화/문화" || deal.category === "정부/공공혜택"), "News deals API missing culture/public official benefits");
  const full = await fetchJson("/api/news-deals");
  const categories = new Set(full.data.deals.map((deal) => deal.category));
  for (const category of ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"]) {
    assert(categories.has(category), `News deals API missing expanded official benefit category: ${category}`);
  }
  const categoryCounts = full.data.deals.reduce((map, deal) => map.set(deal.category, (map.get(deal.category) ?? 0) + 1), new Map());
  for (const category of categories) {
    assert(categoryCounts.get(category) >= 2, `News deals API should keep at least 2 official benefits for category: ${category}`);
  }
});

await check("admin news operations api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-operations");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin news operations API ok should be true");
  assert(data.report?.visibleCount >= 25, "Admin news operations report missing launch-ready visible official benefits");
  assert(Array.isArray(data.report?.visibleDeals) && data.report.visibleDeals.length >= 6, "Admin news operations report missing visible deal operation candidates");
  assert(Array.isArray(data.report?.providerStats) && data.report.providerStats.length >= 4, "Admin news operations report missing provider stats");
  assert(Array.isArray(data.report?.providerRisks) && data.report.providerRisks.length >= 4, "Admin news operations report missing provider risk summaries");
  assert(data.report.providerRisks.every((risk) => risk.provider && risk.label && risk.action && ["healthy", "watch", "danger"].includes(risk.severity)), "Admin news operations provider risks missing operation fields");
  assert(typeof data.report?.providerRiskSummary?.watch === "number" && typeof data.report?.providerRiskSummary?.danger === "number", "Admin news operations report missing provider risk summary counts");
  assert(Array.isArray(data.report?.recentLogs) && data.report.recentLogs.length >= 6, "Admin news operations report missing recent logs");
  assert(Array.isArray(data.report?.manualActions) && data.report.manualActions.length >= 3, "Admin news operations report missing manual actions");
  assert(data.report?.refreshAll?.productDealsCount >= 140, "Admin news operations report missing refresh:all product count");
  assert(data.report?.refreshAll?.newsDealsCount >= 25, "Admin news operations report missing refresh:all news count");
  assert(Array.isArray(data.report?.categoryCoverage) && data.report.categoryCoverage.length >= 10, "Admin news operations report missing required category coverage");
  assert(data.report.categoryCoverage.every((item) => item.category && typeof item.count === "number" && item.count >= 2 && item.minimumCount >= 2 && item.action), "Admin news operations category coverage missing operation fields or minimum counts");
  assert(Array.isArray(data.report?.operationalRisks) && data.report.operationalRisks.length >= 1, "Admin news operations report missing operational risk summary");
  assert(Array.isArray(data.report?.refreshAll?.steps) && data.report.refreshAll.steps.length >= 5, "Admin news operations report missing refresh:all step status");
  assert(data.report?.freshness?.cadenceHours === 6, "Admin news operations report missing 6-hour freshness cadence");
  assert(data.report?.freshness?.staleHours === 24, "Admin news operations report missing 24-hour stale guard");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.freshness?.status), "Admin news operations report missing freshness status");
  assert(String(data.report?.freshness?.command ?? "").includes("refresh:all"), "Admin news operations report missing refresh command guidance");
  assert(Array.isArray(data.report?.operatorNextActions) && data.report.operatorNextActions.length >= 1, "Admin news operations report missing operator next actions");
});

await check("admin health readiness api", async () => {
  const { response, data } = await fetchJson("/api/admin/health-readiness");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin health readiness API ok should be true");
  assert(data.report?.ok === true, "Admin health readiness report should pass");
  assert(data.report?.score === 100, "Admin health readiness score should be 100");
  assert(data.report?.product?.productDealsCount >= 140, "Admin health readiness should preserve product count");
  assert(data.report?.product?.verifiedProductLinks >= 140, "Admin health readiness should preserve verified product links");
  assert(data.report?.product?.searchLinks === 0, "Admin health readiness should expose zero search links");
  assert(data.report?.officialBenefits?.visibleCount >= 25, "Admin health readiness should preserve official benefit count");
  assert(data.report?.officialBenefits?.readyCategories >= 10, "Admin health readiness should preserve official benefit category coverage");
  assert(Array.isArray(data.report?.officialBenefits?.activeProviders) && data.report.officialBenefits.activeProviders.length >= 4, "Admin health readiness should expose active official benefit providers");
  assert(Array.isArray(data.report?.officialBenefits?.providerStats) && data.report.officialBenefits.providerStats.length >= 4, "Admin health readiness should expose official benefit provider stats");
  assert(data.report.officialBenefits.providerStats.every((provider) => provider.provider && typeof provider.visibleCount === "number"), "Admin health readiness provider stats missing operation fields");
  assert(data.report?.refreshAll?.ok === true, "Admin health readiness should show refresh:all success");
  assert(Array.isArray(data.report?.checks) && data.report.checks.every((check) => check.ok), "Admin health readiness checks should all pass");
});

await check("admin notification campaigns api", async () => {
  const { response, data } = await fetchJson("/api/admin/notification-campaigns?includeRows=true");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin notification campaigns API ok should be true");
  assert(data.officialBenefitCount >= 6, "Notification campaign API missing official benefit count");
  assert(Array.isArray(data.productCampaigns) && data.productCampaigns.length >= 5, "Notification campaign API missing product campaigns");
  assert(Array.isArray(data.officialBenefitCampaigns) && data.officialBenefitCampaigns.length >= 4, "Notification campaign API missing official benefit campaigns");
  assert(data.officialBenefitCampaigns.every((campaign) => campaign.sourceKind === "official_benefit"), "Official benefit campaigns should be marked separately");
  assert(data.officialBenefitCampaigns.some((campaign) => campaign.benefitIds.length > 0), "Official benefit campaigns should include benefit ids");
  assert(data.queueRows.some((row) => row.source_kind === "official_benefit" && row.benefit_id), "Push queue rows should include official benefit rows");
  assert(data.queueRows.some((row) => row.source_kind === "product_deal" && row.deal_id), "Push queue rows should preserve product deal rows");
});

await check("admin push readiness api", async () => {
  const { response, data } = await fetchJson("/api/admin/push-readiness");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin push readiness API ok should be true");
  assert(["dry_run_ready", "send_ready"].includes(data.report?.launchStatus), "Push readiness should be dry-run or send ready");
  assert(data.report?.readinessScore >= 80, "Push readiness score should be launch-safe");
  assert(data.report?.queueRows >= 20, "Push readiness should expose queue rows");
  assert(data.report?.readySegments >= 8, "Push readiness should cover interest category segments");
  assert(Array.isArray(data.report?.segmentCoverage) && data.report.segmentCoverage.length >= 10, "Push readiness should expose segment coverage");
  assert(Array.isArray(data.report?.consentChecklist) && data.report.consentChecklist.length >= 5, "Push readiness should expose consent checklist");
  assert(Array.isArray(data.report?.databaseTables) && data.report.databaseTables.some((table) => table.table === "push_subscriptions"), "Push readiness should expose push subscription table readiness");
});

await check("admin push dry-run api", async () => {
  const { response, data } = await fetchJson("/api/admin/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "할인도사 dry-run",
      body: "공식 혜택 알림 후보를 dry-run으로 검증합니다.",
      tokens: ["test-token-1", "test-token-2", "test-token-1"],
      campaignId: "smoke-official-benefit",
      benefitId: "news-smoke",
      sourceKind: "official_benefit",
      alertType: "free_event",
      dryRun: true
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin push dry-run API ok should be true");
  assert(data.result?.attempted === 2, "Admin push dry-run should normalize duplicate tokens");
  assert(data.result?.sent === 0 && data.result?.failed === 0, "Admin push dry-run should not send or fail real pushes");
  assert(data.result?.message.includes("dry-run"), "Admin push dry-run should return dry-run message");
});

await check("deals filters api", async () => {
  const spacedKoreanSearch = await fetchJson(`/api/deals?q=${encodeURIComponent("애플 워치")}&limit=10`);
  assert(spacedKoreanSearch.response.status === 200, `Expected 200, got ${spacedKoreanSearch.response.status}`);
  assert(spacedKoreanSearch.data.deals.some((deal) => /애플워치|애플 워치/.test(deal.title)), "Spaced Korean search should match compact product names");

  const brandMallSearch = await fetchJson(`/api/deals?q=${encodeURIComponent("쿠팡 로켓")}&limit=20`);
  assert(brandMallSearch.response.status === 200, `Expected 200, got ${brandMallSearch.response.status}`);
  assert(brandMallSearch.data.deals.some((deal) => /쿠팡/.test(deal.mallName) || /로켓/.test(`${deal.title} ${deal.tags.join(" ")}`)), "Search should match mall, brand, and tag text");

  const dailyGoodsSearch = await fetchJson(`/api/deals?q=${encodeURIComponent("생필품")}&limit=20`);
  assert(dailyGoodsSearch.response.status === 200, `Expected 200, got ${dailyGoodsSearch.response.status}`);
  assert(dailyGoodsSearch.data.deals.length > 0, "Daily goods synonym search should return deals");
  assert(
    dailyGoodsSearch.data.deals.some((deal) => /생활용품|생활필수|물티슈|세제|마스크|생수|장보기/.test(`${deal.title} ${deal.category} ${deal.tags.join(" ")}`)),
    "Daily goods synonym search should match living essentials"
  );

  const freeShippingSynonymSearch = await fetchJson(`/api/deals?q=${encodeURIComponent("무배")}&limit=20`);
  assert(freeShippingSynonymSearch.response.status === 200, `Expected 200, got ${freeShippingSynonymSearch.response.status}`);
  assert(freeShippingSynonymSearch.data.deals.length > 0, "Free-shipping synonym search should return deals");
  assert(
    freeShippingSynonymSearch.data.deals.some((deal) => /무료배송|무배|로켓배송|로켓프레시|네멤무료/.test([deal.shippingInfo, deal.shipping, ...deal.tags].join(" "))),
    "Free-shipping synonym search should match free shipping language"
  );

  const productIntentSearches = [
    ["라면", /라면|신라면|진라면|너구리|짜파게티|식품/],
    ["햇반", /햇반|즉석밥|간편식|식품/],
    ["세제", /세제|주방세제|섬유유연제|생활필수|생활용품/],
    ["선크림", /선크림|뷰티|올리브영/],
    ["유산균", /유산균|락토핏|프로바이오틱스|건강식품|영양제/],
    ["계란", /계란|달걀|무항생제|특란|식품/],
    ["우유", /우유|멸균우유|신선식품|로켓프레시|식품/],
    ["닭가슴살", /닭가슴살|단백질|냉동|간편식|식품/],
    ["마스크", /마스크|KF94|황사방역|생활필수|생활용품/i],
    ["충전케이블", /USB-C|충전 케이블|100W|케이블|디지털/i],
    ["멀티탭", /멀티탭|절전형|콘센트|생활용품|디지털/],
    ["화장지", /화장지|휴지|두루마리|생활필수|생활용품/],
    ["청소포", /청소포|물걸레|청소용품|생활필수|생활용품/],
    ["김자반", /김자반|노브랜드|장보기|식품|마트/],
    ["김치", /김치|포기김치|장보기|신선식품|식품/],
    ["키친타월", /키친타월|키친타올|주방용품|생활필수|생활용품/],
    ["참치", /참치|참치캔|통조림|장보기|식품/],
    ["가글", /가글|리스테린|마우스워시|구강청결|생활필수/],
    ["콜라", /콜라|제로콜라|탄산음료|음료|간식/],
    ["탈취제", /탈취제|페브리즈|섬유탈취제|생활필수|세탁/],
    ["단백질바", /단백질바|프로틴바|닥터유|간식|헬스/],
    ["새우깡", /새우깡|과자|스낵|간식|식품/]
  ];

  for (const [keyword, expectedPattern] of productIntentSearches) {
    const result = await fetchJson(`/api/deals?q=${encodeURIComponent(keyword)}&verifiedOnly=true&limit=20`);
    assert(result.response.status === 200, `Expected 200 for ${keyword}, got ${result.response.status}`);
    assert(result.data.deals.length > 0, `${keyword} verified product-intent search should return deals`);
    assert(
      result.data.deals.some((deal) => expectedPattern.test(`${deal.title} ${deal.category} ${deal.tags.join(" ")}`)),
      `${keyword} product-intent search should match relevant product text`
    );
    assert(result.data.deals.every((deal) => deal.linkStatus === "verified"), `${keyword} product-intent search returned an unverified deal`);
  }

  const hot = await fetchJson("/api/deals?hotOnly=true&limit=5");
  assert(hot.response.status === 200, `Expected 200, got ${hot.response.status}`);
  assert(hot.data.deals.every((deal) => deal.isHot), "hotOnly returned a non-hot deal");

  const ending = await fetchJson("/api/deals?endingSoonOnly=true&limit=5");
  assert(ending.response.status === 200, `Expected 200, got ${ending.response.status}`);
  assert(ending.data.deals.every((deal) => deal.isEndingSoon), "endingSoonOnly returned a non-ending deal");

  const freeShipping = await fetchJson("/api/deals?freeShippingOnly=true&limit=5");
  assert(freeShipping.response.status === 200, `Expected 200, got ${freeShipping.response.status}`);
  assert(
    freeShipping.data.deals.every((deal) => /무료배송|무배|네멤무료|로켓프레시/.test([deal.shippingInfo, ...deal.tags].join(" "))),
    "freeShippingOnly returned a non-free-shipping deal"
  );

  const verified = await fetchJson("/api/deals?verifiedOnly=true&limit=10");
  assert(verified.response.status === 200, `Expected 200, got ${verified.response.status}`);
  assert(verified.data.deals.length > 0, "verifiedOnly should return verified direct purchase deals");
  assert(
    verified.data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search"),
    "verifiedOnly returned a deal that still needs link review"
  );

  const auction = await fetchJson("/api/deals?mall=auction&limit=5");
  assert(auction.response.status === 200, `Expected 200, got ${auction.response.status}`);
  assert(auction.data.deals.length > 0, "Auction mall filter should return at least one deal");
  assert(auction.data.deals.every((deal) => /옥션|auction/i.test(`${deal.mallName} ${deal.mall}`)), "Auction mall filter returned another mall");

  const budget = await fetchJson("/api/deals?priceBand=under10000&limit=20");
  assert(budget.response.status === 200, `Expected 200, got ${budget.response.status}`);
  assert(budget.data.deals.length > 0, "Budget price band should return at least one deal");
  assert(budget.data.deals.every((deal) => deal.salePrice < 10000), "priceBand=under10000 returned a deal over budget");

  const premium = await fetchJson("/api/deals?minPrice=100000&limit=20");
  assert(premium.response.status === 200, `Expected 200, got ${premium.response.status}`);
  assert(premium.data.deals.length > 0, "minPrice filter should return at least one deal");
  assert(premium.data.deals.every((deal) => deal.salePrice >= 100000), "minPrice returned a cheaper deal");

  const combinedWater = await fetchJson("/api/deals?q=생수&verifiedOnly=true&freeShippingOnly=true&sort=price&limit=20");
  assert(combinedWater.response.status === 200, `Expected 200, got ${combinedWater.response.status}`);
  assert(combinedWater.data.deals.length > 0, "Combined 생수 + verified + free shipping search should return deals");
  assert(
    combinedWater.data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search"),
    "Combined verified search returned a link that still needs review"
  );
  assert(combinedWater.data.deals.every((deal) => deal.isFreeShipping), "Combined free shipping search returned a paid-shipping deal");
  assert(
    combinedWater.data.deals.every((deal, index, list) => index === 0 || list[index - 1].salePrice <= deal.salePrice),
    "Combined price sort should return ascending sale prices"
  );

  const combinedGmarket = await fetchJson("/api/deals?q=지마켓&mall=gmarket&sort=discount&limit=20");
  assert(combinedGmarket.response.status === 200, `Expected 200, got ${combinedGmarket.response.status}`);
  assert(combinedGmarket.data.deals.length > 0, "Combined 지마켓 + mall filter search should return deals");
  assert(combinedGmarket.data.deals.every((deal) => /g마켓|지마켓|gmarket/i.test(`${deal.mallName} ${deal.mall}`)), "Combined mall filter returned another mall");
  assert(
    combinedGmarket.data.deals.every((deal, index, list) => index === 0 || list[index - 1].discountRate >= deal.discountRate),
    "Combined discount sort should return descending discount rates"
  );

  const combinedBudgetLiving = await fetchJson("/api/deals?category=living&q=물티슈&priceBand=under10000&verifiedOnly=true&limit=20");
  assert(combinedBudgetLiving.response.status === 200, `Expected 200, got ${combinedBudgetLiving.response.status}`);
  assert(combinedBudgetLiving.data.deals.length > 0, "Combined living + 물티슈 + budget search should return deals");
  assert(combinedBudgetLiving.data.deals.every((deal) => deal.salePrice < 10000), "Combined budget search returned a deal over budget");
  assert(combinedBudgetLiving.data.deals.every((deal) => deal.linkStatus === "verified"), "Combined budget search returned an unverified deal");
});

await check("deal link integrity", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=150&sort=latest");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.deals.length >= 140, `Expected at least 140 deals, got ${data.deals.length}`);
  const verifiedDirectLinks = data.deals.filter((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search");
  const verifiedDirectRate = Math.round((verifiedDirectLinks.length / data.deals.length) * 100);
  assert(
    verifiedDirectLinks.length >= 140 && verifiedDirectRate >= 100,
    `verified direct seller/product link coverage too low: ${verifiedDirectLinks.length}/${data.deals.length} (${verifiedDirectRate}%)`
  );

  for (const deal of data.deals) {
    const destination = deal.purchaseUrl || deal.url || deal.link;
    assert(!/티몬|위메프/.test(`${deal.mallName} ${deal.mall}`), `${deal.id} uses excluded mall: ${deal.mallName}`);
    assert(["direct_purchase", "seller_search", "affiliate", "unavailable"].includes(deal.linkType), `${deal.id} invalid linkType`);
    assert(!["seller_search", "search", "unavailable"].includes(deal.linkType), `${deal.id} exposed a non-openable link type: ${deal.linkType}`);
    assert(["verified", "needs_review", "broken", "sold_out"].includes(deal.linkStatus), `${deal.id} invalid linkStatus`);
    assert(deal.availability === "active", `${deal.id} exposed a non-active deal: ${deal.availability}`);
    assert(deal.validationStatus === "passed", `${deal.id} exposed a non-passed deal: ${deal.validationStatus}`);
    assert(deal.isHidden === false, `${deal.id} exposed a hidden deal`);
    assert(typeof deal.linkVerified === "boolean", `${deal.id} linkVerified should be boolean`);
    assert(typeof deal.purchaseLinkVerified === "boolean", `${deal.id} purchaseLinkVerified should be boolean`);
    assert(typeof deal.purchaseConfidence === "number", `${deal.id} purchaseConfidence should be number`);
    assert(["discount", "freebie", "coupon", "freeShipping", "experience", "event", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType), `${deal.id} invalid dealType`);
    assert(typeof deal.benefitSummary === "string" && deal.benefitSummary.length > 8, `${deal.id} missing benefitSummary`);
    assert(typeof deal.reliabilityScore === "number" && deal.reliabilityScore >= 0 && deal.reliabilityScore <= 100, `${deal.id} invalid reliabilityScore`);
    assert(typeof deal.isVerified === "boolean", `${deal.id} isVerified should be boolean`);
    assert(typeof deal.isExpired === "boolean", `${deal.id} isExpired should be boolean`);
    assert(typeof deal.savingsAmount === "number", `${deal.id} savingsAmount should be number`);
    assert(typeof deal.savingsRate === "number", `${deal.id} savingsRate should be number`);
    assert(typeof deal.price === "number", `${deal.id} price alias should be number`);
    assert(typeof deal.viewCount === "number", `${deal.id} viewCount should be number`);
    assert(typeof deal.reportCount === "number", `${deal.id} reportCount should be number`);
    assert(typeof deal.isFirstComeFirstServed === "boolean", `${deal.id} isFirstComeFirstServed should be boolean`);
    assert(typeof deal.requiresSignup === "boolean", `${deal.id} requiresSignup should be boolean`);
    assert(typeof deal.shippingFee === "string" && deal.shippingFee.length > 0, `${deal.id} missing shippingFee`);
    assert(typeof deal.claimCta === "string" && deal.claimCta.length > 0, `${deal.id} missing claimCta`);
    assert(Array.isArray(deal.eligibilityChecklist) && deal.eligibilityChecklist.length >= 4, `${deal.id} missing eligibilityChecklist`);
    assert(Array.isArray(deal.claimSteps) && deal.claimSteps.length >= 3, `${deal.id} missing claimSteps`);
    assert(typeof deal.claimWarning === "string" && deal.claimWarning.includes("판매처"), `${deal.id} missing claimWarning`);
    assert(deal.isVerified ? Boolean(deal.verifiedProductUrl || deal.finalPurchaseUrl) : true, `${deal.id} verified deal missing verifiedProductUrl/finalPurchaseUrl`);
    assert(deal.purchaseConfidence >= 0 && deal.purchaseConfidence <= 100, `${deal.id} purchaseConfidence out of range`);
    assert(deal.finalUrl && !isUnsafeDealUrl(deal.finalUrl), `${deal.id} has unsafe finalUrl: ${deal.finalUrl}`);
    assert(deal.finalPurchaseUrl && !isUnsafeDealUrl(deal.finalPurchaseUrl), `${deal.id} has unsafe finalPurchaseUrl: ${deal.finalPurchaseUrl}`);
    assert(!isUnsafeDealUrl(destination), `${deal.id} has unsafe/community/placeholder destination: ${destination}`);

    if (deal.sourceUrl && /ppomppu\.co\.kr|fmkorea\.com|quasarzone\.com|algumon\.com|clien\.net|ruliweb\.com/.test(deal.sourceUrl)) {
      assert(deal.finalPurchaseUrl !== deal.sourceUrl, `${deal.id} should separate community source URL from final purchase URL`);
      assert(!isUnsafeDealUrl(deal.finalPurchaseUrl), `${deal.id} community-sourced deal should still redirect to a safe purchase URL`);
    }

    if (deal.linkStatus === "verified") {
      assert(deal.linkType !== "seller_search", `${deal.id} verified deal should not be seller_search`);
      assert(deal.linkVerified === true, `${deal.id} verified deal should set linkVerified`);
      assert(deal.purchaseLinkVerified === true, `${deal.id} verified deal should set purchaseLinkVerified`);
      assert(!isMallHomeOnlyUrl(destination), `${deal.id} verified deal points to mall home: ${destination}`);
    }

    if (deal.linkType === "seller_search") {
      assert(deal.linkStatus === "needs_review", `${deal.id} seller_search should be needs_review`);
      assert(deal.linkVerified === false, `${deal.id} seller_search should not be linkVerified`);
      assert(/검색|확인/.test(deal.linkLabel), `${deal.id} seller_search label should warn about review`);
    }
  }
});

await check("benefit type filter api", async () => {
  const { response, data } = await fetchJson("/api/deals?dealType=coupon&limit=30");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Benefit filter API ok should be true");
  assert(data.deals.length > 0, "coupon benefit filter should return deals");
  assert(data.deals.every((deal) => deal.dealType === "coupon"), "Benefit filter returned a non-coupon deal");

  for (const type of ["point", "foodDelivery", "experience"]) {
    const filtered = await fetchJson(`/api/deals?dealType=${type}&limit=30`);
    assert(filtered.response.status === 200, `Expected ${type} 200, got ${filtered.response.status}`);
    assert(filtered.data.deals.length > 0, `${type} benefit filter should return deals`);
    assert(filtered.data.deals.every((deal) => deal.dealType === type), `${type} benefit filter returned a mismatched deal`);
  }
  const allBenefitData = await fetchJson("/api/deals?limit=100&sort=latest");
  const benefitText = allBenefitData.data.deals.map((deal) => `${deal.title} ${deal.tags.join(" ")}`).join(" ");
  assert(
    benefitText.includes("현대카드 M포인트") && benefitText.includes("카카오톡 선물하기") && benefitText.includes("티켓링크 전시"),
    "Benefit data missing card, invite, or culture event examples"
  );
});

await check("free benefits page", async () => {
  const response = await fetch(`${baseUrl}/free-benefits`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("무료 혜택 전용 탭"), "Free benefits page missing title");
  assert(text.includes("무료 혜택 출석 기록") && text.includes("오늘도 혜택을 확인한 기록을 기기에 남겼습니다"), "Free benefits page missing visit streak record");
  assert(text.includes("연속 확인") && text.includes("누적 방문") && text.includes("무료 1개 챙기고 내일 볼 루틴 예약"), "Free benefits page missing visit streak cards");
  assert(
    text.includes("오늘 혜택 미션") &&
      text.includes("하루에 세 가지만 챙기면 충분합니다") &&
      text.includes("무료 혜택 1개 챙기기") &&
      text.includes("쿠폰 1개 저장하기") &&
      text.includes("내일 볼 루틴 예약"),
    "Free benefits page missing daily benefit mission"
  );
  assert(text.includes("수령 전 30초 확인") && text.includes("무료 혜택도 조건을 알고 받아야 합니다"), "Free benefits page missing pre-claim condition summary");
  assert(text.includes("문화 초대권 찾기") && text.includes("초대권 보기"), "Free benefits page missing culture invitation quick filter");
  assert(text.includes("혜택 준비물 체크") && text.includes("받기 전 필요한 조건만 먼저 정리합니다"), "Free benefits page missing benefit readiness checklist");
  assert(text.includes("회원가입 없이 받을 혜택") && text.includes("배송비 부담 없는 혜택") && text.includes("쿠폰 조건 확인 필요"), "Free benefits page missing readiness filter actions");
  assert(
    text.includes("현재 결과 혜택 판단 요약") &&
      text.includes("검색 결과를 받기 쉬운 조건부터 다시 정리합니다") &&
      text.includes("바로 받을 가능성") &&
      text.includes("실제 링크 확인"),
    "Free benefits page missing filtered readiness summary"
  );
  assert(
    text.includes("쿠폰·이벤트 조건 보드") &&
      text.includes("최소 주문 금액") &&
      text.includes("중복 가능 여부") &&
      text.includes("배달앱 쿠폰") &&
      text.includes("페이·카드·포인트"),
    "Free benefits page missing coupon event condition board"
  );
  assert(
    text.includes("앱테크·페이·멤버십") &&
      text.includes("매일 눌러 챙길 적립 혜택을 따로 모았습니다") &&
      text.includes("적립 루틴") &&
      text.includes("앱테크 혜택 바로 받기"),
    "Free benefits page missing apptech reward routine rail"
  );
  assert(
    text.includes("문화 무료 초대권") &&
      text.includes("영화·전시·공연 혜택도 놓치지 않게 모았습니다") &&
      text.includes("무료 초대권") &&
      text.includes("문화 혜택 바로 확인") &&
      text.includes("문화 초대권 종료 신고") &&
      text.includes("문화 초대권 링크 오류 신고"),
    "Free benefits page missing culture invitation benefit rail"
  );
  assert(text.includes("내가 챙긴 혜택 기록") && text.includes("오늘 실제로 챙긴 혜택을 남겨보세요") && text.includes("챙김"), "Free benefits page missing claimed benefit tracking");
  assert(text.includes("절약 다이어리") && text.includes("다음 절약 행동"), "Free benefits page missing savings diary");
  assert(text.includes("무료혜택 개인화 이어보기") && text.includes("관심사와 찜 기록으로 다음 혜택") && text.includes("개인화 API 보기"), "Free benefits page missing personalized follow-up queue");
  assert(text.includes("챙긴 혜택 다음 방문 이어보기") && text.includes("오늘 기록을 기준으로 내일 볼 혜택을 정리합니다"), "Free benefits page missing claimed benefit follow-up plan");
  assert(text.includes("아직 안 챙긴 무료 혜택") && text.includes("결제 전 다시 볼 쿠폰") && text.includes("마감 전 놓치기 쉬운 혜택"), "Free benefits page missing claimed benefit follow-up cards");
  assert(text.includes("내일 다시 볼 혜택 예약") && text.includes("오늘 챙긴 뒤 다음 방문 순서를 남깁니다"), "Free benefits page missing next visit benefit plan");
  assert(text.includes("내일 아침 먼저 볼 혜택") && text.includes("퇴근 전 확인할 쿠폰") && text.includes("마감 전 재확인"), "Free benefits page missing next visit routine cards");
  assert(text.includes("내 혜택 재방문 예약함") && text.includes("비회원도 기기에만 다음 방문 루틴을 저장합니다"), "Free benefits page missing local return reservation board");
  assert(text.includes("아침 무료 혜택") && text.includes("저녁 쿠폰 점검") && text.includes("저장된 재방문 루틴"), "Free benefits page missing return reservation actions");
  assert(text.includes("진행 중 혜택") && text.includes("가입 없이 받기") && text.includes("선착순 확인") && text.includes("배송비 확인"), "Free benefits page missing condition summary cards");
  assert(text.includes("혜택 출처·조건 점검") && text.includes("받기 전에 출처와 조건을 먼저 봅니다"), "Free benefits page missing source and condition trust summary");
  assert(text.includes("제공처 확인") && text.includes("실제 링크 확인") && text.includes("조건 요약") && text.includes("신고 가능"), "Free benefits page missing source condition operating cards");
  assert(text.includes("오늘 무료 혜택 루틴") && text.includes("돈 쓰기 전에 이 순서로 챙기세요"), "Free benefits page missing daily benefit routine");
  assert(text.includes("오늘 먼저 받을 혜택") && text.includes("결제 전 쿠폰 챙기기") && text.includes("앱테크·포인트 적립"), "Free benefits page missing routine action cards");
  assert(text.includes("오늘 우선 확인 큐") && text.includes("무료·쿠폰 혜택은 이 순서로 보세요"), "Free benefits page missing priority benefit queue");
  assert(text.includes("이번 주 혜택 루틴 진행률") && text.includes("챙김, 찜, 재방문 예약을 한눈에 이어갑니다"), "Free benefits page missing weekly routine progress");
  assert(text.includes("루틴 완료") && text.includes("오늘 챙김 기록") && text.includes("재방문 예약"), "Free benefits page missing weekly routine progress cards");
  assert(text.includes("이번 주 혜택 캘린더") && text.includes("매일 들어와서 챙길 이유를 만들었습니다"), "Free benefits page missing weekly benefit calendar");
  assert(text.includes("출석·포인트 적립") && text.includes("무료 샘플·체험단") && text.includes("마트·편의점 행사"), "Free benefits page missing weekly benefit routine actions");
  assert(text.includes("5분 혜택 체크리스트") && text.includes("처음 들어온 사용자가 바로 따라할 순서"), "Free benefits page missing guided benefit checklist");
  assert(text.includes("무료·0원 먼저 확인") && text.includes("결제 전 쿠폰 적용") && text.includes("배송비 줄이기"), "Free benefits page missing checklist preset actions");
  assert(text.includes("혜택별 최종 확인 기준") && text.includes("쿠폰/포인트"), "Free benefits page missing benefit guardrail guide");
  assert(text.includes("무료혜택 공통 판단표") && text.includes("홈·알림과 같은 기준으로 오늘 받을 혜택을 고릅니다"), "Free benefits page missing shared benefit decision guide");
  assert(text.includes("판단표 API 보기") && text.includes("무료로 받을 것, 결제 전 적용할 것, 오늘 끝날 것, 바로 이동할 상품"), "Free benefits page missing shared decision guide API action");
  assert(text.includes("돈 안 쓰고 받을 것") && text.includes("구매처가 확인된 것"), "Free benefits page missing shared decision guide cards");
  assert(text.includes("무료 혜택 빠른 판단") && text.includes("받기 전에 가장 중요한 조건만 먼저 고르세요"), "Free benefits page missing quick decision rail");
  assert(text.includes("지금 받을 수 있는 혜택") && text.includes("배송비 부담 낮추기"), "Free benefits page missing condition decision cards");
  assert(text.includes("혜택 헛걸음 방지 점검") && text.includes("현재 결과에서 놓치기 쉬운 조건을 먼저 봅니다"), "Free benefits page missing wasted-visit prevention review");
  assert(text.includes("숨은 비용 확인") && text.includes("가입 조건 확인") && text.includes("선착순·마감 위험") && text.includes("신고 전 확인"), "Free benefits page missing risk review cards");
  assert(text.includes("무료 샘플") && text.includes("체험단") && text.includes("무료배송"), "Free benefits page missing free benefit tabs");
  assert(text.includes("편의점") && text.includes("마트") && text.includes("배달/외식"), "Free benefits page missing daily-life benefit tabs");
  assert(text.includes("무료 혜택 검색") && text.includes("무료 혜택 정렬"), "Free benefits page missing search/sort controls");
  assert(text.includes("마감 임박만") && text.includes("가입 없이 받기") && text.includes("선착순 혜택"), "Free benefits page missing condition filters");
  assert(text.includes("무료 혜택 수령 난이도") && text.includes("헛걸음 줄이도록 받기 쉬운 순서로 고릅니다"), "Free benefits page missing claim effort filter");
  assert(text.includes("간편 수령") && text.includes("조건 확인") && text.includes("마감 주의"), "Free benefits page missing claim effort cards");
  assert(text.includes("진행 중만 보기") && text.includes("바로 확인") && text.includes("종료·품절 가능 혜택"), "Free benefits page missing active-benefit status filter");
  assert(text.includes("선착순 여부") && text.includes("회원가입 필요 여부") && text.includes("신고 가능"), "Free benefits page missing benefit condition guidance");
  assert(text.includes("배송비:") && text.includes("중복:"), "Free benefits page missing benefit condition chips");
  assert(text.includes("혜택 조건 요약") && text.includes("최소금액:") && text.includes("만료:"), "Free benefits page missing actionable benefit condition summary");
  assert(text.includes("0원 혜택 스타터팩") && text.includes("처음 왔다면 이 혜택부터 확인하세요"), "Free benefits page missing zero-cost starter pack");
  assert(text.includes("무료 혜택만 보기") && text.includes("0원 혜택 바로 받기") && text.includes("스타터팩은 결제 부담이 낮은 혜택"), "Free benefits page missing zero-cost starter pack actions");
  assert(text.includes("수령 전 체크") && text.includes("혜택 수령 단계") && text.includes("조건이 다르거나 종료된 경우"), "Free benefits page missing structured benefit claim guide");
  assert(text.includes("혜택 받기") && text.includes("쿠폰 받기") && text.includes("종료"), "Free benefits page missing claim and report actions");
  assert(text.includes("품절 신고") && text.includes("링크 오류 신고"), "Free benefits page missing sold-out and link-error report actions");
  assert(text.includes("혜택 찜"), "Free benefits page missing top-level favorite action");
  assert(text.includes("혜택 공유"), "Free benefits page missing top-level share action");
  assert(text.includes("판매처 확인") && text.includes("신고"), "Free benefits page missing purchase and report actions");
});

await check("verified direct purchase link coverage", async () => {
  const { response, data } = await fetchJson("/api/deals?verifiedOnly=true&limit=150&sort=hot");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Verified deals API ok should be true");
  assert(data.deals.length >= 140, `Expected all 140 curated deals to be verified direct seller/product deals, got ${data.deals.length}`);
  assert(
    data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkVerified && deal.purchaseLinkVerified && deal.finalPurchaseUrl),
    "Verified-only API returned a deal without a reviewed direct product URL"
  );
});

await check("deal detail api", async () => {
  const { response, data } = await fetchJson("/api/deals/d001");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.deal?.id === "d001", "Detail API did not return d001");
  assert(Array.isArray(data.relatedDeals), "Related deals missing");
  assert(Array.isArray(data.priceHistory) && data.priceHistory.length >= 7, "Price history missing");
  assert(data.priceInsight?.confidenceScore >= 0, "Price insight missing");
});

await check("health api", async () => {
  const { response, data } = await fetchJson("/api/health");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.status === "healthy", `Expected healthy, got ${data.status}`);
  assert(data.checks?.operationalStatus === "ready", "Health API missing V2 operational readiness");
  assert(data.checks?.verifiedLinkRate >= 90, "Health API verified link rate is below launch threshold");
  assert(data.checks?.claimGuideRate >= 95, "Health API claim guide rate is below launch threshold");
  assert(data.checks?.claimEffortReady === true, "Health API missing claim effort readiness");
  assert(data.checks?.claimEffortEasyCount >= 1, "Health API missing easy claim effort count");
  assert(data.checks?.claimEffortConditionCount >= 1, "Health API missing condition claim effort count");
  assert(data.checks?.claimEffortDeadlineCount >= 1, "Health API missing deadline claim effort count");
  assert(data.checks?.freeBenefitDeals >= 10, "Health API missing free benefit readiness count");
  assert(data.checks?.personalizationReadyRate >= 0, "Health API missing personalization readiness rate");
  assert(data.checks?.personalizationQueuesReady >= 0, "Health API missing personalization ready queue count");
  assert(data.checks?.operationalEnvReadyRate >= 0, "Health API missing operational env readiness rate");
  assert(data.checks?.operationalEnvReadyGroups >= 0, "Health API missing operational env ready group count");
  assert(data.checks?.officialBenefitFresh === true, "Health API official benefit feed is stale");
  assert(data.checks?.officialBenefitFreshnessHours <= 24, "Health API missing official benefit freshness hours");
  assert(data.checks?.officialBenefitVisibleCount >= 25, "Health API missing official benefit visible count");
  assert(data.checks?.officialBenefitReadyCategories >= 10, "Health API missing official benefit category coverage");
  assert(data.checks?.officialBenefitWeakCategories === 0, "Health API found weak official benefit categories");
  assert(data.checks?.officialBenefitRefreshAllOk === true, "Health API missing refresh:all official benefit status");
});

await check("today benefits api", async () => {
  const { response, data } = await fetchJson("/api/benefits/today?limit=4");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Today benefits API ok should be true");
  assert(data.audience === "guest", "Today benefits API should keep guest access");
  assert(data.summary?.freeBenefitDeals >= 1, "Today benefits API missing free benefit summary");
  assert(data.summary?.verifiedPurchaseDeals >= 1, "Today benefits API missing verified purchase summary");
  assert(Array.isArray(data.sections) && data.sections.length >= 6, "Today benefits API should include daily sections");
  assert(data.sections.some((section) => section.key === "free-first"), "Today benefits API missing free-first section");
  assert(data.sections.some((section) => section.key === "coupon-before-pay"), "Today benefits API missing coupon-before-pay section");
  assert(data.sections.some((section) => section.key === "apptech-point"), "Today benefits API missing apptech-point section");
  assert(data.sections.every((section) => section.items.length <= 4), "Today benefits API should respect limit");
  assert(data.loginRequiredFor?.includes("찜 동기화"), "Today benefits API missing optional login boundary");
  assert(
    data.sections.flatMap((section) => section.items).every((item) => item.redirectUrl?.startsWith("/go/") && Array.isArray(item.claimSteps)),
    "Today benefits API items should include redirect and claim steps"
  );
  assert(String(data.notice ?? "").includes("판매처"), "Today benefits API missing purchase condition notice");
});

await check("admin daily benefit queue api", async () => {
  const { response, data } = await fetchJson("/api/admin/daily-queue?limit=3");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin daily queue API ok should be true");
  assert(data.audience === "guest", "Admin daily queue should keep guest-facing source audience");
  assert(Array.isArray(data.sections) && data.sections.length >= 5, "Admin daily queue missing sections");
  assert(data.sections.every((section) => section.operationAction), "Admin daily queue missing operation actions");
  assert(data.summary?.verifiedPurchaseDeals > 0, "Admin daily queue missing verified purchase summary");
});

await check("admin image queue api", async () => {
  const { response, data } = await fetchJson("/api/admin/image-queue");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin image queue API ok should be true");
  assert(data.imageQuality?.total >= 100, "Admin image queue missing total catalog count");
  assert(data.imageQuality?.fallbackImageCount >= 1, "Admin image queue should expose fallback image count");
  assert(data.imageQuality?.realImageRate >= 0, "Admin image queue missing real image rate");
  assert(Array.isArray(data.imageQuality?.categoryQueue) && data.imageQuality.categoryQueue.length >= 1, "Admin image queue missing category queue");
  assert(Array.isArray(data.imageQuality?.mallQueue) && data.imageQuality.mallQueue.length >= 1, "Admin image queue missing mall feed queue");
  assert(data.imageQuality?.sourcingPlan?.launchTargetRate === 60, "Admin image queue missing 60% launch image target");
  assert(data.imageQuality.sourcingPlan.gapToLaunchTarget >= 0, "Admin image queue missing image launch gap");
  assert(data.imageQuality.sourcingPlan.weeklySourcingTarget >= 0, "Admin image queue missing weekly image sourcing target");
  assert(Array.isArray(data.imageQuality?.nextBatchDeals) && data.imageQuality.nextBatchDeals.length >= 1, "Admin image queue missing weekly image sourcing batch details");
  assert(Array.isArray(data.imageQuality?.priorityDeals) && data.imageQuality.priorityDeals.length >= 1, "Admin image queue missing priority deals");
  assert(data.imageQuality.priorityDeals.every((deal) => deal.id && deal.title && deal.finalPurchaseUrl && deal.action && deal.priorityReason && deal.sourcingPriority), "Admin image priority deals missing operation fields");
  assert(data.imageQuality.nextBatchDeals.every((deal) => deal.id && deal.imageSearchUrl && deal.priorityReason), "Admin image weekly batch missing sourcing fields");
  assert(
    data.imageQuality.priorityDeals.every((deal) => deal.currentImageUrl && deal.imageField === "imageUrl" && deal.imageSearchUrl && deal.sourceUrl),
    "Admin image priority deals missing image sourcing fields"
  );
});

await check("weekly benefit calendar api", async () => {
  const { response, data } = await fetchJson("/api/benefits/calendar");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Weekly benefit calendar API ok should be true");
  assert(data.audience === "guest", "Weekly benefit calendar should keep guest access");
  assert(Array.isArray(data.calendar) && data.calendar.length === 7, "Weekly benefit calendar should include seven days");
  assert(data.calendar.some((item) => item.day === "월" && item.title.includes("출석")), "Weekly benefit calendar missing Monday routine");
  assert(data.calendar.every((item) => item.operationNote && item.preset && item.recommendedSurface), "Weekly benefit calendar missing operation metadata");
});

await check("daily benefit briefing api", async () => {
  const { response, data } = await fetchJson("/api/benefits/briefing?limit=3");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Daily benefit briefing API ok should be true");
  assert(data.briefing?.audience === "guest", "Daily benefit briefing should keep guest access");
  assert(data.briefing?.todayCalendar?.operationNote, "Daily benefit briefing missing today calendar operation note");
  assert(data.briefing?.primarySection?.items?.length <= 3, "Daily benefit briefing should respect limit");
  assert(data.briefing?.quickActions?.some((action) => action.href === "/free-benefits"), "Daily benefit briefing missing free benefit action");
});

await check("daily benefit routine api", async () => {
  const { response, data } = await fetchJson("/api/benefits/routine?limit=2");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Daily benefit routine API ok should be true");
  assert(data.routine?.audience === "guest", "Daily benefit routine should keep guest access");
  assert(data.routine?.title === "오늘 3분 혜택 루틴", "Daily benefit routine missing title");
  assert(data.routine?.summary?.actionableSteps >= 3, "Daily benefit routine should expose actionable steps");
  assert(Array.isArray(data.routine?.steps) && data.routine.steps.length === 5, "Daily benefit routine should include five steps");
  assert(data.routine.steps.some((step) => step.id === "free" && step.href.includes("/free-benefits")), "Daily benefit routine missing free mission");
  assert(data.routine.steps.every((step) => step.items.length <= 2 && step.primaryAction && step.doneSignal), "Daily benefit routine should respect limit and expose action metadata");
  assert(String(data.routine.notice ?? "").includes("선택 로그인"), "Daily benefit routine missing optional login notice");
});

await check("benefit decision guide api", async () => {
  const { response, data } = await fetchJson("/api/benefits/decision-guide");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Benefit decision guide API ok should be true");
  assert(data.audience === "guest", "Benefit decision guide should keep guest access");
  assert(Array.isArray(data.items) && data.items.length === 4, "Benefit decision guide should return four decision cards");
  assert(data.items.some((item) => item.id === "free" && item.title.includes("돈 안 쓰고")), "Benefit decision guide missing free decision card");
  assert(data.items.some((item) => item.id === "coupon" && item.title.includes("결제 전")), "Benefit decision guide missing coupon decision card");
  assert(data.items.some((item) => item.id === "endingSoon" && item.title.includes("놓치기")), "Benefit decision guide missing urgent decision card");
  assert(data.items.some((item) => item.id === "verified" && item.title.includes("구매처")), "Benefit decision guide missing verified decision card");
  assert(data.items.every((item) => typeof item.href === "string" && item.href.length > 1), "Benefit decision guide cards should include action hrefs");
  assert(String(data.notice ?? "").includes("비회원도 모든 혜택"), "Benefit decision guide missing non-member access notice");
});

await check("benefit claim effort api", async () => {
  const { response, data } = await fetchJson("/api/benefits/claim-effort");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Benefit claim effort API ok should be true");
  assert(data.audience === "guest", "Benefit claim effort should keep guest access");
  assert(data.totalActiveBenefits > 0, "Benefit claim effort should expose active benefit count");
  assert(Array.isArray(data.groups) && data.groups.length === 3, "Benefit claim effort should return three effort groups");
  assert(data.groups.some((group) => group.effort === "easy" && group.label === "간편 수령"), "Benefit claim effort missing easy group");
  assert(data.groups.some((group) => group.effort === "condition" && group.label === "조건 확인"), "Benefit claim effort missing condition group");
  assert(data.groups.some((group) => group.effort === "deadline" && group.label === "마감 주의"), "Benefit claim effort missing deadline group");
  assert(String(data.notice ?? "").includes("비회원도 모든 혜택"), "Benefit claim effort missing non-member access notice");
});

await check("personalized benefits api", async () => {
  const { response, data } = await fetchJson("/api/benefits/personalized?interest=%EB%AC%B4%EB%A3%8C%2F%EC%B2%B4%ED%97%98&interest=%EC%BF%A0%ED%8F%B0%2F%EC%9D%B4%EB%B2%A4%ED%8A%B8&favoriteId=d001&recentId=d014&limit=4");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Personalized benefits API ok should be true");
  assert(data.recommendations?.audience === "guest", "Personalized benefits should keep guest access");
  assert(data.recommendations?.interests?.includes("무료/체험"), "Personalized benefits missing interest input");
  assert(data.recommendations?.summary?.recommendedDeals <= 4, "Personalized benefits should respect limit");
  assert(Array.isArray(data.recommendations?.items) && data.recommendations.items.length > 0, "Personalized benefits missing recommendation items");
  assert(data.recommendations.items.every((item) => item.redirectUrl?.startsWith("/go/") && item.reason && item.personalizedSignals), "Personalized benefits items missing redirect, reason, or signals");
  assert(String(data.recommendations.notice ?? "").includes("선택 로그인"), "Personalized benefits missing optional login notice");
});

await check("metrics api", async () => {
  const { response, data } = await fetchJson("/api/metrics");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.metrics?.totalDeals >= 30, "Metrics should include at least 30 deals");
  assert(data.metrics?.averageConfidenceScore >= 0, "Metrics missing confidence score");
  assert(data.metrics?.verifiedLinkRate >= 0, "Metrics missing verified link rate");
  assert(data.metrics?.needsReviewLinks >= 0, "Metrics missing link review count");
  assert(data.metrics?.realImageRate >= 0, "Metrics missing real image rate");
  assert(data.metrics?.fallbackImageCount >= 0, "Metrics missing fallback image count");
  assert(data.imageQuality?.priorityDeals?.length >= 1, "Metrics missing image quality priority deals");
  assert(data.imageQuality?.categoryQueue?.length >= 1, "Metrics missing image quality category queue");
  assert(data.linkQuality?.total === data.metrics?.totalDeals, "Metrics missing shared link quality summary");
  assert(data.benefitQuality?.freeBenefitCount >= 0, "Metrics missing free benefit quality summary");
  assert(data.benefitQuality?.typeBreakdown?.length >= 3, "Metrics missing benefit type breakdown");
  assert(data.benefitQuality?.actionQueue?.length >= 1, "Metrics missing benefit operation action queue");
  assert(data.benefitQuality?.conditionAudit?.length >= 1, "Metrics missing benefit condition audit queue");
  assert(data.benefitQuality.conditionAudit.every((item) => typeof item.readinessRate === "number" && item.action), "Benefit condition audit missing readiness and action");
  assert(data.benefitQuality?.conditionOperationQueue?.length >= 1, "Metrics missing benefit condition operation queue");
  assert(
    data.benefitQuality.conditionOperationQueue.every(
      (item) =>
        item.priority &&
        item.action &&
        typeof item.readyCount === "number" &&
        typeof item.missingClaimGuideCount === "number" &&
        typeof item.needsVerificationCount === "number"
    ),
    "Benefit condition operation queue missing priority counts and action"
  );
  assert(data.benefitQuality?.claimEffortSummary?.groups?.length === 3, "Metrics missing claim effort summary");
  assert(data.benefitQuality?.claimEffortOperationQueue?.length === 3, "Metrics missing claim effort operation queue");
  assert(
    data.benefitQuality.claimEffortOperationQueue.every((item) => item.effort && item.label && item.action && typeof item.count === "number"),
    "Claim effort operation queue missing label, action, or count"
  );
  assert(data.benefitRetention?.retentionScore >= 0, "Metrics missing benefit retention score");
  assert(data.benefitRetention?.dailyRoutineSlots?.length === 5, "Metrics missing daily routine slots");
  assert(typeof data.benefitRetention?.weeklyRoutineReady === "boolean", "Metrics missing weekly routine readiness");
  assert(data.personalizationReadiness?.averageReadyRate >= 0, "Metrics missing personalization readiness rate");
  assert(data.personalizationReadiness?.queues?.length >= 4, "Metrics missing personalization readiness queues");
  assert(data.operationalEnvReadiness?.readyRate >= 0, "Metrics missing operational env readiness rate");
  assert(data.operationalEnvReadiness?.groups?.length >= 5, "Metrics missing operational env readiness groups");
  assert(Array.isArray(data.linkReviewQueue), "Metrics missing link review queue");
  assert(data.linkReviewQueue.length <= 8, "Metrics link review queue should be capped");
  if (data.linkReviewQueue.length) {
    assert(data.linkReviewQueue[0].reviewPriority, "Metrics link review queue missing priority");
    assert(data.linkReviewQueue[0].reviewReason, "Metrics link review queue missing reason");
    assert(data.linkReviewQueue[0].finalPurchaseUrl, "Metrics link review queue missing final purchase URL");
  }
});

await check("sources api", async () => {
  const { response, data } = await fetchJson("/api/sources");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Sources API ok should be true");
  assert(Array.isArray(data.sources) && data.sources.length >= 4, "Sources list is too small");
  assert(data.sources.some((source) => source.key === "mock"), "Mock source profile missing");
  assert(Array.isArray(data.readiness) && data.readiness.length >= 4, "Sources API missing source readiness summary");
  assert(data.readiness.some((source) => source.key === "mock" && typeof source.verifiedRate === "number" && source.nextAction), "Sources API missing mock readiness quality fields");
  assert(data.operationPolicy?.allowedSources?.includes("공식 API"), "Sources API missing allowed source policy");
  assert(data.operationPolicy?.blockedSources?.some((value) => value.includes("검색 결과")), "Sources API missing blocked source policy");
  assert(typeof data.operationPolicy?.configuredProductionFeeds === "number", "Sources API missing configured production feed count");
  assert(data.operationPolicy?.nextStep?.includes("DEAL_PRODUCTION_FEED_URLS") || data.operationPolicy?.nextStep?.includes("dry-run"), "Sources API missing production feed next step");
});

await check("report api", async () => {
  const reasons = await fetchJson("/api/reports?dealId=d001");
  assert(reasons.response.status === 200, `Expected 200, got ${reasons.response.status}`);
  assert(reasons.data.maxMessageLength === 500, "Report API missing message length policy");
  assert(reasons.data.reasons?.some((reason) => reason.plan?.operatorSla && reason.plan?.queueLabel), "Report API missing resolution plan metadata");

  const { response, data } = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d001",
      reason: "price_changed",
      message: "smoke test"
    })
  });
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Report API ok should be true");
  assert(response.headers.get("x-request-id"), "Report API missing request id");
  assert(response.headers.get("x-ratelimit-remaining"), "Report API missing rate limit header");
});

await check("report page reason prefill", async () => {
  const response = await fetch(`${baseUrl}/reports?dealId=d014&reason=sold_out`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("특가 정보 신고"), "Report page missing title");
  assert(text.includes("애플워치 호환 스포츠 밴드"), "Report page missing deal summary");
  assert(text.includes("품절"), "Report page missing sold out reason option");
  assert(text.includes("링크 오류"), "Report page missing link error reason option");
  assert(text.includes("신고 처리 예상 안내") && text.includes("목표 처리:"), "Report page missing resolution expectation guidance");
  assert(text.includes("신고 처리 흐름") && text.includes("링크와 종료 정보는 우선 확인합니다"), "Report page missing public report workflow summary");
  assert(text.includes("링크 교체") && text.includes("종료 혜택 정리") && text.includes("가격 기준 재확인"), "Report page missing report workflow action cards");
  assert(text.includes("구매 기준 보기") && text.includes("문의하기"), "Report page missing post-submit next actions");
  assert(text.includes("support@halindosa.com"), "Report page missing support contact");
});

await check("report validation", async () => {
  const { response, data } = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d001",
      reason: "price_changed",
      message: "x".repeat(501)
    })
  });

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.ok === false, "Long report message should fail");
  assert(data.message.includes("500자"), "Long report validation message missing max length");
});

await check("admin reports api", async () => {
  const { response, data } = await fetchJson("/api/admin/reports");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin reports API ok should be true");
  assert(data.summary?.total >= 1, "Admin reports summary should include submitted report");
  assert(Array.isArray(data.reports), "Admin reports list missing");
  assert(data.reports.some((report) => report.priority && report.recommendedAction), "Admin reports missing priority action fields");
});

await check("admin report status update", async () => {
  const created = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d002",
      reason: "link_error",
      message: "status update smoke test"
    })
  });
  const reportId = created.data.report?.id;
  assert(reportId, "Created report missing id");

  const { response, data } = await fetchJson("/api/admin/reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      status: "reviewing"
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Report status update should be ok");
  assert(data.report?.status === "reviewing", `Expected reviewing, got ${data.report?.status}`);
  assert(data.report?.priority === "high", `Expected high priority link error report, got ${data.report?.priority}`);
  assert(data.report?.recommendedAction?.includes("링크"), "Link error report missing recommended link action");
  assert(data.report?.operatorSla?.includes("6시간") && data.report?.queueLabel?.includes("링크"), "Link error report missing SLA and queue label");
});

await check("partner feed import dry-run", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "smoke-001",
          mall: "스모크몰",
          title: "스모크 테스트 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          imageUrl: "https://gdimg.gmarket.co.kr/4076233103/still/600",
          sourceName: "스모크몰 공식 피드",
          sourceUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
          dealType: "freeShipping",
          benefitSummary: "무료배송 smoke 테스트 특가",
          productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
          searchUrl: "https://search.shopping.naver.com/search/all?query=%EC%8A%A4%EB%AA%A8%ED%81%AC%20%ED%85%8C%EC%8A%A4%ED%8A%B8%20%ED%8A%B9%EA%B0%80",
          isFirstComeFirstServed: false,
          requiresSignup: false,
          eligibilityChecklist: ["판매처 확인", "배송 조건 확인", "최종 가격 확인"],
          claimSteps: ["상품 상세 이동", "결제 전 조건 확인"],
          claimWarning: "판매처 조건은 바뀔 수 있습니다.",
          tags: ["무료배송"]
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Import dry-run should pass");
  assert(data.valid === 1, `Expected 1 valid row, got ${data.valid}`);
  assert(data.previewDeals?.[0]?.discountRate === 40, "Normalized discount rate mismatch");
  assert(data.previewDeals?.[0]?.linkVerified === true, "Partner productUrl should normalize as a verified purchase link");
  assert(data.linkSummary?.verified === 1, "Import link summary should count verified product links");
  assert(data.benefitSummary?.conditionReadyRate === 100, "Import benefit condition summary should be ready");
  assert(data.imageSummary?.imageReadyRate === 100, "Import image summary should be ready");
  assert(data.rows?.[0]?.status === "ready", "Import dry-run should expose ready row summary");
  assert(data.readyItems?.length === 1, "Import dry-run should expose ready items for production feed handoff");
  assert(data.readyRate === 100, "Import dry-run should expose readyRate");
});

await check("partner feed sample validation api", async () => {
  const { response, data } = await fetchJson("/api/admin/import");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Sample feed API should be ok");
  assert(Array.isArray(data.sampleFeed) && data.sampleFeed.length >= 8, "Sample feed API missing V2 benefit sample feed rows");
  const sampleDealTypes = new Set(data.sampleFeed.map((item) => item.dealType));
  ["freeShipping", "discount", "freebie", "foodDelivery", "point", "convenienceStore", "mart", "experience"].forEach((dealType) => {
    assert(sampleDealTypes.has(dealType), `Sample feed missing ${dealType} benefit type`);
  });
  assert(data.sampleValidation?.ok === true, "Sample feed validation should pass");
  assert(data.sampleValidation?.linkSummary?.verified >= 1, "Sample feed validation missing verified link summary");
  assert(data.sampleValidation?.benefitSummary?.conditionReadyRate === 100, "Sample feed validation missing benefit condition readiness");
  assert(data.sampleValidation?.imageSummary?.imageReadyRate === 100, "Sample feed validation missing image readiness");
});

await check("partner feed import blocks unsafe links", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "unsafe-001",
          mall: "스모크몰",
          title: "커뮤니티 링크 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=1"
        },
        {
          externalId: "unsafe-002",
          mall: "스모크몰",
          title: "플레이스홀더 링크 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          link: "https://example.com/smoke"
        },
        {
          externalId: "unsafe-003",
          mall: "스모크몰",
          title: "검색 결과 링크 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          productUrl: "https://search.shopping.naver.com/search/all?query=%EA%B2%80%EC%83%89%EB%A7%81%ED%81%AC"
        },
        {
          externalId: "unsafe-004",
          mall: "스모크몰",
          title: "중복 상품명 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103"
        },
        {
          externalId: "unsafe-004",
          mall: "스모크몰",
          title: "중복 상품명 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103"
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === false, "Unsafe import dry-run should fail");
  assert(data.invalid === 5, `Expected 5 invalid rows, got ${data.invalid}`);
  assert(
    data.issues?.some((issue) => issue.field === "link" && /placeholder|커뮤니티/.test(issue.message)),
    "Expected unsafe link validation issue"
  );
  assert(
    data.issues?.some((issue) => /검색 결과 fallback|검색 결과나 쇼핑몰 메인/.test(issue.message)),
    "Expected search fallback validation issue"
  );
  assert(
    data.issues?.some((issue) => /중복 외부 ID|중복 상품명/.test(issue.message)),
    "Expected duplicate feed row validation issue"
  );
  assert(data.rows?.some((row) => row.status === "needs_fix" && row.issueCount > 0), "Import dry-run should expose needs_fix row summaries");
  assert(data.needsFixItems?.length === 5, "Import dry-run should expose needs_fix items for operator repair");
  assert(data.fixReport?.nextAction?.includes("needs_fix"), "Import dry-run should expose fix report next action");
});

await check("partner feed import validation", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "",
          mall: "스모크몰",
          title: "잘못된 특가",
          category: "식품",
          originalPrice: 10000,
          salePrice: 15000,
          link: "not-a-url"
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === false, "Invalid import dry-run should fail");
  assert(data.invalid === 1, `Expected 1 invalid row, got ${data.invalid}`);
  assert(data.issues?.length >= 2, "Expected validation issues");
});

await check("track api", async () => {
  const { response, data } = await fetchJson("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "deal_click",
      dealId: "d001",
      page: "smoke"
    })
  });
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Track API ok should be true");
  assert(response.headers.get("x-request-id"), "Track API missing request id");
});

await check("redirect api", async () => {
  const response = await fetch(`${baseUrl}/api/redirect/d014?from=smoke&analytics=granted&affiliate=granted`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(response.headers.get("x-request-id"), "Redirect API missing request id");
  assert(location.includes("sub_id=halindosa-local"), `Redirect missing affiliate sub_id: ${location}`);
  assert(location.includes("utm_campaign=smoke"), `Redirect missing campaign: ${location}`);
});

await check("redirect consent guard", async () => {
  const response = await fetch(`${baseUrl}/api/redirect/d014?from=smoke`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(!location.includes("sub_id="), `Redirect should not include affiliate sub_id without consent: ${location}`);
});

await check("go purchase redirect", async () => {
  const response = await fetch(`${baseUrl}/go/d014?from=smoke&analytics=granted&affiliate=granted`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(response.headers.get("x-request-id"), "Go redirect missing request id");
  assert(location.includes("coupang.com"), `Go redirect should resolve to seller URL, got ${location}`);
});

await check("go official news redirect", async () => {
  const cases = [
    ["news-homeplus-official-event", "homeplus.co.kr"],
    ["news-yogiyo-official-event", "yogiyo.co.kr"],
    ["news-samsung-shop-official-event", "samsung.com"],
    ["news-mnuri-official-benefit", "mnuri.kr"]
  ];

  for (const [dealId, expectedHost] of cases) {
    const response = await fetch(`${baseUrl}/go/news/${dealId}?from=smoke-news`, {
      redirect: "manual"
    });
    const location = response.headers.get("location") ?? "";
    assert(response.status === 302, `Expected 302 for ${dealId}, got ${response.status}`);
    assert(response.headers.get("x-request-id"), `News go redirect missing request id for ${dealId}`);
    assert(location.includes(expectedHost), `Expected ${dealId} official redirect to ${expectedHost}, got ${location}`);
  }
});

await check("detail purchase consent guard", async () => {
  const response = await fetch(`${baseUrl}/deals/d014`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("구매 전 판매처 확인"), "Detail page missing purchase confirm button");
  assert(text.includes("혜택 조건 확인"), "Detail page missing benefit condition checklist");
  assert(text.includes("선착순 여부"), "Detail page missing first-come benefit condition");
  assert(text.includes("회원가입 필요 여부"), "Detail page missing signup benefit condition");
  assert(text.includes("배송비 여부"), "Detail page missing shipping fee benefit condition");
  assert(text.includes("쿠폰 조건"), "Detail page missing coupon benefit condition");
  assert(text.includes("혜택 받기 전 3단계") && text.includes("조건 확인부터 신고까지 한 흐름으로 봅니다"), "Detail page missing benefit claim flow steps");
  assert(text.includes("조건 먼저 보기") && text.includes("판매처에서 최종 확인") && text.includes("다르면 바로 신고"), "Detail page missing benefit claim flow actions");
  assert(text.includes("혜택 신고"), "Detail page missing benefit report condition");
  assert(text.includes("구매 전 10초 체크"), "Detail page missing purchase safety checklist");
  assert(text.includes("구매 정보 확인 요약"), "Detail page missing purchase readiness summary");
  assert(text.includes("상품 품질 안내") && text.includes("신고 누적"), "Detail page missing quality notice summary");
  assert(
    text.includes("구매 전 신뢰 체크") && text.includes("판매처 링크") && text.includes("신고 상태") && text.includes("마감 상태"),
    "Detail page missing purchase trust checklist"
  );
  assert(text.includes("예정 도메인"), "Detail page missing destination domain summary");
  assert(text.includes("관련 특가도 구매 전 체크"), "Detail page missing commerce-ready related deal section");
  assert(text.includes("같은 카테고리 보기"), "Detail page missing related category navigation");
  assert(text.includes("정보 신고"), "Detail page missing safety report CTA");
  assert(text.includes("가격 알림 신청"), "Detail page missing price alert opt-in panel");
  assert(text.includes("실제 푸시 발송은 운영 서버와 FCM 연결 후 활성화"), "Detail page should explain push alert readiness");
  assert(!text.includes("affiliate=granted"), "Detail page should not server-render affiliate consent");
  assert(!text.includes("analytics=granted"), "Detail page should not server-render analytics consent");
  assert(!text.includes("신뢰도 "), "Detail page should not expose internal numeric confidence labels");
});

await check("favorites page consent guard", async () => {
  const response = await fetch(`${baseUrl}/favorites`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("관심 특가"), "Favorites page missing title");
  assert(text.includes("구매 링크 확인 특가 보기"), "Favorites empty state missing verified link CTA");
  assert(text.includes("먼저 저장해볼 만한 특가"), "Favorites empty state missing starter recommendations");
  assert(text.includes("저장 상품 정렬"), "Favorites page missing saved deal sort section");
  assert(text.includes("무료·쿠폰 혜택") && text.includes("무료혜택 더 저장"), "Favorites page missing saved free benefit filter");
  assert(text.includes("할인율 높은순") && text.includes("마감임박순") && text.includes("낮은 가격순"), "Favorites page missing sort options");
  assert(!text.includes("affiliate=granted"), "Favorites page should not server-render affiliate consent");
  assert(!text.includes("analytics=granted"), "Favorites page should not server-render analytics consent");
});

await check("seller search redirect fallbacks", async () => {
  const cases = [
    ["d014", "coupang.com"],
    ["d016", "gmarket.co.kr"],
    ["d015", "11st.co.kr"],
    ["d012", "oliveyoung.co.kr"],
    ["d020", "musinsa.com"],
    ["d041", "ssg.com"],
    ["d043", "aliexpress.com"],
    ["d044", "auction.co.kr"],
    ["d118", "gmarket.co.kr"],
    ["d119", "11st.co.kr"],
    ["d120", "gmarket.co.kr"],
    ["d121", "coupang.com"],
    ["d122", "gmarket.co.kr"],
    ["d123", "11st.co.kr"],
    ["d124", "oliveyoung.co.kr"],
    ["d125", "ssg.com"],
    ["d126", "coupang.com"],
    ["d127", "gmarket.co.kr"],
    ["d128", "11st.co.kr"],
    ["d129", "ssg.com"],
    ["d130", "coupang.com"],
    ["d131", "coupang.com"],
    ["d132", "gmarket.co.kr"],
    ["d133", "11st.co.kr"],
    ["d134", "ssg.com"],
    ["d135", "gmarket.co.kr"],
    ["d136", "coupang.com"],
    ["d137", "11st.co.kr"],
    ["d138", "ssg.com"],
    ["d139", "coupang.com"],
    ["d140", "gmarket.co.kr"],
    ["d047", "pay.naver.com"],
    ["d054", "kakaopay.com"],
    ["d060", "cgv.co.kr"],
    ["d073", "hyundaicard.com"],
    ["d115", "bhc.co.kr"]
  ];

  for (const [dealId, expectedHost] of cases) {
    const response = await fetch(`${baseUrl}/api/redirect/${dealId}?from=smoke`, {
      redirect: "manual"
    });
    const location = response.headers.get("location") ?? "";
    assert(response.status === 302, `Expected 302 for ${dealId}, got ${response.status}`);
    assert(location.includes(expectedHost), `Expected ${dealId} redirect to ${expectedHost}, got ${location}`);
  }
});

await check("affiliate status api", async () => {
  const { response, data } = await fetchJson("/api/affiliate/status");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Affiliate status API ok should be true");
  assert(data.status?.subId, "Affiliate status missing sub id state");
});

await check("admin export csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/export`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Export is not CSV");
  assert(response.headers.get("x-request-id"), "Export missing request id");
  assert(text.startsWith("id,mall,title"), "CSV header missing");
  assert(text.includes("linkStatus") && text.includes("finalPurchaseUrl"), "CSV missing link review fields");
  assert(text.includes("reviewPriority") && text.includes("reviewReason"), "CSV missing link review workflow fields");
  assert(
    text.includes("dailyQueueSections") && text.includes("dailyQueueRank") && text.includes("dailyQueueAction"),
    "CSV missing daily benefit queue export fields"
  );
});

await check("admin image queue csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/image-queue?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Image queue export is not CSV");
  assert(response.headers.get("x-request-id"), "Image queue export missing request id");
  assert(text.startsWith("rank,id,title"), "Image queue CSV header missing");
  assert(text.includes("finalPurchaseUrl") && text.includes("action"), "Image queue CSV missing operation fields");
  assert(text.includes("imageSearchUrl") && text.includes("currentImageUrl"), "Image queue CSV missing image sourcing fields");
  assert(text.includes("priorityReason") && text.includes("sourcingPriority"), "Image queue CSV missing sourcing priority fields");
});

await check("seo files", async () => {
  const [sitemap, robots, manifest] = await Promise.all([
    fetch(`${baseUrl}/sitemap.xml`).then((response) => response.text()),
    fetch(`${baseUrl}/robots.txt`).then((response) => response.text()),
    fetch(`${baseUrl}/manifest.webmanifest`).then((response) => response.text())
  ]);

  assert(sitemap.includes("/deals/d001"), "Sitemap missing deal detail URL");
  assert(sitemap.includes("/guide"), "Sitemap missing service guide URL");
  assert(sitemap.includes("/support"), "Sitemap missing support URL");
  assert(sitemap.includes("/commercialization"), "Sitemap missing commercialization readiness URL");
  assert(robots.includes("User-Agent"), "Robots file missing User-Agent");
  assert(manifest.includes("할인도사"), "Manifest missing app name");
  assert(manifest.includes("halindosa-icon-192.png"), "Manifest missing 192 icon");
  assert(manifest.includes("halindosa-icon-512.png"), "Manifest missing 512 icon");
  assert(manifest.includes("shortcuts"), "Manifest missing app shortcuts");
});

const failed = checks.filter((result) => !result.ok);

for (const result of checks) {
  const status = result.ok ? "PASS" : "FAIL";
  const suffix = result.ok ? "" : ` - ${result.error}`;
  console.log(`${status} ${result.name} (${result.latencyMs}ms)${suffix}`);
}

if (failed.length > 0) {
  console.error(`Smoke test failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length}/${checks.length}`);
