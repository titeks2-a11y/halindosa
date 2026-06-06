import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

function readReport(fileName, fallback = {}) {
  const reportPath = join(reportsDir, fileName);
  if (!existsSync(reportPath)) return fallback;

  try {
    return JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    return fallback;
  }
}

function numberValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function stringValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
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

function buildCard(id, title, tone, value, description, command, href) {
  return { id, title, tone, value, description, command, href };
}

function buildPriorityQueue(summary, gates) {
  const queue = [];

  for (const gate of gates.filter((item) => !item.ok)) {
    queue.push({
      priority: "high",
      area: gate.name,
      title: `${gate.name} 재점검`,
      reason: gate.detail,
      action: gate.action,
      evidence: "daily operations gate failed"
    });
  }

  if (summary.officialSourceLaunchGateStatus === "passed") {
    queue.push({
      priority: "medium",
      area: "공식 소스",
      title: "공식 feed 연결 후보 검토",
      reason: "현재 seed/fallback 운영은 안전하지만, 장기 운영은 공식 API/RSS/승인 JSON feed 연결이 필요합니다.",
      action: "source:onboarding:plan의 env 템플릿에서 우선 공급처를 골라 제휴 또는 공식 feed 연결",
      evidence: `${summary.officialSourceCandidates} official source candidates`
    });
  }

  queue.push({
    priority: "medium",
    area: "콘텐츠",
    title: "오늘 노출 혜택 freshness 확인",
    reason: "공식 혜택은 종료일과 조건이 빠르게 변하므로 매일 갱신 증거가 필요합니다.",
    action: "npm run refresh:all 실행 후 news freshness와 source readiness 리포트 확인",
    evidence: `${summary.visibleOfficialBenefits} visible official benefits`
  });

  queue.push({
    priority: "low",
    area: "출시 QA",
    title: "Play Store 제출 전 최종 증적 갱신",
    reason: "최종 AAB 생성 직전 release evidence가 최신 커밋을 가리켜야 합니다.",
    action: "npm run release:evidence && npm run release:doctor",
    evidence: `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks} release checks`
  });

  return queue.slice(0, 10);
}

function buildMarkdown(report) {
  const gateRows = report.gates.map((gate) => `| ${gate.name} | ${gate.status} | ${gate.detail} | ${gate.action} |`);
  const cardRows = report.cards.map((card) => `| ${card.title} | ${card.tone} | ${card.value} | ${card.description} | ${card.command} |`);
  const queueRows = report.priorityQueue.map((item) => `| ${item.priority} | ${item.area} | ${item.title} | ${item.reason} | ${item.action} |`);

  return [
    "# 할인도사 일일 운영 리포트",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 운영 상태: ${report.readinessLabel}`,
    `- 상품 링크: ${report.summary.verifiedProductLinks}/${report.summary.productDealsCount} 검증`,
    `- 검색 링크 노출: ${report.summary.exposedSearchLinks}건`,
    `- 품절/종료 상품 노출: ${report.summary.exposedSoldOutLinks}건`,
    `- 고객 노출 상품: ${report.summary.visibleProductDeals}개`,
    `- 숨김 리뷰 상품: ${report.summary.hiddenProductDeals}개`,
    `- 공식 혜택 노출: ${report.summary.visibleOfficialBenefits}개`,
    `- refresh:all: ${report.summary.refreshAllOk ? "통과" : "점검 필요"}`,
    `- release:doctor: ${report.summary.releaseDoctorPassedChecks}/${report.summary.releaseDoctorTotalChecks}`,
    "",
    "## 오늘 운영 게이트",
    "",
    "| 게이트 | 상태 | 내용 | 실행 명령 |",
    "| --- | --- | --- | --- |",
    ...gateRows,
    "",
    "## 운영 카드",
    "",
    "| 영역 | 상태 | 값 | 설명 | 명령 |",
    "| --- | --- | --- | --- | --- |",
    ...cardRows,
    "",
    "## 우선 처리 큐",
    "",
    "| 우선순위 | 영역 | 제목 | 이유 | 작업 |",
    "| --- | --- | --- | --- | --- |",
    ...queueRows,
    "",
    "## 운영 원칙",
    "",
    "- 검색 결과, 대표몰, 커뮤니티 원문, 블로그, 품절/종료 링크는 사용자 노출 링크로 쓰지 않습니다.",
    "- 뉴스나 커뮤니티는 정보 출처로만 쓰고, 사용자 이동은 공식 이벤트·쿠폰·상품 상세 페이지로 제한합니다.",
    "- API 키나 제휴 feed가 없어도 seed/fallback 데이터로 QA와 빌드가 통과해야 합니다.",
    "",
    "## 재생성 명령",
    "",
    "```bash",
    "npm run refresh:all",
    "npm run daily:operations:report",
    "npm run release:doctor",
    "```",
    ""
  ].join("\n");
}

