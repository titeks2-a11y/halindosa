import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

const apiRoutes = [
  "app/api/deals/route.ts",
  "app/api/news-deals/route.ts",
  "app/api/hot-signals/route.ts",
  "app/api/home/route.ts"
];
const homeApi = read("lib/homeApi.ts");
const homeRealtimeConfig = read("lib/homeRealtimeConfig.ts");
const homePage = read("app/page.tsx");
const homeStatusStrip = read("components/home/HomeStatusStrip.tsx");
const hotSignalProvider = read("lib/hotSignalProvider.ts");
const packageJson = JSON.parse(read("package.json"));
const qaRunner = read("scripts/run-qa.mjs");
const harness = read("scripts/harness.mjs");
const refreshedNews = JSON.parse(read("data/refreshedNewsDeals.json"));
const newsReport = JSON.parse(read("reports/news-deals.json"));

for (const routePath of apiRoutes) {
  const route = read(routePath);
  if (includesAll(route, ['dynamic = "force-dynamic"', "revalidate = 0", 'fetchCache = "force-no-store"', "noStoreJson"])) {
    pass(`${routePath} no-store`, "실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.");
  } else {
    fail(`${routePath} no-store`, "API 라우트에 force-dynamic, revalidate=0, force-no-store, noStoreJson 중 빠진 항목이 있습니다.");
  }
}

if (includesAll(homeApi, ["buildHomeRequestUrl", "/api/home?", "HomeResponse", "HomeFreshness", "ts: String(timestamp)", "Date.now()", 'cache: "no-store"', '"Cache-Control": "no-cache"', "buildLatestDealsRequestUrl"])) {
  pass("home api cache buster", "홈 API 요청이 /api/home snapshot, freshness, no-store, timestamp cache-buster를 함께 사용합니다.");
} else {
  fail("home api cache buster", "홈 API 요청에 /api/home snapshot, freshness, timestamp 또는 no-store fetch 설정이 부족합니다.");
}

if (hotSignalProvider.includes('cache: "no-store"') && !hotSignalProvider.includes("revalidate: 120")) {
  pass("hot signal source no-store", "핫시그널 RSS/API/게시판 수집 fetch가 120초 route cache 대신 no-store로 최신 데이터를 요청합니다.");
} else {
  fail("hot signal source no-store", "핫시그널 수집 내부 fetch에 revalidate cache가 남아 있거나 no-store가 부족합니다.");
}

if (
  includesAll(homePage, [
    "HOME_REFRESH_INTERVAL_MS",
    "window.setInterval(refreshIfVisible, HOME_REFRESH_INTERVAL_MS)",
    "window.setInterval(refreshIfActive, HOME_REFRESH_INTERVAL_MS)",
    "refreshHomeNow",
    "refreshHomeSnapshot",
    "buildHomeRequestUrl",
    "buildCombinedHomeSnapshot",
    "setLastHomeSyncAt",
    "setHomeFreshness",
    "snapshot.freshness",
    "homeFreshnessLabel",
    "fetchDeals(undefined, true)",
    "refreshNewsDeals({ silent: true })",
    "fetchSignals(true)"
  ])
) {
  pass("home realtime refresh loop", "상품, 핫시그널, 공식 혜택이 동일한 운영 주기로 자동 갱신되고 수동 새로고침은 /api/home snapshot으로 한 번에 동기화됩니다.");
} else {
  fail("home realtime refresh loop", "홈 상품/뉴스/핫시그널 자동 갱신 또는 /api/home 수동 snapshot 연결이 부족합니다.");
}

const refreshIntervalMatch = homeRealtimeConfig.match(/HOME_REFRESH_INTERVAL_MS\s*=\s*([0-9_]+)/);
const refreshIntervalMs = refreshIntervalMatch ? Number(refreshIntervalMatch[1].replaceAll("_", "")) : Number.NaN;
if (
  Number.isFinite(refreshIntervalMs) &&
  refreshIntervalMs >= 30_000 &&
  refreshIntervalMs <= 60_000 &&
  homeRealtimeConfig.includes("HOME_REFRESH_CHANNELS") &&
  homeRealtimeConfig.includes("deals") &&
  homeRealtimeConfig.includes("newsDeals") &&
  homeRealtimeConfig.includes("hotSignals")
) {
  pass("home realtime cadence", `홈 자동 갱신 주기가 ${Math.round(refreshIntervalMs / 1000)}초이며 상품/공식혜택/핫시그널 채널을 함께 관리합니다.`);
} else {
  fail("home realtime cadence", "홈 자동 갱신 주기는 30~60초 범위여야 하며 deals/newsDeals/hotSignals 채널을 명시해야 합니다.");
}

