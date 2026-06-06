import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dataDir, dedupeNewsDeals, normalizeNewsDeal, readJson, root, summarizeNewsDeals, validateNewsDeal, writeJson } from "./news-deal-utils.mjs";
import { buildOfficialBenefitSourceConfigSummary } from "./official-benefit-source-config.mjs";

const now = Date.now();
const generatedAt = new Date(now).toISOString();
const snapshotPath = join(dataDir, "refreshedNewsDeals.json");
const snapshot = existsSync(snapshotPath)
  ? readJson("data/refreshedNewsDeals.json", { deals: [], allDeals: [], providerStats: [] })
  : null;
const previousReport = readJson("reports/news-deals.json", {});

const source = snapshot ? (snapshot.allDeals?.length ? snapshot.allDeals : snapshot.deals) : readJson("data/newsDeals.seed.json", []);
const normalized = source.map((item) => normalizeNewsDeal(item, generatedAt));
const validatedBeforeDedupe = normalized.map((deal) => validateNewsDeal(deal, now));
const validated = dedupeNewsDeals(validatedBeforeDedupe);
const summary = summarizeNewsDeals(validated, generatedAt, snapshot?.providerStats ?? [], {
  collectedCount: source.length,
  normalizedCount: normalized.length,
  validationInputCount: validatedBeforeDedupe.length,
  dedupedCount: validated.length,
  duplicateRemovedCount: Math.max(0, validatedBeforeDedupe.length - validated.length)
});
const configuredFeedErrors = (snapshot?.providerStats ?? []).filter(
  (provider) => provider?.configured === true && Number(provider?.errorCount ?? 0) > 0
);
const sourceConfigSummary = buildOfficialBenefitSourceConfigSummary();
const previousSourceConfig =
  previousReport.sourceConfig &&
  Array.isArray(previousReport.sourceConfig.targetSections) &&
  Array.isArray(previousReport.sourceConfig.sourceOperations) &&
  Array.isArray(previousReport.sourceConfig.sourceRefreshWindows) &&
  previousReport.sourceConfig.sourceRefreshWindows.length > 0 &&
  previousReport.sourceConfig.sourceRefreshWindows.every((item) => item.nextRefreshAt && Number(item.refreshCadenceMinutes ?? 0) > 0) &&
  previousReport.sourceConfig.nextRefreshAt &&
  Number(previousReport.sourceConfig.minimumRefreshCadenceMinutes ?? 0) > 0
    ? previousReport.sourceConfig
    : null;
const visibleCandidates = validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.publishable === true);
const searchLikeVisible = visibleCandidates.filter((deal) => /search|query=|keyword=|msearch|result/i.test(deal.finalUrl));
const searchLinkTypeVisible = visibleCandidates.filter((deal) => deal.linkType === "search");
const nonOfficialLinkTypeVisible = visibleCandidates.filter((deal) => ["news_only", "community", "invalid"].includes(deal.linkType));
const inactiveVisible = visibleCandidates.filter((deal) => deal.availability !== "active");
const lowPriorityVisible = visibleCandidates.filter((deal) => Number(deal.priorityScore ?? 0) < 70);
const nonPublishableVisible = validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.publishable !== true);
const missingQualityFields = validated.filter((deal) =>
  ["source", "mallName", "originalUrl", "affiliateUrl", "eventUrl", "linkType", "availability", "validationCode", "validationReason", "priorityScore", "publishable", "updatedAt", "verifiedAt", "expiresAt"].some(
    (field) => !(field in deal)
  )
);
const nonOfficialVisible = visibleCandidates.filter((deal) => deal.hiddenReason.includes("not_approved_official_url"));
const expiredVisible = visibleCandidates.filter((deal) => Date.parse(deal.endDate) < now);
const visibleCategoryCounts = validated
  .filter((deal) => !deal.isHidden && deal.validationStatus === "passed" && deal.publishable === true)
  .reduce((map, deal) => map.set(deal.category, (map.get(deal.category) ?? 0) + 1), new Map());