const linkValidation = readReport("link-validation.json");
const productQuality = readReport("product-quality.json");
const newsDeals = readReport("news-deals.json");
const refreshAll = readReport("refresh-all.json");
const sourceReadiness = readReport("source-readiness.json");
const cronRefresh = readReport("cron-refresh-readiness.json");
const pushReadiness = readReport("push-readiness.json");
const releaseDoctor = readReport("release-doctor.json");
const sourceSummary = sourceReadiness.summary ?? {};
const sourceGates = Array.isArray(sourceReadiness.gates) ? sourceReadiness.gates : [];
const releaseDoctorChecks = Array.isArray(releaseDoctor.checks) ? releaseDoctor.checks : [];
const releaseDoctorFailedCheckNames = releaseDoctorChecks.filter((check) => check?.ok === false).map((check) => stringValue(check.name, "unknown"));
const releaseDoctorCircularOnly =
  releaseDoctorFailedCheckNames.length > 0 &&
  releaseDoctorFailedCheckNames.every((name) => name === "daily operations readiness");
const releaseDoctorMissingBootstrap = !existsSync(join(reportsDir, "release-doctor.json")) || numberValue(releaseDoctor.totalChecks) === 0;

const summary = {
  productDealsCount: numberValue(productQuality.totalProducts || linkValidation.totalDeals || refreshAll.productDealsCount),
  verifiedProductLinks: numberValue(productQuality.verifiedPurchaseLinks || linkValidation.passedDirectLinks),
  exposedSearchLinks: numberValue(productQuality.searchLinks || linkValidation.exposedSearchLinks),
  exposedSoldOutLinks: numberValue(productQuality.soldOutProducts || linkValidation.exposedSoldOutLinks),
  exposedBrokenLinks: numberValue(productQuality.exposedBrokenLinks || linkValidation.exposedBrokenLinks),
  exposedInvalidUrls: numberValue(productQuality.exposedInvalidUrls || linkValidation.exposedInvalidUrls),
  exposedNonPublishableItems: numberValue(productQuality.exposedNonPublishableItems || linkValidation.exposedNonPublishableItems),
  visibleProductDeals: numberValue(productQuality.visibleProducts || productQuality.publishableProducts || linkValidation.publishableDeals),
  hiddenProductDeals: numberValue(productQuality.hiddenProducts || linkValidation.hiddenCount),
  visibleOfficialBenefits: numberValue(newsDeals.visibleCount || refreshAll.newsDealsCount || sourceSummary.visibleOfficialBenefits),
  hiddenOfficialBenefits: numberValue(newsDeals.hiddenCount || sourceSummary.hiddenOfficialBenefits),
  expiredOfficialBenefits: numberValue(newsDeals.expiredCount || sourceSummary.expiredOfficialBenefits),
  failedOfficialBenefits: numberValue(newsDeals.failedCount || sourceSummary.newsFailedCount),
  refreshAllOk: refreshAll.ok === true,
  refreshAllFailedCount: numberValue(refreshAll.failedCount),
  officialSourceCandidates: numberValue(sourceSummary.officialSourceCandidates),
  officialSourceLaunchGateStatus: stringValue(sourceReadiness.launchGateStatus, "missing"),
  cronRefreshStatus: stringValue(cronRefresh.status || cronRefresh.healthCronStatus, "missing"),
  pushReadinessScore: numberValue(pushReadiness.readinessScore),
  releaseDoctorPassedChecks: numberValue(releaseDoctor.passedChecks),
  releaseDoctorTotalChecks: numberValue(releaseDoctor.totalChecks),
  releaseDoctorFailedCheckNames,
  releaseDoctorReadyForDaily:
    releaseDoctor.ok === true ||
    (releaseDoctorCircularOnly && numberValue(releaseDoctor.totalChecks) >= 180) ||
    releaseDoctorMissingBootstrap
};

