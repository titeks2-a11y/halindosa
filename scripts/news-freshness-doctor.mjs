import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = "reports/news-freshness.json";
const docsPath = "docs/NEWS_FRESHNESS_REPORT.md";

const requiredCategories = [
  "식품/생필품",
  "마트/편의점",
  "디지털/가전",
  "패션/뷰티",
  "외식/배달",
  "여행/숙박",
  "영화/문화",
  "카드/멤버십",
  "무료혜택",
  "정부/공공혜택"
];
const minimumCategoryCount = 2;
const refreshCadenceHours = 6;
const staleAfterHours = 24;
const renewalWindowDays = 14;
const watchWindowDays = 30;

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function hoursSince(value) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.round(((Date.now() - time) / 3_600_000) * 10) / 10;
}

function daysUntil(value) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return Number.NEGATIVE_INFINITY;
  return Math.round(((time - Date.now()) / 86_400_000) * 10) / 10;
}

function addHours(value, hours) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) return "";
  return new Date(time + hours * 3_600_000).toISOString();
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

function visibleNewsDeals(snapshot) {
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  return deals.filter((deal) => deal && deal.validationStatus === "passed" && !deal.isHidden && deal.finalUrl);
}

function countBy(items, key) {
  return items.reduce((map, item) => {
    const value = item?.[key] ?? "";
    if (value) map[value] = (map[value] ?? 0) + 1;
    return map;
  }, {});
}

function sortByEndDate(deals) {
  return [...deals].sort((a, b) => Date.parse(a.endDate ?? "") - Date.parse(b.endDate ?? ""));
}

const newsReport = readJson("reports/news-deals.json", {});
const refreshAll = readJson("reports/refresh-all.json", {});
const snapshot = readJson("data/refreshedNewsDeals.json", {});
const sourceCatalog = readJson("data/officialSourceCatalog.json", []);
const visibleDeals = visibleNewsDeals(snapshot);
const generatedAt = newsReport.generatedAt ?? snapshot.generatedAt ?? refreshAll.generatedAt ?? "";
const reportAgeHours = hoursSince(generatedAt);
const visibleExpiredDeals = visibleDeals.filter((deal) => daysUntil(deal.endDate) < 0);
const staleCheckedDeals = visibleDeals.filter((deal) => hoursSince(deal.lastCheckedAt) > staleAfterHours);
const dueCheckedDeals = visibleDeals.filter((deal) => {
  const age = hoursSince(deal.lastCheckedAt);
  return age > refreshCadenceHours && age <= staleAfterHours;
});
const expiringWithin14Days = sortByEndDate(visibleDeals.filter((deal) => daysUntil(deal.endDate) >= 0 && daysUntil(deal.endDate) <= renewalWindowDays));
const expiringWithin30Days = sortByEndDate(visibleDeals.filter((deal) => daysUntil(deal.endDate) >= 0 && daysUntil(deal.endDate) <= watchWindowDays));
const categoryCounts = countBy(visibleDeals, "category");
const missingCategories = requiredCategories.filter((category) => !categoryCounts[category]);
const thinCategories = requiredCategories.filter((category) => {
  const count = Number(categoryCounts[category] ?? 0);
  return count > 0 && count < minimumCategoryCount;
});
const providerCounts = countBy(visibleDeals, "provider");
const sourceCounts = countBy(visibleDeals, "sourceName");
const providerStats = Array.isArray(newsReport.providerStats) ? newsReport.providerStats : [];
const providerIssueCount = providerStats.reduce(
  (sum, stat) =>
    sum +
    Number(stat.hiddenCount ?? 0) +
    Number(stat.failedCount ?? 0) +
    Number(stat.expiredCount ?? 0) +
    Number(stat.officialMissingCount ?? 0) +
    Number(stat.errorCount ?? 0),
  0
);
const officialSourceCandidates = Array.isArray(sourceCatalog) ? sourceCatalog.length : 0;
const highCadenceSources = Array.isArray(sourceCatalog)
  ? sourceCatalog.filter((source) => Number(source.refreshCadenceHours ?? 24) <= refreshCadenceHours).length
  : 0;
const oldestCheckedAt = visibleDeals
  .map((deal) => deal.lastCheckedAt)
  .filter(Boolean)
  .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? "";
const oldestCheckedAgeHours = hoursSince(oldestCheckedAt);
const freshnessStatus =
  !generatedAt || reportAgeHours === Number.POSITIVE_INFINITY
    ? "missing"
    : reportAgeHours > staleAfterHours || staleCheckedDeals.length > 0
      ? "stale"
      : reportAgeHours > refreshCadenceHours || dueCheckedDeals.length > 0
        ? "due"
        : "fresh";
