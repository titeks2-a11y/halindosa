import { readFileSync } from "node:fs";
import { assert, baseUrl, check, fetchJson, isMallHomeOnlyUrl, isUnsafeDealUrl } from "./smoke-harness.mjs";
import { homeSourceSync } from "./release-doctor-harness.mjs";

const homePageSource = homeSourceSync();
const homeApiSource = readFileSync(new URL("../../lib/homeApi.ts", import.meta.url), "utf8");
const homeDealGridSource = readFileSync(new URL("../../components/home/HomeDealGrid.tsx", import.meta.url), "utf8");
const homeEmptyRecoverySource = readFileSync(new URL("../../components/home/HomeEmptyRecovery.tsx", import.meta.url), "utf8");
const homeRuntimeSource = `${homePageSource}\n${homeApiSource}\n${homeDealGridSource}\n${homeEmptyRecoverySource}`;
const bottomNavigationSource = readFileSync(new URL("../../components/BottomNavigation.tsx", import.meta.url), "utf8");
const topNavigationSource = readFileSync(new URL("../../components/TopNavigation.tsx", import.meta.url), "utf8");
const mypageSource = readFileSync(new URL("../../app/mypage/page.tsx", import.meta.url), "utf8");
const accountPanelSource = readFileSync(new URL("../../components/AccountPanel.tsx", import.meta.url), "utf8");
const hotSignalSectionSource = readFileSync(new URL("../../components/HotSignalSection.tsx", import.meta.url), "utf8");
const mockHotSignalsSource = readFileSync(new URL("../../data/mockHotSignals.ts", import.meta.url), "utf8");
const mockDealsSource = readFileSync(new URL("../../data/mockDeals.ts", import.meta.url), "utf8");

const requiredFreeBenefitRuntimeFields = [
  "id",
  "brand",
  "title",
  "description",
  "benefitType",
  "rewardValue",
  "startDate",
  "endDate",
  "sourceUrl",
  "officialUrl",
  "imageUrl",
  "status",
  "isOfficial",
  "isFree",
  "isVerified",
  "qualityScore",
  "freshnessScore",
  "lastCheckedAt",
  "createdAt",
  "tags"
];

function assertFreeBenefitRuntimeFields(events, label) {
  assert(Array.isArray(events), `${label} should be an array`);
  for (const event of events) {
    for (const field of requiredFreeBenefitRuntimeFields) {
      assert(field in event, `${label} event ${event?.id ?? "(missing id)"} missing runtime field: ${field}`);
      const value = event[field];
      if (typeof value === "boolean") continue;
      if (typeof value === "number") {
        assert(Number.isFinite(value), `${label} event ${event.id} has invalid numeric runtime field: ${field}`);
        continue;
      }
      if (Array.isArray(value)) {
        assert(value.length > 0, `${label} event ${event.id} has empty array runtime field: ${field}`);
        continue;
      }
      assert(String(value ?? "").trim().length > 0, `${label} event ${event.id} has blank runtime field: ${field}`);
    }
    assert(event.officialUrl === event.finalUrl || event.officialUrl === event.eventUrl || event.sourceUrl === event.officialUrl, `${label} event ${event.id} should keep officialUrl aligned with the final claim URL`);
    assert(event.isOfficial === true, `${label} event ${event.id} should be official`);
    assert(event.isVerified === true, `${label} event ${event.id} should be verified`);
    assert(event.status === "active", `${label} event ${event.id} should be active`);
    assert(event.validationStatus === "passed", `${label} event ${event.id} should pass validation`);
  }
}

