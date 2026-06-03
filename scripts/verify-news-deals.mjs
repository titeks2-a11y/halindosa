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
const searchLikeVisible = validated.filter((deal) => !deal.isHidden && /search|query=|keyword=|msearch|result/i.test(deal.finalUrl));
const nonOfficialVisible = validated.filter((deal) => !deal.isHidden && deal.hiddenReason.includes("not_approved_official_url"));
const expiredVisible = validated.filter((deal) => !deal.isHidden && Date.parse(deal.endDate) < now);
const visibleCategories = new Set(validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed").map((deal) => deal.category));
const requiredCategories = ["식품/생필품", "마트/편의점", "외식/배달", "패션/뷰티", "디지털/가전", "카드/멤버십", "영화/문화", "무료혜택"];
const missingCategories = requiredCategories.filter((category) => !visibleCategories.has(category));
const newsRedirectRouteSource = existsSync(join(root, "app/go/news/[id]/route.ts"))
  ? readFileSync(join(root, "app/go/news/[id]/route.ts"), "utf8")
  : "";
const ok =
  summary.visibleCount >= 15 &&
  summary.hiddenCount === 0 &&
  searchLikeVisible.length === 0 &&
  nonOfficialVisible.length === 0 &&
  expiredVisible.length === 0 &&
  missingCategories.length === 0 &&
  existsSync(join(root, "app/go/news/[id]/route.ts"));

const report = {
  ...summary,
  ok,
  gates: {
    hasVisibleNewsDeals: summary.visibleCount > 0,
    searchLinkExposure: searchLikeVisible.length,
    nonOfficialExposure: nonOfficialVisible.length,
    expiredExposure: expiredVisible.length,
    hiddenExposure: summary.hiddenCount,
    visibleCategoryCoverage: visibleCategories.size,
    missingCategories,
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
