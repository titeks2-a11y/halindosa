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
const homePage = read("app/page.tsx");
const homeStatusStrip = read("components/home/HomeStatusStrip.tsx");
const packageJson = JSON.parse(read("package.json"));
const qaRunner = read("scripts/run-qa.mjs");
const harness = read("scripts/harness.mjs");

for (const routePath of apiRoutes) {
  const route = read(routePath);
  if (includesAll(route, ['dynamic = "force-dynamic"', "revalidate = 0", 'fetchCache = "force-no-store"', "noStoreJson"])) {
    pass(`${routePath} no-store`, "실시간 홈 데이터 API가 동적/no-store 정책을 명시합니다.");
  } else {
    fail(`${routePath} no-store`, "API 라우트에 force-dynamic, revalidate=0, force-no-store, noStoreJson 중 빠진 항목이 있습니다.");
  }
}

if (includesAll(homeApi, ["buildHomeRequestUrl", "/api/home?", "HomeResponse", "ts: String(timestamp)", "Date.now()", 'cache: "no-store"', '"Cache-Control": "no-cache"', "buildLatestDealsRequestUrl"])) {
  pass("home api cache buster", "홈 API 요청이 /api/home snapshot, no-store, timestamp cache-buster를 함께 사용합니다.");
} else {
  fail("home api cache buster", "홈 API 요청에 /api/home snapshot, timestamp 또는 no-store fetch 설정이 부족합니다.");
}

if (
  includesAll(homePage, [
    "window.setInterval(refreshIfVisible, 60_000)",
    "window.setInterval(refreshIfVisible, 90_000)",
    "window.setInterval(refreshIfActive, 120_000)",
    "refreshHomeNow",
    "refreshHomeSnapshot",
    "buildHomeRequestUrl",
    "buildCombinedHomeSnapshot",
    "setLastHomeSyncAt",
    "fetchDeals(undefined, true)",
    "refreshNewsDeals({ silent: true })",
    "fetchSignals(true)"
  ])
) {
  pass("home realtime refresh loop", "상품, 핫시그널, 공식 혜택이 개별 자동 갱신되고 수동 새로고침은 /api/home snapshot으로 한 번에 동기화됩니다.");
} else {
  fail("home realtime refresh loop", "홈 상품/뉴스/핫시그널 자동 갱신 또는 /api/home 수동 snapshot 연결이 부족합니다.");
}

const homeRoute = read("app/api/home/route.ts");
if (includesAll(homeRoute, ["newsMeta", "cachePolicy", 'mode: "no-store"', "recommendedQueries", "freshnessStatus", "targetSections"])) {
  pass("home snapshot metadata", "/api/home이 공식 혜택 추천, freshness, no-store 생성 메타를 함께 반환합니다.");
} else {
  fail("home snapshot metadata", "/api/home 응답에 공식 혜택 추천/freshness/no-store 메타가 부족합니다.");
}

if (includesAll(homeStatusStrip, ["실시간 검증됨", "업데이트", "새로고침", "onRefresh", "isRefreshing", "getRelativeTime(updatedAt)"])) {
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