export async function runPageSmokeChecks() {
  await check("home page", async () => {
    const response = await fetch(`${baseUrl}/`);
    const text = await response.text();
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(text.includes("할인도사"), "Home page missing brand text");
    assert(text.includes("샤오미 86인치") || text.includes("새우깡"), "Home page missing initial deal cards");
    assert(text.includes("네트워크 정상") || text.includes("오프라인 상태"), "Home page missing compact network status");
    assert(text.includes("구매 전 판매처 확인") || text.includes("판매처 확인"), "Home page missing purchase verification guidance");
    assert(text.includes("혜택 검색") || text.includes("혜택·브랜드 검색"), "Home page missing compact benefit search");
    assert(text.includes("카테고리 바로가기") || text.includes("전체상품"), "Home page missing category shortcuts");
    assert(text.includes("상품 목록 빠른 스캔") && text.includes("목록 안에서 많이 나온 기준"), "Home page missing product list scan shortcuts");
    assert(
      text.includes("오늘 받을 무료 혜택") ||
        text.includes("무료혜택 메인") ||
        text.includes("오늘 챙길 쿠폰·0원딜") ||
        text.includes("무료혜택 먼저 보기") ||
        text.includes("오늘 놓치면 아쉬운 혜택"),
      "Home page missing benefit-first discovery"
    );
    assert(text.includes("무료혜택") || text.includes("쿠폰"), "Home page missing free or coupon discovery");
    assert(text.includes("오늘의 실시간 할인뉴스") && text.includes("공식"), "Home page missing official benefit section");
    assert(text.includes("신뢰 공식출처 우선") && text.includes("신뢰 출처"), "Home page missing trusted official source prioritization");
    assert(text.includes("혜택 바로찾기") && text.includes("공식 링크만"), "Home page missing customer-intent official benefit query rail");
    assert(text.includes("마감 전 우선확인"), "Home page missing official benefit deadline summary");
    assert(text.includes("구매하기") || text.includes("상세 보기") || text.includes("판매처 확인"), "Home page missing commerce actions");
    assert(text.includes("현재 결과") || text.includes("검색 결과"), "Home page missing search result summary");
    assert(homePageSource.includes("getHotSignalDiscoveryQuery"), "Home hot signals should map to verified internal deal discovery");
    assert(!homePageSource.includes("window.open(signal.url") && !homePageSource.includes("Browser.open({ url: signal.url"), "Home hot signals must not open raw source URLs");
    assert(hotSignalSectionSource.includes("buildPublicHotSignalDiscoveryUrl") && !hotSignalSectionSource.includes("signal.url"), "Hot signal sharing must not expose raw source URLs");
    assert(!mockHotSignalsSource.includes("ppomppu.co.kr") && !mockHotSignalsSource.includes("zboard/view.php"), "Mock hot signals must not expose community post URLs");
    assert(!/deal\([^\n]*(ppomppu\.co\.kr|zboard\/view\.php|fmkorea|quasarzone|algumon)/i.test(mockDealsSource), "Mock deal seeds must not use community post URLs");
    assert(!text.includes("직접 구매 링크 비율"), "Home page should not expose internal link coverage ratio copy");
    assert(!text.includes(">상업화<"), "Home page should not expose internal commercialization link in public footer");
    assert(text.includes("aria-pressed="), "Home deal favorite buttons missing pressed state");
    assert(text.includes("판매처 이동 전 확인"), "Home deal open buttons missing accessible purchase label");

    const homePurchaseLinkCount = (text.match(/href="\/go\//g) ?? []).length;
    const homeOfficialBenefitLinkCount = (text.match(/href="\/go\/news\//g) ?? []).length;
    const unsafeRenderedLinks = [
      /href="#"/,
      /javascript:/i,
      /ppomppu|zboard\/view|fmkorea|quasarzone|algumon/i,
      /https?:[^"'<>]*(\/search|search\?|query=|keyword=|msearch|\/result|\/find)/i
    ].filter((pattern) => pattern.test(text));

    assert(homePurchaseLinkCount >= 12, `Home page should render at least 12 verified /go purchase links, got ${homePurchaseLinkCount}`);
    assert(homeOfficialBenefitLinkCount >= 3, `Home page should render official benefit /go/news links, got ${homeOfficialBenefitLinkCount}`);
    assert(text.includes("실시간 검증됨") && text.includes("노출가능"), "Home page missing realtime publishable exposure status copy");
    assert(unsafeRenderedLinks.length === 0, "Home page rendered hash, javascript, community, search, or result URLs in customer-facing links");
  });

  await check("home realtime api cache policy", async () => {
    const endpoints = [
      "/api/deals?limit=3&verifiedOnly=true",
      "/api/news-deals?limit=3",
      "/api/hot-signals?limit=3",
      "/api/home?limit=3&verifiedOnly=true"
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const data = await response.json();
      const cacheControl = response.headers.get("cache-control") ?? "";
      assert(response.status === 200, `Expected ${endpoint} 200, got ${response.status}`);
      assert(cacheControl.includes("no-store"), `${endpoint} should return no-store cache-control, got ${cacheControl || "(missing)"}`);
      assert(data.updatedAt, `${endpoint} should expose updatedAt for realtime trust copy`);
      assert(data.ok === true || Array.isArray(data.deals) || Array.isArray(data.signals), `${endpoint} should return usable fallback data shape`);
      if (endpoint.startsWith("/api/home")) {
        assert(data.cachePolicy?.mode === "no-store", "/api/home should expose no-store snapshot metadata");
        assert(data.newsMeta?.freshnessStatus, "/api/home should expose official benefit freshness metadata");
        assert(data.newsMeta?.categoryCounts && data.newsMeta?.benefitTypeCounts, "/api/home should expose full official benefit count metadata");
        const expectedFreeBenefitEventCategories = ["all", "everyone", "firstCome", "coupon", "sample", "freeTrial", "gifticon", "pointCashback", "checkIn", "roulette", "signup", "publicFree", "experiencePanel"];
        assert(Array.isArray(data.freeBenefitEvents) && data.freeBenefitEvents.length >= 48, `/api/home should expose a broad publishable free benefit event pool for the home hero, got ${data.freeBenefitEvents?.length ?? 0}`);
        assertFreeBenefitRuntimeFields(data.freeBenefitEvents.slice(0, 48), "/api/home freeBenefitEvents");
        assert(
          data.freebiesMeta?.eventSummary?.sourceDomainCount >= 30,
          `/api/home should expose broad official source domain coverage for free benefits, got ${data.freebiesMeta?.eventSummary?.sourceDomainCount ?? 0}`
        );
        assert(
          new Set(data.freeBenefitEvents.map((event) => event.benefitType)).size >= 8,
          "/api/home free benefit event pool should mix coupon, sample, point, first-come, everyone, shipping, and brand/event styles"
        );
        assert(
          Array.isArray(data.freebiesMeta?.eventSummary?.topSourceDomains) && data.freebiesMeta.eventSummary.topSourceDomains.length >= 5,
          "/api/home should expose top official source domains for the free benefit hero trust strip"
        );
        assert(
          Array.isArray(data.freebiesMeta?.categoryCounts) &&
            expectedFreeBenefitEventCategories.every((id) => data.freebiesMeta.categoryCounts.some((category) => category.id === id && typeof category.count === "number")),
          "/api/home should expose active free benefit event category counts for every home quick filter"
        );
        assert(
          Array.isArray(data.freeBenefitEventMeta?.categoryCounts) &&
            data.freeBenefitEventMeta.categoryCounts.find((category) => category.id === "gifticon")?.count >= 0 &&
            data.freeBenefitEventMeta.categoryCounts.find((category) => category.id === "all")?.count === data.freeBenefitEventMeta.totalCount,
          "/api/home should expose top-level free benefit event category metadata for mobile chips"
        );
        assert(
          Array.isArray(data.freeBenefitEventMeta?.visibleTypes) &&
            data.freeBenefitEventMeta.visibleTypes.includes("coupon") &&
            data.freeBenefitEventMeta.visibleTypes.includes("sample") &&
            data.freeBenefitEventMeta.policy?.countBasis?.includes("publishable") &&
            data.freeBenefitEventMeta.policy?.cta?.includes("/go/news/[id]"),
          "/api/home free benefit event metadata should explain visible types and official redirect CTA policy"
        );
        assert(
          data.freebiesMeta.categoryCounts.find((category) => category.id === "all")?.count === data.freebiesMeta.eventCount,
          "/api/home free benefit all-count should match the full publishable event pool"
        );
        assert(
          data.freebiesMeta?.requiredCategoryCoverage?.ok === true &&
            data.freebiesMeta.requiredCategoryCoverage.visibleActiveBenefits >= 150 &&
            data.freebiesMeta.requiredCategoryCoverage.noPurchaseVisibleBenefits >= 120 &&
            data.freebiesMeta.requiredCategoryCoverage.officialHostCount >= 70,
          "/api/home should expose passing required free benefit category coverage metadata"
        );
        assert(
          Array.isArray(data.freebiesMeta?.requiredCategoryCoverage?.categories) &&
            data.freebiesMeta.requiredCategoryCoverage.categories.length >= 10 &&
            data.freebiesMeta.requiredCategoryCoverage.categories.every((category) => category.ok === true && category.href?.startsWith("/free-benefits?eventType=")),
          "/api/home required free benefit category coverage should expose 10 passing mobile filter chips"
        );
        assert(data.quality?.productDeals?.publishableLinks >= 0, "/api/home should expose product publishable quality metadata");
        assert(data.quality?.officialBenefits?.publishable >= 0, "/api/home should expose official benefit publishable quality metadata");
        assert(data.quality?.exposure?.publishableTotal >= data.quality?.officialBenefits?.publishable, "/api/home should expose combined publishable exposure quality metadata");
        assert(data.counts?.newsDeals >= data.newsDeals.length, "/api/home official benefit total count should not be limited to returned rows");
        assert(Array.isArray(data.deals) && Array.isArray(data.newsDeals) && Array.isArray(data.hotSignals), "/api/home should return product, official benefit, and signal arrays together");
        assert(
          data.deals.every(
            (deal) =>
              deal.publishable === true &&
              deal.availability === "active" &&
              deal.validationStatus === "passed" &&
              deal.isHidden !== true &&
              typeof deal.finalUrl === "string" &&
              /^https?:\/\//.test(deal.finalUrl) &&
              !isUnsafeDealUrl(deal.finalUrl) &&
              !isMallHomeOnlyUrl(deal.finalUrl) &&
              !/\/search|search\?|query=|keyword=|msearch|\/result|\/find/i.test(deal.finalUrl) &&
              Boolean(deal.updatedAt) &&
              Boolean(deal.verifiedAt) &&
              ["official", "generated"].includes(deal.imageType) &&
              Number(deal.qualityScore ?? 0) >= 55
          ),
          "/api/home product deals must all be active, publishable, verified, directly linkable, image-ready, and quality-scored"
        );
        assert(
          data.newsDeals.every(
            (deal) =>
              deal.publishable === true &&
              deal.availability === "active" &&
              deal.validationStatus === "passed" &&
              deal.isHidden !== true &&
              typeof deal.finalUrl === "string" &&
              /^https?:\/\//.test(deal.finalUrl) &&
              !isUnsafeDealUrl(deal.finalUrl) &&
              !isMallHomeOnlyUrl(deal.finalUrl) &&
              !/\/search|search\?|query=|keyword=|msearch|\/result|\/find/i.test(deal.finalUrl) &&
              Boolean(deal.updatedAt) &&
              Boolean(deal.verifiedAt) &&
              Boolean(deal.source || deal.sourceName) &&
              ["official", "generated"].includes(deal.imageType) &&
              Number(deal.qualityScore ?? 0) >= 70
          ),
          "/api/home official benefits must all be active, publishable, verified, source-labeled, directly linkable, image-ready, and quality-scored"
        );
      }
    }

    const freebiePool = await fetchJson("/api/freebies?limit=96");
    assert(freebiePool.response.status === 200, `Expected /api/freebies 200, got ${freebiePool.response.status}`);
    assert(Array.isArray(freebiePool.data.events) && freebiePool.data.events.length >= 48, `/api/freebies should expose 48+ publishable official free benefit events, got ${freebiePool.data.events?.length ?? 0}`);
    assertFreeBenefitRuntimeFields(freebiePool.data.events.slice(0, 48), "/api/freebies events");
    assert(freebiePool.data.eventSummary?.sourceDomainCount >= 30, `/api/freebies should expose broad official source domain coverage, got ${freebiePool.data.eventSummary?.sourceDomainCount ?? 0}`);
    assert(new Set(freebiePool.data.events.map((event) => event.benefitType)).size >= 8, "/api/freebies events should preserve mixed benefit-type discovery");
    assert(Array.isArray(freebiePool.data.categoryCounts), "/api/freebies should expose free benefit event category counts");
    assert(
      freebiePool.data.categoryCounts.find((category) => category.id === "all")?.count === freebiePool.data.eventCount,
      "/api/freebies category all-count should match the full publishable event pool"
    );
    assert(
      freebiePool.data.events.every(
        (event) =>
          event.status === "active" &&
          event.validationStatus === "passed" &&
          event.isHidden !== true &&
          typeof event.finalUrl === "string" &&
          /^https?:\/\//.test(event.finalUrl) &&
          !isUnsafeDealUrl(event.finalUrl) &&
          !isMallHomeOnlyUrl(event.finalUrl) &&
          !/\/search|search\?|query=|keyword=|msearch|\/result|\/find/i.test(event.finalUrl) &&
          Boolean(event.brandName) &&
          Boolean(event.rewardText) &&
          Boolean(event.participationCondition)
      ),
      "/api/freebies events must be active, verified, directly linkable, brand-labeled, and condition-labeled"
    );

    assert(homeApiSource.includes("buildHomeRequestUrl") && homeApiSource.includes("ts: String(timestamp)") && homeApiSource.includes('cache: "no-store"'), "Home API client should use /api/home cache busting and no-store fetch");
    const homeRefreshIntervalUsages = [...homePageSource.matchAll(/window\.setInterval\(([^,]+), HOME_REFRESH_INTERVAL_MS\)/g)].map((match) => match[1].trim());
    assert(
      homePageSource.includes("refreshHomeNow") &&
        homePageSource.includes("HOME_REFRESH_INTERVAL_MS") &&
        homePageSource.includes("window.setInterval(refreshHomeIfVisible, HOME_REFRESH_INTERVAL_MS)") &&
        homeRefreshIntervalUsages.length === 1 &&
        homeRefreshIntervalUsages[0] === "refreshHomeIfVisible",
      `Home page should expose manual refresh and use a single /api/home realtime refresh cadence, got ${homeRefreshIntervalUsages.join(", ") || "none"}`
    );
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
    assert(text.includes("현재 결과") || text.includes("적용된 조건"), "Filtered home missing active result summary");
    assert(text.includes("구매링크 확인") || text.includes("구매처 확인"), "Filtered home missing verifiedOnly filter label");
    assert(text.includes("조건 초기화") || text.includes("초기화"), "Filtered home missing filter reset action");
  });
  
  await check("home empty search recovery", async () => {
    const result = await fetchJson(`/api/deals?q=${encodeURIComponent("zzznomatch987")}&verifiedOnly=true&limit=20`);
    assert(result.response.status === 200, `Expected 200, got ${result.response.status}`);
    assert(result.data.deals.length === 0, "Impossible search query should return no API deals");
    assert(
      homePageSource.includes("조건에 맞는 추가 할인 상품이 없습니다.") || homePageSource.includes("조건에 맞는 특가가 없습니다."),
      "Home source missing empty result title"
    );
    assert(homeRuntimeSource.includes("검색 결과 없음 복구"), "Home source missing recovery region");
    assert(homeRuntimeSource.includes("바로 다시 찾아볼 검색어"), "Home source missing recovery keyword suggestions");
    assert(homeRuntimeSource.includes("먼저 볼 만한 검증 특가"), "Home source missing verified deal recovery suggestions");
    assert(homeRuntimeSource.includes("검색 결과 대신 실제 구매 링크가 확인된 상품"), "Home source missing verified-link recovery copy");
    assert(homeRuntimeSource.includes('params.set("q"') && homeRuntimeSource.includes('sort: query.trim() ? "endingSoon" : "priority"'), "Home source should pass product search query into official benefit news refresh");
    assert(homeRuntimeSource.includes("activeQuery={query}"), "Home source should pass active search query into official benefit UI");
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
    assert(accountPanelSource.includes("mypage-recent-benefit") && accountPanelSource.includes("/go/news/${deal.id}"), "Mypage recent official benefits must use /go/news/[id] redirect");
    assert(!accountPanelSource.includes("href={deal.finalUrl}"), "Mypage recent official benefits must not link directly to finalUrl");
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
    assert(
      notificationsText.includes("공식 혜택 알림 후보") &&
        notificationsText.includes("공식 페이지 이동만 포함") &&
        notificationsText.includes("최근 본 공식 혜택") &&
        notificationsText.includes("공식 혜택 알림 API") &&
        notificationsText.includes("공식 알림 API 보기"),
      "Notifications page missing official benefit alert preview"
    );
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
  
}
