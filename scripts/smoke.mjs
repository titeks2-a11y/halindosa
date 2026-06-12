import { assert, baseUrl, check, checks, fetchJson, installSmokeFetch, isMallHomeOnlyUrl, isUnsafeDealUrl, smokeAdminToken } from "./lib/smoke-harness.mjs";
import { runAdminDashboardSmokeChecks } from "./lib/smoke-admin-checks.mjs";
import { runPageSmokeChecks } from "./lib/smoke-page-checks.mjs";

installSmokeFetch();

const MIN_OFFICIAL_BENEFITS = 95;
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
  "officialScore",
  "urgencyScore",
  "rewardScore",
  "claimAccessLevel",
  "claimAccessLabel",
  "isInstantClaim",
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

await runPageSmokeChecks();
await runAdminDashboardSmokeChecks();

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
  assert(text.includes("Provider 위험도 운영 준비도") && text.includes("즉시 점검 provider"), "Commercialization page missing official benefit provider risk readiness");
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
  for (const field of ["linkVerified", "finalUrl", "checkedAt", "purchaseConfidence", "purchaseLinkVerified", "finalPurchaseUrl", "validationCode", "publishable"]) {
    assert(field in data.deals[0], `Purchase link verification field missing: ${field}`);
  }
  for (const deal of data.deals) {
    assert(!deal.searchUrl || !/search|query=|keyword=|msearch|result|\/np\/search/i.test(deal.searchUrl), `${deal.id} exposed a public searchUrl fallback`);
    assert(!deal.sourceUrl || !/search|query=|keyword=|msearch|result|\/np\/search/i.test(deal.sourceUrl), `${deal.id} exposed a public sourceUrl search fallback`);
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
  assert(data.count >= MIN_OFFICIAL_BENEFITS, `Expected at least ${MIN_OFFICIAL_BENEFITS} official news/event benefits, got ${data.count}`);
  assert(
    data.deals.every((deal) => deal.validationStatus === "passed" && deal.isHidden === false && deal.publishable === true),
    "News deals API returned hidden, unverified, or non-publishable items"
  );
  assert(data.deals.every((deal) => /^https?:\/\//.test(deal.finalUrl)), "News deals API returned invalid finalUrl");
  assert(data.deals.every((deal) => !/search|query=|keyword=|msearch|result/i.test(deal.finalUrl)), "News deals API returned a search/result URL");
  assert(["fresh", "due", "stale", "seed"].includes(data.freshnessStatus), "News deals API missing official benefit freshness status");
  assert(typeof data.freshnessLabel === "string" && data.freshnessLabel.length > 0, "News deals API missing official benefit freshness label");
  assert(data.freshnessCadenceMinutes === 360, "News deals API missing 6-hour freshness cadence");
  assert(data.freshnessStaleAfterMinutes === 1440, "News deals API missing 24-hour stale threshold");
  assert(data.categoryCounts?.["마트/편의점"] >= 1, "News deals API missing category result counts");
  assert(typeof data.benefitTypeCounts === "object" && Object.keys(data.benefitTypeCounts).length >= 3, "News deals API missing benefit type result counts");
  assert(typeof data.sourceCounts === "object" && Object.keys(data.sourceCounts).length >= 3, "News deals API missing official source result counts");
  assert(Array.isArray(data.sourceTrustScores) && data.sourceTrustScores.length >= 3, "News deals API missing official source trust scores");
  assert(
    data.sourceTrustScores.every((source) => source.sourceName && source.trustScore >= 75 && ["trusted", "watch", "needs_review"].includes(source.status)),
    "News deals API source trust scores missing launch fields"
  );
  assert(Array.isArray(data.recommendedQueries) && data.recommendedQueries.length >= 3, "News deals API missing recommended official benefit search queries");
  assert(
    data.recommendedQueries.some((item) => ["오늘의 무료", "무료 쿠폰", "마트 행사", "편의점 1+1", "배달 쿠폰", "카드 혜택"].includes(item.query)),
    "News deals API missing customer intent recommended queries"
  );
  assert(Array.isArray(data.targetSections) && data.targetSections.length >= 4, "News deals API missing official target section chips");
  assert(
    data.targetSections.some((item) => item.label && item.query && item.count > 0 && ["오늘의 무료", "쿠폰", "마트 행사", "편의점 1+1", "배달 쿠폰", "카드 혜택"].includes(item.label)),
    "News deals API missing customer-facing official target section labels"
  );
  assert(Array.isArray(data.intentGroups) && data.intentGroups.length >= 4, "News deals API missing customer intent benefit groups");
  assert(
    data.intentGroups.every((item) => item.id && item.label && item.query && item.count > 0 && Array.isArray(item.topSources) && Array.isArray(item.benefitTypes) && item.actionLabel),
    "News deals API intent groups missing launch fields"
  );
  assert(
    data.intentGroups.some((item) => ["free", "coupon", "mart", "convenience", "delivery", "card", "public-culture"].includes(item.id)),
    "News deals API missing launch intent groups for free, coupon, mart, delivery, card, or public benefits"
  );
  assert(typeof data.deadlineSummary?.nearestEndDate === "string" && data.deadlineSummary.nearestEndDate.length > 0, "News deals API missing official benefit deadline summary");
  assert(Array.isArray(data.deadlineSummary?.buckets) && data.deadlineSummary.buckets.some((bucket) => bucket.id === "sevenDays"), "News deals API missing deadline bucket rows");
  assert(data.deals.some((deal) => deal.category === "마트/편의점"), "News deals API missing mart/convenience official benefits");
  assert(
    data.deals.slice(0, 12).some((deal) => ["쿠폰", "sample", "freebie", "freeShipping", "foodDelivery", "convenienceStore", "mart", "point"].includes(deal.benefitType)),
    "News deals API default ranking should prioritize consumer coupon, sample, delivery, mart, point, or free-shipping benefits"
  );
  const full = await fetchJson("/api/news-deals?includePublic=true");
  assert(full.data.count >= MIN_OFFICIAL_BENEFITS, `News deals API should keep at least ${MIN_OFFICIAL_BENEFITS} visible official benefits, got ${full.data.count}`);
  const couponSearch = await fetchJson("/api/news-deals?q=쿠폰&sort=endingSoon&limit=10");
  assert(couponSearch.response.status === 200, `Expected coupon news search 200, got ${couponSearch.response.status}`);
  assert(couponSearch.data.ok === true, "News deals search API ok should be true");
  assert(couponSearch.data.query === "쿠폰", "News deals search API should echo normalized query");
  assert(couponSearch.data.sort === "endingSoon", "News deals search API should expose selected sort");
  assert(couponSearch.data.deals.length >= 1, "News deals search should return coupon/event benefits");
  assert(couponSearch.data.count >= couponSearch.data.deals.length, "News deals search should preserve total count beyond limited rows");
  assert(Array.isArray(couponSearch.data.recommendedQueries) && couponSearch.data.recommendedQueries.some((item) => item.query), "News deals search should return related recommended queries");
  assert(couponSearch.data.deals.every((deal) => `${deal.title} ${deal.summary} ${deal.category} ${deal.benefitType} ${deal.tags?.join(" ")}`.includes("쿠폰") || deal.benefitType === "coupon"), "News deals search returned unrelated benefits");
  const latestSearch = await fetchJson("/api/news-deals?q=문화&sort=latest&limit=5");
  assert(latestSearch.data.deals.length >= 1, "News deals Korean query search should return culture/public benefits");
  const categories = new Set(full.data.deals.map((deal) => deal.category));
  for (const category of ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"]) {
    assert(categories.has(category), `News deals API missing expanded official benefit category: ${category}`);
  }
  const categoryCounts = full.data.deals.reduce((map, deal) => map.set(deal.category, (map.get(deal.category) ?? 0) + 1), new Map());
  for (const category of categories) {
    assert(categoryCounts.get(category) >= 2, `News deals API should keep at least 2 official benefits for category: ${category}`);
  }
});

await check("freebies api", async () => {
  const { response, data } = await fetchJson("/api/freebies?limit=12");
  assert(response.status === 200, `Expected freebies API 200, got ${response.status}`);
  assert(data.ok === true, "Freebies API ok should be true");
  assert(Array.isArray(data.freebies) && data.freebies.length >= 4, "Freebies API should return visible official freebies");
  assert(data.totalCount >= 27, `Freebies API should keep at least 27 verified freebies, got ${data.totalCount}`);
  assert(data.summary?.zeroCost >= 1 || data.summary?.coupon >= 1 || data.summary?.freeShipping >= 1, "Freebies API summary missing free/coupon/free shipping counts");
  assert(Number(data.eventSummary?.instantClaimCount ?? 0) >= 1, "Freebies API summary missing instant-claim benefit count");
  assert(data.freebies.every((deal) => deal.validationStatus === "passed" && deal.publishable === true && deal.availability === "active"), "Freebies API returned non-publishable items");
  assert(data.freebies.every((deal) => String(deal.linkType || "").startsWith("official")), "Freebies API returned non-official link types");
  assert(data.freebies.every((deal) => /^https?:\/\//.test(deal.finalUrl)), "Freebies API returned invalid finalUrl");
  assert(data.freebies.every((deal) => !/\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver/i.test(deal.finalUrl)), "Freebies API returned a search, community, or news URL");
  assert(data.cachePolicy?.mode === "no-store", "Freebies API should expose no-store cache policy");
  assert(["fresh", "due", "stale", "seed"].includes(data.freshnessStatus), "Freebies API missing freshness status");
  assert(data.runtimeReadiness?.total === data.eventCount, "Freebies API runtime readiness total should match eventCount");
  assert(data.runtimeReadiness?.categoriesWithItems >= 8, "Freebies API runtime readiness should expose broad category coverage");
  assert(data.runtimeReadiness?.deadlineBuckets?.thisWeek >= 0, "Freebies API runtime readiness missing deadline buckets");
  assert(Array.isArray(data.runtimeReadiness?.collectionLanes) && data.runtimeReadiness.collectionLanes.length >= 6, "Freebies API runtime readiness missing collection lanes");
  assert(data.runtimeReadiness.collectionLanes.some((lane) => lane.id === "officialEvents" && lane.envKey === "OFFICIAL_EVENT_FEED_URLS" && lane.count > 0), "Freebies API collection lanes missing official event lane");
  assert(data.runtimeReadiness.collectionLanes.some((lane) => lane.id === "couponsMembership" && lane.envKey === "PUBLIC_COUPON_FEED_URLS" && lane.count > 0), "Freebies API collection lanes missing coupon membership lane");
  assert(data.runtimeReadiness.collectionLanes.every((lane) => Array.isArray(lane.recommendedEnvKeys) && lane.recommendedEnvKeys.includes(lane.envKey)), "Freebies API collection lanes missing recommended env key guidance");
  assert(data.runtimeReadiness.collectionLanes.some((lane) => lane.id === "deliveryFood" && lane.recommendedEnvKeys.includes("CAFE_FRANCHISE_COUPON_FEED_URLS")), "Freebies API collection lanes missing cafe/franchise env guidance");
  assert(data.runtimeReadiness.collectionLanes.some((lane) => lane.id === "shippingZero" && lane.recommendedEnvKeys.includes("BENEFIT_REFRESH_FEED_URLS")), "Freebies API collection lanes missing free-shipping env guidance");
  assert(data.runtimeReadiness.collectionLanes.every((lane) => ["healthy", "thin", "empty"].includes(lane.status) && typeof lane.action === "string"), "Freebies API collection lanes should expose status and operator action");
  assert(Array.isArray(data.deadlineCategoryCounts) && data.deadlineCategoryCounts.some((category) => category.id === "today"), "Freebies API missing deadline category counts");
  assert(data.deadlineCategoryCounts.every((category) => category.href?.startsWith("/free-benefits?deadline=") && typeof category.count === "number"), "Freebies API deadline category counts should expose href and count");
  assert(Array.isArray(data.runtimeReadiness?.topBrands) && data.runtimeReadiness.topBrands.length >= 4, "Freebies API runtime readiness missing top brand coverage");
});

await check("free benefit events api", async () => {
  const { response, data } = await fetchJson("/api/benefits/events?limit=12&type=all&includePublic=true");
  assert(response.status === 200, `Expected free benefit events API 200, got ${response.status}`);
  assert(data.ok === true, "Free benefit events API ok should be true");
  assert(Array.isArray(data.events) && data.events.length >= 8, "Free benefit events API should return official active events");
  assertFreeBenefitRuntimeFields(data.events, "/api/benefits/events");
  assert(data.totalCount >= 100, `Free benefit events API should keep at least 100 publishable events, got ${data.totalCount}`);
  const expectedBenefitCategories = ["all", "everyone", "firstCome", "coupon", "sample", "freeTrial", "gifticon", "pointCashback", "checkIn", "roulette", "signup", "publicFree", "experiencePanel"];
  assert(Array.isArray(data.categories) && data.categories.some((category) => category.id === "everyone"), "Free benefit events API missing event category metadata");
  assert(
    expectedBenefitCategories.every((id) => data.categories.some((category) => category.id === id && typeof category.count === "number")),
    "Free benefit events API categories should expose active publishable counts for every mobile filter"
  );
  assert(Array.isArray(data.categoryCounts) && Array.isArray(data.filteredCategoryCounts), "Free benefit events API missing global and filtered category count arrays");
  assert(Array.isArray(data.deadlineCategoryCounts) && Array.isArray(data.filteredDeadlineCategoryCounts), "Free benefit events API missing global and filtered deadline count arrays");
  assert(["today", "week", "soon"].every((id) => data.deadlineCategoryCounts.some((category) => category.id === id && category.href?.includes(`deadline=${id}`))), "Free benefit events API deadline categories should expose today, week, and soon filters");
  assert(data.categoryCounts.find((category) => category.id === "all")?.count === data.publishableTotalCount, "Free benefit events API global all count should match publishableTotalCount");
  assert(data.filteredCategoryCounts.find((category) => category.id === "all")?.count === data.totalCount, "Free benefit events API filtered all count should match totalCount");
  assert(data.summary?.noPurchase >= 1 || data.summary?.everyone >= 1 || data.summary?.firstCome >= 1, "Free benefit events API summary missing free-benefit counters");
  assert(Number(data.summary?.instantClaimCount ?? 0) >= 1, "Free benefit events API summary missing instant-claim counter");
  assert(data.summary?.officialSourceCount >= 50, "Free benefit events API summary missing official source diversity counter");
  assert(data.runtimeReadiness?.total === data.totalCount, "Free benefit events API runtime readiness total should match filtered totalCount");
  assert(data.runtimeReadiness?.officialCount >= 80, "Free benefit events API runtime readiness missing official source count");
  assert(data.runtimeReadiness?.noPurchaseCount >= 40, "Free benefit events API runtime readiness should favor no-purchase benefits");
  assert(data.runtimeReadiness?.categoriesWithItems >= 10, "Free benefit events API runtime readiness should cover the core mobile filters");
  assert(Array.isArray(data.runtimeReadiness?.missingRequiredCategories), "Free benefit events API runtime readiness missing category gap list");
  assert(data.filters?.sort === "recommended", "Free benefit events API should expose selected sort state");
  assert(data.rankingPolicy?.ctaField === "claimCtaLabel" && data.rankingPolicy?.trustField === "trustBadges", "Free benefit events API missing customer-facing ranking policy");
  assert(data.events.every((event) => event.status === "active" && event.validationStatus === "passed" && event.isHidden === false), "Free benefit events API returned non-publishable events");
  assert(data.events.every((event) => /^https?:\/\//.test(event.finalUrl)), "Free benefit events API returned invalid finalUrl");
  assert(data.events.every((event) => !/\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver/i.test(event.finalUrl)), "Free benefit events API returned a search, community, or news URL");
  assert(data.events.every((event) => event.claimCtaLabel && event.urgencyLabel && event.rankingReason && Array.isArray(event.trustBadges) && event.trustBadges.length >= 2), "Free benefit events API missing claim CTA, urgency, ranking reason, or trust badges");
  assert(data.policy?.publishableOnly === true, "Free benefit events API should expose publishable-only policy");
  assert(data.cachePolicy?.mode === "no-store", "Free benefit events API should expose no-store cache policy");
  const noPurchase = await fetchJson("/api/benefits/events?limit=8&type=all&sort=noPurchase&noPurchaseOnly=true");
  assert(noPurchase.response.status === 200, `Expected no-purchase benefit event search 200, got ${noPurchase.response.status}`);
  assert(noPurchase.data.events.length >= 4, "No-purchase benefit event filter should return visible official benefits");
  assert(noPurchase.data.events.every((event) => event.requiresPurchase === false), "No-purchase benefit event filter returned purchase-required event");
});

await check("hot signals api internal discovery links", async () => {
  const { response, data } = await fetchJson("/api/hot-signals?limit=8");
  assert(response.status === 200, `Expected hot signals 200, got ${response.status}`);
  assert(Array.isArray(data.signals), "Hot signals API missing signals array");
  assert(
    data.signals.every((signal) => typeof signal.url === "string" && signal.url.startsWith("/?") && signal.url.includes("verifiedOnly=true")),
    "Hot signals API should expose only internal verified-deal discovery URLs"
  );
  assert(
    data.signals.every((signal) => !/^https?:\/\//i.test(signal.url) && !/ppomppu\.co\.kr|zboard\/view\.php|fmkorea|quasarzone|algumon/i.test(signal.url)),
    "Hot signals API must not expose raw news/community source URLs"
  );
});

await check("admin news operations api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-operations");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin news operations API ok should be true");
  assert(data.report?.visibleCount >= MIN_OFFICIAL_BENEFITS, "Admin news operations report missing launch-ready visible official benefits");
  assert(Array.isArray(data.report?.visibleDeals) && data.report.visibleDeals.length >= 6, "Admin news operations report missing visible deal operation candidates");
  assert(Array.isArray(data.report?.providerStats) && data.report.providerStats.length >= 4, "Admin news operations report missing provider stats");
  assert(
    data.report.providerStats.every(
      (provider) =>
        typeof provider.seedCount === "number" &&
        typeof provider.feedItemCount === "number" &&
        typeof provider.feedSuccessCount === "number" &&
        typeof provider.collectedCount === "number" &&
        typeof provider.configuredEmptyFeed === "boolean"
    ),
    "Admin news operations provider stats missing seed/feed source mix counters"
  );
  assert(Array.isArray(data.report?.providerRisks) && data.report.providerRisks.length >= 4, "Admin news operations report missing provider risk summaries");
  assert(data.report.providerRisks.every((risk) => risk.provider && risk.label && risk.action && ["healthy", "watch", "danger"].includes(risk.severity)), "Admin news operations provider risks missing operation fields");
  assert(typeof data.report?.providerRiskSummary?.watch === "number" && typeof data.report?.providerRiskSummary?.danger === "number", "Admin news operations report missing provider risk summary counts");
  assert(Array.isArray(data.report?.sourceTrustScores) && data.report.sourceTrustScores.length >= 10, "Admin news operations report missing source trust score rows");
  assert(
    data.report.sourceTrustScores.every((source) => source.sourceName && source.trustScore >= 75 && source.recommendedAction && Array.isArray(source.categories)),
    "Admin news operations source trust scores missing operation fields"
  );
  assert(data.report?.feedTransitionReadiness?.totalProviders >= 4, "Admin news operations report missing official feed transition readiness summary");
  assert(typeof data.report.feedTransitionReadiness.seedCount === "number", "Admin news operations feed transition missing seed source count");
  assert(typeof data.report.feedTransitionReadiness.feedItemCount === "number", "Admin news operations feed transition missing external feed item count");
  assert(typeof data.report.feedTransitionReadiness.feedSuccessCount === "number", "Admin news operations feed transition missing successful feed count");
  assert(typeof data.report.feedTransitionReadiness.collectedCount === "number", "Admin news operations feed transition missing collected source count");
  assert(typeof data.report.feedTransitionReadiness.feedItemRate === "number", "Admin news operations feed transition missing external feed item rate");
  assert(typeof data.report.feedTransitionReadiness.configuredEmptyFeedCount === "number", "Admin news operations feed transition missing configured empty feed count");
  assert(Array.isArray(data.report.feedTransitionReadiness.configuredEmptyFeedProviders), "Admin news operations feed transition missing configured empty feed providers");
  assert(Array.isArray(data.report.feedTransitionReadiness.providers) && data.report.feedTransitionReadiness.providers.length >= 4, "Admin news operations report missing feed transition providers");
  assert(data.report.feedTransitionReadiness.providers.every((provider) => provider.provider && provider.mode && provider.modeLabel && provider.envKeys?.length && provider.nextAction), "Admin news operations feed transition providers missing launch operation fields");
  assert(
    data.report.feedTransitionReadiness.providers.every(
      (provider) =>
        typeof provider.seedCount === "number" &&
        typeof provider.feedItemCount === "number" &&
        typeof provider.feedSuccessCount === "number" &&
        typeof provider.collectedCount === "number" &&
        typeof provider.feedItemRate === "number" &&
        typeof provider.configuredEmptyFeed === "boolean"
    ),
    "Admin news operations feed transition providers missing source mix counters"
  );
  assert(Array.isArray(data.report.feedTransitionReadiness.recommendedNextEnvKeys), "Admin news operations report missing recommended feed env keys");
  assert(data.report?.sourceConfig?.configuredSources >= 4, "Admin news operations report missing official source config summary");
  assert(Array.isArray(data.report.sourceConfig.recommendedQueries) && data.report.sourceConfig.recommendedQueries.length >= 8, "Admin news operations report missing official source recommended queries");
  assert(Array.isArray(data.report.sourceConfig.guardrails) && data.report.sourceConfig.guardrails.some((rule) => String(rule).includes("검색 결과")), "Admin news operations report missing official source guardrails");
  assert(Array.isArray(data.report.sourceConfig.envKeys) && data.report.sourceConfig.envKeys.includes("OFFICIAL_EVENT_FEED_URLS"), "Admin news operations report missing official feed env keys");
  assert(data.report.sourceConfig.nextRefreshAt, "Admin news operations report missing next official feed refresh time");
  assert(
    Array.isArray(data.report.sourceConfig.sourceRefreshWindows) &&
      data.report.sourceConfig.sourceRefreshWindows.length >= 4 &&
      data.report.sourceConfig.sourceRefreshWindows.every((item) => item.nextRefreshAt && Number(item.refreshCadenceMinutes ?? 0) > 0),
    "Admin news operations report missing official source refresh windows"
  );
  assert(Array.isArray(data.report?.sourceActionQueue) && data.report.sourceActionQueue.length >= 4, "Admin news operations report missing official source action queue");
  assert(
    data.report.sourceActionQueue.every(
      (item) =>
        item.provider &&
        item.source &&
        ["high", "medium", "low"].includes(item.priority) &&
        ["connect_feed", "fix_feed", "review", "healthy"].includes(item.status) &&
        item.action &&
        item.command &&
        Array.isArray(item.envKeys)
    ),
    "Admin news operations source action queue missing launch operation fields"
  );
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing"].includes(data.report?.feedCanary?.status), "Admin news operations report missing official feed canary status");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.feedCanary?.freshnessStatus), "Admin news operations report missing official feed canary freshness status");
  assert(typeof data.report?.feedCanary?.staleHours === "number", "Admin news operations report missing official feed canary stale threshold");
  assert(typeof data.report?.feedCanary?.configuredFeedUrls === "number", "Admin news operations report missing official feed canary configured URL count");
  assert(typeof data.report?.feedCanary?.visibleCandidateCount === "number", "Admin news operations report missing official feed canary visible candidate count");
  assert(Array.isArray(data.report?.recentLogs) && data.report.recentLogs.length >= 6, "Admin news operations report missing recent logs");
  assert(Array.isArray(data.report?.manualActions) && data.report.manualActions.length >= 3, "Admin news operations report missing manual actions");
  assert(data.report?.refreshAll?.productDealsCount >= 140, "Admin news operations report missing refresh:all product count");
  assert(data.report?.refreshAll?.newsDealsCount >= MIN_OFFICIAL_BENEFITS, "Admin news operations report missing refresh:all news count");
  assert(Array.isArray(data.report?.categoryCoverage) && data.report.categoryCoverage.length >= 10, "Admin news operations report missing required category coverage");
  assert(data.report.categoryCoverage.every((item) => item.category && typeof item.count === "number" && item.count >= 2 && item.minimumCount >= 2 && item.action), "Admin news operations category coverage missing operation fields or minimum counts");
  assert(Array.isArray(data.report?.operationalRisks) && data.report.operationalRisks.length >= 1, "Admin news operations report missing operational risk summary");
  assert(Array.isArray(data.report?.refreshAll?.steps) && data.report.refreshAll.steps.length >= 5, "Admin news operations report missing refresh:all step status");
  assert(data.report?.freshness?.cadenceHours === 6, "Admin news operations report missing 6-hour freshness cadence");
  assert(data.report?.freshness?.staleHours === 24, "Admin news operations report missing 24-hour stale guard");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.freshness?.status), "Admin news operations report missing freshness status");
  assert(String(data.report?.freshness?.command ?? "").includes("refresh:all"), "Admin news operations report missing refresh command guidance");
  assert(Array.isArray(data.report?.operatorNextActions) && data.report.operatorNextActions.length >= 1, "Admin news operations report missing operator next actions");
  assert(data.report?.policyRegression?.ok === true, "Admin news operations report missing passing news policy regression");
  assert(data.report?.policyRegression?.blockedNegativeSamples >= 8, "Admin news operations policy regression should block bad official benefit samples");
  assert(
    data.report?.policyRegression?.results?.some((item) => item.id === "news-regression-search-url" && item.hiddenReason.includes("search_or_result_url")),
    "Admin news operations policy regression should block search official benefit URLs"
  );
  assert(
    data.report?.policyRegression?.results?.some((item) => item.id === "news-regression-community-url" && item.hiddenReason.includes("blocked_community_or_news_host")),
    "Admin news operations policy regression should block community official benefit URLs"
  );

  const csvResponse = await fetch(`${baseUrl}/api/admin/news-operations?format=csv`);
  const csv = await csvResponse.text();
  assert(csvResponse.status === 200, `Expected news operations CSV 200, got ${csvResponse.status}`);
  assert(csvResponse.headers.get("content-type")?.includes("text/csv"), "Admin news operations CSV should use text/csv content type");
  assert(csv.includes("provider_risk") && csv.includes("feed_transition") && csv.includes("failure_reason") && csv.includes("recent_log"), "Admin news operations CSV missing provider risk, feed transition, failure reason, or recent log sections");
  assert(csv.includes("feed_source_mix") && csv.includes("seed=") && csv.includes("feed="), "Admin news operations CSV missing seed/feed source mix rows");
});

await check("admin news feed canary api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-feed-canary");
  assert(response.status === 200, `Expected news feed canary 200, got ${response.status}`);
  assert(data.ok === true, "Admin news feed canary API ok should be true");
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing"].includes(data.report?.status), "Admin news feed canary missing status");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.freshnessStatus), "Admin news feed canary missing freshness status");
  assert(typeof data.report?.staleHours === "number", "Admin news feed canary missing stale threshold");
  assert(typeof data.report?.configuredFeedUrls === "number", "Admin news feed canary missing configured feed URL count");
  assert(typeof data.report?.visibleCandidateCount === "number", "Admin news feed canary missing visible candidate count");
  assert(Array.isArray(data.report?.nextActions) && data.report.nextActions.length >= 1, "Admin news feed canary missing next actions");

  const csvResponse = await fetch(`${baseUrl}/api/admin/news-feed-canary?format=csv`);
  const csv = await csvResponse.text();
  assert(csvResponse.status === 200, `Expected news feed canary CSV 200, got ${csvResponse.status}`);
  assert(csvResponse.headers.get("content-type")?.includes("text/csv"), "Admin news feed canary CSV should use text/csv content type");
  assert(csv.includes("official_feed_canary") && csv.includes("next_action"), "Admin news feed canary CSV missing summary or next action rows");
});