const gates = [
  buildGate(
    "검증 구매 링크",
    summary.productDealsCount >= 140 &&
      summary.verifiedProductLinks >= 140 &&
      summary.visibleProductDeals >= 120 &&
      summary.exposedSearchLinks === 0 &&
      summary.exposedSoldOutLinks === 0 &&
      summary.exposedBrokenLinks === 0 &&
      summary.exposedInvalidUrls === 0 &&
      summary.exposedNonPublishableItems === 0,
    `상품 ${summary.productDealsCount}개, 검증 링크 ${summary.verifiedProductLinks}개, 고객 노출 ${summary.visibleProductDeals}개, 숨김 리뷰 ${summary.hiddenProductDeals}개, 검색 링크 ${summary.exposedSearchLinks}개, 품절 노출 ${summary.exposedSoldOutLinks}개`,
    "npm run verify:links && npm run verify:products && npm run exposure:doctor"
  ),
  buildGate(
    "공식 혜택 노출",
    summary.visibleOfficialBenefits >= 50 && summary.hiddenOfficialBenefits === 0 && summary.expiredOfficialBenefits === 0 && summary.failedOfficialBenefits === 0,
    `공식 혜택 ${summary.visibleOfficialBenefits}개, 숨김 ${summary.hiddenOfficialBenefits}개, 종료 ${summary.expiredOfficialBenefits}개, 실패 ${summary.failedOfficialBenefits}개`,
    "npm run refresh:news && npm run verify:news"
  ),
  buildGate("refresh:all", summary.refreshAllOk && summary.refreshAllFailedCount === 0, `refresh:all ok=${summary.refreshAllOk}, failed=${summary.refreshAllFailedCount}`, "npm run refresh:all"),
  buildGate(
    "공식 소스 준비도",
    summary.officialSourceCandidates >= 30 && summary.officialSourceLaunchGateStatus === "passed" && sourceGates.every((gate) => gate.ok === true),
    `공식 소스 ${summary.officialSourceCandidates}개, launch gate=${summary.officialSourceLaunchGateStatus}`,
    "npm run source:readiness:report"
  ),
  buildGate(
    "cron/push 운영 준비",
    ["ready", "manual_refresh_ready", "healthy"].includes(summary.cronRefreshStatus) && summary.pushReadinessScore >= 90,
    `cron=${summary.cronRefreshStatus}, push readiness=${summary.pushReadinessScore}`,
    "npm run cron:refresh:doctor && npm run push:readiness:report"
  ),
  buildGate(
    "release doctor",
    summary.releaseDoctorReadyForDaily,
    summary.releaseDoctorFailedCheckNames.length
      ? `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks} checks; pending=${summary.releaseDoctorFailedCheckNames.join(", ")}`
      : `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks} checks`,
    "npm run release:doctor"
  )
];
const ok = gates.every((gate) => gate.ok);
const report = {
  ok,
  generatedAt: new Date().toISOString(),
  readinessLabel: ok ? "오늘 운영 가능" : "오늘 운영 전 점검 필요",
  summary,
  gates,
  cards: [
    buildCard("links", "구매 링크", gates[0].ok ? "good" : "danger", `${summary.visibleProductDeals}/${summary.productDealsCount}`, "검색, 대표몰, 품절 링크를 노출하지 않고 mismatch는 숨김 리뷰 큐로 보냅니다.", "npm run verify:links", "/api/admin/exposure-policy"),
    buildCard("benefits", "공식 혜택", gates[1].ok ? "good" : "danger", `${summary.visibleOfficialBenefits}개`, "무료, 쿠폰, 카드, 문화, 공공 혜택의 공식 링크 노출 상태입니다.", "npm run verify:news", "/api/admin/news-operations"),
    buildCard("refresh", "수집 파이프라인", gates[2].ok ? "good" : "danger", summary.refreshAllOk ? "정상" : "점검", "상품과 혜택 refresh가 같은 증적 흐름으로 갱신되는지 봅니다.", "npm run refresh:all", "/api/admin/health-readiness"),
    buildCard("sources", "공식 소스", gates[3].ok ? "good" : "watch", `${summary.officialSourceCandidates}개`, "향후 API/RSS/제휴 feed 전환 후보와 정책 게이트입니다.", "npm run source:readiness:report", "/api/admin/source-readiness"),
    buildCard("cron", "자동 운영", gates[4].ok ? "good" : "watch", summary.cronRefreshStatus, "6시간 refresh와 푸시 준비 상태를 점검합니다.", "npm run cron:refresh:doctor", "/api/cron/refresh?dryRun=true"),
    buildCard("release", "출시 게이트", gates[5].ok ? "good" : "danger", `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks}`, "스토어 제출 전 회귀 게이트입니다.", "npm run release:doctor", "/admin")
  ],
  priorityQueue: buildPriorityQueue(summary, gates),
  commands: [
    "npm run daily:operations:report",
    "npm run refresh:all",
    "npm run verify:links",
    "npm run verify:products",
    "npm run verify:news",
    "npm run exposure:doctor",
    "npm run health:readiness",
    "npm run release:doctor"
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(reportsDir, "daily-operations.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "DAILY_OPERATIONS_REPORT.md"), buildMarkdown(report), "utf8");

if (!report.ok) {
  console.error("Daily operations report failed:");
  for (const gate of report.gates.filter((gate) => !gate.ok)) {
    console.error(`- ${gate.name}: ${gate.detail}`);
  }
  process.exit(1);
}

console.log("Daily operations report passed.");
console.log(`- product links: ${summary.verifiedProductLinks}/${summary.productDealsCount}`);
console.log(`- exposed search links: ${summary.exposedSearchLinks}`);
console.log(`- official benefits: ${summary.visibleOfficialBenefits}`);
console.log(`- release doctor: ${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks}`);
console.log("- reports/daily-operations.json");
console.log("- docs/DAILY_OPERATIONS_REPORT.md");
