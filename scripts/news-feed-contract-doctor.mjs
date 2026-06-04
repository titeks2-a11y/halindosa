import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeNewsDeal, parseNewsFeedXmlItems, validateNewsDeal } from "./news-deal-utils.mjs";

const root = process.cwd();
const issues = [];
const pass = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function requireFile(path, label) {
  if (!existsSync(join(root, path))) {
    issues.push(`${label} missing: ${path}`);
    return "";
  }

  pass.push(`${label} exists`);
  return read(path);
}

const provider = requireFile("lib/deals/providers/newsProvider.ts", "news provider");
const feedUrlParser = requireFile("lib/deals/feedUrls.ts", "feed URL parser");
const scriptFeedUrlParser = requireFile("scripts/feed-url-utils.mjs", "script feed URL parser");
const eventProvider = requireFile("lib/deals/providers/eventNewsProvider.ts", "event news provider");
const officialProvider = requireFile("lib/deals/providers/officialEventProvider.ts", "official event provider");
const couponProvider = requireFile("lib/deals/providers/publicCouponProvider.ts", "public coupon provider");
const refreshScript = requireFile("scripts/refresh-news-deals.mjs", "refresh script");
const sourceConfigScript = requireFile("scripts/official-benefit-source-config.mjs", "official benefit source config helper");
const sourceConfigData = requireFile("data/officialBenefitFeedSources.json", "official benefit source config data");
const verifyScript = requireFile("scripts/verify-news-deals.mjs", "verify script");
const configuredFeedErrorTest = requireFile("scripts/test-news-feed-error-gate.mjs", "configured feed error regression");
const newsOperations = requireFile("lib/deals/newsOperations.ts", "news operations");
const sourcesRoute = requireFile("app/api/sources/route.ts", "sources API");
const feedTransitionReport = requireFile("scripts/feed-transition-report.mjs", "feed transition report");
const sourceCatalogReport = requireFile("scripts/official-source-catalog-report.mjs", "official source catalog report");
const productionProvider = requireFile("lib/deals/providers/productionProvider.ts", "production product feed provider");
const envExample = requireFile(".env.example", "env example");
const docs = requireFile("docs/news-feed-contract.md", "feed contract docs");
const sampleRaw = requireFile("data/newsFeed.sample.json", "sample feed");
const sampleRssRaw = requireFile("data/newsFeed.sample.rss.xml", "sample RSS feed");

for (const phrase of ["createJsonFeedNewsProvider", "fetchJsonNewsFeed", "fetchNewsFeed", "parseNewsFeedXmlItems", "extractOfficialUrlFromBlock", "isApprovedOfficialNewsUrl", "AbortController", "redirect: \"follow\"", "User-Agent"]) {
  if (!provider.includes(phrase)) issues.push(`news provider missing ${phrase}`);
}

for (const [label, content] of [
  ["lib feed URL parser", feedUrlParser],
  ["script feed URL parser", scriptFeedUrlParser]
]) {
  for (const phrase of ["parseFeedUrlList", "JSON.parse", "https?:\\/\\/", "data:", "[;,](?="]) {
    if (!content.includes(phrase)) issues.push(`${label} missing ${phrase}`);
  }
}

const envKeys = [
  "DEAL_NEWS_FEED_URLS",
  "DEAL_NEWS_RSS_URLS",
  "DEAL_EVENT_NEWS_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "DEAL_EVENT_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS"
];

for (const key of envKeys) {
  if (!envExample.includes(key)) issues.push(`.env.example missing ${key}`);
}

for (const [path, content, required] of [
  ["eventNewsProvider.ts", eventProvider, "DEAL_EVENT_NEWS_FEED_URLS"],
  ["officialEventProvider.ts", officialProvider, "OFFICIAL_EVENT_FEED_URLS"],
  ["officialEventProvider.ts", officialProvider, "DEAL_EVENT_FEED_URLS"],
  ["publicCouponProvider.ts", couponProvider, "PUBLIC_COUPON_FEED_URLS"]
]) {
  if (!content.includes("createJsonFeedNewsProvider") || !content.includes(required)) {
    issues.push(`${path} should use JSON feed provider env key ${required}`);
  }
}

for (const phrase of ["공식 승인 도메인", "검색 결과 URL", "커뮤니티", "finalUrl", "RSS", "Atom", "본문 안 공식 링크", "npm run refresh:news", "configuredFeedErrors", "설정된 운영 feed", "targetSections", "operatorOwner", "refreshCadenceMinutes", "qualityChecklist", "data/newsFeed.sample.json", "data/newsFeed.sample.rss.xml"]) {
  if (!docs.includes(phrase)) issues.push(`feed contract docs missing ${phrase}`);
}

