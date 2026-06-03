import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportJsonPath = "reports/health-readiness.json";
const reportDocsPath = "docs/HEALTH_READINESS_REPORT.md";
const cronReportPath = "reports/cron-refresh.json";

const requiredNewsCategories = [
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
const minimumCategoryDealCount = 2;
const freshnessLimitHours = 24;
const cronRefreshStaleHours = 12;

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
  return Math.round(((Date.now() - time) / (60 * 60 * 1000)) * 10) / 10;
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 10) / 10}%`;
}

function formatValue(value) {
  if (value === Number.POSITIVE_INFINITY) return "확인 불가";
  return String(value);
}

const linkValidation = readJson("reports/link-validation.json", {});
const productQuality = readJson("reports/product-quality.json", {});
const newsQuality = readJson("reports/news-deals.json", {});
const refreshAll = readJson("reports/refresh-all.json", {});
const refreshDeals = readJson("reports/refresh-deals.json", {});
const cronRefreshReport = readJson(cronReportPath, {});

const productDealsCount = Number(refreshAll.productDealsCount ?? productQuality.totalProducts ?? linkValidation.totalDeals ?? 0);
const visibleProducts = Number(productQuality.visibleProducts ?? linkValidation.visibleDeals ?? 0);
const verifiedProductLinks = Number(productQuality.verifiedPurchaseLinks ?? linkValidation.passedDirectLinks ?? 0);
const productVerificationRate = productDealsCount > 0 ? (verifiedProductLinks / productDealsCount) * 100 : 0;
const searchLinks = Number(productQuality.searchLinks ?? linkValidation.searchLinks ?? linkValidation.exposedSearchLinks ?? 0);
const soldOutProducts = Number(productQuality.soldOutProducts ?? linkValidation.soldOutOrEndedSuspected ?? 0);
const hiddenProducts = Number(productQuality.hiddenProducts ?? linkValidation.hiddenCount ?? 0);
const productFailed = Number(productQuality.failedProducts ?? linkValidation.failedCount ?? 0);

const newsVisibleCount = Number(newsQuality.visibleCount ?? refreshAll.newsDealsCount ?? 0);
const newsHiddenCount = Number(newsQuality.hiddenCount ?? 0);
const newsExpiredCount = Number(newsQuality.expiredCount ?? 0);
const newsOfficialMissingCount = Number(newsQuality.officialMissingCount ?? 0);
const newsFailedCount = Number(newsQuality.failedCount ?? 0);
const newsFreshnessHours = hoursSince(newsQuality.generatedAt ?? refreshAll.generatedAt);
const categoryCounts = newsQuality.categoryCounts ?? {};
const missingNewsCategories = requiredNewsCategories.filter((category) => Number(categoryCounts[category] ?? 0) === 0);
const thinNewsCategories = requiredNewsCategories.filter((category) => {
  const count = Number(categoryCounts[category] ?? 0);
  return count > 0 && count < minimumCategoryDealCount;
});
const readyNewsCategories = requiredNewsCategories.filter((category) => Number(categoryCounts[category] ?? 0) >= minimumCategoryDealCount);

const refreshSteps = Array.isArray(refreshAll.steps) ? refreshAll.steps : [];
const failedRefreshSteps = refreshSteps.filter((step) => !step.ok).map((step) => step.name);
const cronRefreshReportExists = existsSync(join(root, cronReportPath));
const cronRefreshAgeHours = hoursSince(cronRefreshReport.generatedAt);
const cronRefreshStatus = !cronRefreshReportExists
  ? "manual_refresh_ready"
  : cronRefreshReport.ok === false
    ? "failed"
    : cronRefreshAgeHours > cronRefreshStaleHours
      ? "stale"
      : "healthy";
const cronRefreshOk = ["healthy", "manual_refresh_ready"].includes(cronRefreshStatus) && refreshAll.ok === true;
const cronRefreshLabel =
  cronRefreshStatus === "healthy"
    ? "자동 갱신 정상"
    : cronRefreshStatus === "manual_refresh_ready"
      ? "수동 갱신 기준 정상"
      : cronRefreshStatus === "stale"
        ? "cron 재실행 필요"
        : "cron 실패 확인";
const providerStats = {
  product: Array.isArray(refreshAll.providerStats?.product) ? refreshAll.providerStats.product : Array.isArray(refreshDeals.providerStats) ? refreshDeals.providerStats : [],
  news: Array.isArray(refreshAll.providerStats?.news) ? refreshAll.providerStats.news : Array.isArray(newsQuality.providerStats) ? newsQuality.providerStats : []
};
const configuredProductProviders = providerStats.product.filter((stat) => stat.configured).map((stat) => stat.provider);
const configuredNewsProviders = providerStats.news.filter((stat) => stat.configured).map((stat) => stat.provider);
const activeNewsProviders = providerStats.news.map((stat) => stat.provider).filter(Boolean);
function buildProviderRisk(stat) {
  const visibleCount = Number(stat.visibleCount ?? 0);
  const fetchedCount = Number(stat.fetchedCount ?? 0);
  const normalizedCount = Number(stat.normalizedCount ?? 0);
  const hiddenCount = Number(stat.hiddenCount ?? 0);
  const failedCount = Number(stat.failedCount ?? 0);
  const expiredCount = Number(stat.expiredCount ?? 0);
  const officialMissingCount = Number(stat.officialMissingCount ?? 0);
  const errorCount = Number(stat.errorCount ?? 0);
  const issueCount = hiddenCount + failedCount + expiredCount + officialMissingCount + errorCount;
  const totalCount = Math.max(fetchedCount, normalizedCount, visibleCount + issueCount, 1);
  const failureRate = Math.round((issueCount / totalCount) * 1000) / 10;
  const source = stat.source ?? (stat.configured ? "configured_feed" : "seed_fallback");

  if (failedCount > 0 || errorCount > 0 || officialMissingCount > 0) {
    return { provider: stat.provider, source, severity: "danger", label: "즉시 점검", reason: `실패 ${failedCount} · 오류 ${errorCount} · 공식 링크 누락 ${officialMissingCount}`, visibleCount, issueCount, failureRate };
  }
  if (expiredCount > 0 || hiddenCount > 0) {
    return { provider: stat.provider, source, severity: "watch", label: "정리 필요", reason: `숨김 ${hiddenCount} · 종료 ${expiredCount}`, visibleCount, issueCount, failureRate };
  }
  if (visibleCount === 0) {
    return { provider: stat.provider, source, severity: "watch", label: "수집 대기", reason: "노출 가능한 공식 혜택이 아직 없습니다.", visibleCount, issueCount, failureRate };
  }
  if (!stat.configured) {
    return { provider: stat.provider, source, severity: "watch", label: "seed 운영", reason: "승인된 seed/fallback으로 운영 중입니다.", visibleCount, issueCount, failureRate };
  }
  return { provider: stat.provider, source, severity: "healthy", label: "정상", reason: "공식 feed 연결 및 검증 상태가 정상입니다.", visibleCount, issueCount, failureRate };
}
const officialBenefitProviderStats = providerStats.news.map((stat) => ({
  provider: stat.provider,
  source: stat.source ?? (stat.configured ? "configured_feed" : "seed_fallback"),
  configured: Boolean(stat.configured),
  fetchedCount: Number(stat.fetchedCount ?? 0),
  normalizedCount: Number(stat.normalizedCount ?? 0),
  visibleCount: Number(stat.visibleCount ?? 0),
  hiddenCount: Number(stat.hiddenCount ?? 0),
  failedCount: Number(stat.failedCount ?? 0),
  expiredCount: Number(stat.expiredCount ?? 0),
  officialMissingCount: Number(stat.officialMissingCount ?? 0),
  errorCount: Number(stat.errorCount ?? 0)
}));
const officialBenefitProviderRisks = providerStats.news.map(buildProviderRisk);
const officialBenefitProviderRiskSummary = {
  healthy: officialBenefitProviderRisks.filter((risk) => risk.severity === "healthy").length,
  watch: officialBenefitProviderRisks.filter((risk) => risk.severity === "watch").length,
  danger: officialBenefitProviderRisks.filter((risk) => risk.severity === "danger").length
};

const checks = [
  productDealsCount >= 140
    ? pass("product count floor", `${productDealsCount} verified product deals are available.`)
    : fail("product count floor", `Expected at least 140 product deals, got ${productDealsCount}.`),
  productVerificationRate >= 99
    ? pass("product verification rate", `${percent(productVerificationRate)} product links are verified.`)
    : fail("product verification rate", `Expected >=99%, got ${percent(productVerificationRate)}.`),
  searchLinks === 0
    ? pass("search link exposure", "No search/result URLs are exposed.")
    : fail("search link exposure", `${searchLinks} search/result URLs are still exposed.`),
  soldOutProducts === 0
    ? pass("sold out exposure", "No sold-out or ended product links are exposed.")
    : fail("sold out exposure", `${soldOutProducts} sold-out/ended product signals remain.`),
  hiddenProducts === 0 && productFailed === 0
    ? pass("product hidden/failed queue", "No hidden or failed product deals remain in the customer exposure set.")
    : fail("product hidden/failed queue", `Hidden=${hiddenProducts}, failed=${productFailed}.`),
  newsVisibleCount >= 25
    ? pass("official benefit count floor", `${newsVisibleCount} official benefit deals are visible.`)
    : fail("official benefit count floor", `Expected at least 25 official benefit deals, got ${newsVisibleCount}.`),
  readyNewsCategories.length === requiredNewsCategories.length
    ? pass("official benefit category coverage", `All ${requiredNewsCategories.length} required categories have at least ${minimumCategoryDealCount} visible benefits.`)
    : fail("official benefit category coverage", `Missing=${missingNewsCategories.join(", ") || "none"}; thin=${thinNewsCategories.join(", ") || "none"}.`),
  newsHiddenCount === 0 && newsExpiredCount === 0 && newsOfficialMissingCount === 0 && newsFailedCount === 0
    ? pass("official benefit hidden/failed queue", "No hidden, expired, non-official, or failed official benefit links are exposed.")
    : fail("official benefit hidden/failed queue", `Hidden=${newsHiddenCount}, expired=${newsExpiredCount}, officialMissing=${newsOfficialMissingCount}, failed=${newsFailedCount}.`),
  newsFreshnessHours <= freshnessLimitHours
    ? pass("official benefit freshness", `Official benefit report freshness is ${formatValue(newsFreshnessHours)}h.`)
    : fail("official benefit freshness", `Official benefit report is stale: ${formatValue(newsFreshnessHours)}h.`),
  refreshAll.ok === true && failedRefreshSteps.length === 0
    ? pass("refresh all pipeline", "refresh:all completed successfully.")
    : fail("refresh all pipeline", `refresh:all failed or missing. Failed steps: ${failedRefreshSteps.join(", ") || "unknown"}.`),
  cronRefreshOk
    ? pass("cron refresh operations", `Cron refresh status=${cronRefreshStatus}; report=${cronRefreshReportExists ? cronReportPath : "manual refresh fallback"}.`)
    : fail("cron refresh operations", `Cron refresh status=${cronRefreshStatus}; run /api/cron/refresh or check ${cronReportPath}.`),
  providerStats.product.length >= 4 && providerStats.news.length >= 4
    ? pass("provider stats coverage", `Product providers=${providerStats.product.length}, news providers=${providerStats.news.length}.`)
    : fail("provider stats coverage", `Product providers=${providerStats.product.length}, news providers=${providerStats.news.length}.`),
  officialBenefitProviderRiskSummary.danger === 0
    ? pass("provider risk gate", `Official benefit providers danger=${officialBenefitProviderRiskSummary.danger}, watch=${officialBenefitProviderRiskSummary.watch}.`)
    : fail("provider risk gate", `Official benefit providers danger=${officialBenefitProviderRiskSummary.danger}.`)
];

const failures = checks.filter((check) => !check.ok);
const score = Math.max(0, Math.round(((checks.length - failures.length) / checks.length) * 100));
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  score,
  thresholds: {
    productDealsCount: 140,
    productVerificationRate: 99,
    officialBenefits: 25,
    newsCategories: requiredNewsCategories.length,
    minimumCategoryDealCount,
    freshnessHours: freshnessLimitHours,
    cronRefreshStaleHours
  },
  product: {
    productDealsCount,
    visibleProducts,
    verifiedProductLinks,
    productVerificationRate,
    searchLinks,
    soldOutProducts,
    hiddenProducts,
    failedProducts: productFailed,
    configuredProviders: configuredProductProviders
  },
  officialBenefits: {
    visibleCount: newsVisibleCount,
    hiddenCount: newsHiddenCount,
    expiredCount: newsExpiredCount,
    officialMissingCount: newsOfficialMissingCount,
    failedCount: newsFailedCount,
    freshnessHours: newsFreshnessHours,
    readyCategories: readyNewsCategories.length,
    requiredCategories: requiredNewsCategories.length,
    minimumCategoryDealCount,
    missingCategories: missingNewsCategories,
    thinCategories: thinNewsCategories,
    categoryCounts,
    configuredProviders: configuredNewsProviders,
    activeProviders: activeNewsProviders,
    providerStats: officialBenefitProviderStats,
    providerRisks: officialBenefitProviderRisks,
    providerRiskSummary: officialBenefitProviderRiskSummary
  },
  refreshAll: {
    ok: refreshAll.ok === true,
    generatedAt: refreshAll.generatedAt ?? "",
    insertedCount: Number(refreshAll.insertedCount ?? 0),
    updatedCount: Number(refreshAll.updatedCount ?? 0),
    hiddenCount: Number(refreshAll.hiddenCount ?? 0),
    expiredCount: Number(refreshAll.expiredCount ?? 0),
    failedCount: Number(refreshAll.failedCount ?? 0),
    failedSteps: failedRefreshSteps,
    steps: refreshSteps.map((step) => ({
      name: step.name,
      ok: Boolean(step.ok),
      startedAt: step.startedAt,
      finishedAt: step.finishedAt
    }))
  },
  cronRefresh: {
    ok: cronRefreshOk,
    status: cronRefreshStatus,
    label: cronRefreshLabel,
    reportPath: cronReportPath,
    reportExists: cronRefreshReportExists,
    generatedAt: cronRefreshReport.generatedAt ?? "",
    ageHours: Number.isFinite(cronRefreshAgeHours) ? cronRefreshAgeHours : null,
    command: cronRefreshReport.command ?? "node scripts/refresh-all.mjs",
    schedule: "0 */6 * * *",
    protected: true,
    durationMs: Number(cronRefreshReport.durationMs ?? 0),
    productDealsCount: Number((cronRefreshReport.refreshAll ?? refreshAll).productDealsCount ?? productDealsCount),
    newsDealsCount: Number((cronRefreshReport.refreshAll ?? refreshAll).newsDealsCount ?? newsVisibleCount),
    failedCount: Number((cronRefreshReport.refreshAll ?? refreshAll).failedCount ?? 0),
    message: cronRefreshReport.message ?? "아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 정상입니다."
  },
  checks
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportJsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# 할인도사 운영 헬스 리포트",
  "",
  "이 문서는 상품 링크, 공식 혜택, refresh 파이프라인이 실제 출시 운영 기준을 만족하는지 요약합니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 운영 준비 점수: ${score}/100`,
  `- 상태: ${report.ok ? "PASS" : "FAIL"}`,
  "",
  "## 핵심 지표",
  "",
  `- 상품 특가: ${productDealsCount}개`,
  `- 검증된 상품 링크: ${verifiedProductLinks}개 (${percent(productVerificationRate)})`,
  `- 검색 링크 노출: ${searchLinks}개`,
  `- 품절/종료 의심 노출: ${soldOutProducts}개`,
  `- 공식 혜택: ${newsVisibleCount}개`,
  `- 공식 혜택 카테고리 커버리지: ${readyNewsCategories.length}/${requiredNewsCategories.length}`,
  `- 공식 혜택 Provider: ${activeNewsProviders.length}개 (feed 연결 ${configuredNewsProviders.length}개)`,
  `- 공식 혜택 Provider 위험도: 정상 ${officialBenefitProviderRiskSummary.healthy}개 · 관찰 ${officialBenefitProviderRiskSummary.watch}개 · 즉시 점검 ${officialBenefitProviderRiskSummary.danger}개`,
  `- 공식 혜택 리포트 신선도: ${formatValue(newsFreshnessHours)}시간`,
  `- refresh:all 상태: ${refreshAll.ok === true ? "PASS" : "FAIL"}`,
  `- cron refresh 상태: ${cronRefreshLabel} (${cronRefreshStatus})`,
  "",
  "## 카테고리 커버리지",
  "",
  "| 카테고리 | 노출 건수 | 기준 | 상태 |",
  "| --- | ---: | ---: | --- |",
  ...requiredNewsCategories.map((category) => {
    const count = Number(categoryCounts[category] ?? 0);
    const status = count >= minimumCategoryDealCount ? "PASS" : count > 0 ? "THIN" : "GAP";
    return `| ${category} | ${count} | ${minimumCategoryDealCount} | ${status} |`;
  }),
  "",
  "## 공식 혜택 Provider 상태",
  "",
  "| Provider | Source | Feed 연결 | 수집 | 정규화 | 노출 | 숨김 | 실패 |",
  "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ...(officialBenefitProviderStats.length
    ? officialBenefitProviderStats.map(
        (stat) =>
          `| ${stat.provider} | ${stat.source} | ${stat.configured ? "yes" : "seed/fallback"} | ${stat.fetchedCount} | ${stat.normalizedCount} | ${stat.visibleCount} | ${stat.hiddenCount} | ${stat.failedCount} |`
      )
    : ["| 없음 | - | - | 0 | 0 | 0 | 0 | 0 |"]),
  "",
  "## 공식 혜택 Provider 위험도",
  "",
  "| Provider | 위험도 | Source | 노출 | 이슈 | 실패율 | 사유 |",
  "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ...(officialBenefitProviderRisks.length
    ? officialBenefitProviderRisks.map((risk) => `| ${risk.provider} | ${risk.label} | ${risk.source} | ${risk.visibleCount} | ${risk.issueCount} | ${risk.failureRate}% | ${risk.reason} |`)
    : ["| 없음 | 리포트 없음 | - | 0 | 0 | 0% | provider risk 리포트가 없습니다. |"]),
  "",
  "## 자동 refresh cron 운영",
  "",
  `- 상태: ${cronRefreshLabel} (${cronRefreshStatus})`,
  `- 스케줄: 0 */6 * * *`,
  `- 보호 여부: CRON_SECRET 또는 관리자 토큰 필요`,
  `- 리포트: ${cronReportPath} (${cronRefreshReportExists ? "존재" : "아직 없음"})`,
  `- 마지막 실행: ${cronRefreshReport.generatedAt ?? "직접 실행 전"}`,
  `- 상품/뉴스 건수: ${Number((cronRefreshReport.refreshAll ?? refreshAll).productDealsCount ?? productDealsCount)} / ${Number((cronRefreshReport.refreshAll ?? refreshAll).newsDealsCount ?? newsVisibleCount)}`,
  `- 메시지: ${cronRefreshReport.message ?? "아직 cron 직접 실행 리포트는 없지만 refresh:all 수동 리포트는 정상입니다."}`,
  "",
  "## 게이트",
  "",
  "| 게이트 | 상태 | 상세 |",
  "| --- | --- | --- |",
  ...checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail} |`),
  "",
  "## 운영 조치",
  "",
  report.ok
    ? "- 현재 상품 링크, 공식 혜택, refresh 파이프라인 모두 출시 운영 기준을 만족합니다."
    : "- 실패한 게이트를 먼저 복구한 뒤 `npm run refresh:all`, `npm run health:readiness`, `npm run release:doctor`를 재실행하세요.",
  "- 공식 혜택 feed가 추가되면 `data/newsFeed.sample.json` 계약을 기준으로 `npm run news:feed:doctor`를 먼저 실행하세요.",
  "- 검색 링크, 대표몰, 커뮤니티 원문 링크, 종료 이벤트는 사용자 노출 전에 hidden 처리해야 합니다.",
  ""
];

writeFileSync(join(root, reportDocsPath), `${docsLines.join("\n")}\n`, "utf8");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name} - ${check.detail}`);
}

if (failures.length) {
  console.error(`Health readiness failed: ${failures.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Health readiness passed: ${checks.length}/${checks.length}`);