const checks = [
  visibleDeals.length >= 25
    ? pass("visible official benefits", `${visibleDeals.length} visible official benefit deals are available.`)
    : fail("visible official benefits", `Expected at least 25 visible official benefits, got ${visibleDeals.length}.`),
  reportAgeHours <= staleAfterHours
    ? pass("report freshness", `news-deals report age is ${reportAgeHours}h.`)
    : fail("report freshness", `news-deals report is stale at ${reportAgeHours}h.`),
  staleCheckedDeals.length === 0
    ? pass("deal check freshness", `No visible official benefit has lastCheckedAt older than ${staleAfterHours}h.`)
    : fail("deal check freshness", `${staleCheckedDeals.length} visible official benefits have stale lastCheckedAt values.`),
  visibleExpiredDeals.length === 0
    ? pass("expired exposure", "No expired official benefit is visible.")
    : fail("expired exposure", `${visibleExpiredDeals.length} expired official benefits are still visible.`),
  missingCategories.length === 0 && thinCategories.length === 0
    ? pass("category coverage", `All ${requiredCategories.length} categories have at least ${minimumCategoryCount} visible benefits.`)
    : fail("category coverage", `Missing: ${missingCategories.join(", ") || "-"} / thin: ${thinCategories.join(", ") || "-"}.`),
  providerStats.length >= 4 && providerIssueCount === 0
    ? pass("provider freshness queue", `${providerStats.length} providers have zero hidden/failed/expired/official-missing issues.`)
    : fail("provider freshness queue", `Provider stats or issue counts need review: providers=${providerStats.length}, issues=${providerIssueCount}.`),
  officialSourceCandidates >= 30
    ? pass("official source catalog", `${officialSourceCandidates} official source candidates are tracked.`)
    : fail("official source catalog", `Expected at least 30 official source candidates, got ${officialSourceCandidates}.`)
];
const issues = checks.filter((check) => !check.ok);
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: generatedAt,
  freshnessStatus,
  cadenceHours: refreshCadenceHours,
  staleAfterHours,
  reportAgeHours,
  oldestCheckedAt,
  oldestCheckedAgeHours,
  nextRefreshDueAt: addHours(generatedAt, refreshCadenceHours),
  staleAfterAt: addHours(generatedAt, staleAfterHours),
  visibleCount: visibleDeals.length,
  hiddenCount: Number(newsReport.hiddenCount ?? 0),
  failedCount: Number(newsReport.failedCount ?? 0),
  expiredVisibleCount: visibleExpiredDeals.length,
  staleCheckedCount: staleCheckedDeals.length,
  dueCheckedCount: dueCheckedDeals.length,
  expiringWithin14DaysCount: expiringWithin14Days.length,
  expiringWithin30DaysCount: expiringWithin30Days.length,
  categoryCounts,
  missingCategories,
  thinCategories,
  providerCounts,
  sourceCounts,
  providerIssueCount,
  officialSourceCandidates,
  highCadenceSources,
  renewalQueue: expiringWithin14Days.slice(0, 12).map((deal) => ({
    id: deal.id,
    title: deal.title,
    merchant: deal.merchant,
    category: deal.category,
    sourceName: deal.sourceName,
    endDate: deal.endDate,
    daysLeft: daysUntil(deal.endDate),
    action: "공식 페이지 종료 여부를 확인하고 대체 혜택 후보를 준비하세요."
  })),
  watchQueue: expiringWithin30Days.slice(0, 20).map((deal) => ({
    id: deal.id,
    title: deal.title,
    merchant: deal.merchant,
    category: deal.category,
    endDate: deal.endDate,
    daysLeft: daysUntil(deal.endDate)
  })),
  checks,
  issues: issues.map((check) => `${check.name}: ${check.detail}`),
  nextActions: [
    freshnessStatus === "fresh"
      ? "정기 refresh cadence를 유지하세요."
      : "npm run refresh:all && npm run news:freshness:doctor를 실행해 공식 혜택 freshness를 갱신하세요.",
    expiringWithin14Days.length
      ? "14일 이내 종료되는 공식 혜택의 대체 후보를 공식 소스 카탈로그에서 준비하세요."
      : "14일 이내 종료 혜택이 없으므로 현재 카테고리 커버리지를 유지하세요.",
    "공식 혜택은 finalUrl 검증, 종료일, lastCheckedAt, 카테고리 커버리지를 함께 보고 운영합니다."
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# News Freshness Report",
  "",
  "공식 혜택/할인뉴스가 오래된 정보나 종료된 이벤트를 사용자에게 노출하지 않도록 확인하는 운영 리포트입니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 원본 리포트 생성 시각: ${report.sourceGeneratedAt || "-"}`,
  `- 상태: ${report.freshnessStatus}`,
  `- 리포트 나이: ${report.reportAgeHours}h`,
  `- 노출 공식 혜택: ${report.visibleCount}개`,
  `- 종료 노출: ${report.expiredVisibleCount}개`,
  `- 14일 이내 종료: ${report.expiringWithin14DaysCount}개`,
  `- 공식 소스 후보: ${report.officialSourceCandidates}개`,
  "",
  "## Checks",
  "",
  "| Check | Status | Detail |",
  "| --- | --- | --- |",
  ...checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${String(check.detail).replace(/\|/g, "/")} |`),
  "",
  "## Category Coverage",
  "",
  "| Category | Count | Status |",
  "| --- | ---: | --- |",
  ...requiredCategories.map((category) => {
    const count = Number(report.categoryCounts[category] ?? 0);
    const status = count >= minimumCategoryCount ? "ready" : count > 0 ? "thin" : "missing";
    return `| ${category} | ${count} | ${status} |`;
  }),
  "",
  "## Renewal Queue",
  "",
  "| Deal | Merchant | End Date | Days Left | Action |",
  "| --- | --- | --- | ---: | --- |",
  ...(report.renewalQueue.length
    ? report.renewalQueue.map((deal) => `| ${deal.title} | ${deal.merchant} | ${deal.endDate} | ${deal.daysLeft} | ${deal.action} |`)
    : ["| - | - | - | - | 14일 이내 종료 혜택 없음 |"]),
  "",
  "## Next Actions",
  "",
  ...report.nextActions.map((action) => `- ${action}`),
  ""
];
writeFileSync(join(root, docsPath), `${docsLines.join("\n")}\n`, "utf8");

if (!report.ok) {
  console.error("News freshness doctor failed.");
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("News freshness doctor passed.");
console.log(`- ${reportPath}`);
console.log(`- ${docsPath}`);
console.log(`- status: ${report.freshnessStatus}`);
console.log(`- visibleCount: ${report.visibleCount}`);
console.log(`- expiringWithin14Days: ${report.expiringWithin14DaysCount}`);