const requiredCategories = ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"];
const minimumCategoryDealCount = 2;
const minimumVisibleOfficialBenefits = 60;
const missingCategories = requiredCategories.filter((category) => !visibleCategoryCounts.has(category));
const thinCategories = requiredCategories.filter((category) => (visibleCategoryCounts.get(category) ?? 0) > 0 && (visibleCategoryCounts.get(category) ?? 0) < minimumCategoryDealCount);
const newsRedirectRouteSource = existsSync(join(root, "app/go/news/[id]/route.ts"))
  ? readFileSync(join(root, "app/go/news/[id]/route.ts"), "utf8")
  : "";
function buildPolicyRegressionScenarios() {
  const futureDate = "2099-12-31";
  const base = {
    id: "news-regression-official-event",
    title: "공식 혜택 정책 회귀 샘플",
    summary: "공식 이벤트 상세 페이지와 명확한 혜택 조건이 있는 항목만 사용자에게 노출되어야 합니다.",
    merchant: "할인도사 검증",
    category: "무료혜택",
    benefitType: "coupon",
    discountRate: 0,
    price: 0,
    originalPrice: 0,
    couponAmount: 3000,
    startDate: "2026-01-01",
    endDate: futureDate,
    sourceName: "공식 혜택 회귀 테스트",
    sourceUrl: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
    finalUrl: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
    imageUrl: "",
    confidenceScore: 90,
    provider: "regression",
    tags: ["공식", "쿠폰"]
  };
  const samples = [
    {
      ...base,
      expectedHidden: false,
      expectedLinkTypePrefix: "official"
    },
    {
      ...base,
      id: "news-regression-official-coupon",
      title: "공식 쿠폰 정책 회귀 샘플",
      finalUrl: "https://pay.naver.com/about/coupon",
      sourceUrl: "https://pay.naver.com/about/coupon",
      expectedHidden: false,
      expectedLinkTypePrefix: "official"
    },
    {
      ...base,
      id: "news-regression-search-url",
      title: "검색 결과 URL 차단 샘플",
      finalUrl: "https://www.homeplus.co.kr/search?keyword=milk",
      sourceUrl: "https://www.homeplus.co.kr/search?keyword=milk",
      expectedHidden: true,
      expectedReason: "search_or_result_url"
    },
    {
      ...base,
      id: "news-regression-community-url",
      title: "커뮤니티 원문 차단 샘플",
      finalUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
      sourceUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
      expectedHidden: true,
      expectedReason: "blocked_community_or_news_host"
    },
    {
      ...base,
      id: "news-regression-news-only-url",
      title: "뉴스 기사 단독 링크 차단 샘플",
      finalUrl: "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=101&oid=001&aid=0000000001",
      sourceUrl: "https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=101&oid=001&aid=0000000001",
      expectedHidden: true,
      expectedReason: "not_approved_official_url"
    },
    {
      ...base,
      id: "news-regression-official-home-url",
      title: "공식 홈 URL 차단 샘플",
      finalUrl: "https://point.pay.naver.com/",
      sourceUrl: "https://point.pay.naver.com/",
      expectedHidden: true,
      expectedReason: "home_or_landing_url"
    },
    {
      ...base,
      id: "news-regression-expired-event",
      title: "종료 이벤트 차단 샘플",
      endDate: "2000-01-01",
      expectedHidden: true,
      expectedReason: "expired_event"
    },
    {
      ...base,
      id: "news-regression-low-confidence",
      title: "낮은 신뢰도 차단 샘플",
      confidenceScore: 40,
      expectedHidden: true,
      expectedReason: "low_confidence"
    },
    {
      ...base,
      id: "news-regression-unclear-copy",
      title: "조건 불명확 차단 샘플",
      summary: "커뮤니티 제보 기준이라 혜택 조건 확인 필요 문구가 남아 있는 항목입니다.",
      expectedHidden: true,
      expectedReason: "unclear_benefit_condition"
    },
    {
      ...base,
      id: "news-regression-spam-copy",
      title: "광고성 문구 차단 샘플",
      summary: "클릭만 하면 무조건 지급된다는 고수익 보장성 광고 문구가 있는 항목입니다.",
      expectedHidden: true,
      expectedReason: "spam_or_ad_like_copy"
    },
    {
      ...base,
      id: "news-regression-missing-final-url",
      title: "공식 링크 누락 차단 샘플",
      finalUrl: "",
      sourceUrl: "",
      expectedHidden: true,
      expectedReason: "missing_final_url"
    },
    {
      ...base,
      id: "news-regression-unsafe-url",
      title: "위험 URL 차단 샘플",
      finalUrl: "javascript:alert(1)",
      sourceUrl: "javascript:alert(1)",
      expectedHidden: true,
      expectedReason: "not_approved_official_url"
    }
  ];
  const results = samples.map((sample) => {
    const normalized = normalizeNewsDeal(sample, generatedAt);
    const validated = validateNewsDeal(normalized, now);
    const expectedReasonOk = sample.expectedReason ? validated.hiddenReason.includes(sample.expectedReason) : true;
    const linkTypeOk = sample.expectedLinkTypePrefix ? String(validated.linkType).startsWith(sample.expectedLinkTypePrefix) : true;

    return {
      id: sample.id,
      expectedHidden: sample.expectedHidden,
      actualHidden: validated.isHidden,
      expectedReason: sample.expectedReason ?? "",
      hiddenReason: validated.hiddenReason,
      linkType: validated.linkType,
      availability: validated.availability,
      validationStatus: validated.validationStatus,
      validationCode: validated.validationCode,
      publishable: validated.publishable === true,
      priorityScore: validated.priorityScore,
      ok: validated.isHidden === sample.expectedHidden && expectedReasonOk && linkTypeOk
    };
  });

  return {
    ok: results.every((item) => item.ok),
    total: results.length,
    passed: results.filter((item) => item.ok).length,
    visiblePositiveSamples: results.filter((item) => !item.expectedHidden && !item.actualHidden).length,
    blockedNegativeSamples: results.filter((item) => item.expectedHidden && item.actualHidden).length,
    results
  };
}
const policyRegression = buildPolicyRegressionScenarios();
const ok =
  summary.visibleCount >= minimumVisibleOfficialBenefits &&
  summary.hiddenCount === 0 &&
  searchLikeVisible.length === 0 &&
  searchLinkTypeVisible.length === 0 &&
  nonOfficialLinkTypeVisible.length === 0 &&
  inactiveVisible.length === 0 &&
  lowPriorityVisible.length === 0 &&
  missingQualityFields.length === 0 &&
  nonPublishableVisible.length === 0 &&
  nonOfficialVisible.length === 0 &&
  expiredVisible.length === 0 &&
  missingCategories.length === 0 &&
  thinCategories.length === 0 &&
  configuredFeedErrors.length === 0 &&
  policyRegression.ok &&
  existsSync(join(root, "app/go/news/[id]/route.ts"));

