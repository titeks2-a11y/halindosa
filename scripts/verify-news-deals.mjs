import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dataDir, dedupeNewsDeals, normalizeNewsDeal, readJson, root, summarizeNewsDeals, validateNewsDeal, writeJson } from "./news-deal-utils.mjs";

const now = Date.now();
const generatedAt = new Date(now).toISOString();
const snapshotPath = join(dataDir, "refreshedNewsDeals.json");
const snapshot = existsSync(snapshotPath)
  ? readJson("data/refreshedNewsDeals.json", { deals: [], allDeals: [], providerStats: [] })
  : null;
const source = snapshot ? (snapshot.allDeals?.length ? snapshot.allDeals : snapshot.deals) : readJson("data/newsDeals.seed.json", []);
const normalized = source.map((item) => normalizeNewsDeal(item, generatedAt));
const validated = dedupeNewsDeals(normalized.map((deal) => validateNewsDeal(deal, now)));
const summary = summarizeNewsDeals(validated, generatedAt, snapshot?.providerStats ?? []);
const configuredFeedErrors = (snapshot?.providerStats ?? []).filter(
  (provider) => provider?.configured === true && Number(provider?.errorCount ?? 0) > 0
);
const searchLikeVisible = validated.filter((deal) => !deal.isHidden && /search|query=|keyword=|msearch|result/i.test(deal.finalUrl));
const searchLinkTypeVisible = validated.filter((deal) => !deal.isHidden && deal.linkType === "search");
const nonOfficialLinkTypeVisible = validated.filter((deal) => !deal.isHidden && ["news_only", "community", "invalid"].includes(deal.linkType));
const inactiveVisible = validated.filter((deal) => !deal.isHidden && deal.availability !== "active");
const lowPriorityVisible = validated.filter((deal) => !deal.isHidden && Number(deal.priorityScore ?? 0) < 70);
const missingQualityFields = validated.filter((deal) =>
  ["source", "mallName", "originalUrl", "affiliateUrl", "eventUrl", "linkType", "availability", "validationReason", "priorityScore"].some(
    (field) => !(field in deal)
  )
);
const nonOfficialVisible = validated.filter((deal) => !deal.isHidden && deal.hiddenReason.includes("not_approved_official_url"));
const expiredVisible = validated.filter((deal) => !deal.isHidden && Date.parse(deal.endDate) < now);
const visibleCategoryCounts = validated
  .filter((deal) => !deal.isHidden && deal.validationStatus === "passed")
  .reduce((map, deal) => map.set(deal.category, (map.get(deal.category) ?? 0) + 1), new Map());
const requiredCategories = ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"];
const minimumCategoryDealCount = 2;
const minimumVisibleOfficialBenefits = 40;
const missingCategories = requiredCategories.filter((category) => !visibleCategoryCounts.has(category));
const thinCategories = requiredCategories.filter((category) => (visibleCategoryCounts.get(category) ?? 0) > 0 && (visibleCategoryCounts.get(category) ?? 0) < minimumCategoryDealCount);
const newsRedirectRouteSource = existsSync(join(root, "app/go/news/[id]/route.ts"))
  ? readFileSync(join(root, "app/go/news/[id]/route.ts"), "utf8")
  : "";
const ok =
  summary.visibleCount >= minimumVisibleOfficialBenefits &&
  summary.hiddenCount === 0 &&
  searchLikeVisible.length === 0 &&
  searchLinkTypeVisible.length === 0 &&
  nonOfficialLinkTypeVisible.length === 0 &&
  inactiveVisible.length === 0 &&
  lowPriorityVisible.length === 0 &&
  missingQualityFields.length === 0 &&
  nonOfficialVisible.length === 0 &&
  expiredVisible.length === 0 &&
  missingCategories.length === 0 &&
  thinCategories.length === 0 &&
  configuredFeedErrors.length === 0 &&
  existsSync(join(root, "app/go/news/[id]/route.ts"));

const report = {
  ...summary,
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
