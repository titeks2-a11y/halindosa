import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  dataDir,
  dedupeNewsDeals,
  fetchNewsFeed,
  normalizeNewsDeal,
  readJson,
  root,
  summarizeNewsDeals,
  validateNewsDeal,
  writeJson
} from "./news-deal-utils.mjs";

const now = Date.now();
const generatedAt = new Date(now).toISOString();

function envUrls(...keys) {
  return keys
    .flatMap((key) => (process.env[key] ?? "").split(","))
    .map((url) => url.trim())
    .filter(Boolean);
}

const providerSpecs = [
  { provider: "news", source: "approved_news_feed", seed: true, env: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"] },
  { provider: "event_news", source: "official_event_news_feed", seed: true, env: ["DEAL_EVENT_NEWS_FEED_URLS"] },
  { provider: "official_event", source: "official_event_page_feed", seed: true, env: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"] },
  { provider: "public_coupon", source: "public_coupon_and_culture_benefit_feed", seed: true, env: ["PUBLIC_COUPON_FEED_URLS"] }
];

const seed = readJson("data/newsDeals.seed.json", []);
const collected = [];
const providerStats = [];

for (const spec of providerSpecs) {
  const feedUrls = envUrls(...spec.env);
  const items = [];
  const errors = [];

  if (spec.seed) {
    items.push(...seed.filter((deal) => deal.provider === spec.provider));
  }

  for (const feedUrl of feedUrls) {
    try {
      const feedItems = await fetchNewsFeed(feedUrl, spec.provider);
      items.push(...feedItems.map((item) => ({ ...item, provider: spec.provider, sourceName: item.sourceName ?? spec.source })));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${spec.provider}_feed_failed`);
    }
  }

  collected.push(...items);
  providerStats.push({
    provider: spec.provider,
    source: spec.source,
    configured: feedUrls.length > 0,
    feedUrls: feedUrls.length,
    fetchedCount: items.length,
    errorCount: errors.length,
    errors
  });
}

const normalized = collected.map((item) => normalizeNewsDeal(item, generatedAt));
const validated = dedupeNewsDeals(normalized.map((deal) => validateNewsDeal(deal, now))).sort(
  (a, b) => Number(a.isHidden) - Number(b.isHidden) || b.confidenceScore - a.confidenceScore || new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
);
const summary = summarizeNewsDeals(validated, generatedAt, providerStats);
const visibleDeals = validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed");
const snapshot = {
  generatedAt,
  schemaVersion: 1,
  source: "official_event_seed_and_approved_feeds",
  allDeals: validated,
  deals: visibleDeals,
  hiddenDeals: summary.hiddenDeals,
  providerStats
};

writeJson("data/refreshedNewsDeals.json", snapshot);
writeJson("reports/news-deals.json", {
  ...summary,
  pipeline: [
    "collect approved seed/feed sources",
    "normalize news/event fields",
    "block search/community/news-only URLs",
    "hide expired or unclear events",
    "require approved official finalUrl",
    "dedupe by official URL",
    "write data/refreshedNewsDeals.json",
    "write reports/news-deals.json"
  ],
  sourceFiles: {
    seed: existsSync(join(root, "data/newsDeals.seed.json")),
    refreshed: existsSync(join(dataDir, "refreshedNewsDeals.json")),
    report: true
  }
});

console.log("News/event deal refresh completed.");
console.log(`- collectedCount: ${collected.length}`);
console.log(`- normalizedCount: ${normalized.length}`);
console.log(`- visibleCount: ${summary.visibleCount}`);
console.log(`- hiddenCount: ${summary.hiddenCount}`);
console.log(`- failedCount: ${summary.failedCount}`);
console.log("- data/refreshedNewsDeals.json");
console.log("- reports/news-deals.json");

if (summary.hiddenCount > 0) {
  console.error("News/event refresh found hidden items. They remain excluded from user surfaces.");
}