const homeRoute = read("app/api/home/route.ts");
if (
  includesAll(homeRoute, [
    "newsMeta",
    "cachePolicy",
    'mode: "no-store"',
    "recommendedQueries",
    "categoryCounts",
    "benefitTypeCounts",
    "sourceCounts",
    "freshnessStatus",
    "targetSections",
    "buildHomeFreshness",
    "oldestChannel",
    "nextRefreshAt",
    "staleChannelCount",
    "channels"
  ])
) {
  pass("home snapshot metadata", "/api/home이 공식 혜택 추천, 전체 혜택 분포, 채널별 freshness, no-store 생성 메타를 함께 반환합니다.");
} else {
  fail("home snapshot metadata", "/api/home 응답에 공식 혜택 추천/전체 혜택 분포/채널별 freshness/no-store 메타가 부족합니다.");
}

const refreshedNewsDeals = Array.isArray(refreshedNews.deals) ? refreshedNews.deals : [];
const minimumVisibleOfficialBenefits = 80;
const realtimeReadyNewsDeals = refreshedNewsDeals.filter(
  (deal) =>
    deal.publishable === true &&
    deal.availability === "active" &&
    deal.validationStatus === "passed" &&
    Boolean(deal.updatedAt) &&
    Boolean(deal.verifiedAt) &&
    Boolean(deal.lastCheckedAt) &&
    Boolean(deal.source || deal.sourceName) &&
    Boolean(deal.imageUrl) &&
    ["official", "generated"].includes(deal.imageType) &&
    Number(deal.qualityScore ?? 0) >= 70 &&
    typeof deal.finalUrl === "string" &&
    /^https?:\/\//.test(deal.finalUrl) &&
    !/\/search|search\?|query=|keyword=|msearch|\/result|\/find/i.test(deal.finalUrl)
);

if (
  refreshedNews.generatedAt &&
  newsReport.generatedAt &&
  refreshedNewsDeals.length >= minimumVisibleOfficialBenefits &&
  realtimeReadyNewsDeals.length === refreshedNewsDeals.length &&
  Number(newsReport.visibleCount ?? 0) >= minimumVisibleOfficialBenefits &&
  Number(newsReport.exposedSearchLinkCount ?? 0) === 0 &&
  Number(newsReport.exposedNonOfficialLinkCount ?? 0) === 0
) {
  pass(
    "home realtime data snapshot",
    `수집 산출물 ${refreshedNewsDeals.length}개가 updatedAt/verifiedAt/availability/source/finalUrl을 갖고 홈 no-store API로 반영될 준비가 되어 있습니다.`
  );
} else {
  fail(
    "home realtime data snapshot",
    `수집 산출물 또는 검증 리포트가 홈 실시간 반영 기준을 충족하지 못했습니다. ready=${realtimeReadyNewsDeals.length}/${refreshedNewsDeals.length}, visible=${newsReport.visibleCount ?? 0}`
  );
}

if (includesAll(homeStatusStrip, ["실시간 검증됨", "업데이트", "새로고침", "onRefresh", "isRefreshing", "freshnessLabel", "staleChannelCount", "oldestChannel", "refreshIntervalSeconds", "자동 확인"])) {
  pass("home realtime status ux", "모바일 상태 배지에 최신성, 수동 새로고침, 진행 상태가 표시됩니다.");
} else {
  fail("home realtime status ux", "홈 상태 UI에 최신성 또는 수동 새로고침 표시가 부족합니다.");
}

if (
  packageJson.scripts?.["home:realtime:doctor"] === "node scripts/home-realtime-doctor.mjs" &&
  packageJson.scripts?.["test:home-realtime"] === "node scripts/home-realtime-doctor.mjs" &&
  qaRunner.includes("home:realtime:doctor") &&
  qaRunner.includes("test:home-realtime") &&
  harness.includes("home:realtime:doctor") &&
  harness.includes("test:home-realtime")
) {
  pass("home realtime qa gate", "home:realtime:doctor와 test:home-realtime이 package, QA, harness에 연결되어 있습니다.");
} else {
  fail("home realtime qa gate", "home:realtime:doctor 또는 test:home-realtime 스크립트가 package, QA, harness 중 일부에 연결되지 않았습니다.");
}

const failed = checks.filter((check) => !check.ok);
const report = {
  generatedAt: new Date().toISOString(),
  ok: failed.length === 0,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  checkedApiRoutes: apiRoutes,
  checks
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports", "home-realtime.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`Home realtime doctor failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Home realtime doctor passed: ${checks.length}/${checks.length}`);
