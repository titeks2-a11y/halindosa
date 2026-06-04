import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "source-readiness.json");
const docsPath = join(docsDir, "SOURCE_READINESS_REPORT.md");

function readJson(fileName, fallback = {}) {
  const path = join(root, "reports", fileName);
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function numberValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function uniqueNonEmpty(items) {
  return [...new Set(items.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function buildGate(name, ok, detail, action) {
  return {
    name,
    ok: Boolean(ok),
    status: ok ? "passed" : "failed",
    detail,
    action
  };
}

function sumEnvPlanConfiguredUrls(envPlan) {
  if (!Array.isArray(envPlan)) return 0;
  return envPlan.reduce((sum, item) => sum + numberValue(item.configuredFeedUrls), 0);
}

function getRefreshAllOk(refreshAll) {
  if (refreshAll.ok === true) return true;
  if (!Array.isArray(refreshAll.steps)) return false;
  return refreshAll.steps.length > 0 && refreshAll.steps.every((step) => step.ok === true || step.status === "passed");
}

function buildOperatorNextActions({ catalog, onboarding, feedEnv, news, refreshAll }) {
  const actions = [];

  if (Array.isArray(catalog.nextActions)) actions.push(...catalog.nextActions);
  if (Array.isArray(onboarding.topActions)) {
    actions.push(...onboarding.topActions.slice(0, 5).map((item) => item.nextAction));
  }
  if (numberValue(feedEnv.configuredUrlCount) === 0) {
    actions.push("공식 feed env가 아직 연결되지 않았습니다. source:onboarding:plan의 env 템플릿에서 우선 후보를 골라 담당자 승인 JSON/RSS/API만 연결하세요.");
  }
  if (numberValue(feedEnv.failedCount) > 0) {
    actions.push("source:feed-env:doctor 실패 URL을 제거하거나 공식 카탈로그/승인 host 기반의 JSON/RSS/API feed로 교체하세요.");
  }
  if (numberValue(news.hiddenCount) + numberValue(news.expiredCount) + numberValue(news.failedCount) > 0) {
    actions.push("숨김, 종료, 실패 공식 혜택은 갱신하거나 사용자 노출에서 제외한 상태를 유지하세요.");
  }
  if (!getRefreshAllOk(refreshAll)) {
    actions.push("npm run refresh:all을 다시 실행해 상품, 공식 혜택, 링크 검증 리포트를 함께 갱신하세요.");
  }

  actions.push("검색 결과, 커뮤니티 원문, 블로그, HTML 랜딩 페이지는 운영 feed와 사용자 이동 링크로 연결하지 않습니다.");

  return uniqueNonEmpty(actions).slice(0, 10);
}

function buildMarkdown(report) {
  const gateRows = report.gates.map(
    (gate) => `| ${gate.name} | ${gate.status} | ${gate.detail} | ${gate.action} |`
  );
  const envRows = report.envPlan.length
    ? report.envPlan.map(
        (plan) => `| ${plan.envKey} | ${plan.status} | ${plan.candidateCount} | ${plan.reachableCandidates} | ${plan.guardedCandidates} | ${plan.configuredFeedUrls} | ${plan.nextAction} |`
      )
    : ["| - | - | 0 | 0 | 0 | 0 | source:onboarding:plan 실행 후 공식 feed env 후보를 확인합니다. |"];
  const riskRows = report.riskySources.length
    ? report.riskySources.map(
        (source) => `| ${source.id} | ${source.label} | ${source.provider} | ${source.status} | ${source.operatorAction} |`
      )
    : ["| - | 공식 소스 위험 후보 없음 | - | passed | 계속 source:live:doctor로 접근 상태를 점검합니다. |"];
  const actionRows = report.operatorNextActions.map((action) => `- ${action}`);

  return [
    "# 공식 소스 통합 준비도",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 준비 상태: ${report.readinessLabel}`,
    `- 출시 게이트: ${report.launchGateStatus}`,
    `- 공식 소스 후보: ${report.summary.officialSourceCandidates}개`,
    `- 접근 가능/보호 소스: ${report.summary.reachableSources}개 / ${report.summary.guardedSources}개`,
    `- 설정된 공식 feed URL: ${report.summary.configuredFeedUrls}개`,
    `- 공식 혜택 노출 가능: ${report.summary.visibleOfficialBenefits}개`,
    `- 차단 이슈: ${report.summary.blockedLiveIssues + report.summary.feedEnvFailedCount + report.summary.newsFailedCount}개`,
    "",
    "## 운영 원칙",
    "",
    "- 공식 API, RSS, Atom, 승인 JSON, 제휴 feed만 운영 데이터로 연결합니다.",
    "- 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인, HTML 이벤트 랜딩 페이지는 사용자 노출 링크나 운영 feed로 사용하지 않습니다.",
    "- 보호/권한 페이지는 직접 수집하지 않고 담당자 승인 API, RSS, 제휴 feed로 전환합니다.",
    "",
    "## 게이트",
    "",
    "| 게이트 | 상태 | 내용 | 다음 작업 |",
    "| --- | --- | --- | --- |",
    ...gateRows,
    "",
    "## 공식 feed env 연결 후보",
    "",
    "| Env key | 상태 | 후보 | 접근 가능 | 보호/승인 | 설정 URL | 다음 작업 |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...envRows,
    "",
    "## 점검해야 할 보호/위험 소스",
    "",
    "| ID | 소스 | Provider | 상태 | 운영 액션 |",
    "| --- | --- | --- | --- | --- |",
    ...riskRows,
    "",
    "## 다음 작업",
    "",
    ...actionRows,
    "",
    "## 재생성 명령",
    "",
    "```bash",
    "npm run source:catalog:report",
    "npm run source:live:doctor",
    "npm run source:onboarding:plan",
    "npm run source:feed-env:doctor",
    "npm run source:readiness:report",
    "npm run refresh:all",
    "```",
    ""
  ].join("\n");
}

const catalog = readJson("official-source-catalog.json");
const live = readJson("official-source-live-check.json");
const onboarding = readJson("source-onboarding-plan.json");
const feedEnv = readJson("source-feed-env-readiness.json");
const news = readJson("news-deals.json");
const refreshAll = readJson("refresh-all.json");

const liveStatusCounts = live.statusCounts ?? {};
const blockedLiveIssues =
  numberValue(live.needsReviewCount) +
  numberValue(live.timeoutCount) +
  numberValue(live.networkErrorCount) +
  numberValue(live.staleOrRemovedCount) +
  numberValue(liveStatusCounts.server_error) +
  numberValue(onboarding.blockedLiveIssues);
const policyRegressionFailures = Array.isArray(feedEnv.policyRegressionSamples)
  ? feedEnv.policyRegressionSamples.filter((sample) => sample.passed !== true).length
  : 1;
const configuredFeedUrls = Math.max(
  numberValue(catalog.configuredSourceCount),
  numberValue(feedEnv.configuredUrlCount),
  sumEnvPlanConfiguredUrls(onboarding.envPlan)
);
const refreshAllOk = getRefreshAllOk(refreshAll);
const officialSourceCandidates = numberValue(catalog.catalogCount);
const visibleOfficialBenefits = numberValue(news.visibleCount);

const gates = [
  buildGate(
    "official source catalog",
    catalog.ok === true && officialSourceCandidates >= 30 && Array.isArray(catalog.missingCategories) && catalog.missingCategories.length === 0 && Array.isArray(catalog.thinCategories) && catalog.thinCategories.length === 0,
    `${officialSourceCandidates}개 공식 소스 후보, 누락 카테고리 ${(catalog.missingCategories ?? []).length}개, 얇은 카테고리 ${(catalog.thinCategories ?? []).length}개`,
    "npm run source:catalog:report"
  ),
  buildGate(
    "official source live",
    live.ok === true && numberValue(live.totalSources) >= 30 && blockedLiveIssues === 0 && numberValue(live.highPriorityReachableOrGuarded) >= numberValue(live.highPrioritySources),
    `접근 가능 ${numberValue(live.reachableCount)}개, 보호 ${numberValue(live.guardedCount)}개, 차단 이슈 ${blockedLiveIssues}개`,
    "npm run source:live:doctor"
  ),
  buildGate(
    "source onboarding plan",
    onboarding.ok === true && numberValue(onboarding.totalSources) >= 30 && Array.isArray(onboarding.envPlan) && onboarding.envPlan.length >= 5,
    `env 후보 ${Array.isArray(onboarding.envPlan) ? onboarding.envPlan.length : 0}개, 상위 액션 ${Array.isArray(onboarding.topActions) ? onboarding.topActions.length : 0}개`,
    "npm run source:onboarding:plan"
  ),
  buildGate(
    "source feed env safety",
    feedEnv.ok === true && numberValue(feedEnv.failedCount) === 0 && policyRegressionFailures === 0 && Array.isArray(feedEnv.allowedCatalogHosts) && feedEnv.allowedCatalogHosts.length >= 25,
    `설정 URL ${numberValue(feedEnv.configuredUrlCount)}개, 실패 ${numberValue(feedEnv.failedCount)}개, 정책 샘플 실패 ${policyRegressionFailures}개`,
    "npm run source:feed-env:doctor"
  ),
  buildGate(
    "official benefit exposure",
    news.ok === true && visibleOfficialBenefits >= 25 && numberValue(news.hiddenCount) === 0 && numberValue(news.expiredCount) === 0 && numberValue(news.failedCount) === 0,
    `노출 ${visibleOfficialBenefits}개, 숨김 ${numberValue(news.hiddenCount)}개, 종료 ${numberValue(news.expiredCount)}개, 실패 ${numberValue(news.failedCount)}개`,
    "npm run refresh:news && npm run verify:news"
  ),
  buildGate(
    "refresh all pipeline",
    refreshAllOk && numberValue(refreshAll.productDealsCount) >= 140 && numberValue(refreshAll.newsDealsCount) >= 25 && numberValue(refreshAll.failedCount) === 0,
    `상품 ${numberValue(refreshAll.productDealsCount)}개, 공식 혜택 ${numberValue(refreshAll.newsDealsCount)}개, 실패 ${numberValue(refreshAll.failedCount)}개`,
    "npm run refresh:all"
  )
];

const ok = gates.every((gate) => gate.ok);
const report = {
  ok,
  generatedAt: new Date().toISOString(),
  readinessLabel: ok ? (configuredFeedUrls > 0 ? "공식 feed 운영 전환 가능" : "seed launch ready / 공식 feed 연결 대기") : "출시 전 차단 이슈 점검 필요",
  launchGateStatus: ok ? "passed" : "blocked",
  summary: {
    officialSourceCandidates,
    highPrioritySources: numberValue(catalog.highPriorityCount),
    reachableSources: numberValue(live.reachableCount),
    guardedSources: numberValue(live.guardedCount),
    blockedLiveIssues,
    configuredFeedUrls,
    feedEnvConfiguredUrlCount: numberValue(feedEnv.configuredUrlCount),
    feedEnvFailedCount: numberValue(feedEnv.failedCount),
    policyRegressionFailures,
    visibleOfficialBenefits,
    hiddenOfficialBenefits: numberValue(news.hiddenCount),
    expiredOfficialBenefits: numberValue(news.expiredCount),
    newsFailedCount: numberValue(news.failedCount),
    refreshAllOk,
    productDealsCount: numberValue(refreshAll.productDealsCount),
    newsDealsCount: numberValue(refreshAll.newsDealsCount)
  },
  gates,
  envPlan: Array.isArray(onboarding.envPlan) ? onboarding.envPlan : [],
  riskySources: Array.isArray(live.sources)
    ? live.sources.filter((source) => source.status !== "reachable").slice(0, 8)
    : [],
  operatorNextActions: buildOperatorNextActions({ catalog, onboarding, feedEnv, news, refreshAll }),
  commands: [
    "npm run source:catalog:report",
    "npm run source:live:doctor",
    "npm run source:onboarding:plan",
    "npm run source:feed-env:doctor",
    "npm run source:readiness:report",
    "npm run refresh:all"
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildMarkdown(report), "utf8");

if (!report.ok) {
  console.error("Official source readiness report failed:");
  for (const gate of report.gates.filter((gate) => !gate.ok)) {
    console.error(`- ${gate.name}: ${gate.detail}`);
  }
  process.exit(1);
}

console.log("Official source readiness report passed.");
console.log(`- official source candidates: ${report.summary.officialSourceCandidates}`);
console.log(`- reachable/guarded: ${report.summary.reachableSources}/${report.summary.guardedSources}`);
console.log(`- visible official benefits: ${report.summary.visibleOfficialBenefits}`);
console.log("- reports/source-readiness.json");
console.log("- docs/SOURCE_READINESS_REPORT.md");
