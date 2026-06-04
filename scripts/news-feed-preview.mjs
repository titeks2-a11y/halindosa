import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getEnvFeedUrls, parseFeedUrlList } from "./feed-url-utils.mjs";
import {
  dedupeNewsDeals,
  fetchNewsFeed,
  normalizeNewsDeal,
  parseNewsFeedXmlItems,
  root,
  summarizeNewsDeals,
  validateNewsDeal
} from "./news-deal-utils.mjs";

const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const generatedAt = new Date().toISOString();
const now = Date.now();

const providerSpecs = [
  { provider: "news", label: "뉴스/보도자료", env: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"] },
  { provider: "event_news", label: "이벤트 뉴스", env: ["DEAL_EVENT_NEWS_FEED_URLS"] },
  { provider: "official_event", label: "공식 이벤트", env: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"] },
  { provider: "public_coupon", label: "공공/쿠폰 혜택", env: ["PUBLIC_COUPON_FEED_URLS"] }
];

function argValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isArticleContextPromotion(deal) {
  const sourceHost = normalizeHost(deal.sourceUrl);
  const finalHost = normalizeHost(deal.finalUrl);
  return Boolean(sourceHost && finalHost && sourceHost !== finalHost && deal.linkType?.startsWith("official"));
}

function configuredUrlsFor(provider) {
  const cliUrls = parseFeedUrlList(argValue("url"));
  if (cliUrls.length) return cliUrls;
  return getEnvFeedUrls(...provider.env);
}

function sampleItemsForProvider(provider) {
  const jsonSample = readJson("data/newsFeed.sample.json", { items: [] });
  const jsonItems = Array.isArray(jsonSample) ? jsonSample : Array.isArray(jsonSample.items) ? jsonSample.items : [];
  const rssPath = join(root, "data", "newsFeed.sample.rss.xml");
  const rssItems = existsSync(rssPath) ? parseNewsFeedXmlItems(readFileSync(rssPath, "utf8"), provider.provider, "data/newsFeed.sample.rss.xml") : [];
  return [...jsonItems, ...rssItems].map((item) => ({ ...item, provider: provider.provider }));
}

async function previewProvider(provider) {
  const urls = configuredUrlsFor(provider);
  const items = [];
  const errors = [];
  const sourceMode = urls.length ? "configured_feed" : "local_contract_sample";

  if (!urls.length) {
    items.push(...sampleItemsForProvider(provider));
  }

  for (const url of urls) {
    try {
      const feedItems = await fetchNewsFeed(url, provider.provider);
      items.push(...feedItems.map((item) => ({ ...item, provider: provider.provider, sourceUrl: item.sourceUrl ?? url })));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${provider.provider}_preview_failed`);
    }
  }

  const validated = dedupeNewsDeals(
    items.map((item) => validateNewsDeal(normalizeNewsDeal(item, generatedAt), now))
  ).sort((a, b) => Number(a.isHidden) - Number(b.isHidden) || b.priorityScore - a.priorityScore);
  const visible = validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed");
  const hidden = validated.filter((deal) => deal.isHidden || deal.validationStatus !== "passed");

  return {
    provider: provider.provider,
    label: provider.label,
    sourceMode,
    configuredFeedUrls: urls.length,
    fetchedCount: items.length,
    visibleCount: visible.length,
    hiddenCount: hidden.length,
    errorCount: errors.length,
    errors,
    officialLinkPromotedCount: visible.filter(isArticleContextPromotion).length,
    hiddenReasonTop5: Object.entries(
      hidden.reduce((acc, deal) => {
        for (const reason of String(deal.hiddenReason || deal.validationReason || "unknown").split(",").filter(Boolean)) {
          acc[reason] = (acc[reason] ?? 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count })),
    sampleVisible: visible.slice(0, 5).map((deal) => ({
      id: deal.id,
      title: deal.title,
      merchant: deal.merchant,
      finalUrl: deal.finalUrl,
      sourceUrl: deal.sourceUrl,
      linkType: deal.linkType,
      priorityScore: deal.priorityScore
    })),
    sampleHidden: hidden.slice(0, 5).map((deal) => ({
      id: deal.id,
      title: deal.title,
      finalUrl: deal.finalUrl,
      sourceUrl: deal.sourceUrl,
      hiddenReason: deal.hiddenReason,
      linkType: deal.linkType
    })),
    deals: validated
  };
}

const requestedProvider = argValue("provider");
const targetProviders = requestedProvider
  ? providerSpecs.filter((provider) => provider.provider === requestedProvider)
  : providerSpecs;

if (!targetProviders.length) {
  console.error(`Unknown provider: ${requestedProvider}`);
  process.exit(1);
}

const providerResults = [];
for (const provider of targetProviders) {
  providerResults.push(await previewProvider(provider));
}

const allDeals = providerResults.flatMap((provider) => provider.deals);
const summary = summarizeNewsDeals(allDeals, generatedAt, providerResults.map((provider) => ({
  provider: provider.provider,
  source: provider.sourceMode,
  configured: provider.sourceMode === "configured_feed",
  feedUrls: provider.configuredFeedUrls,
  fetchedCount: provider.fetchedCount,
  errorCount: provider.errorCount,
  errors: provider.errors
})));
const report = {
  ok: providerResults.every((provider) => provider.errorCount === 0) && summary.exposedSearchLinkCount === 0 && summary.exposedNonOfficialLinkCount === 0,
  generatedAt,
  mode: providerResults.some((provider) => provider.sourceMode === "configured_feed") ? "configured_feed_preview" : "contract_sample_preview",
  providerCount: providerResults.length,
  totalFetchedCount: providerResults.reduce((sum, provider) => sum + provider.fetchedCount, 0),
  visibleCount: providerResults.reduce((sum, provider) => sum + provider.visibleCount, 0),
  hiddenCount: providerResults.reduce((sum, provider) => sum + provider.hiddenCount, 0),
  officialLinkPromotedCount: providerResults.reduce((sum, provider) => sum + provider.officialLinkPromotedCount, 0),
  providerResults: providerResults.map((provider) => {
    const publicProvider = { ...provider };
    delete publicProvider.deals;
    return publicProvider;
  }),
  summary: {
    exposedSearchLinkCount: summary.exposedSearchLinkCount,
    exposedNonOfficialLinkCount: summary.exposedNonOfficialLinkCount,
    failedCount: summary.failedCount,
    failureReasonTop10: summary.failureReasonTop10,
    categoryCounts: summary.categoryCounts
  }
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(reportsDir, "news-feed-preview.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# 공식 혜택 Feed Preview",
  "",
  "운영 feed를 연결하기 전 또는 연결 직후, 사용자 노출 전에 공식 링크 승격과 숨김 사유를 dry-run으로 확인하는 리포트입니다.",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- 모드: ${report.mode}`,
  `- Provider: ${report.providerCount}개`,
  `- 수집 후보: ${report.totalFetchedCount}개`,
  `- 노출 가능: ${report.visibleCount}개`,
  `- 숨김 후보: ${report.hiddenCount}개`,
  `- 뉴스 본문 공식 링크 승격: ${report.officialLinkPromotedCount}개`,
  `- 검색 링크 노출: ${report.summary.exposedSearchLinkCount}개`,
  `- 비공식 링크 노출: ${report.summary.exposedNonOfficialLinkCount}개`,
  "",
  "## Provider별 Preview",
  "",
  "| Provider | 모드 | 후보 | 노출 | 숨김 | 공식 링크 승격 | 오류 |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ...report.providerResults.map(
    (provider) =>
      `| ${provider.provider} | ${provider.sourceMode} | ${provider.fetchedCount} | ${provider.visibleCount} | ${provider.hiddenCount} | ${provider.officialLinkPromotedCount} | ${provider.errorCount} |`
  ),
  "",
  "## 사용 방법",
  "",
  "```bash",
  "npm run news:preview",
  "npm run news:preview -- --provider=official_event --url=https://official.example/feed.json",
  "```",
  "",
  "- 검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 사용자 노출에서 제외됩니다.",
  "- RSS 본문 안 공식 이벤트 링크가 있으면 기사 링크는 sourceUrl로 남고 공식 링크가 finalUrl로 승격됩니다.",
  "- 실제 반영 전에는 `npm run refresh:news && npm run verify:news && npm run refresh:all`을 다시 실행합니다."
];

writeFileSync(join(docsDir, "NEWS_FEED_PREVIEW_REPORT.md"), `${docsLines.join("\n")}\n`, "utf8");

console.log("News feed preview completed.");
console.log(`- mode: ${report.mode}`);
console.log(`- visible: ${report.visibleCount}`);
console.log(`- hidden: ${report.hiddenCount}`);
console.log(`- official link promotions: ${report.officialLinkPromotedCount}`);
console.log("- reports/news-feed-preview.json");
console.log("- docs/NEWS_FEED_PREVIEW_REPORT.md");

if (!report.ok) {
  console.error("News feed preview found feed errors or exposed unsafe links. Review reports/news-feed-preview.json.");
  process.exit(1);
}