await check("admin news feed live pipeline api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-feed-live");
  assert(response.status === 200, `Expected news feed live pipeline 200, got ${response.status}`);
  assert(data.ok === true, "Admin news feed live pipeline API ok should be true");
  assert(["seed_launch_ready", "live_feed_ready", "needs_attention", "missing", "unreadable"].includes(data.report?.status), "Admin news feed live pipeline missing status");
  assert(typeof data.report?.configuredUrlCount === "number", "Admin news feed live pipeline missing configured URL count");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.canary?.freshnessStatus), "Admin news feed live pipeline missing canary freshness status");
  assert(data.report?.officialBenefits?.visibleCount >= MIN_OFFICIAL_BENEFITS, "Admin news feed live pipeline should expose visible official benefits");
  assert(data.report?.officialBenefits?.exposedSearchLinkCount === 0, "Admin news feed live pipeline should expose zero search links");
  assert(data.report?.officialBenefits?.exposedNonOfficialLinkCount === 0, "Admin news feed live pipeline should expose zero non-official links");
  assert(Array.isArray(data.report?.steps) && data.report.steps.some((step) => step.name === "verify:links:live"), "Admin news feed live pipeline should expose live probe step");
  assert(Array.isArray(data.report?.nextActions) && data.report.nextActions.length >= 1, "Admin news feed live pipeline missing next actions");

  const csvResponse = await fetch(`${baseUrl}/api/admin/news-feed-live?format=csv`);
  const csv = await csvResponse.text();
  assert(csvResponse.status === 200, `Expected news feed live pipeline CSV 200, got ${csvResponse.status}`);
  assert(csvResponse.headers.get("content-type")?.includes("text/csv"), "Admin news feed live pipeline CSV should use text/csv content type");
  assert(csv.includes("news_feed_live_pipeline") && csv.includes("provider") && csv.includes("next_action"), "Admin news feed live pipeline CSV missing summary, provider, or next action rows");
});

