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
const eventProvider = requireFile("lib/deals/providers/eventNewsProvider.ts", "event news provider");
const officialProvider = requireFile("lib/deals/providers/officialEventProvider.ts", "official event provider");
const couponProvider = requireFile("lib/deals/providers/publicCouponProvider.ts", "public coupon provider");
const refreshScript = requireFile("scripts/refresh-news-deals.mjs", "refresh script");
const verifyScript = requireFile("scripts/verify-news-deals.mjs", "verify script");
const envExample = requireFile(".env.example", "env example");
const docs = requireFile("docs/news-feed-contract.md", "feed contract docs");
const sampleRaw = requireFile("data/newsFeed.sample.json", "sample feed");
const sampleRssRaw = requireFile("data/newsFeed.sample.rss.xml", "sample RSS feed");

for (const phrase of ["createJsonFeedNewsProvider", "fetchJsonNewsFeed", "fetchNewsFeed", "parseNewsFeedXmlItems", "AbortController", "redirect: \"follow\"", "User-Agent"]) {
  if (!provider.includes(phrase)) issues.push(`news provider missing ${phrase}`);
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

for (const phrase of ["공식 승인 도메인", "검색 결과 URL", "커뮤니티", "finalUrl", "RSS", "Atom", "npm run refresh:news", "data/newsFeed.sample.json", "data/newsFeed.sample.rss.xml"]) {
  if (!docs.includes(phrase)) issues.push(`feed contract docs missing ${phrase}`);
}

for (const phrase of ["fetchNewsFeed", "DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS", "DEAL_EVENT_NEWS_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"]) {
  if (!refreshScript.includes(phrase)) issues.push(`refresh-news-deals missing ${phrase}`);
}

for (const phrase of ["searchLinkExposure", "nonOfficialExposure", "expiredExposure", "thinCategories"]) {
  if (!verifyScript.includes(phrase)) issues.push(`verify-news-deals missing ${phrase}`);
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
  if (items.length < 2) {
    issues.push("sample RSS feed should include at least two official benefit items");
  } else {
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
