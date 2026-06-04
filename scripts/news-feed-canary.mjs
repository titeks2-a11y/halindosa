import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getEnvFeedUrls } from "./feed-url-utils.mjs";
import {
  dedupeNewsDeals,
  fetchNewsFeed,
  normalizeNewsDeal,
  root,
  validateNewsDeal,
  writeJson
} from "./news-deal-utils.mjs";

const generatedAt = new Date().toISOString();
const now = Date.now();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

const providerSpecs = [
  { provider: "news", label: "뉴스·보도자료", env: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"] },
  { provider: "event_news", label: "이벤트 뉴스", env: ["DEAL_EVENT_NEWS_FEED_URLS"] },
  { provider: "official_event", label: "공식 이벤트·혜택", env: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"] },
  { provider: "public_coupon", label: "공공·쿠폰·무료혜택", env: ["PUBLIC_COUPON_FEED_URLS"] }
];

function sanitizeFeedUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return "invalid-feed-url";
  }
}

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function countReasons(deals) {
  return Object.entries(
    deals.reduce((acc, deal) => {
      for (const reason of String(deal.hiddenReason || deal.validationReason || "unknown").split(",").filter(Boolean)) {
        acc[reason] = (acc[reason] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));
}

function statusForProvider(provider) {
  if (!provider.configuredFeedUrls) return "seed_fallback_only";
  if (provider.errorCount > 0) return "feed_error";
  if (provider.fetchedCount === 0) return "configured_empty_feed";
  if (provider.visibleCount === 0) return "no_visible_candidates";
  return "live_feed_ready";
}

async function inspectProvider(spec) {
  const urls = getEnvFeedUrls(...spec.env);
  const feedResults = [];
  const items = [];

  for (const url of urls) {
    const started = Date.now();
    try {
      const feedItems = await fetchNewsFeed(url, spec.provider);
      feedResults.push({
        url: sanitizeFeedUrl(url),
        host: hostOf(url),
        status: "passed",
        itemCount: feedItems.length,
        durationMs: Date.now() - started,
        error: "",
        sampleTitles: feedItems.slice(0, 3).map((item) => String(item.title ?? item.name ?? "").trim()).filter(Boolean)
      });
      items.push(...feedItems.map((item) => ({ ...item, provider: spec.provider, sourceUrl: item.sourceUrl ?? url })));
    } catch (error) {
      feedResults.push({
        url: sanitizeFeedUrl(url),
        host: hostOf(url),
        status: "failed",
        itemCount: 0,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : `${spec.provider}_canary_failed`,
        sampleTitles: []
      });
    }
  }

  const validated = dedupeNewsDeals(
    items.map((item) => validateNewsDeal(normalizeNewsDeal(item, generatedAt), now))
  ).sort((a, b) => Number(a.isHidden) - Number(b.isHidden) || b.priorityScore - a.priorityScore);
  const visible = validated.filter((deal) => !deal.isHidden && deal.validationStatus === "passed");
  const hidden = validated.filter((deal) => deal.isHidden || deal.validationStatus !== "passed");
  const provider = {
    provider: spec.provider,
    label: spec.label,
    envKeys: spec.env,
    configuredFeedUrls: urls.length,
    fetchedCount: items.length,
    visibleCount: visible.length,
    hiddenCount: hidden.length,
    errorCount: feedResults.filter((result) => result.status === "failed").length,
    configuredEmptyFeed: urls.length > 0 && items.length === 0,
    officialLinkPromotedCount: visible.filter((deal) => hostOf(deal.sourceUrl) && hostOf(deal.finalUrl) && hostOf(deal.sourceUrl) !== hostOf(deal.finalUrl)).length,
    hiddenReasonTop5: countReasons(hidden),
    feedResults,
    sampleVisible: visible.slice(0, 5).map((deal) => ({
      id: deal.id,
      title: deal.title,
      merchant: deal.merchant,
      finalUrl: deal.finalUrl,
      sourceUrl: deal.sourceUrl,
      linkType: deal.linkType,
      priorityScore: deal.priorityScore
    }))
  };

  return {
    ...provider,
    status: statusForProvider(provider)
  };
}

const providers = [];
for (const spec of providerSpecs) {
  providers.push(await inspectProvider(spec));
}

const configuredProviders = providers.filter((provider) => provider.configuredFeedUrls > 0);
const failedProviders = providers.filter((provider) => ["feed_error", "configured_empty_feed", "no_visible_candidates"].includes(provider.status));
const status = configuredProviders.length === 0
  ? "seed_fallback_only"
  : failedProviders.length
    ? "needs_attention"
    : "live_feed_ready";
const report = {
  ok: status === "seed_fallback_only" || status === "live_feed_ready",
  generatedAt,
  status,
  providerCount: providers.length,
  configuredProviderCount: configuredProviders.length,
  configuredFeedUrls: providers.reduce((sum, provider) => sum + provider.configuredFeedUrls, 0),
  totalFetchedCount: providers.reduce((sum, provider) => sum + provider.fetchedCount, 0),
  visibleCandidateCount: providers.reduce((sum, provider) => sum + provider.visibleCount, 0),
  hiddenCandidateCount: providers.reduce((sum, provider) => sum + provider.hiddenCount, 0),
  errorCount: providers.reduce((sum, provider) => sum + provider.errorCount, 0),
  configuredEmptyFeedCount: providers.filter((provider) => provider.configuredEmptyFeed).length,
  officialLinkPromotedCount: providers.reduce((sum, provider) => sum + provider.officialLinkPromotedCount, 0),
  exposedSearchLinkCount: providers.reduce((sum, provider) => sum + provider.sampleVisible.filter((deal) => deal.linkType === "search").length, 0),
  exposedNonOfficialLinkCount: providers.reduce((sum, provider) => sum + provider.sampleVisible.filter((deal) => !String(deal.linkType ?? "").startsWith("official")).length, 0),
  failedProviders: failedProviders.map((provider) => ({
    provider: provider.provider,
    status: provider.status,
    action:
      provider.status === "feed_error"
        ? "feed URL, 인증, 응답 상태, timeout을 확인하세요."
        : provider.status === "configured_empty_feed"
          ? "feed 응답이 빈 배열인지, parser가 항목을 찾지 못하는지 확인하세요."
          : "finalUrl, 공식 도메인, 종료일, 혜택 조건을 보강하세요."
  })),
  providers,
  nextActions: configuredProviders.length
    ? [
        "needs_attention provider는 사용자 노출 반영 전에 feed URL, 응답 형식, finalUrl 승격 결과를 보강하세요.",
        "canary 통과 후 npm run refresh:news && npm run verify:news && npm run refresh:all을 실행하세요.",
        "검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 finalUrl로 쓰지 않습니다."
      ]
    : [
        "아직 운영 feed URL이 없어 seed fallback만 검사했습니다.",
        "OFFICIAL_EVENT_FEED_URLS 또는 PUBLIC_COUPON_FEED_URLS에 공식 JSON/RSS/Atom feed를 연결한 뒤 npm run news:feed:canary를 다시 실행하세요.",
        "무단 HTML 크롤링 대신 공식 API, RSS, Atom, 승인된 파트너 JSON만 연결하세요."
      ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeJson("reports/news-feed-canary.json", report);

const docsLines = [
  "# 공식 혜택 Feed Canary",
  "",
  "운영 환경변수에 연결된 실시간 공식 feed가 실제로 살아 있고, 사용자 노출 가능한 공식 혜택 후보를 만들 수 있는지 확인하는 canary 리포트입니다.",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- 상태: ${status}`,
  `- Provider: ${providers.length}개`,
  `- 연결된 feed URL: ${report.configuredFeedUrls}개`,
  `- 수집 후보: ${report.totalFetchedCount}개`,
  `- 노출 가능 후보: ${report.visibleCandidateCount}개`,
  `- 숨김 후보: ${report.hiddenCandidateCount}개`,
  `- 오류: ${report.errorCount}개`,
  `- 설정 feed 공백: ${report.configuredEmptyFeedCount}개`,
  `- 뉴스 본문 공식 링크 승격: ${report.officialLinkPromotedCount}개`,
  "",
  "## Provider별 상태",
  "",
  "| Provider | 상태 | Feed URL | 수집 | 노출 | 숨김 | 오류 | 공식 링크 승격 |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...providers.map((provider) => `| ${provider.provider} | ${provider.status} | ${provider.configuredFeedUrls} | ${provider.fetchedCount} | ${provider.visibleCount} | ${provider.hiddenCount} | ${provider.errorCount} | ${provider.officialLinkPromotedCount} |`),
  "",
  "## 다음 액션",
  "",
  ...report.nextActions.map((action) => `- ${action}`),
  "",
  "## 운영 API",
  "",
  "- JSON: `GET /api/admin/news-feed-canary`",
  "- CSV: `GET /api/admin/news-feed-canary?format=csv`",
  "- 운영 화면: `/admin`의 공식 피드 전환 준비도에서 `canary JSON`, `canary CSV` 버튼으로 확인합니다.",
  "",
  "## 검증 명령",
  "",
  "```bash",
  "npm run news:feed:canary",
  "npm run refresh:news",
  "npm run verify:news",
  "npm run refresh:all",
  "```",
  ""
];
writeFileSync(join(root, "docs", "NEWS_FEED_CANARY_REPORT.md"), docsLines.join("\n"), "utf8");

console.log("News feed canary completed.");
console.log(`- status: ${status}`);
console.log(`- configuredFeedUrls: ${report.configuredFeedUrls}`);
console.log(`- visibleCandidateCount: ${report.visibleCandidateCount}`);
console.log(`- reports/news-feed-canary.json`);
console.log(`- docs/NEWS_FEED_CANARY_REPORT.md`);

if (!report.ok) {
  console.error("News feed canary found configured feed issues. Review reports/news-feed-canary.json.");
  process.exit(1);
}