await check("admin news feed preview api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-feed-preview");
  assert(response.status === 200, `Expected news feed preview 200, got ${response.status}`);
  assert(data.ok === true, "Admin news feed preview API ok should be true");
  assert(data.report?.visibleCount >= 1, "Admin news feed preview report should expose visible candidates");
  assert(data.report?.officialLinkPromotedCount >= 1, "Admin news feed preview report should prove official link promotion");
  assert(data.report?.summary?.exposedSearchLinkCount === 0, "Admin news feed preview should expose zero search links");
  assert(data.report?.summary?.exposedNonOfficialLinkCount === 0, "Admin news feed preview should expose zero non-official links");
  assert(Array.isArray(data.report?.providerResults) && data.report.providerResults.length >= 4, "Admin news feed preview should expose provider rows");
  assert(Array.isArray(data.report?.gates) && data.report.gates.every((gate) => typeof gate.ok === "boolean" && gate.action), "Admin news feed preview gates should expose ok/action fields");
  assert(Array.isArray(data.report?.nextActions) && data.report.nextActions.some((action) => action.includes("news:preview")), "Admin news feed preview should expose operator command guidance");

  const csvResponse = await fetch(`${baseUrl}/api/admin/news-feed-preview?format=csv`);
  const csv = await csvResponse.text();
  assert(csvResponse.status === 200, `Expected news feed preview CSV 200, got ${csvResponse.status}`);
  assert(csvResponse.headers.get("content-type")?.includes("text/csv"), "Admin news feed preview CSV should use text/csv content type");
  assert(csv.includes("provider") && csv.includes("sample_visible") && csv.includes("official_promotions"), "Admin news feed preview CSV missing provider, sample, or promotion sections");

  const sampleRss = `<rss><channel><item><guid>smoke-news-feed-dry-run</guid><title>공식 이벤트 링크가 포함된 smoke RSS</title><link>https://news.naver.com/example/halindosa-smoke</link><description><![CDATA[공식 행사 <a href="https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593">바로가기</a>]]></description><category>외식/배달</category><benefitType>coupon</benefitType><merchant>맥도날드</merchant><endDate>2026-12-31T14:59:59.000Z</endDate></item></channel></rss>`;
  const dryRun = await fetchJson("/api/admin/news-feed-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_news_feed_paste",
      provider: "official_event",
      text: sampleRss
    })
  });
  assert(dryRun.response.status === 200, `Expected news feed dry-run 200, got ${dryRun.response.status}`);
  assert(dryRun.data.ok === true, "Admin news feed dry-run should pass official RSS sample");
  assert(dryRun.data.result?.visible === 1, "Admin news feed dry-run should expose one visible row");
  assert(dryRun.data.result?.hidden === 0, "Admin news feed dry-run should hide zero rows for official sample");
  assert(dryRun.data.result?.officialLinkPromotedCount === 1, "Admin news feed dry-run should promote official link from RSS body");
  assert(dryRun.data.result?.visibleRows?.[0]?.finalUrl?.includes("mcdonalds.co.kr"), "Admin news feed dry-run should use official final URL");

  const blockedDryRun = await fetchJson("/api/admin/news-feed-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_news_feed_blocked_samples",
      provider: "official_event",
      items: [
        {
          id: "smoke-dry-run-search-url",
          title: "검색 결과 URL 차단 샘플",
          summary: "검색 결과 URL은 운영 feed에서 숨김 처리되어야 합니다.",
          merchant: "검색몰",
          finalUrl: "https://search.shopping.naver.com/search/all?query=%ED%8A%B9%EA%B0%80",
          endDate: "2026-12-31T14:59:59.000Z"
        },
        {
          id: "smoke-dry-run-news-only",
          title: "뉴스 원문 단독 URL 차단 샘플",
          summary: "공식 이벤트 URL 없이 뉴스 기사 링크만 있으면 사용자 노출 후보가 아닙니다.",
          merchant: "뉴스",
          finalUrl: "https://news.naver.com/example/halindosa-only-news",
          endDate: "2026-12-31T14:59:59.000Z"
        },
        {
          id: "smoke-dry-run-expired-official",
          title: "만료 공식 이벤트 차단 샘플",
          summary: "공식 이벤트 URL이라도 종료일이 지나면 사용자 노출에서 제외합니다.",
          merchant: "맥도날드",
          finalUrl: "https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593",
          endDate: "2025-12-31T14:59:59.000Z"
        }
      ]
    })
  });
  assert(blockedDryRun.response.status === 200, `Expected blocked dry-run 200, got ${blockedDryRun.response.status}`);
  assert(blockedDryRun.data.ok === false, "Admin news feed dry-run should fail blocked samples");
  assert(blockedDryRun.data.result?.visible === 0, "Admin news feed dry-run should expose zero blocked sample rows");
  assert(blockedDryRun.data.result?.hidden === 3, "Admin news feed dry-run should hide all blocked sample rows");
  assert(
    blockedDryRun.data.result?.hiddenRows?.some((row) => row.id === "smoke-dry-run-search-url" && row.hiddenReason.includes("search_or_result_url")),
    "Admin news feed dry-run should block search URL sample"
  );
  assert(
    blockedDryRun.data.result?.hiddenRows?.some((row) => row.id === "smoke-dry-run-news-only" && row.hiddenReason.includes("blocked_news_or_community_context_url")),
    "Admin news feed dry-run should block news-only sample"
  );
  assert(
    blockedDryRun.data.result?.hiddenRows?.some((row) => row.id === "smoke-dry-run-expired-official" && row.hiddenReason.includes("expired_event")),
    "Admin news feed dry-run should block expired official sample"
  );

  const oversizedDryRun = await fetchJson("/api/admin/news-feed-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_news_feed_oversized",
      provider: "official_event",
      text: "x".repeat(300_001)
    })
  });
  assert(oversizedDryRun.response.status === 413, `Expected oversized dry-run 413, got ${oversizedDryRun.response.status}`);
  assert(oversizedDryRun.data.ok === false, "Admin news feed dry-run should reject oversized source");
  assert(oversizedDryRun.data.reason === "source too large", "Admin news feed dry-run should expose oversized source reason");
});

await check("admin source live readiness api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-live");
  assert(response.status === 200, `Expected source live 200, got ${response.status}`);
  assert(data.ok === true, "Admin source live API ok should be true");
  assert(data.report?.mode === "non_strict_live_readiness", "Admin source live report should use non-strict live readiness mode");
  assert(data.report?.totalSources >= 30, "Admin source live report missing official source candidates");
  assert(data.report?.reachableCount >= 1, "Admin source live report should include reachable official sources");
  assert(typeof data.report?.guardedCount === "number", "Admin source live report missing guarded count");
  assert(Array.isArray(data.report?.sources) && data.report.sources.length >= 30, "Admin source live report missing source rows");
  assert(data.report.sources.every((source) => source.id && source.status && source.operatorAction), "Admin source live rows missing operation fields");
});

await check("admin source live readiness csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-live?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source live CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source live CSV should use text/csv content type");
  assert(text.includes("officialUrl") && text.includes("operatorAction") && text.includes("checkedAt"), "Admin source live CSV missing source URL, operator action, or checkedAt fields");
});

await check("admin free benefit source breadth api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-breadth");
  assert(response.status === 200, `Expected source breadth 200, got ${response.status}`);
  assert(data.ok === true, "Admin source breadth API ok should be true");
  assert(data.report?.ok === true, "Admin source breadth report should pass");
  assert(data.report?.catalogCount >= 100, "Admin source breadth missing official source catalog coverage");
  assert(data.report?.passedLaneCount === data.report?.requiredLaneCount, "Admin source breadth should pass every required lane");
  assert(data.report?.passedBrandSignalCount === data.report?.requiredBrandSignalCount, "Admin source breadth should pass every required brand signal");
  assert(Array.isArray(data.report?.lanes) && data.report.lanes.length >= 10, "Admin source breadth missing lane rows");
  assert(Array.isArray(data.report?.brandSignals) && data.report.brandSignals.length >= 40, "Admin source breadth missing brand signal rows");
  assert(data.report.lanes.every((lane) => lane.ok === true && lane.activeCount >= lane.minimum), "Admin source breadth lane rows should all satisfy minimum active sources");
  assert(data.report.brandSignals.every((brand) => brand.ok === true && brand.activeCount >= 1), "Admin source breadth brand rows should all have active official candidates");
  assert(data.report?.consumerFirstPolicy?.publicPolicyDefaultHandling === "excluded_from_default_home_and_freebies_unless_explicitly_requested", "Admin source breadth should preserve consumer-first public policy handling");
});

await check("admin free benefit source breadth csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-breadth?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source breadth CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source breadth CSV should use text/csv content type");
  assert(text.includes("source_breadth") && text.includes("lane") && text.includes("brand"), "Admin source breadth CSV missing summary, lane, or brand sections");
  assert(text.includes("무료혜택 소스 축 커버리지") && text.includes("통신사 멤버십"), "Admin source breadth CSV missing customer benefit source coverage labels");
});

await check("admin source onboarding plan api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-onboarding");
  assert(response.status === 200, `Expected source onboarding 200, got ${response.status}`);
  assert(data.ok === true, "Admin source onboarding API ok should be true");
  assert(data.report?.ok === true, "Admin source onboarding plan should pass");
  assert(data.report?.totalSources >= 30, "Admin source onboarding plan missing official source candidates");
  assert(data.report?.blockedLiveIssues === 0, "Admin source onboarding plan should not include blocked live issues");
  assert(Array.isArray(data.report?.topActions) && data.report.topActions.length >= 5, "Admin source onboarding plan missing top actions");
  assert(Array.isArray(data.report?.envPlan) && data.report.envPlan.length >= 5, "Admin source onboarding plan missing env plan");
  assert(String(data.report?.envTemplate ?? "").includes("OFFICIAL_EVENT_FEED_URLS"), "Admin source onboarding plan missing env template");
  assert(Array.isArray(data.report?.queue) && data.report.queue.length >= 30, "Admin source onboarding plan missing full queue");
  assert(data.report.queue.every((source) => source.id && source.nextAction && source.guardrail && source.recommendedEnvKeys?.length), "Admin source onboarding rows missing operation guidance");
});

await check("admin source onboarding plan csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-onboarding?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source onboarding CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source onboarding CSV should use text/csv content type");
  assert(text.includes("recommendedEnvKeys") && text.includes("nextAction") && text.includes("guardrail"), "Admin source onboarding CSV missing env key, next action, or guardrail fields");
});

await check("admin source onboarding env template", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-onboarding?format=env`);
  const text = await response.text();
  assert(response.status === 200, `Expected source onboarding env 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/plain"), "Admin source onboarding env template should use text/plain content type");
  assert(text.includes("OFFICIAL_EVENT_FEED_URLS=") && text.includes("PUBLIC_COUPON_FEED_URLS="), "Admin source onboarding env template missing official feed keys");
  assert(text.includes("검색 결과, 커뮤니티 원문") && text.includes("담당자 승인 JSON"), "Admin source onboarding env template missing safe source guardrails");
});

await check("admin free benefit source starter pack api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-starter-pack");
  assert(response.status === 200, `Expected source starter pack 200, got ${response.status}`);
  assert(data.ok === true, "Admin source starter pack API ok should be true");
  assert(data.report?.ok === true, "Admin source starter pack report should pass");
  assert(data.report?.catalogCount >= 100, "Admin source starter pack missing official source catalog coverage");
  assert(data.report?.summary?.totalCandidates >= 50, "Admin source starter pack missing starter candidates");
  assert(data.report?.summary?.reachableCandidates >= 40, "Admin source starter pack missing reachable candidates");
  assert(Array.isArray(data.report?.summary?.envKeys) && data.report.summary.envKeys.includes("BENEFIT_REFRESH_FEED_URLS"), "Admin source starter pack missing benefit refresh env key");
  assert(Array.isArray(data.report?.packs) && data.report.packs.length >= 8, "Admin source starter pack missing operating lanes");
  assert(
    data.report.packs.every((pack) => pack.label && pack.firstAction && pack.candidateCount >= 3 && pack.envKeys?.length && pack.candidates?.length >= 3),
    "Admin source starter pack lanes missing first action, env keys, or candidates"
  );
  assert(String(data.report?.envTemplate ?? "").includes("공식 API, RSS, Atom, 승인 파트너 JSON"), "Admin source starter pack missing safe feed env guidance");
});

await check("admin free benefit source starter pack csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-starter-pack?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source starter pack CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source starter pack CSV should use text/csv content type");
  assert(text.includes("lane") && text.includes("feedConnectionAction") && text.includes("guardrail"), "Admin source starter pack CSV missing lane, action, or guardrail fields");
});

await check("admin free benefit source starter pack env", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-starter-pack?format=env`);
  const text = await response.text();
  assert(response.status === 200, `Expected source starter pack env 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/plain"), "Admin source starter pack env should use text/plain content type");
  assert(text.includes("BENEFIT_REFRESH_FEED_URLS=") && text.includes("PUBLIC_COUPON_FEED_URLS="), "Admin source starter pack env missing free benefit feed keys");
  assert(text.includes("공식 이벤트 HTML 페이지는 참고 URL") && text.includes("검색 결과, 커뮤니티 글"), "Admin source starter pack env missing anti-scraping or unsafe-link guardrails");
});

await check("admin free benefit source feed handoff api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-feed-handoff");
  assert(response.status === 200, `Expected source feed handoff 200, got ${response.status}`);
  assert(data.ok === true, "Admin source feed handoff API ok should be true");
  assert(data.report?.ok === true, "Admin source feed handoff report should pass");
  assert(data.report?.starterPack?.laneCount >= 8, "Admin source feed handoff missing starter lanes");
  assert(data.report?.starterPack?.totalCandidates >= 50, "Admin source feed handoff missing candidate coverage");
  assert(Array.isArray(data.report?.envKeys) && data.report.envKeys.includes("CRON_SECRET"), "Admin source feed handoff missing cron secret env guidance");
  assert(Array.isArray(data.report?.verificationCommands) && data.report.verificationCommands.includes("npm run refresh:benefits"), "Admin source feed handoff missing refresh verification command");
});

await check("admin free benefit source feed handoff csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-feed-handoff?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source feed handoff CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source feed handoff CSV should use text/csv content type");
  assert(text.includes("lane") && text.includes("firstAction") && text.includes("firstCandidateUrl"), "Admin source feed handoff CSV missing lane, action, or URL fields");
});

await check("admin free benefit source feed handoff markdown", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-feed-handoff?format=md`);
  const text = await response.text();
  assert(response.status === 200, `Expected source feed handoff markdown 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/markdown"), "Admin source feed handoff markdown should use text/markdown content type");
  assert(text.includes("Vercel Environment Variables") && text.includes("공식 HTML 이벤트 페이지를 무단 스크래핑하지 않는다"), "Admin source feed handoff markdown missing Vercel env or anti-scraping guidance");
});

