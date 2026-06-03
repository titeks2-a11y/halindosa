import { existsSync } from "node:fs";
import { join } from "node:path";
import { dataDir, dedupeNewsDeals, normalizeNewsDeal, readJson, summarizeNewsDeals, validateNewsDeal, writeJson } from "./news-deal-utils.mjs";

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
const ok =
  summary.visibleCount > 0 &&
  summary.hiddenCount === 0 &&
  searchLikeVisible.length === 0 &&
  nonOfficialVisible.length === 0 &&
  expiredVisible.length === 0;

const report = {
  ...summary,
  ok,
  gates: {
    hasVisibleNewsDeals: summary.visibleCount > 0,
    searchLinkExposure: searchLikeVisible.length,
    nonOfficialExposure: nonOfficialVisible.length,
    expiredExposure: expiredVisible.length,
    hiddenExposure: summary.hiddenCount
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
