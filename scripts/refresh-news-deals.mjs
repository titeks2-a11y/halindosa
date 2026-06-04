import { existsSync } from "node:fs";
import { join } from "node:path";
import { getEnvFeedUrls } from "./feed-url-utils.mjs";
import { buildOfficialBenefitSourceConfigSummary, getOfficialBenefitProviderSpecs } from "./official-benefit-source-config.mjs";
import {
  dataDir,
  buildNewsPolicyRegressionScenarios,
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
  return getEnvFeedUrls(...keys);
}

const providerSpecs = getOfficialBenefitProviderSpecs();
const seed = readJson("data/newsDeals.seed.json", []);
const collected = [];
const providerStats = [];

for (const spec of providerSpecs) {
  const feedUrls = envUrls(...spec.env);
  const items = [];
  const errors = [];
  const seedItems = spec.seed ? seed.filter((deal) => deal.provider === spec.provider) : [];
  let feedItemCount = 0;
  let feedSuccessCount = 0;

  items.push(...seedItems);

  for (const feedUrl of feedUrls) {
    try {
      const feedItems = await fetchNewsFeed(feedUrl, spec.provider);
      feedSuccessCount += 1;
      feedItemCount += feedItems.length;
      items.push(...feedItems.map((item) => ({ ...item, provider: spec.provider, sourceName: item.sourceName ?? spec.source })));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${spec.provider}_feed_failed`);
    }
  }

  collected.push(...items);
  providerStats.push({
    id: spec.id,
    provider: spec.provider,
    source: spec.source,
    categories: spec.categories,
    benefitTypes: spec.benefitTypes,
    recommendedQueries: spec.recommendedQueries,
    allowedUse: spec.allowedUse,
    blockedUse: spec.blockedUse,
    operatorNote: spec.operatorNote,
    configured: feedUrls.length > 0,
    feedUrls: feedUrls.length,
    seedCount: seedItems.length,
    feedItemCount,
    feedSuccessCount,
    configuredEmptyFeed: feedUrls.length > 0 && feedItemCount === 0,
    collectedCount: items.length,
    fetchedCount: items.length,
    errorCount: errors.length,
    errors
  });
}

const normalized = collected.map((item) => normalizeNewsDeal(item, generatedAt));
const validatedBeforeDedupe = normalized.map((deal) => validateNewsDeal(deal, now));
const validated = dedupeNewsDeals(validatedBeforeDedupe).sort(
  (a, b) => Number(a.isHidden) - Number(b.isHidden) || b.confidenceScore - a.confidenceScore || new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
);
const summary = summarizeNewsDeals(validated, generatedAt, providerStats, {
  collectedCount: collected.length,
  normalizedCount: normalized.length,
  validationInputCount: validatedBeforeDedupe.length,
  dedupedCount: validated.length,
  duplicateRemovedCount: Math.max(0, validatedBeforeDedupe.length - validated.length)
});
const configuredFeedErrors = providerStats.filter((provider) => provider.configured === true && Number(provider.errorCount ?? 0) > 0);
const policyRegression = buildNewsPolicyRegressionScenarios({ now, generatedAt });
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

const sourceConfigSummary = buildOfficialBenefitSourceConfigSummary(providerSpecs);

writeJson("data/refreshedNewsDeals.json", snapshot);
writeJson("reports/news-deals.json", {
  ...summary,
  sourceConfig: sourceConfigSummary,
  ok: summary.ok && configuredFeedErrors.length === 0 && policyRegression.ok,
  gates: {
    configuredFeedErrors: configuredFeedErrors.map((provider) => ({
      provider: provider.provider,
      feedUrls: provider.feedUrls,
      errorCount: provider.errorCount,
      errors: provider.errors ?? []
    })),
    policyRegression
  },
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
console.log(`- duplicateRemovedCount: ${summary.collectionSummary.duplicateRemovedCount}`);
console.log(`- visibleCount: ${summary.visibleCount}`);
console.log(`- hiddenCount: ${summary.hiddenCount}`);
console.log(`- failedCount: ${summary.failedCount}`);
console.log("- data/refreshedNewsDeals.json");
console.log("- reports/news-deals.json");

if (summary.hiddenCount > 0) {
  console.error("News/event refresh found hidden items. They remain excluded from user surfaces.");
}