await check("admin free benefit source feed activation api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-feed-activation");
  assert(response.status === 200, `Expected source feed activation 200, got ${response.status}`);
  assert(data.ok === true, "Admin source feed activation API ok should be true");
  assert(data.report?.ok === true, "Admin source feed activation report should pass");
  assert(["seed_ready", "live_feed_ready"].includes(data.report?.status), "Admin source feed activation status should be seed_ready or live_feed_ready");
  assert(Array.isArray(data.report?.requiredActivationCommands) && data.report.requiredActivationCommands.includes("npm run test:home-realtime"), "Admin source feed activation missing home realtime command");
  assert(Array.isArray(data.report?.checks) && data.report.checks.length >= 6, "Admin source feed activation missing checks");
  assert(data.report.checks.every((check) => check.ok === true), "Admin source feed activation checks should all pass");
});

await check("admin free benefit source feed activation csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-feed-activation?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source feed activation CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source feed activation CSV should use text/csv content type");
  assert(text.includes("name") && text.includes("action") && text.includes("home realtime reflection"), "Admin source feed activation CSV missing check headers or home realtime row");
});

await check("admin free benefit source feed activation markdown", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-feed-activation?format=md`);
  const text = await response.text();
  assert(response.status === 200, `Expected source feed activation markdown 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/markdown"), "Admin source feed activation markdown should use text/markdown content type");
  assert(text.includes("무료혜택 Feed Activation 리포트") && text.includes("seed_ready") && text.includes("live_feed_ready"), "Admin source feed activation markdown missing activation readiness states");
});

await check("admin source feed env readiness api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-feed-env");
  assert(response.status === 200, `Expected source feed env 200, got ${response.status}`);
  assert(data.ok === true, "Admin source feed env API ok should be true");
  assert(data.report?.ok === true, "Admin source feed env report should pass");
  assert(Array.isArray(data.report?.checkedKeys) && data.report.checkedKeys.length >= 6, "Admin source feed env report missing checked keys");
  assert(typeof data.report?.configuredUrlCount === "number", "Admin source feed env report missing configured URL count");
  assert(data.report?.failedCount === 0, "Admin source feed env report should have zero failed configured URLs");
  assert(data.report?.policy?.httpsOnly === true, "Admin source feed env report should require HTTPS");
  assert(data.report?.policy?.machineReadableFeedRequired === true, "Admin source feed env report should require machine-readable feeds");
  assert(data.report?.policy?.officialCatalogHostOrApprovedPartnerHostRequired === true, "Admin source feed env report should require official or approved hosts");
  assert(Array.isArray(data.report?.allowedCatalogHosts) && data.report.allowedCatalogHosts.length >= 25, "Admin source feed env report missing allowed catalog hosts");
  assert(Array.isArray(data.report?.policyRegressionSamples) && data.report.policyRegressionSamples.every((sample) => sample.passed === true), "Admin source feed env policy regression samples should all pass");
});

await check("admin source readiness rollup api", async () => {
  const { response, data } = await fetchJson("/api/admin/source-readiness");
  assert(response.status === 200, `Expected source readiness 200, got ${response.status}`);
  assert(data.ok === true, "Admin source readiness API ok should be true");
  assert(data.report?.ok === true, "Admin source readiness report should pass");
  assert(data.report?.launchGateStatus === "passed", "Admin source readiness launch gate should pass");
  assert(data.report?.summary?.officialSourceCandidates >= 30, "Admin source readiness missing official source candidates");
  assert(data.report?.summary?.visibleOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Admin source readiness missing visible official benefits");
  assert(data.report?.summary?.feedEnvFailedCount === 0, "Admin source readiness should have zero feed env failures");
  assert(data.report?.summary?.blockedLiveIssues === 0, "Admin source readiness should have zero blocking live issues");
  assert(Array.isArray(data.report?.gates) && data.report.gates.length >= 6, "Admin source readiness report missing gate rows");
  assert(data.report.gates.every((gate) => gate.ok === true), "Admin source readiness gates should all pass");
  assert(Array.isArray(data.report?.operatorNextActions) && data.report.operatorNextActions.length >= 3, "Admin source readiness report missing operator next actions");
  assert(Array.isArray(data.report?.commands) && data.report.commands.includes("npm run source:readiness:report"), "Admin source readiness report missing regeneration command");
});

await check("admin source readiness rollup csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/source-readiness?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected source readiness CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin source readiness CSV should use text/csv content type");
  assert(text.includes("env_plan") && text.includes("gate") && text.includes("next_action"), "Admin source readiness CSV missing env plan, gate, or next action sections");
  assert(text.includes("검색 결과, 커뮤니티 원문") && text.includes("source:feed-env:doctor"), "Admin source readiness CSV missing safe source guardrails or feed env command");
  assert(text.includes("guarded_source") && text.includes("officialUrl=") && text.includes("finalUrl=") && text.includes("reason="), "Admin source readiness CSV missing guarded source URL and reason evidence");
});

await check("admin daily operations api", async () => {
  const { response, data } = await fetchJson("/api/admin/daily-operations");
  assert(response.status === 200, `Expected daily operations 200, got ${response.status}`);
  assert(data.ok === true, "Admin daily operations API ok should be true");
  assert(data.report?.ok === true, "Admin daily operations report should pass");
  assert(data.report?.summary?.productDealsCount >= 140, "Admin daily operations should preserve product count");
  assert(data.report?.summary?.verifiedProductLinks >= 140, "Admin daily operations should preserve verified links");
  assert(data.report?.summary?.exposedSearchLinks === 0, "Admin daily operations should show zero exposed search links");
  assert(data.report?.summary?.exposedSoldOutLinks === 0, "Admin daily operations should show zero exposed sold-out links");
  assert(data.report?.summary?.visibleOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Admin daily operations should preserve official benefits");
  assert(data.report?.summary?.refreshAllOk === true, "Admin daily operations should preserve refresh:all success");
  assert(data.report?.summary?.officialSourceLaunchGateStatus === "passed", "Admin daily operations should expose passing source readiness");
  assert(Array.isArray(data.report?.gates) && data.report.gates.length >= 6 && data.report.gates.every((gate) => gate.ok === true), "Admin daily operations gates should all pass");
  assert(Array.isArray(data.report?.cards) && data.report.cards.length >= 6, "Admin daily operations should expose operation cards");
  assert(Array.isArray(data.report?.priorityQueue) && data.report.priorityQueue.length >= 3, "Admin daily operations should expose priority queue");
});

await check("admin daily operations csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/daily-operations?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected daily operations CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin daily operations CSV should use text/csv content type");
  assert(text.includes("priority_queue") && text.includes("verifiedProductLinks") && text.includes("exposedSearchLinks"), "Admin daily operations CSV missing summary or queue fields");
  assert(text.includes("npm run daily:operations:report") && text.includes("npm run verify:links"), "Admin daily operations CSV missing regeneration commands");
});

await check("admin free benefit operations api", async () => {
  const { response, data } = await fetchJson("/api/admin/free-benefit-operations");
  assert(response.status === 200, `Expected free benefit operations 200, got ${response.status}`);
  assert(data.ok === true, "Admin free benefit operations API ok should be true");
  assert(data.report?.ok === true, "Admin free benefit operations report should pass");
  assert(data.report?.totals?.visibleOfficialBenefitItems >= MIN_OFFICIAL_BENEFITS, "Admin free benefit operations should preserve visible official benefit count");
  assert(data.report?.totals?.officialHosts >= 45, "Admin free benefit operations should preserve broad official host coverage");
  assert(data.report?.qualityGates?.exposedSearchLinks === 0, "Admin free benefit operations should show zero search links");
  assert(data.report?.qualityGates?.exposedNonOfficialLinks === 0, "Admin free benefit operations should show zero non-official links");
  assert(data.report?.qualityGates?.brokenImages === 0, "Admin free benefit operations should show zero broken images");
  assert(Array.isArray(data.report?.topCandidates) && data.report.topCandidates.length >= 10, "Admin free benefit operations should expose top display candidates");
  assert(Array.isArray(data.report?.operatorActionQueue) && data.report.operatorActionQueue.length >= 1, "Admin free benefit operations should expose operator action queue");
  assert(data.report.operatorActionQueue.every((item) => item.title && item.action && item.priority), "Admin free benefit operations action queue should include title, action, and priority");
});

await check("admin free benefit operations csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/free-benefit-operations?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected free benefit operations CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin free benefit operations CSV should use text/csv content type");
  assert(text.includes("visibleOfficialBenefitItems") && text.includes("exposedSearchLinks") && text.includes("top_candidate") && text.includes("operator_action"), "Admin free benefit operations CSV missing summary, quality, action, or candidate rows");
  assert(text.includes("npm run benefit:operations:report") && text.includes("/free-benefits?deadline=week"), "Admin free benefit operations CSV missing regeneration command or deadline action");
});

await check("admin free benefit ranking api", async () => {
  const { response, data } = await fetchJson("/api/admin/free-benefit-ranking");
  assert(response.status === 200, `Expected free benefit ranking 200, got ${response.status}`);
  assert(data.ok === true, "Admin free benefit ranking API ok should be true");
  assert(data.report?.ok === true, "Admin free benefit ranking report should pass");
  assert(data.report?.publishableCount >= MIN_OFFICIAL_BENEFITS, "Admin free benefit ranking should preserve publishable official benefit count");
  assert(data.report?.consumerPublishableCount >= 90, "Admin free benefit ranking should preserve consumer-first benefit count");
  assert(data.report?.noPurchaseCount >= 100, "Admin free benefit ranking should preserve no-purchase benefit count");
  assert(data.report?.claimReadyCount >= 40, "Admin free benefit ranking should preserve enough immediately claimable benefits");
  assert(data.report?.topClaimReadyCount >= 16, "Admin free benefit ranking should keep first-screen candidates easy to claim");
  assert(data.report?.topBenefitTypeDiversity >= 7, "Admin free benefit ranking should keep first-screen benefit types diverse");
  assert(data.report?.exactDuplicateGroupCount === 0, "Admin free benefit ranking should expose zero exact duplicate groups");
  assert(data.report?.maxTopBrandRepeat <= 4, "Admin free benefit ranking should keep first-screen brand repetition low");
  assert(data.report?.maxTopDomainRepeat <= 5, "Admin free benefit ranking should keep first-screen domain repetition low");
  assert(data.report?.operationalReadiness?.recentlyCheckedCount >= 120, "Admin free benefit ranking should expose recently checked benefit SLA");
  assert(data.report?.operationalReadiness?.staleCheckedCount === 0, "Admin free benefit ranking should expose zero stale checked benefits");
  assert(data.report?.operationalReadiness?.missingCheckedAtCount === 0, "Admin free benefit ranking should expose zero missing checked-at benefits");
  assert(data.report?.operationalReadiness?.officialHostDiversity >= 80, "Admin free benefit ranking should preserve official host diversity");
  assert(Array.isArray(data.report?.topCandidates) && data.report.topCandidates.length >= 10, "Admin free benefit ranking should expose top candidates");
  assert(data.report.topCandidates.every((item) => item.finalUrl?.startsWith("https://") && item.brand && item.title && item.benefitType && Number(item.claimEaseScore) >= 0 && item.claimUrgencyLabel), "Admin free benefit ranking candidates should expose official HTTPS URLs, claim ease, and display fields");
  assert(Array.isArray(data.report?.claimReadyCandidates) && data.report.claimReadyCandidates.length >= 10, "Admin free benefit ranking should expose claim-ready candidates");
  assert(data.report.claimReadyCandidates.every((item) => item.finalUrl?.startsWith("https://") && item.isNoPurchase === true && Number(item.claimEaseScore) >= 80), "Claim-ready candidates should be no-purchase official links with high claim ease");
});

await check("admin free benefit ranking csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/free-benefit-ranking?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected free benefit ranking CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin free benefit ranking CSV should use text/csv content type");
  assert(text.includes("publishableCount") && text.includes("exactDuplicateGroupCount") && text.includes("top_candidate") && text.includes("claim_ready_candidate") && text.includes("recentlyCheckedCount"), "Admin free benefit ranking CSV missing summary, duplicate, claim-ready, operations, or candidate rows");
  assert(text.includes("npm run benefit:ranking:doctor") && text.includes("첫 화면") && text.includes("claimReadyCount") && text.includes("npm run refresh:benefits"), "Admin free benefit ranking CSV missing regeneration command, claim-ready guidance, operations guidance, or diversity guidance");
});

await check("admin free benefit collection lanes api", async () => {
  const { response, data } = await fetchJson("/api/admin/free-benefit-collection-lanes");
  assert(response.status === 200, `Expected free benefit collection lanes 200, got ${response.status}`);
  assert(data.ok === true, "Admin free benefit collection lanes API ok should be true");
  assert(data.report?.ok === true, "Free benefit collection lanes report should pass");
  assert(data.report?.summary?.consumerVisibleItems >= 120, "Free benefit collection lanes should preserve consumer visible benefit count");
  assert(data.report?.summary?.healthyLanes >= 6, "Free benefit collection lanes should have at least six healthy lanes");
  assert(data.report?.summary?.emptyLanes === 0, "Free benefit collection lanes should have zero empty lanes");
  assert(Array.isArray(data.report?.lanes) && data.report.lanes.length >= 8, "Free benefit collection lanes missing lane rows");
  assert(data.report.lanes.some((lane) => lane.id === "officialEvents" && lane.envKey === "OFFICIAL_EVENT_FEED_URLS" && lane.status === "healthy"), "Free benefit collection lanes missing healthy official event lane");
  assert(data.report.lanes.some((lane) => lane.id === "samplesTrials" && lane.envKey === "BEAUTY_SAMPLE_FEED_URLS" && lane.count > 0), "Free benefit collection lanes missing sample/trial lane");
  assert(data.report.lanes.every((lane) => Array.isArray(lane.recommendedEnvKeys) && lane.recommendedEnvKeys.includes(lane.envKey)), "Free benefit collection lanes should expose recommended env keys for every lane");
  assert(data.report.lanes.some((lane) => lane.id === "deliveryFood" && lane.envKey === "CAFE_FRANCHISE_COUPON_FEED_URLS" && lane.recommendedEnvKeys.includes("BENEFIT_REFRESH_FEED_URLS")), "Delivery/food lane should use the live cafe/franchise env guidance");
  assert(data.report.lanes.some((lane) => lane.id === "shippingZero" && lane.envKey === "BENEFIT_REFRESH_FEED_URLS"), "Free shipping lane should use shared benefit refresh feed guidance");
});

await check("admin free benefit collection lanes csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/free-benefit-collection-lanes?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected free benefit collection lanes CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin free benefit collection lanes CSV should use text/csv content type");
  assert(text.includes("officialEvents") && text.includes("OFFICIAL_EVENT_FEED_URLS") && text.includes("samplesTrials"), "Admin free benefit collection lanes CSV missing lane ids or env keys");
  assert(text.includes("recommendedEnvKeys") && text.includes("CAFE_FRANCHISE_COUPON_FEED_URLS") && text.includes("BENEFIT_REFRESH_FEED_URLS"), "Admin free benefit collection lanes CSV missing recommended env key guidance");
});