const report = {
  ...summary,
  sourceConfig: previousSourceConfig ?? sourceConfigSummary,
  ok,
  gates: {
    hasVisibleNewsDeals: summary.visibleCount > 0,
    searchLinkExposure: searchLikeVisible.length,
    searchLinkTypeExposure: searchLinkTypeVisible.length,
    nonOfficialLinkTypeExposure: nonOfficialLinkTypeVisible.length,
    inactiveVisibleExposure: inactiveVisible.length,
    lowPriorityExposure: lowPriorityVisible.length,
    missingQualityFieldCount: missingQualityFields.length,
    missingQualityFieldIds: missingQualityFields.map((deal) => deal.id).slice(0, 20),
    nonPublishableExposure: nonPublishableVisible.length,
    nonOfficialExposure: nonOfficialVisible.length,
    expiredExposure: expiredVisible.length,
    hiddenExposure: summary.hiddenCount,
    configuredFeedErrors: configuredFeedErrors.map((provider) => ({
      provider: provider.provider,
      feedUrls: provider.feedUrls,
      errorCount: provider.errorCount,
      errors: provider.errors ?? []
    })),
    visibleCategoryCoverage: visibleCategoryCounts.size,
    minimumCategoryDealCount,
    missingCategories,
    thinCategories,
    policyRegression,
    newsRedirectRoute: existsSync(join(root, "app/go/news/[id]/route.ts")),
    newsRedirectRouteUsesPolicy: typeof newsRedirectRouteSource === "string"
      ? newsRedirectRouteSource.includes("resolveNewsDealDestinationUrl")
      : false
  }
};

writeJson("reports/news-deals.json", report);

if (ok) {
  console.log(`PASS news deals verified: ${summary.visibleCount}/${summary.totalCount} official benefit links`);
  process.exit(0);
}

console.error("FAIL news deal verification");
console.error(JSON.stringify(report.gates, null, 2));
process.exit(1);