const refreshContractSource = `${refreshScript}\n${sourceConfigScript}\n${sourceConfigData}`;

for (const phrase of ["fetchNewsFeed", "DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS", "DEAL_EVENT_NEWS_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"]) {
  if (!refreshContractSource.includes(phrase)) issues.push(`refresh-news-deals source config missing ${phrase}`);
}

for (const phrase of ["targetSections", "operatorOwner", "launchPriority", "refreshCadenceMinutes", "qualityChecklist"]) {
  if (!refreshContractSource.includes(phrase)) issues.push(`refresh-news-deals source config missing operational metadata ${phrase}`);
}

for (const [label, content] of [
  ["news operations", newsOperations],
  ["sources API", sourcesRoute],
  ["feed transition report", feedTransitionReport],
  ["official source catalog report", sourceCatalogReport],
  ["production product feed provider", productionProvider]
]) {
  if (!content.includes("getEnvFeedUrls")) {
    issues.push(`${label} should use the shared robust feed URL parser for comma, semicolon, newline, JSON array, and data URL env values`);
  }
}

for (const phrase of ["searchLinkExposure", "nonOfficialExposure", "expiredExposure", "thinCategories", "configuredFeedErrors"]) {
  if (!verifyScript.includes(phrase)) issues.push(`verify-news-deals missing ${phrase}`);
}

for (const phrase of ["DEAL_NEWS_FEED_URLS", "not-a-halindosa-feed", "/broken.txt", "tags=mart,coupon", "base64,", "configuredFeedErrors", "refresh-news-deals.mjs", "verify-news-deals.mjs"]) {
  if (!configuredFeedErrorTest.includes(phrase)) issues.push(`configured feed error regression missing ${phrase}`);
}

try {
  const sample = JSON.parse(sampleRaw);
  const items = Array.isArray(sample) ? sample : sample.items;
  if (!Array.isArray(items) || items.length < 2) {
    issues.push("sample feed should include at least two official benefit items");
  } else {
    const now = Date.parse("2026-06-03T00:00:00.000Z");
    const validated = items.map((item) => validateNewsDeal(normalizeNewsDeal({ ...item, provider: item.provider ?? "official_event" }, "2026-06-03T00:00:00.000Z"), now));
    const failed = validated.filter((deal) => deal.validationStatus !== "passed" || deal.isHidden);
    if (failed.length) {
      issues.push(`sample feed has hidden/failed deals: ${failed.map((deal) => `${deal.id}:${deal.hiddenReason}`).join(", ")}`);
    }
  }
} catch (error) {
  issues.push(`sample feed JSON parse failed: ${error instanceof Error ? error.message : "unknown"}`);
}

try {
  const items = parseNewsFeedXmlItems(sampleRssRaw, "official_event", "data/newsFeed.sample.rss.xml");
  if (items.length < 3) {
    issues.push("sample RSS feed should include at least three official benefit items including an article-context mapping case");
  } else {
    const mappedNewsItem = items.find((item) => item.id === "sample-rss-news-with-official-link");
    if (!mappedNewsItem) {
      issues.push("sample RSS feed should include sample-rss-news-with-official-link");
    } else {
      if (mappedNewsItem.finalUrl !== "https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593") {
        issues.push("sample RSS article-context item should promote the official href to finalUrl");
      }
      if (mappedNewsItem.sourceUrl !== "https://news.naver.com/example/halindosa-benefit-context") {
        issues.push("sample RSS article-context item should keep the news link as sourceUrl");
      }
    }

    const now = Date.parse("2026-06-03T00:00:00.000Z");
    const validated = items.map((item) => validateNewsDeal(normalizeNewsDeal({ ...item, provider: item.provider ?? "official_event" }, "2026-06-03T00:00:00.000Z"), now));
    const failed = validated.filter((deal) => deal.validationStatus !== "passed" || deal.isHidden);
    if (failed.length) {
      issues.push(`sample RSS feed has hidden/failed deals: ${failed.map((deal) => `${deal.id}:${deal.hiddenReason}`).join(", ")}`);
    }
  }
} catch (error) {
  issues.push(`sample RSS feed parse failed: ${error instanceof Error ? error.message : "unknown"}`);
}

if (issues.length) {
  console.error("News feed contract doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("News feed contract doctor passed.");
console.log(`- Checked ${pass.length} required files`);
console.log("- JSON feed providers support seed fallback plus approved external feeds");
console.log("- RSS/Atom sample feed validates as visible official benefit data");
console.log("- Sample feed validates as visible official benefit data");