await check("admin free benefit category coverage api", async () => {
  const { response, data } = await fetchJson("/api/admin/free-benefit-category-coverage");
  assert(response.status === 200, `Expected free benefit category coverage 200, got ${response.status}`);
  assert(data.ok === true, "Admin free benefit category coverage API ok should be true");
  assert(data.report?.ok === true, "Admin free benefit category coverage report should pass");
  assert(data.report?.visibleActiveBenefits >= 150, "Admin free benefit category coverage should preserve visible active benefit count");
  assert(data.report?.officialHostCount >= 70, "Admin free benefit category coverage should preserve official host diversity");
  assert(data.report?.noPurchaseVisibleBenefits >= 120, "Admin free benefit category coverage should preserve no-purchase benefit count");
  assert(Array.isArray(data.report?.categoryCoverage) && data.report.categoryCoverage.length >= 10, "Admin free benefit category coverage should expose required category rows");
  assert(data.report.categoryCoverage.every((row) => row.ok === true && row.count >= row.minimum && row.href?.startsWith("/free-benefits?eventType=")), "Admin free benefit category coverage should pass every required category and expose filter hrefs");
  assert(Array.isArray(data.report?.categoryCandidateGroups) && data.report.categoryCandidateGroups.length >= 10, "Admin free benefit category coverage should expose per-category candidate groups");
  assert(
    data.report.categoryCandidateGroups.every(
      (group) =>
        group.ok === true &&
        group.count >= group.minimum &&
        group.href?.startsWith("/free-benefits?eventType=") &&
        Array.isArray(group.candidates) &&
        group.candidates.length >= 1 &&
        group.candidates.every((item) => item.finalUrl?.startsWith("https://") && item.title && item.sourceName)
    ),
    "Admin free benefit category candidate groups should include official HTTPS display candidates"
  );
});

await check("admin free benefit category coverage csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/free-benefit-category-coverage?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected free benefit category coverage CSV 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Admin free benefit category coverage CSV should use text/csv content type");
  assert(text.includes("visibleActiveBenefits") && text.includes("category") && text.includes("category_candidate") && text.includes("top_candidate"), "Admin free benefit category coverage CSV missing summary, category, or candidate rows");
  assert(text.includes("전원증정") && text.includes("선착순") && text.includes("무료 샘플") && text.includes("npm run benefit:category:doctor"), "Admin free benefit category coverage CSV missing required category labels or regeneration command");
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
  assert(data.report?.officialBenefits?.visibleCount >= MIN_OFFICIAL_BENEFITS, "Admin health readiness should preserve official benefit count");
  assert(data.report?.officialBenefits?.readyCategories >= 10, "Admin health readiness should preserve official benefit category coverage");
  assert(Array.isArray(data.report?.officialBenefits?.activeProviders) && data.report.officialBenefits.activeProviders.length >= 4, "Admin health readiness should expose active official benefit providers");
  assert(Array.isArray(data.report?.officialBenefits?.providerStats) && data.report.officialBenefits.providerStats.length >= 4, "Admin health readiness should expose official benefit provider stats");
  assert(data.report.officialBenefits.providerStats.every((provider) => provider.provider && typeof provider.visibleCount === "number" && typeof provider.configuredEmptyFeed === "boolean"), "Admin health readiness provider stats missing operation fields");
  assert(typeof data.report?.officialBenefits?.sourceMix?.configuredEmptyFeedCount === "number", "Admin health readiness should expose configured empty feed count");
  assert(Array.isArray(data.report?.officialBenefits?.sourceMix?.configuredEmptyFeedProviders), "Admin health readiness should expose configured empty feed providers");
  assert(Array.isArray(data.report?.officialBenefits?.providerRisks) && data.report.officialBenefits.providerRisks.length >= 4, "Admin health readiness should expose official benefit provider risks");
  assert(data.report.officialBenefits.providerRisks.every((risk) => risk.provider && risk.label && ["healthy", "watch", "danger"].includes(risk.severity)), "Admin health readiness provider risks missing launch fields");
  assert(data.report?.officialBenefits?.providerRiskSummary?.danger === 0, "Admin health readiness should show zero danger official benefit providers");
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing"].includes(data.report?.officialBenefits?.feedCanary?.status), "Admin health readiness should expose official feed canary status");
  assert(["fresh", "due", "stale", "missing"].includes(data.report?.officialBenefits?.feedCanary?.freshnessStatus), "Admin health readiness should expose official feed canary freshness status");
  assert(typeof data.report?.officialBenefits?.feedCanary?.staleHours === "number", "Admin health readiness should expose official feed canary stale threshold");
  assert(typeof data.report?.officialBenefits?.feedCanary?.configuredFeedUrls === "number", "Admin health readiness should expose official feed canary URL count");
  assert(data.report?.sourceReadiness?.ok === true, "Admin health readiness should expose passing source readiness");
  assert(data.report?.sourceReadiness?.launchGateStatus === "passed", "Admin health readiness source launch gate should pass");
  assert(data.report?.sourceReadiness?.officialSourceCandidates >= 30, "Admin health readiness should expose official source candidates");
  assert(data.report?.sourceReadiness?.visibleOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Admin health readiness should expose source readiness official benefits");
  assert(data.report?.sourceReadiness?.blockedLiveIssues === 0, "Admin health readiness should expose zero source blocked live issues");
  assert(data.report?.sourceReadiness?.feedEnvFailedCount === 0, "Admin health readiness should expose zero source feed env failures");
  assert(data.report?.sourceReadiness?.failedGateCount === 0, "Admin health readiness source gates should all pass");
  assert(data.report?.refreshAll?.ok === true, "Admin health readiness should show refresh:all success");
  assert(["healthy", "manual_refresh_ready", "stale", "failed"].includes(data.report?.cronRefresh?.status), "Admin health readiness should expose cron refresh status");
  assert(data.report?.cronRefresh?.protected === true, "Admin health readiness should expose protected cron refresh evidence");
  assert(data.report?.cronRefresh?.schedule === "0 18 * * *", "Admin health readiness should expose daily Hobby-compatible cron refresh schedule");
  assert(data.report?.cronRefresh?.productDealsCount >= 140, "Admin health readiness should expose cron product count");
  assert(data.report?.cronRefresh?.newsDealsCount >= MIN_OFFICIAL_BENEFITS, "Admin health readiness should expose cron news count");
  assert(Array.isArray(data.report?.checks) && data.report.checks.every((check) => check.ok), "Admin health readiness checks should all pass");
  assert(data.report.checks.some((check) => check.name === "official source readiness gate"), "Admin health readiness checks missing official source readiness gate");
});

await check("cron refresh api guard", async () => {
  const denied = await fetchJson("/api/cron/refresh?dryRun=true");
  assert(denied.response.status === 401, `Expected cron refresh without token to be 401, got ${denied.response.status}`);

  const { response, data } = await fetchJson("/api/cron/refresh?dryRun=true&token=local-admin");
  assert(response.status === 200, `Expected cron refresh dry-run 200, got ${response.status}`);
  assert(data.ok === true, "Cron refresh dry-run should be ok");
  assert(data.mode === "dry_run", "Cron refresh dry-run should not execute refresh scripts");
  assert(data.command === "node scripts/refresh-all.mjs", "Cron refresh dry-run missing refresh command");
  assert(data.refreshAll?.productDealsCount >= 140, "Cron refresh dry-run missing latest refresh-all product count");
  assert(data.refreshAll?.newsDealsCount >= MIN_OFFICIAL_BENEFITS, "Cron refresh dry-run missing latest refresh-all news count");

  const liveFeed = await fetchJson("/api/cron/refresh?dryRun=true&mode=liveFeed&token=local-admin");
  assert(liveFeed.response.status === 200, `Expected cron liveFeed dry-run 200, got ${liveFeed.response.status}`);
  assert(liveFeed.data.ok === true, "Cron liveFeed dry-run should be ok");
  assert(liveFeed.data.mode === "dry_run", "Cron liveFeed dry-run should not execute refresh scripts");
  assert(liveFeed.data.pipelineMode === "liveFeed", "Cron liveFeed dry-run missing pipeline mode");
  assert(liveFeed.data.command === "node scripts/news-feed-live-pipeline.mjs", "Cron liveFeed dry-run missing live pipeline command");
  assert(["seed_launch_ready", "live_feed_ready"].includes(liveFeed.data.livePipeline?.status), "Cron liveFeed dry-run missing live pipeline status");
  assert(liveFeed.data.livePipeline?.officialBenefits?.visibleCount >= MIN_OFFICIAL_BENEFITS, "Cron liveFeed dry-run missing official benefits count");

  const benefitsDenied = await fetchJson("/api/cron/benefits?dryRun=true");
  assert(benefitsDenied.response.status === 401, `Expected cron benefits without token to be 401, got ${benefitsDenied.response.status}`);

  const benefits = await fetchJson("/api/cron/benefits?dryRun=true&token=local-admin");
  assert(benefits.response.status === 200, `Expected cron benefits dry-run 200, got ${benefits.response.status}`);
  assert(benefits.data.ok === true, "Cron benefits dry-run should be ok");
  assert(benefits.data.mode === "dry_run", "Cron benefits dry-run should not execute refresh scripts");
  assert(benefits.data.pipelineMode === "benefits", "Cron benefits dry-run missing pipeline mode");
  assert(benefits.data.command === "node scripts/refresh-benefits.mjs", "Cron benefits dry-run missing benefits refresh command");
  assert(benefits.data.freeBenefitEvents?.visibleActiveEvents >= 100, "Cron benefits dry-run missing active free benefit event count");

  if (smokeAdminToken) {
    const headerAuth = await fetchJson("/api/cron/refresh?dryRun=true", {
      headers: {
        "x-admin-token": smokeAdminToken
      }
    });
    assert(headerAuth.response.status === 200, `Expected cron refresh header auth 200, got ${headerAuth.response.status}`);
    assert(headerAuth.data.ok === true, "Cron refresh header auth should be ok");
    assert(headerAuth.data.mode === "dry_run", "Cron refresh header auth should stay in dry-run mode");
  }
});

await check("admin exposure policy api", async () => {
  const { response, data } = await fetchJson("/api/admin/exposure-policy");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin exposure policy API ok should be true");
  assert(data.report?.summary?.auditedItems >= 140, "Exposure policy report should audit all deals");
  assert(Array.isArray(data.report?.auditedItems) && data.report.auditedItems.length >= 140, "Exposure policy report should include product-level audited rows");
  assert(
    data.report.auditedItems.filter((item) => !item.isHidden).every((item) => item.finalUrl && item.validationStatus === "passed"),
    "Exposure policy visible rows should only expose passed final URLs"
  );
  assert(data.report?.summary?.hiddenItems >= 0, "Exposure policy report should expose the hidden review queue count");
  if (data.report.summary.hiddenItems > 0) {
    assert(data.report.auditedItems.some((item) => item.isHidden), "Exposure policy report should retain hidden review rows when the queue is non-empty");
  } else {
    assert(data.report.auditedItems.every((item) => !item.isHidden), "Exposure policy report should prove a clean hidden review queue when hiddenItems is zero");
  }
  assert(data.report?.summary?.badExposedItems === 0, "Exposure policy report should have zero bad exposed items");
  assert(data.report?.summary?.searchLinksExposed === 0, "Exposure policy report should have zero search links exposed");
  assert(data.report?.summary?.soldOutExposed === 0, "Exposure policy report should have zero sold-out links exposed");
  assert(data.report?.syntheticExposureScenarios?.ok === true, "Exposure policy synthetic scenarios should pass");
  assert(data.report?.syntheticExposureScenarios?.blockedNegativeSamples >= 8, "Exposure policy synthetic scenarios should block bad public samples");
  assert(
    data.report?.syntheticExposureScenarios?.results?.some((item) => item.id === "synthetic-search-url" && item.issues.includes("search_or_category_url")),
    "Exposure policy synthetic scenarios should block search URLs"
  );
  assert(
    data.report?.syntheticExposureScenarios?.results?.some((item) => item.id === "synthetic-unsafe-url" && item.issues.includes("unsafe_protocol_or_invalid_url")),
    "Exposure policy synthetic scenarios should block unsafe URLs"
  );
  assert(data.report?.liveProbe && typeof data.report.liveProbe.enabled === "boolean", "Exposure policy report should expose live probe summary");
  assert(data.report?.liveProbeReviewSummary?.exposedHardFailureCount === 0, "Exposure policy report should expose zero customer-visible hard live probe failures");
  assert(typeof data.report.liveProbeReviewSummary.accessProtectedCount === "number", "Exposure policy report should expose access protected live probe count");
  assert(typeof data.report.liveProbe.timeoutMs === "number", "Exposure policy live probe summary should include timeout");
  assert(data.report?.liveProbeFailureReasonCounts && typeof data.report.liveProbeFailureReasonCounts === "object", "Exposure policy report should expose live probe failure reason counts");
  assert(data.report?.liveProbeHostFailureCounts && typeof data.report.liveProbeHostFailureCounts === "object", "Exposure policy report should expose live probe host failure counts");
});

await check("admin exposure policy csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/exposure-policy?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Exposure policy export is not CSV");
  assert(response.headers.get("x-request-id"), "Exposure policy export missing request id");
  assert(text.startsWith("section,key,label"), "Exposure policy CSV header missing");
  assert(text.includes("bad_exposed_items") && text.includes("search_links_exposed") && text.includes("sold_out_exposed"), "Exposure policy CSV missing risk summary rows");
  assert(text.includes("bad_exposed_item,none") && text.includes("hidden_item,"), "Exposure policy CSV should prove zero bad exposed items and list hidden review rows");
  assert(text.includes("audited_item,d001") && text.includes("source,originalUrl") && text.includes("priorityScore"), "Exposure policy CSV missing product-level audit rows");
  assert(text.includes("live_probe,enabled") && text.includes("liveProbeTimeoutMs"), "Exposure policy CSV missing live probe operation rows");
  assert(text.includes("exposed_hard_failure_count") && text.includes("hard_failure_count") && text.includes("access_protected_count"), "Exposure policy CSV missing live probe review summary rows");
  assert(text.includes("live_probe_reason"), "Exposure policy CSV missing live probe failure reason rows");
  assert(text.includes("live_probe_host"), "Exposure policy CSV missing live probe failed host rows");
});

