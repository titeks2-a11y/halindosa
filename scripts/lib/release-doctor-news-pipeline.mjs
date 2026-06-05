import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fail, pass, root, smokeSourceSync, withQaRunnerScripts } from "./release-doctor-harness.mjs";

export function checkNewsDealPipeline() {
  const requiredFiles = [
    "lib/deals/providers/newsProvider.ts",
    "lib/deals/feedUrls.ts",
    "lib/deals/providers/eventNewsProvider.ts",
    "lib/deals/providers/officialEventProvider.ts",
    "lib/deals/providers/publicCouponProvider.ts",
    "lib/deals/newsOperations.ts",
    "lib/deals/newsOverrides.ts",
    "lib/deals/newsLinkPolicy.ts",
    "lib/operations/newsFeedDryRun.ts",
    "lib/operations/newsFeedPreview.ts",
    "scripts/refresh-news-deals.mjs",
    "scripts/verify-news-deals.mjs",
    "scripts/news-freshness-doctor.mjs",
    "scripts/news-feed-contract-doctor.mjs",
    "scripts/news-feed-canary.mjs",
    "scripts/news-feed-live-pipeline.mjs",
    "scripts/news-feed-preview.mjs",
    "scripts/test-news-feed-error-gate.mjs",
    "scripts/test-news-feed-dry-run.mjs",
    "scripts/feed-url-utils.mjs",
    "scripts/refresh-all.mjs",
    "data/officialBenefitFeedSources.json",
    "data/newsDeals.seed.json",
    "data/newsFeed.sample.json",
    "data/newsFeed.sample.rss.xml",
    "data/refreshedNewsDeals.json",
    "reports/news-deals.json",
    "reports/news-freshness.json",
    "reports/news-feed-canary.json",
    "reports/news-feed-live-pipeline.json",
    "reports/news-feed-preview.json",
    "docs/NEWS_FRESHNESS_REPORT.md",
    "docs/NEWS_FEED_CANARY_REPORT.md",
    "docs/NEWS_FEED_LIVE_PIPELINE.md",
    "docs/NEWS_FEED_PREVIEW_REPORT.md",
    "docs/news-feed-contract.md",
    "docs/OFFICIAL_BENEFIT_SOURCE_CONFIG.md",
    "reports/refresh-all.json",
    "app/api/news-deals/route.ts",
    "app/go/news/[id]/route.ts",
    "app/api/admin/news-operations/route.ts",
    "app/api/admin/news-feed-canary/route.ts",
    "app/api/admin/news-feed-live/route.ts",
    "app/api/admin/news-feed-preview/route.ts",
    "components/NewsFeedDryRunPanel.tsx",
    "components/OfficialBenefitIntentGroups.tsx",
    "components/RealtimeNewsDealsSection.tsx"
  ];
  const issues = [];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length) issues.push(`missing files: ${missing.join(", ")}`);

  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  const packageJson = withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8")));
  const refreshScript = existsSync(join(root, "scripts/refresh-news-deals.mjs")) ? readFileSync(join(root, "scripts/refresh-news-deals.mjs"), "utf8") : "";
  const verifyScript = existsSync(join(root, "scripts/verify-news-deals.mjs")) ? readFileSync(join(root, "scripts/verify-news-deals.mjs"), "utf8") : "";
  const freshnessScript = existsSync(join(root, "scripts/news-freshness-doctor.mjs")) ? readFileSync(join(root, "scripts/news-freshness-doctor.mjs"), "utf8") : "";
  const feedDoctorScript = existsSync(join(root, "scripts/news-feed-contract-doctor.mjs")) ? readFileSync(join(root, "scripts/news-feed-contract-doctor.mjs"), "utf8") : "";
  const feedCanaryScript = existsSync(join(root, "scripts/news-feed-canary.mjs")) ? readFileSync(join(root, "scripts/news-feed-canary.mjs"), "utf8") : "";
  const feedLivePipelineScript = existsSync(join(root, "scripts/news-feed-live-pipeline.mjs")) ? readFileSync(join(root, "scripts/news-feed-live-pipeline.mjs"), "utf8") : "";
  const feedPreviewScript = existsSync(join(root, "scripts/news-feed-preview.mjs")) ? readFileSync(join(root, "scripts/news-feed-preview.mjs"), "utf8") : "";
  const feedPreviewOperation = existsSync(join(root, "lib/operations/newsFeedPreview.ts")) ? readFileSync(join(root, "lib/operations/newsFeedPreview.ts"), "utf8") : "";
  const feedDryRunOperation = existsSync(join(root, "lib/operations/newsFeedDryRun.ts")) ? readFileSync(join(root, "lib/operations/newsFeedDryRun.ts"), "utf8") : "";
  const feedPreviewReport = existsSync(join(root, "reports/news-feed-preview.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-preview.json"), "utf8")) : {};
  const feedCanaryReport = existsSync(join(root, "reports/news-feed-canary.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-canary.json"), "utf8")) : {};
  const feedLivePipelineReport = existsSync(join(root, "reports/news-feed-live-pipeline.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-live-pipeline.json"), "utf8")) : {};
  const feedCanaryGeneratedAt = Date.parse(String(feedCanaryReport.generatedAt ?? ""));
  const feedCanaryAgeHours = Number.isFinite(feedCanaryGeneratedAt)
    ? Math.round(((Date.now() - feedCanaryGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
    : Number.POSITIVE_INFINITY;
  const feedCanaryStaleHours = Number(feedCanaryReport.staleHours ?? 24);
  const feedCanaryFreshEnough = Number.isFinite(feedCanaryAgeHours) && feedCanaryAgeHours <= feedCanaryStaleHours;
  const feedLivePipelineGeneratedAt = Date.parse(String(feedLivePipelineReport.generatedAt ?? ""));
  const feedLivePipelineAgeHours = Number.isFinite(feedLivePipelineGeneratedAt)
    ? Math.round(((Date.now() - feedLivePipelineGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
    : Number.POSITIVE_INFINITY;
  const feedLivePipelineFreshEnough = Number.isFinite(feedLivePipelineAgeHours) && feedLivePipelineAgeHours <= 24;
  const feedCanaryDocs = existsSync(join(root, "docs/NEWS_FEED_CANARY_REPORT.md")) ? readFileSync(join(root, "docs/NEWS_FEED_CANARY_REPORT.md"), "utf8") : "";
  const feedLivePipelineDocs = existsSync(join(root, "docs/NEWS_FEED_LIVE_PIPELINE.md")) ? readFileSync(join(root, "docs/NEWS_FEED_LIVE_PIPELINE.md"), "utf8") : "";
  const feedPreviewDocs = existsSync(join(root, "docs/NEWS_FEED_PREVIEW_REPORT.md")) ? readFileSync(join(root, "docs/NEWS_FEED_PREVIEW_REPORT.md"), "utf8") : "";
  const sourceConfigDocs = existsSync(join(root, "docs/OFFICIAL_BENEFIT_SOURCE_CONFIG.md")) ? readFileSync(join(root, "docs/OFFICIAL_BENEFIT_SOURCE_CONFIG.md"), "utf8") : "";
  const officialBenefitFeedSources = existsSync(join(root, "data/officialBenefitFeedSources.json")) ? JSON.parse(readFileSync(join(root, "data/officialBenefitFeedSources.json"), "utf8")) : [];
  const sourceConfigHasOperationalMetadata =
    Array.isArray(officialBenefitFeedSources) &&
    officialBenefitFeedSources.every(
      (source) =>
        Array.isArray(source.targetSections) &&
        source.targetSections.length &&
        source.operatorOwner &&
        ["high", "medium", "low"].includes(source.launchPriority) &&
        Number(source.refreshCadenceMinutes) > 0 &&
        Array.isArray(source.qualityChecklist) &&
        source.qualityChecklist.length >= 3
    );
  const configuredFeedErrorTest = existsSync(join(root, "scripts/test-news-feed-error-gate.mjs")) ? readFileSync(join(root, "scripts/test-news-feed-error-gate.mjs"), "utf8") : "";
  const feedDryRunTest = existsSync(join(root, "scripts/test-news-feed-dry-run.mjs")) ? readFileSync(join(root, "scripts/test-news-feed-dry-run.mjs"), "utf8") : "";
  const feedDryRunRegressionReport = existsSync(join(root, "reports/news-feed-dry-run-regression.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-dry-run-regression.json"), "utf8")) : {};
  const feedUrlParser = existsSync(join(root, "lib/deals/feedUrls.ts")) ? readFileSync(join(root, "lib/deals/feedUrls.ts"), "utf8") : "";
  const scriptFeedUrlParser = existsSync(join(root, "scripts/feed-url-utils.mjs")) ? readFileSync(join(root, "scripts/feed-url-utils.mjs"), "utf8") : "";
  const newsUtils = existsSync(join(root, "scripts/news-deal-utils.mjs")) ? readFileSync(join(root, "scripts/news-deal-utils.mjs"), "utf8") : "";
  const newsDealsRuntime = existsSync(join(root, "lib/deals/newsDeals.ts")) ? readFileSync(join(root, "lib/deals/newsDeals.ts"), "utf8") : "";
  const newsDealTypes = existsSync(join(root, "types/newsDeal.ts")) ? readFileSync(join(root, "types/newsDeal.ts"), "utf8") : "";
  const refreshAllScript = existsSync(join(root, "scripts/refresh-all.mjs")) ? readFileSync(join(root, "scripts/refresh-all.mjs"), "utf8") : "";
  const newsProvider = existsSync(join(root, "lib/deals/providers/newsProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/newsProvider.ts"), "utf8") : "";
  const eventNewsProvider = existsSync(join(root, "lib/deals/providers/eventNewsProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/eventNewsProvider.ts"), "utf8") : "";
  const officialEventProvider = existsSync(join(root, "lib/deals/providers/officialEventProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/officialEventProvider.ts"), "utf8") : "";
  const publicCouponProvider = existsSync(join(root, "lib/deals/providers/publicCouponProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/publicCouponProvider.ts"), "utf8") : "";
  const newsFeedContract = existsSync(join(root, "docs/news-feed-contract.md")) ? readFileSync(join(root, "docs/news-feed-contract.md"), "utf8") : "";
  const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
  const homeApi = existsSync(join(root, "lib/homeApi.ts")) ? readFileSync(join(root, "lib/homeApi.ts"), "utf8") : "";
  const homeRuntimeSource = `${homePage}\n${homeApi}`;
  const adminPage = [
    readFileSync(join(root, "app/admin/page.tsx"), "utf8"),
    existsSync(join(root, "components/AdminNewsCollectionPanel.tsx")) ? readFileSync(join(root, "components/AdminNewsCollectionPanel.tsx"), "utf8") : ""
  ].join("\n");
  const adminNewsOperationsPanel = existsSync(join(root, "components/AdminNewsOperationsPanel.tsx"))
    ? readFileSync(join(root, "components/AdminNewsOperationsPanel.tsx"), "utf8")
    : "";
  const newsFeedDryRunPanel = existsSync(join(root, "components/NewsFeedDryRunPanel.tsx"))
    ? readFileSync(join(root, "components/NewsFeedDryRunPanel.tsx"), "utf8")
    : "";
  const adminNewsOperationsRoute = existsSync(join(root, "app/api/admin/news-operations/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-operations/route.ts"), "utf8")
    : "";
  const adminNewsFeedCanaryRoute = existsSync(join(root, "app/api/admin/news-feed-canary/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-canary/route.ts"), "utf8")
    : "";
  const adminNewsFeedLiveRoute = existsSync(join(root, "app/api/admin/news-feed-live/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-live/route.ts"), "utf8")
    : "";
  const adminNewsFeedPreviewRoute = existsSync(join(root, "app/api/admin/news-feed-preview/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-preview/route.ts"), "utf8")
    : "";
  const newsOperations = existsSync(join(root, "lib/deals/newsOperations.ts")) ? readFileSync(join(root, "lib/deals/newsOperations.ts"), "utf8") : "";
  const sourceConfigHelper = existsSync(join(root, "scripts/official-benefit-source-config.mjs"))
    ? readFileSync(join(root, "scripts/official-benefit-source-config.mjs"), "utf8")
    : "";
  const realtimeNewsSection = existsSync(join(root, "components/RealtimeNewsDealsSection.tsx")) ? readFileSync(join(root, "components/RealtimeNewsDealsSection.tsx"), "utf8") : "";
  const officialBenefitIntentGroups = existsSync(join(root, "components/OfficialBenefitIntentGroups.tsx"))
    ? readFileSync(join(root, "components/OfficialBenefitIntentGroups.tsx"), "utf8")
    : "";
  const realtimeNewsUiSource = `${realtimeNewsSection}\n${officialBenefitIntentGroups}`;
  const homeOfficialBenefitAlertRail = existsSync(join(root, "components/HomeOfficialBenefitAlertRail.tsx"))
    ? readFileSync(join(root, "components/HomeOfficialBenefitAlertRail.tsx"), "utf8")
    : "";
  const newsRedirectRoute = existsSync(join(root, "app/go/news/[id]/route.ts")) ? readFileSync(join(root, "app/go/news/[id]/route.ts"), "utf8") : "";
  const newsLinkPolicy = existsSync(join(root, "lib/deals/newsLinkPolicy.ts")) ? readFileSync(join(root, "lib/deals/newsLinkPolicy.ts"), "utf8") : "";
  const smokeScript = smokeSourceSync();

  for (const key of ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS", "DEAL_EVENT_NEWS_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"]) {
    if (!envExample.includes(key)) issues.push(`env example missing ${key}`);
  }

  if (!packageJson.scripts?.["refresh:news"] || !packageJson.scripts?.["verify:news"] || !packageJson.scripts?.["news:freshness:doctor"] || !packageJson.scripts?.["news:feed:doctor"] || !packageJson.scripts?.["news:feed:canary"] || !packageJson.scripts?.["news:feed:live"] || !packageJson.scripts?.["test:news-feed-errors"] || !packageJson.scripts?.["test:news-feed-dry-run"] || !packageJson.scripts?.["refresh:all"]) {
    issues.push("package scripts should expose refresh:news, verify:news, news:freshness:doctor, news:feed:doctor, news:feed:canary, news:feed:live, test:news-feed-errors, test:news-feed-dry-run, and refresh:all");
  }
  if (!String(packageJson.scripts?.qa ?? "").includes("news:freshness:doctor") || !String(packageJson.scripts?.qa ?? "").includes("news:feed:doctor") || !String(packageJson.scripts?.qa ?? "").includes("news:feed:canary") || !String(packageJson.scripts?.qa ?? "").includes("test:news-feed-errors") || !String(packageJson.scripts?.qa ?? "").includes("test:news-feed-dry-run")) {
    issues.push("qa should include news:freshness:doctor, news:feed:doctor, news:feed:canary, test:news-feed-errors, and test:news-feed-dry-run");
  }

  for (const phrase of ["not_approved_official_url", "search_or_result_url", "expired_event", "official_event_seed_and_approved_feeds"]) {
    if (!refreshScript.includes(phrase) && !verifyScript.includes(phrase) && !newsUtils.includes(phrase)) {
      issues.push(`news verification missing ${phrase}`);
    }
  }
  for (const phrase of ["buildPolicyRegressionScenarios", "news-regression-search-url", "news-regression-community-url", "news-regression-news-only-url", "news-regression-expired-event", "news-regression-unsafe-url"]) {
    if (!verifyScript.includes(phrase)) issues.push(`verify:news missing policy regression sample ${phrase}`);
  }
  for (const field of ["source", "mallName", "originalUrl", "affiliateUrl", "eventUrl", "linkType", "availability", "validationCode", "validationReason", "priorityScore", "publishable"]) {
    if (!newsDealTypes.includes(`${field}:`) && !newsDealTypes.includes(`${field}?:`)) {
      issues.push(`NewsDeal type missing launch quality field ${field}`);
    }
    if (!newsUtils.includes(field)) {
      issues.push(`news normalization/validation missing launch quality field ${field}`);
    }
    if (!verifyScript.includes(field)) {
      issues.push(`verify:news missing launch quality field gate ${field}`);
    }
  }

  for (const step of ["refresh-deals.mjs", "refresh-news-deals.mjs", "verify-product-links-live.mjs", "verify-products.mjs", "verify-news-deals.mjs"]) {
    if (!refreshAllScript.includes(step)) issues.push(`refresh:all missing ${step}`);
  }
  if (!refreshAllScript.includes('"--body"')) {
    issues.push("refresh:all should run product link verification with live body probing");
  }
  if (
    !newsProvider.includes("createJsonFeedNewsProvider") ||
    !newsProvider.includes("fetchJsonNewsFeed") ||
    !newsProvider.includes("fetchNewsFeed") ||
    !newsProvider.includes("parseNewsFeedXmlItems") ||
    !newsProvider.includes("extractOfficialUrlFromBlock") ||
    !newsProvider.includes("isApprovedOfficialNewsUrl") ||
    !newsProvider.includes("AbortController") ||
    !eventNewsProvider.includes("DEAL_EVENT_NEWS_FEED_URLS") ||
    !officialEventProvider.includes("OFFICIAL_EVENT_FEED_URLS") ||
    !officialEventProvider.includes("DEAL_EVENT_FEED_URLS") ||
    !publicCouponProvider.includes("PUBLIC_COUPON_FEED_URLS") ||
    !feedDoctorScript.includes("data/newsFeed.sample.json") ||
    !feedDoctorScript.includes("data/newsFeed.sample.rss.xml") ||
    !feedDoctorScript.includes("sample-rss-news-with-official-link") ||
    !feedDoctorScript.includes("official href to finalUrl") ||
    !feedDoctorScript.includes("parseNewsFeedXmlItems") ||
    !feedDoctorScript.includes("validateNewsDeal") ||
    !feedPreviewScript.includes("officialLinkPromotedCount") ||
    !feedPreviewScript.includes("contract_sample_preview") ||
    !feedPreviewScript.includes("configured_feed_preview") ||
    !feedPreviewScript.includes("reports/news-feed-preview.json") ||
    !feedPreviewOperation.includes("getNewsFeedPreviewReport") ||
    !feedPreviewOperation.includes("officialLinkPromotedCount") ||
    !feedPreviewOperation.includes("exposedSearchLinkCount") ||
    !feedPreviewOperation.includes("nextActions") ||
    !feedDryRunOperation.includes("dryRunNewsFeedPreview") ||
    !feedDryRunOperation.includes("parseNewsFeedXmlItems") ||
    !feedDryRunOperation.includes("isApprovedOfficialNewsUrl") ||
    !feedDryRunOperation.includes("search_or_result_url") ||
    !feedDryRunOperation.includes("blocked_news_or_community_context_url") ||
    !adminNewsFeedPreviewRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedPreviewRoute.includes("buildPreviewCsv") ||
    !adminNewsFeedPreviewRoute.includes("text/csv") ||
    !adminNewsFeedPreviewRoute.includes("getNewsFeedPreviewReport") ||
    !adminNewsFeedPreviewRoute.includes("POST") ||
    !adminNewsFeedPreviewRoute.includes("dryRunNewsFeedPreview") ||
    !feedPreviewDocs.includes("뉴스 본문 공식 링크 승격") ||
    feedPreviewReport.officialLinkPromotedCount < 1 ||
    feedPreviewReport.summary?.exposedSearchLinkCount !== 0 ||
    feedPreviewReport.summary?.exposedNonOfficialLinkCount !== 0 ||
    !feedUrlParser.includes("parseFeedUrlList") ||
    !feedUrlParser.includes("JSON.parse") ||
    !feedUrlParser.includes("[;,](?=") ||
    !scriptFeedUrlParser.includes("parseFeedUrlList") ||
    !scriptFeedUrlParser.includes("JSON.parse") ||
    !scriptFeedUrlParser.includes("[;,](?=") ||
    !configuredFeedErrorTest.includes("not-a-halindosa-feed") ||
    !configuredFeedErrorTest.includes("/broken.txt") ||
    !configuredFeedErrorTest.includes("tags=mart,coupon") ||
    !configuredFeedErrorTest.includes("base64,") ||
    !configuredFeedErrorTest.includes("configuredFeedErrors") ||
    !configuredFeedErrorTest.includes("seedCount") ||
    !configuredFeedErrorTest.includes("feedItemCount") ||
    !configuredFeedErrorTest.includes("feedSuccessCount") ||
    !configuredFeedErrorTest.includes("collectedCount") ||
    !configuredFeedErrorTest.includes("configuredEmptyFeed") ||
    !configuredFeedErrorTest.includes("DEAL_NEWS_FEED_URLS") ||
    !configuredFeedErrorTest.includes("verify-news-deals.mjs") ||
    !feedDryRunTest.includes("dry-run-negative-search-url") ||
    !feedDryRunTest.includes("dry-run-negative-news-only") ||
    !feedDryRunTest.includes("dry-run-negative-expired-official") ||
    !feedDryRunTest.includes("news-feed-dry-run-regression.json") ||
    feedDryRunRegressionReport.ok !== true ||
    feedDryRunRegressionReport.hiddenCount < 3 ||
    !freshnessScript.includes("reports/news-freshness.json") ||
    !feedCanaryScript.includes("reports/news-feed-canary.json") ||
    !feedCanaryScript.includes("configured_empty_feed") ||
    !feedCanaryScript.includes("live_feed_ready") ||
    !feedCanaryScript.includes("seed_fallback_only") ||
    !feedLivePipelineScript.includes("source-feed-env-doctor.mjs") ||
    !feedLivePipelineScript.includes("news-feed-canary.mjs") ||
    !feedLivePipelineScript.includes("refresh-news-deals.mjs") ||
    !feedLivePipelineScript.includes("verify-news-deals.mjs") ||
    !feedLivePipelineScript.includes("refresh-all.mjs") ||
    !feedLivePipelineScript.includes("verify-product-links-live.mjs") ||
    !feedLivePipelineScript.includes("health-readiness-report.mjs") ||
    !feedLivePipelineScript.includes("reports/news-feed-live-pipeline.json") ||
    !adminNewsFeedCanaryRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedCanaryRoute.includes("buildFeedCanaryCsv") ||
    !adminNewsFeedCanaryRoute.includes("text/csv") ||
    !adminNewsFeedCanaryRoute.includes("getNewsOperationsReport") ||
    !adminNewsFeedLiveRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedLiveRoute.includes("buildLivePipelineCsv") ||
    !adminNewsFeedLiveRoute.includes("text/csv") ||
    !adminNewsFeedLiveRoute.includes("news-feed-live-pipeline.json") ||
    !freshnessScript.includes("expiredVisibleCount") ||
    !freshnessScript.includes("expiringWithin14Days") ||
    !freshnessScript.includes("lastCheckedAt") ||
    !freshnessScript.includes("officialSourceCandidates")
  ) {
    issues.push("official benefit providers should support seed fallback plus approved JSON/RSS/Atom feed ingestion with a contract doctor, canary, freshness doctor, and configured feed error regression");
  }
  if (
    feedCanaryReport.ok !== true ||
    !["seed_fallback_only", "live_feed_ready"].includes(feedCanaryReport.status) ||
    !["fresh", "due", "stale", "missing"].includes(feedCanaryReport.freshnessStatus) ||
    typeof feedCanaryReport.staleHours !== "number" ||
    !feedCanaryFreshEnough ||
    typeof feedCanaryReport.configuredFeedUrls !== "number" ||
    typeof feedCanaryReport.visibleCandidateCount !== "number"
  ) {
    issues.push("news feed canary report should pass, be fresher than the stale threshold, and expose configured feed URL and visible candidate counters");
  }
  if (
    feedLivePipelineReport.ok !== true ||
    !["seed_launch_ready", "live_feed_ready"].includes(feedLivePipelineReport.status) ||
    !feedLivePipelineFreshEnough ||
    typeof feedLivePipelineReport.configuredUrlCount !== "number" ||
    !["fresh", "due"].includes(feedLivePipelineReport.canary?.freshnessStatus) ||
    Number(feedLivePipelineReport.officialBenefits?.visibleCount ?? 0) < 40 ||
    Number(feedLivePipelineReport.officialBenefits?.exposedSearchLinkCount ?? 1) !== 0 ||
    Number(feedLivePipelineReport.officialBenefits?.exposedNonOfficialLinkCount ?? 1) !== 0 ||
    Number(feedLivePipelineReport.officialBenefits?.expiredCount ?? 1) !== 0
  ) {
    issues.push("news feed live pipeline should pass recently and prove official benefits expose no search, non-official, or expired links");
  }
  if (!adminPage.includes("canary JSON") || !adminPage.includes("canary CSV") || !smokeScript.includes("admin news feed canary api")) {
    issues.push("admin dashboard and smoke tests should expose protected official feed canary JSON/CSV checks");
  }
  if (!adminPage.includes("live JSON") || !adminPage.includes("live CSV") || !smokeScript.includes("admin news feed live pipeline api")) {
    issues.push("admin dashboard and smoke tests should expose protected official feed live pipeline JSON/CSV checks");
  }
  for (const phrase of ["공식 혜택 Feed Canary", "신선도", "연결된 feed URL", "설정 feed 공백", "npm run news:feed:canary"]) {
    if (!feedCanaryDocs.includes(phrase)) issues.push(`news feed canary docs missing ${phrase}`);
  }
  for (const phrase of ["실시간 공식 feed 운영 파이프라인", "npm run news:feed:live", "검색 결과 URL", "공식 혜택", "canary"]) {
    if (!feedLivePipelineDocs.includes(phrase)) issues.push(`news feed live pipeline docs missing ${phrase}`);
  }
  for (const phrase of ["공식 혜택 Feed 계약", "검색 결과 URL", "커뮤니티", "finalUrl", "RSS", "Atom", "본문 안 공식 링크", "npm run refresh:news", "configuredFeedErrors", "설정된 운영 feed"]) {
    if (!newsFeedContract.includes(phrase)) issues.push(`news feed contract docs missing ${phrase}`);
  }
  if (
    !Array.isArray(officialBenefitFeedSources) ||
    officialBenefitFeedSources.length < 4 ||
    !officialBenefitFeedSources.every(
      (source) =>
        source.provider &&
        Array.isArray(source.env) &&
        source.env.length &&
        Array.isArray(source.recommendedQueries) &&
        source.allowedUse &&
        source.blockedUse
    ) ||
    !sourceConfigHasOperationalMetadata ||
    (!refreshScript.includes("officialBenefitFeedSources.json") && !sourceConfigHelper.includes("officialBenefitFeedSources.json")) ||
    !refreshScript.includes("sourceConfigSummary") ||
    !sourceConfigDocs.includes("data/officialBenefitFeedSources.json") ||
    !sourceConfigDocs.includes("검색 결과, 커뮤니티 원문, 블로그, 뉴스 기사 단독 링크") ||
    !sourceConfigDocs.includes("refreshCadenceMinutes") ||
    !sourceConfigDocs.includes("qualityChecklist") ||
    !sourceConfigHelper.includes("sourceRefreshWindows") ||
    !sourceConfigHelper.includes("nextRefreshAt") ||
    !sourceConfigHelper.includes("operatorAction")
  ) {
    issues.push("official benefit feed source config should let operators add approved providers with owner, cadence, next refresh window, target section, quality checklist, and allowed/blocked source policy");
  }

  if (!homeRuntimeSource.includes("RealtimeNewsDealsSection") || !homeRuntimeSource.includes("/api/news-deals?${params.toString()}") || !homeRuntimeSource.includes("params.set(\"q\"") || !homeRuntimeSource.includes("activeQuery={query}") || !homeRuntimeSource.includes("refreshNewsDeals") || !homeRuntimeSource.includes("120_000")) {
    issues.push("home should show verified realtime discount news section from /api/news-deals with live refresh");
  }
  if (
    !newsDealsRuntime.includes("buildNewsFreshness") ||
    !newsDealsRuntime.includes("freshnessCadenceMinutes") ||
    !newsDealsRuntime.includes("freshnessStaleAfterMinutes") ||
    !newsDealsRuntime.includes("freshnessStatus") ||
    !newsDealsRuntime.includes("categoryCounts") ||
    !newsDealsRuntime.includes("benefitTypeCounts") ||
    !newsDealsRuntime.includes("sourceCounts") ||
    !newsDealsRuntime.includes("recommendedQueries") ||
    !newsDealsRuntime.includes("targetSections") ||
    !newsDealsRuntime.includes("intentGroups") ||
    !newsDealsRuntime.includes("buildNewsIntentGroups") ||
    !newsDealsRuntime.includes("buildConfiguredNewsTargetSections") ||
    !newsDealsRuntime.includes("buildRecommendedNewsQueries") ||
    !newsDealsRuntime.includes("seed 기준")
  ) {
    issues.push("news deals runtime should expose freshness status, result aggregations, recommended queries, target sections, intent groups, cadence, stale threshold, and seed fallback state");
  }
  if (!realtimeNewsUiSource.includes("activeQuery") || !realtimeNewsUiSource.includes("공식 혜택 검색 결과 요약") || !realtimeNewsUiSource.includes("상품 검색어 기준으로 공식 혜택도 함께 좁혔습니다")) {
    issues.push("realtime official benefit section should explain search-filtered official benefit results");
  }
  if (!realtimeNewsUiSource.includes("공식 혜택 신선도 안내") || !realtimeNewsUiSource.includes("freshnessLabel") || !realtimeNewsUiSource.includes("freshnessAgeMinutes")) {
    issues.push("realtime official benefit section should surface freshness status without implying unverified realtime data");
  }
  if (!homePage.includes("newsTotalCount") || !realtimeNewsUiSource.includes("visibleResultCount") || !realtimeNewsUiSource.includes("먼저 볼")) {
    issues.push("home realtime official benefit section should preserve total API result count even when rows are limited");
  }
  if (!homePage.includes("newsRecommendedQueries") || !realtimeNewsUiSource.includes("공식 혜택 추천 검색어") || !realtimeNewsUiSource.includes("onSelectQuery")) {
    issues.push("home realtime official benefit section should expose recommended official benefit search chips");
  }
  if (!homePage.includes("newsTargetSections") || !realtimeNewsUiSource.includes("운영 추천 혜택 지도") || !realtimeNewsUiSource.includes("targetSections")) {
    issues.push("home realtime official benefit section should expose operator target section chips for free, coupon, mart, delivery, card, and public benefits");
  }
  if (!homePage.includes("newsIntentGroups") || !realtimeNewsUiSource.includes("오늘 먼저 볼 혜택") || !realtimeNewsUiSource.includes("intentGroups")) {
    issues.push("home realtime official benefit section should expose customer intent groups for free, coupon, mart, delivery, card, and public benefits");
  }
  if (
    !adminNewsOperationsPanel.includes("sourceRefreshWindows") ||
    !adminNewsOperationsPanel.includes("소스별 재확인 큐") ||
    !adminNewsOperationsPanel.includes("nextRefreshAt")
  ) {
    issues.push("admin official benefit operations should expose source refresh windows and next refresh timing for operator handoff");
  }
  if (
    !realtimeNewsUiSource.includes("/go/news/") ||
    !newsRedirectRoute.includes("resolveNewsDealDestinationUrl") ||
    !newsRedirectRoute.includes("recordDealClick") ||
    !newsLinkPolicy.includes("approvedNewsHosts") ||
    !newsLinkPolicy.includes("officialSourceCatalog") ||
    !newsLinkPolicy.includes("approvedNewsHostSet")
  ) {
    issues.push("official news benefit clicks should pass through /go/news/[id] with link policy and click logging");
  }
  if (
    !homePage.includes("HomeOfficialBenefitAlertRail") ||
    !homeOfficialBenefitAlertRail.includes("readRecentNewsBenefitIds") ||
    !homeOfficialBenefitAlertRail.includes("recentNewsBenefitUpdatedEvent") ||
    !homeOfficialBenefitAlertRail.includes("재방문 혜택 큐") ||
    !homeOfficialBenefitAlertRail.includes("오늘 다시 볼 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("관심 카테고리 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("officialHost") ||
    !homeOfficialBenefitAlertRail.includes("target=\"_blank\"") ||
    !homeOfficialBenefitAlertRail.includes("noopener noreferrer")
  ) {
    issues.push("home should keep recent official benefit and interest news return queues");
  }

  if (!adminPage.includes("뉴스 수집 현황") || !adminPage.includes("운영 리포트 API 보기") || !adminPage.includes("Provider 위험도 CSV") || !adminPage.includes("공식 feed preview") || !adminPage.includes("Preview JSON") || !adminPage.includes("뉴스 본문 공식 링크 승격") || !adminPage.includes("NewsFeedDryRunPanel") || !adminPage.includes("공식 피드 전환 준비도") || !adminPage.includes("Provider별 성공/실패") || !adminPage.includes("실시간 feed") || !adminPage.includes("성공 feed") || !adminPage.includes("feed 공백") || !adminPage.includes("최근 20개 수집 로그") || !adminPage.includes("수동 숨김/복구/재검증 구조") || !adminPage.includes("캠페인 API 보기")) {
    issues.push("admin should expose news collection status, provider logs, CSV export, manual actions, and notification campaign operation links");
  }
  if (
    !adminPage.includes("AdminNewsOperationsPanel") ||
    !adminPage.includes("newsOperationsCsvHref") ||
    !adminNewsOperationsRoute.includes("format") ||
    !adminNewsOperationsRoute.includes("buildNewsOperationsCsv") ||
    !adminNewsOperationsRoute.includes("text/csv") ||
    !adminNewsOperationsRoute.includes("provider_risk") ||
    !adminNewsOperationsRoute.includes("feed_source_mix") ||
    !adminNewsOperationsRoute.includes("seed=") ||
    !adminNewsOperationsRoute.includes("feed=") ||
    !adminNewsOperationsRoute.includes("feed_transition") ||
    !adminNewsOperationsRoute.includes("renewal_queue") ||
    !adminNewsOperationsRoute.includes("watch_queue") ||
    !adminNewsOperationsRoute.includes("replacementCandidates") ||
    !smokeScript.includes("Admin news operations CSV should use text/csv") ||
    !smokeScript.includes("admin news feed preview api") ||
    !smokeScript.includes("Admin news feed preview CSV should use text/csv") ||
    !smokeScript.includes("Admin dashboard missing official news feed preview panel") ||
    !smokeScript.includes("Admin news feed dry-run should pass official RSS sample") ||
    !smokeScript.includes("Admin news feed dry-run should block search URL sample") ||
    !smokeScript.includes("Admin news feed dry-run should block news-only sample") ||
    !smokeScript.includes("Admin news feed dry-run should block expired official sample") ||
    !smokeScript.includes("Admin news feed dry-run should reject oversized source") ||
    !smokeScript.includes("Admin dashboard missing official news paste dry-run panel") ||
    !newsFeedDryRunPanel.includes("공식 뉴스·혜택 feed 붙여넣기 검증") ||
    !newsFeedDryRunPanel.includes("공식 feed dry-run 실행") ||
    !newsFeedDryRunPanel.includes("hiddenRows") ||
    !newsFeedDryRunPanel.includes("visibleRows") ||
    !adminNewsOperationsPanel.includes("공식 혜택 수동 운영") ||
    !adminNewsOperationsPanel.includes("runAction") ||
    !adminNewsOperationsPanel.includes("action: NewsOperationAction") ||
    !adminNewsOperationsPanel.includes("수동 숨김") ||
    !adminNewsOperationsPanel.includes("재검증 기록") ||
    !adminNewsOperationsPanel.includes("필수 혜택 카테고리 커버리지") ||
    !adminNewsOperationsPanel.includes("issueCount") ||
    !adminNewsOperationsPanel.includes("thin") ||
    !adminNewsOperationsPanel.includes("refresh:all 운영 상태") ||
    !adminNewsOperationsPanel.includes("Provider 위험도") ||
    !adminNewsOperationsPanel.includes("공식 feed 소스 설정") ||
    !adminNewsOperationsPanel.includes("추천 검색어 자동 큐") ||
    !adminNewsOperationsPanel.includes("허용·차단 가드레일") ||
    !adminNewsOperationsPanel.includes("공식 feed 우선 운영 액션 큐") ||
    !adminNewsOperationsPanel.includes("sourceConfigQueries") ||
    !adminNewsOperationsPanel.includes("sourceConfigGuardrails") ||
    !adminNewsOperationsPanel.includes("sourceActionQueue") ||
    !adminNewsOperationsPanel.includes("실패 사유별 운영 액션") ||
    !adminNewsOperationsPanel.includes("수집 로그 바로 점검") ||
    !adminNewsOperationsPanel.includes("getFailureReasonAction") ||
    !adminNewsOperationsPanel.includes("failureReasonTop10") ||
    !adminNewsOperationsPanel.includes("recentLogs") ||
    !adminNewsOperationsPanel.includes("priorityScore") ||
    !adminNewsOperationsPanel.includes("availability") ||
    !adminNewsOperationsPanel.includes("linkType") ||
    !adminNewsOperationsPanel.includes("신선도 운영") ||
    !adminNewsOperationsPanel.includes("다음 refresh 권장") ||
    !adminNewsOperationsPanel.includes("만료 임박 대체 큐") ||
    !adminNewsOperationsPanel.includes("추천 대체 소스") ||
    !adminNewsOperationsPanel.includes("renewalQueue") ||
    !adminNewsOperationsPanel.includes("operatorNextActions") ||
    !adminPage.includes("공식 혜택 다음 운영 액션") ||
    !newsOperations.includes("categoryCoverage") ||
    !newsOperations.includes("operationalRisks") ||
    !newsOperations.includes("getNewsFreshnessState") ||
    !newsOperations.includes("newsRefreshCadenceHours") ||
    !newsOperations.includes("operatorNextActions") ||
    !newsOperations.includes("providerRisks") ||
    !newsOperations.includes("providerRiskSummary") ||
    !newsOperations.includes("freshnessQueues") ||
    !newsOperations.includes("newsFreshnessReportPath") ||
    !newsOperations.includes("attachReplacementCandidates") ||
    !newsOperations.includes("getOfficialSourceOnboardingPlan") ||
    !newsOperations.includes("feedTransitionReadiness") ||
    !newsOperations.includes("sourceConfig") ||
    !newsOperations.includes("sourceActionQueue") ||
    !newsOperations.includes("buildSourceActionQueue") ||
    !newsOperations.includes("OfficialBenefitSourceConfig") ||
    !newsOperations.includes("buildFeedTransitionReadiness") ||
    !newsOperations.includes("seedCount") ||
    !newsOperations.includes("feedItemCount") ||
    !newsOperations.includes("feedSuccessCount") ||
    !newsOperations.includes("collectedCount") ||
    !newsOperations.includes("feedItemRate") ||
    !newsOperations.includes("configuredEmptyFeed") ||
    !refreshScript.includes("seedCount") ||
    !refreshScript.includes("feedItemCount") ||
    !refreshScript.includes("feedSuccessCount") ||
    !refreshScript.includes("collectedCount") ||
    !refreshScript.includes("configuredEmptyFeed") ||
    !newsOperations.includes("getEnvFeedUrls") ||
    !newsOperations.includes("DEAL_NEWS_FEED_URLS") ||
    !newsOperations.includes("getProviderRisk") ||
    !newsOperations.includes("requiredNewsCategories") ||
    !newsOperations.includes("minimumCategoryDealCount") ||
    !verifyScript.includes("minimumCategoryDealCount") ||
    !verifyScript.includes("thinCategories") ||
    !verifyScript.includes("policyRegression") ||
    !verifyScript.includes("configuredFeedErrors") ||
    !verifyScript.includes("searchLinkTypeExposure") ||
    !verifyScript.includes("inactiveVisibleExposure") ||
    !verifyScript.includes("missingQualityFieldCount") ||
    !newsOperations.includes("priorityScore") ||
    !newsOperations.includes("availability") ||
    !newsOperations.includes("linkType") ||
    !newsOperations.includes("durationMs") ||
    !smokeScript.includes("freshness?.cadenceHours === 6") ||
    !smokeScript.includes("operatorNextActions") ||
    !smokeScript.includes("providerRisks") ||
    !smokeScript.includes("feedTransitionReadiness") ||
    !smokeScript.includes("sourceConfig") ||
    !smokeScript.includes("sourceActionQueue") ||
    !smokeScript.includes("공식 feed 소스 설정") ||
    !smokeScript.includes("seed/feed source mix counters") ||
    !smokeScript.includes("external feed item count") ||
    !smokeScript.includes("configured empty feed") ||
    !smokeScript.includes("feed_source_mix")
  ) {
    issues.push("admin should provide executable hide/restore/revalidate controls plus CSV export, category coverage, provider risk, official feed transition readiness, refresh status, freshness cadence, next actions, and risk summaries for official benefit operations");
  }

  if (existsSync(join(root, "reports/news-deals.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/news-deals.json"), "utf8"));
    if (report.ok !== true) issues.push("news-deals report should pass");
    if ((report.visibleCount ?? 0) < 40) issues.push("news-deals report should include at least 40 visible official benefits across daily benefit categories");
    const requiredNewsCategories = ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"];
    const categoryCounts = report.categoryCounts ?? {};
    const missingCategories = requiredNewsCategories.filter((category) => !categoryCounts[category]);
    const thinCategories = requiredNewsCategories.filter((category) => Number(categoryCounts[category] ?? 0) > 0 && Number(categoryCounts[category] ?? 0) < 2);
    if (missingCategories.length) issues.push(`news-deals report missing required categories: ${missingCategories.join(", ")}`);
    if (thinCategories.length) issues.push(`news-deals report thin required categories: ${thinCategories.join(", ")}`);
    if (!Array.isArray(report.providerStats) || report.providerStats.length < 4) issues.push("news-deals report should include provider stats");
    if (
      !report.sourceConfig ||
      Number(report.sourceConfig.configuredSources ?? 0) < 4 ||
      !Array.isArray(report.sourceConfig.recommendedQueries) ||
      report.sourceConfig.recommendedQueries.length < 8 ||
      !Array.isArray(report.sourceConfig.guardrails) ||
      !report.sourceConfig.guardrails.some((rule) => String(rule).includes("검색 결과")) ||
      !Array.isArray(report.sourceConfig.sourceRefreshWindows) ||
      !report.sourceConfig.sourceRefreshWindows.every((item) => item.nextRefreshAt && Number(item.refreshCadenceMinutes ?? 0) > 0) ||
      !report.sourceConfig.nextRefreshAt ||
      !sourceConfigHasOperationalMetadata ||
      !sourceConfigHelper.includes("sourceOperations") ||
      !sourceConfigHelper.includes("minimumRefreshCadenceMinutes") ||
      !sourceConfigHelper.includes("sourceRefreshWindows")
    ) {
      issues.push("news-deals report should include operator source config, recommended queries, target sections, cadence, next refresh windows, owners, and blocked source guardrails");
    }
    if (
      Array.isArray(report.providerStats) &&
      report.providerStats.some(
        (provider) =>
          typeof provider.seedCount !== "number" ||
          typeof provider.feedItemCount !== "number" ||
          typeof provider.feedSuccessCount !== "number" ||
          typeof provider.collectedCount !== "number"
      )
    ) {
      issues.push("news-deals provider stats should separate seed fallback counts from external feed item counts");
    }
    if (Array.isArray(report.gates?.configuredFeedErrors) && report.gates.configuredFeedErrors.length > 0) issues.push("news-deals report should fail configured feed errors before release");
    if (report.gates && !Array.isArray(report.gates.configuredFeedErrors)) issues.push("news-deals report should expose configured feed error gate");
    if (report.gates?.policyRegression?.ok !== true || Number(report.gates?.policyRegression?.blockedNegativeSamples ?? 0) < 8) {
      issues.push("news-deals report should prove policy regression blocks search, community, news-only, expired, unclear, spam, missing URL, and unsafe official benefit samples");
    }
    if (!Array.isArray(report.gates?.policyRegression?.results) || !report.gates.policyRegression.results.some((item) => item.id === "news-regression-search-url" && item.hiddenReason?.includes("search_or_result_url"))) {
      issues.push("news-deals report should include a passing search URL policy regression sample");
    }
    if (!Array.isArray(report.gates?.policyRegression?.results) || !report.gates.policyRegression.results.some((item) => item.id === "news-regression-community-url" && item.hiddenReason?.includes("blocked_community_or_news_host"))) {
      issues.push("news-deals report should include a passing community URL policy regression sample");
    }
    if (!Array.isArray(report.recentLogs) || report.recentLogs.length < 5) issues.push("news-deals report should include recent collection logs");
    if (
      (report.exposedSearchLinkCount ?? 0) !== 0 ||
      (report.exposedNonOfficialLinkCount ?? 0) !== 0 ||
      (report.nonPublishableVisibleCount ?? 0) !== 0 ||
      (report.activeVisibleCount ?? 0) !== (report.visibleCount ?? 0)
    ) {
      issues.push("news-deals report should expose only active, publishable official link types with zero search/non-official exposure");
    }
    if ((report.averagePriorityScore ?? 0) < 70) issues.push("news-deals report should keep average official benefit priority score above 70");
    if (!Array.isArray(report.manualActions) || report.manualActions.length < 3) issues.push("news-deals report should include manual hide/restore/revalidate actions");
    if ((report.hiddenCount ?? 0) !== 0 || (report.expiredCount ?? 0) !== 0 || (report.officialMissingCount ?? 0) !== 0) {
      issues.push("news-deals report should expose zero hidden, expired, or non-official links");
    }
  }

  if (existsSync(join(root, "reports/news-freshness.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/news-freshness.json"), "utf8"));
    if (report.ok !== true) issues.push("news-freshness report should pass");
    if ((report.visibleCount ?? 0) < 40) issues.push("news-freshness report should include at least 40 visible official benefits");
    if ((report.expiredVisibleCount ?? 999) !== 0) issues.push("news-freshness report should show zero expired visible official benefits");
    if ((report.staleCheckedCount ?? 999) !== 0) issues.push("news-freshness report should show zero stale checked visible official benefits");
    if ((report.reportAgeHours ?? 999) > 24) issues.push("news-freshness report should be fresher than 24h");
    if ((report.officialSourceCandidates ?? 0) < 30) issues.push("news-freshness report should include at least 30 official source candidates");
    if (!Array.isArray(report.renewalQueue)) issues.push("news-freshness report should include a renewal queue");
    if (!report.categoryCounts || Object.keys(report.categoryCounts).length < 10) issues.push("news-freshness report should include category counts");
  } else {
    issues.push("reports/news-freshness.json is missing");
  }

  if (existsSync(join(root, "reports/refresh-all.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/refresh-all.json"), "utf8"));
    if (report.ok !== true) issues.push("refresh-all report should pass");
    if ((report.newsDealsCount ?? 0) < 40) issues.push("refresh-all should include expanded official news/event benefits");
    if ((report.productDealsCount ?? 0) < 140) issues.push("refresh-all should preserve 140 verified product deals");
    if (!Array.isArray(report.providerStats?.news) || report.providerStats.news.length < 4) issues.push("refresh-all should preserve news provider stats");
  }

  if (issues.length) fail("news and official event pipeline", issues.join("; "));
  else pass("news and official event pipeline", "Approved news, official event, public coupon, refresh:news, verify:news, refresh:all, home section, admin status surfaces, and provider-risk CSV export are wired.");
}