await check("admin link launch gate api", async () => {
  const { response, data } = await fetchJson("/api/admin/link-launch-gate");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin link launch gate API ok should be true");
  assert(data.report?.ok === true, "Link launch gate report should pass");
  assert(data.report?.actual?.auditedItems >= 140, "Link launch gate should audit all products");
  assert(data.report?.actual?.exposedItems >= 120, "Link launch gate should expose the verified publishable product set");
  assert(data.report?.actual?.hiddenItems >= 0, "Link launch gate should expose the hidden product review count");
  assert(data.report?.actual?.verifiedPurchaseLinks >= data.report.actual.exposedItems, "Link launch gate should prove verified links cover exposed items");
  assert(data.report?.actual?.exposedSearchLinks === 0, "Link launch gate should expose zero search links");
  assert(data.report?.actual?.exposedSoldOutLinks === 0, "Link launch gate should expose zero sold-out links");
  assert(data.report?.actual?.exposedBrokenLinks === 0, "Link launch gate should expose zero broken links");
  assert(data.report?.actual?.exposedInvalidUrls === 0, "Link launch gate should expose zero invalid URLs");
  assert(data.report?.actual?.failedExposureItems === 0, "Link launch gate should have zero failed exposure items");
  assert(data.report?.actual?.liveHardFailures === 0, "Link launch gate should have zero customer-visible hard live probe failures");
  assert(data.report?.actual?.sellerUnavailableSignals === 0, "Link launch gate should have zero seller unavailable signals");
  assert(data.report?.actual?.manualEvidenceMaxAgeDays === 7, "Link launch gate should enforce 7-day manual evidence freshness");
  assert(data.report?.actual?.manualEvidenceReviewedItems === data.report?.actual?.freshManualEvidence, "Link launch gate should have fresh evidence for every live review queue item");
  assert(data.report?.actual?.staleManualEvidence === 0, "Link launch gate should have zero stale manual evidence items");
  assert(data.report?.actual?.missingManualEvidence === 0, "Link launch gate should have zero missing manual evidence items");
  assert(data.report?.manualEvidenceSummary?.freshManualEvidenceCount === data.report?.actual?.freshManualEvidence, "Link launch gate should include the live probe manual evidence summary");
  assert(Array.isArray(data.report?.issues) && data.report.issues.length === 0, "Link launch gate should have no blocking issues");
});

await check("admin link launch gate csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/link-launch-gate?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Link launch gate export is not CSV");
  assert(response.headers.get("x-request-id"), "Link launch gate export missing request id");
  assert(text.startsWith("section,key,label"), "Link launch gate CSV header missing");
  assert(text.includes("summary,exposed_search_links") && text.includes("summary,exposed_sold_out_links"), "Link launch gate CSV missing zero-exposure summary rows");
  assert(text.includes("summary,exposed_invalid_urls") && text.includes("summary,failed_exposure_items"), "Link launch gate CSV missing invalid URL or failed exposure rows");
  assert(text.includes("summary,fresh_manual_evidence") && text.includes("summary,stale_manual_evidence") && text.includes("summary,missing_manual_evidence"), "Link launch gate CSV missing manual evidence freshness rows");
  assert(text.includes("policy,exposure_policy") && text.includes("failed_exposure_item,none"), "Link launch gate CSV missing policy or clean failed item evidence");
});

await check("admin link revalidation priority api", async () => {
  const { response, data } = await fetchJson("/api/admin/link-revalidation-priority");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin link revalidation priority API ok should be true");
  assert(data.report?.ok === true, "Link revalidation priority report should pass");
  assert(data.report?.summary?.auditedItems >= 140, "Link revalidation priority should audit all products");
  assert(data.report?.summary?.publishableItems >= 120, "Link revalidation priority should preserve a healthy publishable product set after quarantine");
  assert(data.report?.summary?.blockingRevalidationItems === 0, "Link revalidation priority should have zero blocking items");
  assert(typeof data.report?.summary?.userReportedItems === "number", "Link revalidation priority should expose user-reported revalidation items");
  assert(data.report?.summary?.exposedSearchLinks === 0, "Link revalidation priority should expose zero search links");
  assert(data.report?.summary?.exposedSoldOutLinks === 0, "Link revalidation priority should expose zero sold-out links");
  assert(data.report?.summary?.exposedBrokenLinks === 0, "Link revalidation priority should expose zero broken links");
  assert(data.report?.summary?.queueItems >= data.report.summary.reviewItems, "Link revalidation priority should expose an operator queue");
  assert(Array.isArray(data.report?.topQueue), "Link revalidation priority should include top queue rows");
  assert(data.report?.counts?.byReason && typeof data.report.counts.byReason === "object", "Link revalidation priority should include reason counts");
});

await check("admin link revalidation priority csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/link-revalidation-priority?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Link revalidation priority export is not CSV");
  assert(response.headers.get("x-request-id"), "Link revalidation priority export missing request id");
  assert(text.startsWith("section,key,label"), "Link revalidation priority CSV header missing");
  assert(text.includes("summary,blocking_revalidation_items") && text.includes("summary,review_items"), "Link revalidation priority CSV missing summary rows");
  assert(text.includes("revalidation_queue,") && text.includes("reason_count,"), "Link revalidation priority CSV missing queue or reason rows");
});

await check("admin live probe review api", async () => {
  const { response, data } = await fetchJson("/api/admin/live-probe-review");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin live probe review API ok should be true");
  assert(data.report?.ok === true, "Live probe review report should pass");
  assert(data.report?.summary?.totalDeals >= 140, "Live probe review should audit all products");
  assert(data.report?.summary?.publishableDeals >= 120, "Live probe review should preserve a healthy publishable product set after quarantine");
  assert(data.report?.summary?.liveChecked >= data.report.summary.totalDeals, "Live probe review should live-check every audited product");
  assert(data.report?.summary?.hardFailureCount === 0, "Live probe review should have zero hard failures");
  assert(data.report?.summary?.exposedHardFailureCount === 0, "Live probe review should have zero customer-visible hard failures");
  assert(data.report?.summary?.unavailableTextCount === 0, "Live probe review should have zero unavailable/sold-out text signals");
  assert(data.report?.summary?.exposedSearchLinks === 0, "Live probe review should expose zero search links");
  assert(data.report?.summary?.exposedSoldOutLinks === 0, "Live probe review should expose zero sold-out links");
  assert(data.report?.summary?.exposedBrokenLinks === 0, "Live probe review should expose zero broken links");
  assert(data.report?.summary?.exposedInvalidUrls === 0, "Live probe review should expose zero invalid URLs");
  assert(data.report?.summary?.exposedNonPublishableItems === 0, "Live probe review should expose zero quarantined or non-publishable items");
  assert(Array.isArray(data.report?.reviewQueue), "Live probe review should include an operator review queue");
  assert(Array.isArray(data.report?.topHostActions), "Live probe review should include host-level review actions");
  assert(data.report?.reasonCounts && typeof data.report.reasonCounts === "object", "Live probe review should include reason counts");
  assert(data.report?.retryModeCounts && typeof data.report.retryModeCounts === "object", "Live probe review should include retry mode counts");
  assert(data.report?.manualEvidenceSummary?.maxAgeDays === 7, "Live probe review should enforce a 7-day manual evidence freshness window");
  const manualEvidenceRequiredCount = data.report?.summary?.manualEvidenceRequiredCount ?? data.report?.manualEvidenceSummary?.reviewedQueueItems;
  assert(
    data.report?.manualEvidenceSummary?.reviewedQueueItems === manualEvidenceRequiredCount,
    "Live probe review should require manual evidence for every protected/rate-limited/retry queue item"
  );
  assert(data.report?.manualEvidenceSummary?.staleManualEvidenceCount === 0, "Live probe review should have zero stale manual evidence items");
  assert(data.report?.manualEvidenceSummary?.missingManualEvidenceCount === 0, "Live probe review should have zero missing manual evidence items");
  const evidenceRequiredQueue = data.report?.reviewQueue.filter((item) => item.retryMode !== "remove_or_replace") ?? [];
  assert(
    evidenceRequiredQueue.every((item) => item.manualEvidenceFresh === true && item.manualEvidenceStatus === "fresh"),
    "Live probe review evidence-required queue should expose only fresh manual evidence"
  );
  const quarantinedQueue = data.report?.reviewQueue.filter((item) => item.retryMode === "remove_or_replace" || item.severity === "quarantine") ?? [];
  assert(
    quarantinedQueue.every((item) => item.publishable === false || item.isHidden === true),
    "Live probe review quarantined hard failures should stay hidden from public surfaces"
  );
});

await check("admin live probe review csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/live-probe-review?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Live probe review export is not CSV");
  assert(response.headers.get("x-request-id"), "Live probe review export missing request id");
  assert(text.startsWith("section,key,label"), "Live probe review CSV header missing");
  assert(text.includes("summary,hard_failures") && text.includes("summary,exposed_hard_failures"), "Live probe review CSV missing hard failure summary rows");
  assert(text.includes("summary,protected_or_rate_limited") && text.includes("summary,transient_network"), "Live probe review CSV missing protected/rate-limit or retry summary rows");
  assert(
    text.includes("summary,fresh_manual_evidence") && text.includes("summary,stale_manual_evidence") && text.includes("summary,missing_manual_evidence"),
    "Live probe review CSV missing manual evidence freshness summary rows"
  );
  assert(text.includes("manualEvidenceStatus") && text.includes("manualEvidenceAgeDays"), "Live probe review CSV missing manual evidence queue columns");
  assert(text.includes("host_action,") && text.includes("live_probe_queue,"), "Live probe review CSV missing host actions or queue rows");
  assert(text.includes("official API") || text.includes("partner feed") || text.includes("manual device check") || text.includes("backoff retry"), "Live probe review CSV missing operator retry guidance");
});

await check("admin news revalidation priority api", async () => {
  const { response, data } = await fetchJson("/api/admin/news-revalidation-priority");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin news revalidation priority API ok should be true");
  assert(data.report?.ok === true, "Official benefit revalidation priority report should pass");
  assert(data.report?.summary?.visibleItems >= MIN_OFFICIAL_BENEFITS, "Official benefit revalidation priority should include visible official benefits");
  assert(data.report?.summary?.activeOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Official benefit revalidation priority should include active official benefits");
  assert(data.report?.summary?.blockingItems === 0, "Official benefit revalidation priority should have zero blocking items");
  assert(data.report?.summary?.exposedSearchLinks === 0, "Official benefit revalidation priority should expose zero search links");
  assert(data.report?.summary?.exposedNonOfficialLinks === 0, "Official benefit revalidation priority should expose zero non-official links");
  assert(data.report?.summary?.hiddenItems === 0, "Official benefit revalidation priority should expose zero hidden benefits");
  assert(data.report?.summary?.expiredItems === 0, "Official benefit revalidation priority should expose zero expired benefits");
  assert(data.report?.summary?.queueItems >= data.report.summary.renewalItems, "Official benefit revalidation priority should expose an operator queue");
  assert(Array.isArray(data.report?.topQueue), "Official benefit revalidation priority should include top queue rows");
  assert(data.report?.counts?.byReason && typeof data.report.counts.byReason === "object", "Official benefit revalidation priority should include reason counts");
});

await check("admin news revalidation priority csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/news-revalidation-priority?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Official benefit revalidation priority export is not CSV");
  assert(response.headers.get("x-request-id"), "Official benefit revalidation priority export missing request id");
  assert(text.startsWith("section,key,label"), "Official benefit revalidation priority CSV header missing");
  assert(text.includes("summary,blocking_items") && text.includes("summary,renewal_items"), "Official benefit revalidation priority CSV missing summary rows");
  assert(text.includes("official_benefit_revalidation_queue,") && text.includes("reason_count,"), "Official benefit revalidation priority CSV missing queue or reason rows");
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

await check("admin official benefit alerts api", async () => {
  const { response, data } = await fetchJson("/api/admin/official-alerts");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin official benefit alerts API ok should be true");
  assert(data.report?.totals?.activeOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Official benefit alert admin report should expose active official benefits");
  assert(data.report?.defaultQueue?.recommendedBenefits >= 6, "Official benefit alert admin report should expose recommendations");
  assert(data.report?.redirectSafety?.ok === true, "Official benefit alert admin report should prove redirect safety");
  assert(Array.isArray(data.report?.interestCoverage) && data.report.interestCoverage.length >= 4, "Official benefit alert admin report should expose interest coverage");

  const csvResponse = await fetch(`${baseUrl}/api/admin/official-alerts?format=csv`);
  const csv = await csvResponse.text();
  assert(csvResponse.status === 200, `Expected 200, got ${csvResponse.status}`);
  assert(csvResponse.headers.get("content-type")?.includes("text/csv"), "Official benefit alerts export is not CSV");
  assert(csv.includes("summary") && csv.includes("redirectSafety") && csv.includes("/go/news/"), "Official benefit alerts CSV missing summary or redirect safety rows");
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
  assert(data.deals.length >= 120, `Expected at least 120 publishable deals, got ${data.deals.length}`);
  const verifiedDirectLinks = data.deals.filter((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search");
  const verifiedDirectRate = Math.round((verifiedDirectLinks.length / data.deals.length) * 100);
  assert(
    verifiedDirectLinks.length === data.deals.length && verifiedDirectRate >= 100,
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
    assert(deal.validationCode === "valid", `${deal.id} exposed a non-valid validation code: ${deal.validationCode}`);
    assert(deal.isHidden === false, `${deal.id} exposed a hidden deal`);
    assert(deal.publishable === true, `${deal.id} exposed a non-publishable deal`);
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
  assert(
    text.includes("공식 무료·쿠폰 혜택") &&
      text.includes("공식 페이지로 바로 이동되는 혜택만 모았습니다") &&
      text.includes("/go/news/") &&
      text.includes("검색 결과나 커뮤니티 글이 아니라 검증된 공식 이벤트"),
    "Free benefits page missing official verified benefit rail"
  );
  assert(text.includes("무료혜택 새로고침") && text.includes("최신 검증"), "Free benefits page missing live refresh controls");
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
  assert(data.deals.length >= 120, `Expected at least 120 verified publishable seller/product deals, got ${data.deals.length}`);
  assert(
    data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkVerified && deal.purchaseLinkVerified && deal.finalPurchaseUrl),
    "Verified-only API returned a deal without a reviewed direct product URL"
  );
});

await check("deal detail api", async () => {
  const verifiedList = await fetchJson("/api/deals?verifiedOnly=true&limit=1&sort=hot");
  const dealId = verifiedList.data.deals?.[0]?.id;
  assert(verifiedList.response.status === 200, `Expected verified deal list 200, got ${verifiedList.response.status}`);
  assert(dealId, "Verified deal list did not provide a public detail sample");

  const { response, data } = await fetchJson(`/api/deals/${encodeURIComponent(dealId)}`);
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.deal?.id === dealId, `Detail API did not return ${dealId}`);
  assert(data.deal?.finalPurchaseUrl, "Detail API public sample missing direct purchase URL");
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
  assert(data.checks?.officialBenefitVisibleCount >= MIN_OFFICIAL_BENEFITS, "Health API missing official benefit visible count");
  assert(data.checks?.officialBenefitReadyCategories >= 10, "Health API missing official benefit category coverage");
  assert(data.checks?.officialBenefitWeakCategories === 0, "Health API found weak official benefit categories");
  assert(data.checks?.officialBenefitRefreshAllOk === true, "Health API missing refresh:all official benefit status");
  assert(data.checks?.officialBenefitProviderRiskOk === true, "Health API official benefit provider risk should be launch-safe");
  assert(typeof data.checks?.officialBenefitProviderWatchCount === "number", "Health API missing official benefit provider watch count");
  assert(data.checks?.officialBenefitProviderDangerCount === 0, "Health API found danger official benefit providers");
  assert(["seed_launch_ready", "hybrid_feed_ready", "production_feed_ready"].includes(data.checks?.officialBenefitFeedTransitionStatus), "Health API missing official benefit feed transition status");
  assert(typeof data.checks?.officialBenefitFeedReadinessRate === "number", "Health API missing official benefit feed readiness rate");
  assert(typeof data.checks?.officialBenefitFeedConfiguredProviders === "number", "Health API missing configured official feed provider count");
  assert(typeof data.checks?.officialBenefitFeedSeedOnlyProviders === "number", "Health API missing seed-only official feed provider count");
  assert(typeof data.checks?.officialBenefitFeedSeedCount === "number", "Health API missing official feed seed source count");
  assert(typeof data.checks?.officialBenefitFeedExternalItemCount === "number", "Health API missing official external feed item count");
  assert(typeof data.checks?.officialBenefitFeedSuccessCount === "number", "Health API missing official feed success count");
  assert(typeof data.checks?.officialBenefitFeedCollectedCount === "number", "Health API missing official collected source count");
  assert(typeof data.checks?.officialBenefitFeedExternalItemRate === "number", "Health API missing official external feed item rate");
  assert(typeof data.checks?.officialBenefitFeedConfiguredEmptyCount === "number", "Health API missing configured empty feed count");
  assert(Array.isArray(data.checks?.officialBenefitFeedConfiguredEmptyProviders), "Health API missing configured empty feed providers");
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing"].includes(data.checks?.officialBenefitFeedCanaryStatus), "Health API missing official feed canary status");
  assert(["fresh", "due", "stale", "missing"].includes(data.checks?.officialBenefitFeedCanaryFreshnessStatus), "Health API missing official feed canary freshness status");
  assert(typeof data.checks?.officialBenefitFeedCanaryStaleHours === "number", "Health API missing official feed canary stale threshold");
  assert(typeof data.checks?.officialBenefitFeedCanaryConfiguredUrls === "number", "Health API missing official feed canary configured URL count");
  assert(typeof data.checks?.officialBenefitFeedCanaryVisibleCount === "number", "Health API missing official feed canary visible candidate count");
  assert(Array.isArray(data.checks?.officialBenefitFeedRecommendedEnvKeys), "Health API missing recommended official feed env keys");
  assert(data.checks.officialBenefitFeedRecommendedEnvKeys.includes("CONVENIENCE_BENEFIT_FEED_URLS"), "Health API missing convenience benefit feed env guidance");
  assert(data.checks.officialBenefitFeedRecommendedEnvKeys.includes("BEAUTY_SAMPLE_FEED_URLS"), "Health API missing beauty sample feed env guidance");
  assert(data.checks.officialBenefitFeedRecommendedEnvKeys.includes("CAFE_FRANCHISE_COUPON_FEED_URLS"), "Health API missing cafe franchise coupon feed env guidance");
  assert(data.checks?.freeBenefitCollectionLaneOk === true, "Health API missing healthy free benefit collection lane readiness");
  assert(data.checks?.freeBenefitCollectionLaneCount >= 8, "Health API missing free benefit collection lane count");
  assert(data.checks?.freeBenefitCollectionLaneHealthyCount >= 6, "Health API should show most free benefit collection lanes are healthy");
  assert(data.checks?.freeBenefitCollectionLaneEmptyCount === 0, "Health API should show zero empty free benefit collection lanes");
  assert(Array.isArray(data.checks?.freeBenefitCollectionLaneStatuses), "Health API missing free benefit collection lane statuses");
  assert(data.checks.freeBenefitCollectionLaneStatuses.some((lane) => lane.id === "officialEvents" && lane.envKey === "OFFICIAL_EVENT_FEED_URLS" && lane.count > 0), "Health API missing official event collection lane status");
  assert(data.checks.freeBenefitCollectionLaneStatuses.some((lane) => lane.id === "couponsMembership" && lane.envKey === "PUBLIC_COUPON_FEED_URLS" && lane.count > 0), "Health API missing coupon membership collection lane status");
  assert(data.checks.freeBenefitCollectionLaneStatuses.every((lane) => Array.isArray(lane.recommendedEnvKeys) && lane.recommendedEnvKeys.includes(lane.envKey)), "Health API collection lanes missing recommended env key guidance");
  assert(data.checks.freeBenefitCollectionLaneStatuses.some((lane) => lane.id === "deliveryFood" && lane.recommendedEnvKeys.includes("CAFE_FRANCHISE_COUPON_FEED_URLS")), "Health API missing cafe/franchise collection lane env guidance");
  assert(data.checks.freeBenefitCollectionLaneStatuses.some((lane) => lane.id === "shippingZero" && lane.recommendedEnvKeys.includes("BENEFIT_REFRESH_FEED_URLS")), "Health API missing free-shipping collection lane env guidance");
  assert(data.checks.freeBenefitCollectionLaneStatuses.every((lane) => ["healthy", "thin"].includes(lane.status) && typeof lane.action === "string"), "Health API collection lanes should be launch-actionable and non-empty");
  assert(data.checks?.officialSourceReadinessOk === true, "Health API missing passing official source readiness");
  assert(data.checks?.officialSourceFeedActivationOk === true, "Health API missing passing source feed activation readiness");
  assert(["seed_ready", "live_feed_ready"].includes(data.checks?.officialSourceFeedActivationStatus), "Health API missing safe source feed activation status");
  assert(typeof data.checks?.officialSourceFeedActivationConfiguredUrls === "number", "Health API missing source feed activation configured URL count");
  assert(typeof data.checks?.officialSourceFeedActivationConfiguredProviders === "number", "Health API missing source feed activation configured provider count");
  assert(typeof data.checks?.officialSourceFeedActivationVisibleCandidates === "number", "Health API missing source feed activation visible candidate count");
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing", "unknown"].includes(data.checks?.officialSourceFeedActivationCanaryStatus), "Health API missing source feed activation canary status");
  assert(data.checks?.officialSourceFeedActivationPassedChecks === data.checks?.officialSourceFeedActivationTotalChecks, "Health API source feed activation checks should all pass");
  assert(Array.isArray(data.checks?.officialSourceFeedActivationNextActions), "Health API missing source feed activation next actions");
  assert(data.checks?.officialSourceLaunchGateStatus === "passed", "Health API missing source readiness launch gate");
  assert(data.checks?.officialSourceCandidates >= 30, "Health API missing official source candidate count");
  assert(data.checks?.officialSourceVisibleOfficialBenefits >= MIN_OFFICIAL_BENEFITS, "Health API missing source readiness visible official benefit count");
  assert(data.checks?.officialSourceConsumerSourceRate >= 60, "Health API source readiness should preserve consumer-first source mix");
  assert(data.checks?.officialSourcePublicPolicySourceRate <= 35, "Health API source readiness should keep public/policy sources out of the default mix");
  assert(data.checks?.officialSourceConfiguredFeedUrls >= 0, "Health API missing official source configured feed count");
  assert(data.checks?.officialSourceFeedEnvConfiguredUrlCount >= 0, "Health API missing source feed env configured URL count");
  assert(data.checks?.officialSourceFeedEnvConfiguredKeyCount >= 0, "Health API missing source feed env configured key count");
  assert(data.checks?.officialSourceFeedEnvRecommendedLaneCount >= 8, "Health API missing recommended official feed activation lanes");
  assert(["seed_fallback_only", "feed_configured"].includes(data.checks?.officialSourceFeedEnvActivationStatus), "Health API missing source feed env activation status");
  assert(data.checks?.officialSourceFeedEnvFailedCount === 0, "Health API found source feed env failures");
  assert(data.checks?.officialSourceBlockedLiveIssues === 0, "Health API found source blocked live issues");
  assert(data.checks?.officialSourceFailedGateCount === 0, "Health API found source readiness failed gates");
  assert(["healthy", "manual_refresh_ready", "stale", "failed"].includes(data.checks?.cronRefreshStatus), "Health API missing cron refresh status");
  assert(data.checks?.cronRefreshProtected === true, "Health API missing protected cron refresh evidence");
  assert(data.checks?.cronRefreshSchedule === "0 18 * * *", "Health API missing daily Hobby-compatible cron refresh schedule");
  assert(data.checks?.cronRefreshReportPath === "reports/cron-refresh.json", "Health API missing cron refresh report path");
  assert(data.checks?.cronRefreshLiveCommand === "node scripts/news-feed-live-pipeline.mjs", "Health API missing cron live feed command");
  assert(data.checks?.cronRefreshLivePipelineReportPath === "reports/news-feed-live-pipeline.json", "Health API missing cron live feed report path");
  assert(["seed_launch_ready", "live_feed_ready", "unknown"].includes(data.checks?.cronRefreshLivePipelineStatus), "Health API missing cron live feed pipeline status");
  assert(data.checks?.cronRefreshLivePipelineOfficialBenefitsCount >= MIN_OFFICIAL_BENEFITS, "Health API missing cron live feed official benefit count");
  assert(data.checks?.cronRefreshProductDealsCount >= 140, "Health API missing cron refresh product count");
  assert(data.checks?.cronRefreshNewsDealsCount >= MIN_OFFICIAL_BENEFITS, "Health API missing cron refresh news count");
  assert(["healthy", "manual_refresh_ready", "stale", "failed"].includes(data.checks?.cronBenefitsStatus), "Health API missing cron benefits status");
  assert(data.checks?.cronBenefitsProtected === true, "Health API missing protected cron benefits evidence");
  assert(data.checks?.cronBenefitsSchedule === "0 21 * * *", "Health API missing daily Hobby-compatible cron benefits schedule");
  assert(data.checks?.cronBenefitsCommand === "node scripts/refresh-benefits.mjs", "Health API missing cron benefits command");
  assert(data.checks?.cronBenefitsReportPath === "reports/cron-benefits.json", "Health API missing cron benefits report path");
  assert(data.checks?.cronBenefitsRefreshReportPath === "reports/benefits-refresh.json", "Health API missing benefits refresh report path");
  assert(data.checks?.cronBenefitsEventsReportPath === "reports/free-benefit-events.json", "Health API missing free benefit events report path");
  assert(data.checks?.cronBenefitsRefreshReportExists === true, "Health API missing benefits refresh report evidence");
  assert(data.checks?.cronBenefitsEventsReportExists === true, "Health API missing free benefit events report evidence");
  assert(data.checks?.cronBenefitsRefreshOk === true, "Health API missing passing benefits refresh evidence");
  assert(data.checks?.cronBenefitsEventsOk === true, "Health API missing passing free benefit events evidence");
  assert(data.checks?.cronBenefitsVisibleActiveEvents >= data.checks?.cronBenefitsMinimumVisibleEvents, "Health API missing minimum visible active benefits evidence");
  assert(data.checks?.cronBenefitsVisibleActiveEvents >= 100, "Health API should expose at least 100 visible active free benefits");
  assert(data.checks?.cronBenefitsSourceCount >= 90, "Health API missing free benefit source breadth evidence");
  assert(data.checks?.cronBenefitsHostCount >= 70, "Health API missing free benefit host breadth evidence");
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
  assert(
    data.imageQuality.mallQueue.every((item) => item.recommendedAcquisition && item.operationOwner && Number.isFinite(item.slaDays) && Array.isArray(item.sampleIds)),
    "Admin image mall queue missing acquisition, owner, SLA, or sample IDs"
  );
  assert(
    data.imageQuality.mallQueue.every((item) => item.recommendedImageSource && Array.isArray(item.imageFeedFields) && item.imageManualVerification && item.prohibitedImageSource),
    "Admin image mall queue missing seller-specific image sourcing policy"
  );
  assert(
    data.imageQuality.mallQueue.every(
      (item) =>
        item.sourceSafetyLevel === "official_or_partner_only" &&
        item.imageReadyGate &&
        Array.isArray(item.requiredFeedFields) &&
        item.requiredFeedFields.includes("imageRights") &&
        Array.isArray(item.operatorChecklist) &&
        item.requestTemplate
    ),
    "Admin image mall queue missing official image ready gate"
  );
  assert(data.imageQuality?.sourcingPlan?.launchTargetRate === 60, "Admin image queue missing 60% launch image target");
  assert(data.imageQuality?.sourcingPlan?.operatingTargetRate === 80, "Admin image queue missing 80% operating image target");
  assert(data.imageQuality.sourcingPlan.gapToLaunchTarget >= 0, "Admin image queue missing image launch gap");
  assert(data.imageQuality.sourcingPlan.gapToOperatingTarget >= 0, "Admin image queue missing image operating gap");
  assert(data.imageQuality.sourcingPlan.weeklyOperatingBatchSize === 12, "Admin image queue missing 12 item weekly operating batch size");
  assert(data.imageQuality.sourcingPlan.weeklySourcingTarget >= 0, "Admin image queue missing weekly image sourcing target");
  assert(Array.isArray(data.imageQuality?.nextBatchDeals) && data.imageQuality.nextBatchDeals.length >= 1, "Admin image queue missing weekly image sourcing batch details");
  assert(Array.isArray(data.imageQuality?.priorityDeals) && data.imageQuality.priorityDeals.length >= 1, "Admin image queue missing priority deals");
  assert(data.imageQuality.priorityDeals.every((deal) => deal.id && deal.title && deal.finalPurchaseUrl && deal.action && deal.priorityReason && deal.sourcingPriority), "Admin image priority deals missing operation fields");
  assert(data.imageQuality.nextBatchDeals.every((deal) => deal.id && deal.imageSearchUrl && deal.priorityReason && deal.recommendedImageSource && Array.isArray(deal.imageFeedFields)), "Admin image weekly batch missing sourcing fields");
  assert(
    data.imageQuality.nextBatchDeals.every(
      (deal) =>
        deal.sourceSafetyLevel === "official_or_partner_only" &&
        deal.imageReadyGate &&
        Array.isArray(deal.requiredFeedFields) &&
        deal.requiredFeedFields.includes("imageRights") &&
        Array.isArray(deal.operatorChecklist) &&
        deal.requestTemplate
    ),
    "Admin image weekly batch missing official image ready gate"
  );
  assert(
    data.imageQuality.priorityDeals.every((deal) => deal.currentImageUrl && deal.imageField === "imageUrl" && deal.imageSearchUrl && deal.sourceUrl && deal.recommendedImageSource && deal.prohibitedImageSource),
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

await check("official benefit alerts api", async () => {
  const { response, data } = await fetchJson("/api/benefits/official-alerts?interest=%EB%AC%B4%EB%A3%8C%2F%EC%B2%B4%ED%97%98&interest=%EC%98%81%ED%99%94%2F%EB%AC%B8%ED%99%94&recentNewsId=news-homeplus-official-event&limit=4");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Official benefit alerts API ok should be true");
  assert(data.recommendations?.audience === "guest", "Official benefit alerts should keep guest access");
  assert(data.recommendations?.summary?.totalActiveBenefits >= MIN_OFFICIAL_BENEFITS, "Official benefit alerts should use visible official benefit pool");
  assert(data.recommendations?.summary?.recommendedBenefits <= 4, "Official benefit alerts should respect limit");
  assert(Array.isArray(data.recommendations?.items) && data.recommendations.items.length > 0, "Official benefit alerts missing recommendation items");
  assert(
    data.recommendations.items.every((item) => item.redirectUrl?.startsWith("/go/news/") && item.reason && item.personalizedSignals),
    "Official benefit alert items missing redirect, reason, or signals"
  );
  assert(
    data.recommendations.items.every((item) => item.officialHost && Array.isArray(item.matchedInterests)),
    "Official benefit alert items missing official host or matched interests"
  );
  assert(String(data.recommendations.notice ?? "").includes("실제 푸시는 별도 동의"), "Official benefit alerts missing push consent notice");
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
  assert(data.officialBenefitProviderRisk?.summary?.danger === 0, "Metrics found danger official benefit providers");
  assert(Array.isArray(data.officialBenefitProviderRisk?.providers) && data.officialBenefitProviderRisk.providers.length >= 4, "Metrics missing official benefit provider risk details");
  assert(Array.isArray(data.officialBenefitProviderRisk?.nextActions), "Metrics missing official benefit provider next actions");
  assert(data.officialBenefitFeedTransition?.totalProviders >= 4, "Metrics missing official benefit feed transition provider count");
  assert(typeof data.officialBenefitFeedTransition?.readinessRate === "number", "Metrics missing official benefit feed transition readiness rate");
  assert(typeof data.officialBenefitFeedTransition?.feedItemCount === "number", "Metrics missing official external feed item count");
  assert(typeof data.officialBenefitFeedTransition?.seedCount === "number", "Metrics missing official seed source count");
  assert(typeof data.officialBenefitFeedTransition?.feedItemRate === "number", "Metrics missing official external feed item rate");
  assert(typeof data.officialBenefitFeedTransition?.configuredEmptyFeedCount === "number", "Metrics missing configured empty feed count");
  assert(Array.isArray(data.officialBenefitFeedTransition?.configuredEmptyFeedProviders), "Metrics missing configured empty feed providers");
  assert(Array.isArray(data.officialBenefitFeedTransition?.providers) && data.officialBenefitFeedTransition.providers.length >= 4, "Metrics missing official benefit feed transition providers");
  assert(data.officialBenefitFeedTransition.providers.every((provider) => typeof provider.seedCount === "number" && typeof provider.feedItemCount === "number" && typeof provider.feedItemRate === "number" && typeof provider.configuredEmptyFeed === "boolean"), "Metrics official feed transition providers missing source mix counters");
  assert(Array.isArray(data.officialBenefitFeedTransition?.recommendedNextEnvKeys), "Metrics missing official benefit feed transition env guidance");
  assert(["seed_fallback_only", "live_feed_ready", "needs_attention", "missing"].includes(data.officialBenefitFeedCanary?.status), "Metrics missing official feed canary status");
  assert(["fresh", "due", "stale", "missing"].includes(data.officialBenefitFeedCanary?.freshnessStatus), "Metrics missing official feed canary freshness status");
  assert(typeof data.officialBenefitFeedCanary?.staleHours === "number", "Metrics missing official feed canary stale threshold");
  assert(typeof data.officialBenefitFeedCanary?.configuredFeedUrls === "number", "Metrics missing official feed canary configured URL count");
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
  assert(data.operationPolicy?.officialBenefitProviderRiskOk === true, "Sources API found danger official benefit provider risk");
  assert(data.officialBenefitProviderReadiness?.summary?.danger === 0, "Sources API missing official benefit provider risk summary");
  assert(Array.isArray(data.officialBenefitProviderReadiness?.providers) && data.officialBenefitProviderReadiness.providers.length >= 4, "Sources API missing official benefit provider readiness details");
  assert(Array.isArray(data.officialBenefitProviderReadiness?.nextActions), "Sources API missing official benefit provider next actions");
  assert(data.officialBenefitFeedTransitionReadiness?.totalProviders >= 4, "Sources API missing official benefit feed transition summary");
  assert(typeof data.officialBenefitFeedTransitionReadiness?.readinessRate === "number", "Sources API missing official benefit feed transition readiness rate");
  assert(typeof data.officialBenefitFeedTransitionReadiness?.seedCount === "number", "Sources API missing official feed seed source count");
  assert(typeof data.officialBenefitFeedTransitionReadiness?.feedItemCount === "number", "Sources API missing official external feed item count");
  assert(typeof data.officialBenefitFeedTransitionReadiness?.feedItemRate === "number", "Sources API missing official external feed item rate");
  assert(typeof data.officialBenefitFeedTransitionReadiness?.configuredEmptyFeedCount === "number", "Sources API missing configured empty feed count");
  assert(Array.isArray(data.officialBenefitFeedTransitionReadiness?.configuredEmptyFeedProviders), "Sources API missing configured empty feed providers");
  assert(Array.isArray(data.officialBenefitFeedTransitionReadiness?.providers) && data.officialBenefitFeedTransitionReadiness.providers.length >= 4, "Sources API missing official benefit feed transition providers");
  assert(data.officialBenefitFeedTransitionReadiness.providers.every((provider) => typeof provider.seedCount === "number" && typeof provider.feedItemCount === "number" && typeof provider.feedItemRate === "number" && typeof provider.configuredEmptyFeed === "boolean"), "Sources API official feed transition providers missing source mix counters");
  assert(Array.isArray(data.officialBenefitFeedTransitionReadiness?.recommendedNextEnvKeys), "Sources API missing official benefit feed env guidance");
  assert(data.officialSourceCatalog?.totalSources >= 30, "Sources API missing official source catalog summary");
  assert(data.officialSourceCatalog?.highPrioritySources >= 10, "Sources API missing high-priority official source candidates");
  assert(Array.isArray(data.officialSourceCatalog?.missingCategories) && data.officialSourceCatalog.missingCategories.length === 0, "Sources API official source catalog has missing categories");
  assert(data.officialSourceCatalog?.providerCoverage?.official_event >= 1, "Sources API official source catalog missing official_event provider");
  assert(data.officialSourceCatalog?.providerCoverage?.public_coupon >= 1, "Sources API official source catalog missing public_coupon provider");
  assert(Array.isArray(data.officialSourceCatalog?.thinCategories) && data.officialSourceCatalog.thinCategories.length === 0, "Sources API official source catalog has thin categories");
  assert(Array.isArray(data.officialSourceCatalog?.sources) && data.officialSourceCatalog.sources.length >= 30, "Sources API missing official source catalog rows");
  assert(
    data.officialSourceCatalog.sources.some((source) => source.officialUrl?.startsWith("https://") && source.allowedUse && source.blockedUse),
    "Sources API official source catalog rows should include official URL and usage policy"
  );
  assert(data.officialSourceCatalog?.reportCommand === "npm run source:catalog:report", "Sources API missing source catalog report command");
  assert(typeof data.operationPolicy?.configuredOfficialBenefitFeeds === "number", "Sources API missing configured official benefit feed count");
  assert(typeof data.operationPolicy?.officialBenefitSeedOnlyProviders === "number", "Sources API missing seed-only official benefit provider count");
  assert(data.operationPolicy?.nextStep?.includes("DEAL_PRODUCTION_FEED_URLS") || data.operationPolicy?.nextStep?.includes("dry-run"), "Sources API missing production feed next step");
});

await check("sources csv export", async () => {
  const response = await fetch(`${baseUrl}/api/sources?format=csv`);
  const csv = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Sources CSV should return text/csv");
  assert(csv.includes("source_catalog"), "Sources CSV missing source catalog rows");
  assert(csv.includes("feed_transition"), "Sources CSV missing feed transition rows");
  assert(csv.includes("next_action"), "Sources CSV missing operator next action rows");
  assert(csv.includes("officialUrl"), "Sources CSV missing official URL column");
  assert(csv.includes("preferredEnvKeys"), "Sources CSV missing env key column");
  assert(csv.includes("seedCount") && csv.includes("feedItemCount") && csv.includes("feedItemRate") && csv.includes("configuredEmptyFeed"), "Sources CSV missing official feed source mix columns");
  assert(csv.includes("OFFICIAL_EVENT_FEED_URLS") || csv.includes("PUBLIC_COUPON_FEED_URLS"), "Sources CSV missing official feed env guidance");
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
  assert(data.revalidationQueued === false, "Price-only report should not enter urgent link revalidation queue");
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
  assert(data.sla?.active >= 1 && typeof data.sla?.slaTargetMet === "boolean", "Admin reports API missing SLA summary");
  assert(Array.isArray(data.sla?.priorityReports), "Admin reports API missing SLA priority report list");
  assert(data.storage?.maxStoredReports === 200, "Admin reports API missing persisted queue storage metadata");
  assert(["local_file", "memory", "supabase_and_local_file"].includes(data.storage?.persistence), "Admin reports API missing persistence mode");
  assert(typeof data.storage?.supabaseConfigured === "boolean", "Admin reports API missing Supabase storage readiness flag");
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
  assert(created.data.revalidationQueued === true, "Link error report should enter the urgent revalidation queue");

  const { response, data } = await fetchJson("/api/admin/reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      status: "reviewing",
      operationAction: "hide",
      operationReason: "smoke_report_hide"
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Report status update should be ok");
  assert(data.report?.status === "reviewing", `Expected reviewing, got ${data.report?.status}`);
  assert(data.operation?.action === "hide" && data.operation?.dealId === "d002", "Report update should record a matching hide operation");
  assert(data.report?.priority === "high", `Expected high priority link error report, got ${data.report?.priority}`);
  assert(data.report?.recommendedAction?.includes("링크"), "Link error report missing recommended link action");
  assert(data.report?.operatorSla?.includes("6시간") && data.report?.queueLabel?.includes("링크"), "Link error report missing SLA and queue label");
  assert(data.sla?.urgent >= 1 && Array.isArray(data.sla?.priorityReports), "Report update response missing SLA triage summary");
  assert(data.storage?.maxStoredReports === 200, "Report update response missing storage metadata");
  assert(typeof data.storage?.supabaseConfigured === "boolean", "Report update response missing Supabase storage readiness flag");

  const restored = await fetchJson("/api/admin/reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      status: "resolved",
      operationAction: "restore",
      operationReason: "smoke_report_restore"
    })
  });

  assert(restored.response.status === 200, `Expected restore 200, got ${restored.response.status}`);
  assert(restored.data.ok === true, "Report restore operation should be ok");
  assert(restored.data.operation?.action === "restore" && restored.data.operation?.dealId === "d002", "Report update should record a matching restore operation");
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
  const { data } = await fetchJson("/api/news-deals?limit=20&sort=priority");
  const cases = data.deals
    .filter((deal) => deal.publishable === true && deal.validationStatus === "passed" && /^https?:\/\//.test(deal.finalUrl))
    .slice(0, 12)
    .map((deal) => [deal.id, new URL(deal.finalUrl).hostname.replace(/^www\./, "")]);

  assert(cases.length >= 8, `Expected at least 8 current official benefit redirect samples, got ${cases.length}`);

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

await check("verified purchase redirect destinations", async () => {
  const cases = [
    ["d014", "coupang.com"],
    ["d016", "gmarket.co.kr"],
    ["d015", "11st.co.kr"],
    ["d012", "oliveyoung.co.kr"],
    ["d116", "musinsa.com"],
    ["d041", "ssg.com"],
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
    ["d057", "tmembership.co.kr"],
    ["d061", "bgfretail.com"],
    ["d073", "hyundaicard.com"],
    ["d074", "shinhancard.com"],
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

await check("admin deal quality csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/deal-quality?format=csv`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Deal quality export is not CSV");
  assert(response.headers.get("x-request-id"), "Deal quality export missing request id");
  assert(text.startsWith("section,key,label"), "Deal quality CSV header missing");
  assert(text.includes("provider") && text.includes("failure_reason") && text.includes("link_validation"), "Deal quality CSV missing provider, failure reason, or link validation sections");
  assert(text.includes("manual_override_storage") && text.includes("supabase_admin_actions"), "Deal quality CSV missing manual override storage readiness");
});

await check("admin manual hide affects public exposure", async () => {
  const dealId = "d014";

  try {
    const hide = await fetchJson("/api/admin/deal-quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide", dealId })
    });
    assert(hide.response.status === 200, `Expected hide 200, got ${hide.response.status}`);
    assert(hide.data.ok === true, "Manual hide should succeed");
    assert(hide.data.manualHiddenDealIds?.includes(dealId), "Manual hide response should include hidden deal id");
    assert(
      hide.data.manualOverrideAudit?.some((item) => item.action === "hide" && item.id === dealId),
      "Manual hide response should include persistent override audit log"
    );
    assert(
      hide.data.manualOverrideStorage?.supabaseTable === "admin_actions",
      "Manual hide response should expose Supabase admin_actions storage readiness"
    );

    const publicDeals = await fetchJson("/api/deals?limit=200");
    assert(publicDeals.response.status === 200, `Expected deals 200, got ${publicDeals.response.status}`);
    assert(!publicDeals.data.deals?.some((deal) => deal.id === dealId), "Manually hidden deal should not be exposed in public deal API");

    const blockedRedirect = await fetch(`${baseUrl}/api/redirect/${dealId}?from=smoke-manual-hidden`, {
      redirect: "manual"
    });
    assert(blockedRedirect.status === 404, `Expected hidden redirect 404, got ${blockedRedirect.status}`);
  } finally {
    const restore = await fetchJson("/api/admin/deal-quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", dealId })
    });
    assert(restore.response.status === 200, `Expected restore 200, got ${restore.response.status}`);
    assert(restore.data.ok === true, "Manual restore should succeed");
    assert(
      restore.data.manualOverrideAudit?.some((item) => item.action === "restore" && item.id === dealId),
      "Manual restore response should include persistent override audit log"
    );

    const restoredRedirect = await fetch(`${baseUrl}/api/redirect/${dealId}?from=smoke-manual-restored`, {
      redirect: "manual"
    });
    assert(restoredRedirect.status === 302, `Expected restored redirect 302, got ${restoredRedirect.status}`);
  }
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
  assert(text.includes("recommendedImageSource") && text.includes("imageFeedFields") && text.includes("prohibitedImageSource"), "Image queue CSV missing seller-specific image sourcing policy fields");
  assert(text.includes("sourceSafetyLevel") && text.includes("imageReadyGate") && text.includes("requiredFeedFields") && text.includes("operatorChecklist") && text.includes("requestTemplate"), "Image queue CSV missing official image ready gate fields");
});

await check("image proxy abuse guard", async () => {
  const unsafeCases = [
    ["/api/image", 400],
    ["/api/image?url=javascript%3Aalert(1)", 400],
    ["/api/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg", 400],
    ["/api/image?url=http%3A%2F%2F127.0.0.1%2Fimage.jpg", 400]
  ];

  for (const [path, expectedStatus] of unsafeCases) {
    const response = await fetch(`${baseUrl}${path}`);
    const text = await response.text();
    assert(response.status === expectedStatus, `Expected ${path} to return ${expectedStatus}, got ${response.status}`);
    assert(response.headers.get("x-request-id"), `${path} missing request id`);
    assert(!text.includes("Unknown error") && !text.includes("Error:"), `${path} exposed internal error details`);
  }
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
