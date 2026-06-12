import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

function readText(path, fallback = "") {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : fallback;
}

function readJson(path, fallback = {}) {
  try {
    const fullPath = join(root, path);
    if (!existsSync(fullPath)) return fallback;
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

const packageJson = readJson("package.json");
const vercelConfig = readJson("vercel.json");
const route = readText("app/api/cron/refresh/route.ts");
const benefitsRoute = readText("app/api/cron/benefits/route.ts");
const apiGuards = readText("lib/apiGuards.ts");
const cronOutput = readText("lib/cronOutput.ts");
const cronOperations = readText("lib/operations/cronRefresh.ts");
const healthRoute = readText("app/api/health/route.ts");
const githubBenefitRefreshWorkflow = readText(".github/workflows/benefit-refresh-scheduler.yml");
const adminPage = [
  readText("app/admin/page.tsx"),
  readText("components/AdminCronRefreshPanel.tsx")
].join("\n");
const smoke = readText("scripts/smoke.mjs");
const runbook = readText("docs/RUNBOOK.md");
const envExample = readText(".env.example");
const refreshAll = readJson("reports/refresh-all.json");
const livePipeline = readJson("reports/news-feed-live-pipeline.json");
const benefitsRefresh = readJson("reports/benefits-refresh.json");
const freeBenefitEvents = readJson("reports/free-benefit-events.json");
const healthReadiness = readJson("reports/health-readiness.json");
const cronReport = readJson("reports/cron-refresh.json", null);
const benefitsCronReport = readJson("reports/cron-benefits.json", null);
const cronConfig = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/refresh") : null;
const benefitsCronConfig = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/benefits") : null;
const minimumVisibleOfficialBenefits = 95;

const refreshAllOk = refreshAll.ok === true && Number(refreshAll.productDealsCount ?? 0) >= 140 && Number(refreshAll.newsDealsCount ?? 0) >= minimumVisibleOfficialBenefits && Number(refreshAll.failedCount ?? 0) === 0;
const livePipelineOk =
  livePipeline.ok === true &&
  ["seed_launch_ready", "live_feed_ready"].includes(String(livePipeline.status ?? "")) &&
  Number(livePipeline.officialBenefits?.visibleCount ?? 0) >= minimumVisibleOfficialBenefits &&
  Number(livePipeline.officialBenefits?.exposedSearchLinkCount ?? 0) === 0 &&
  Number(livePipeline.officialBenefits?.exposedNonOfficialLinkCount ?? 0) === 0;
const benefitsRefreshOk = benefitsRefresh.ok === true && Number(benefitsRefresh.failedSteps ?? 0) === 0;
const freeBenefitEventsOk =
  freeBenefitEvents.ok === true &&
  Number(freeBenefitEvents.visibleActiveEvents ?? 0) >= Math.max(100, Number(freeBenefitEvents.minimumVisibleEvents ?? 0)) &&
  Number(freeBenefitEvents.sourceCount ?? 0) >= 90 &&
  Number(freeBenefitEvents.hostCount ?? 0) >= 70;
const healthCronStatus = healthReadiness.cronRefresh?.status ?? "";
const healthCronOk = healthReadiness.cronRefresh?.ok === true;
const checks = [
  route.includes('dynamic = "force-dynamic"') &&
    route.includes("revalidate = 0") &&
    route.includes('fetchCache = "force-no-store"') &&
    benefitsRoute.includes('dynamic = "force-dynamic"') &&
    benefitsRoute.includes("revalidate = 0") &&
    benefitsRoute.includes('fetchCache = "force-no-store"')
    ? pass("cron no-store route policy", "Cron refresh and benefits endpoints explicitly opt out of static rendering and fetch caching.")
    : fail("cron no-store route policy", "Cron refresh and benefits endpoints should declare force-dynamic, revalidate=0, and force-no-store."),
  route.includes("canRunCronRefresh") && route.includes("CRON_SECRET") && route.includes("x-cron-secret")
    ? pass("protected route", "Cron endpoint requires CRON_SECRET, bearer/header secret, or admin token.")
    : fail("protected route", "Cron endpoint should reject unauthenticated refresh attempts."),
  apiGuards.includes("isTrustedRequestOrigin") &&
    route.includes("isTrustedRequestOrigin(request)") &&
    benefitsRoute.includes("isTrustedRequestOrigin(request)")
    ? pass("trusted origin guard", "Cron refresh and benefits endpoints reject untrusted browser origins while allowing server cron calls.")
    : fail("trusted origin guard", "Cron refresh and benefits endpoints should check trusted browser origins."),
  cronOutput.includes("sanitizedProcessTail") &&
    route.includes("sanitizedProcessTail") &&
    benefitsRoute.includes("sanitizedProcessTail") &&
    !route.includes("stderrTail과") &&
    !benefitsRoute.includes("stderrTail과")
    ? pass("sanitized process output", "Cron process output is redacted before it can appear in API/report payloads.")
    : fail("sanitized process output", "Cron process output should be redacted and failure messages should avoid stderr hints."),
  route.includes("dryRun") && route.includes("buildDryRunReport") && smoke.includes("/api/cron/refresh?dryRun=true")
    ? pass("dry-run guard", "Dry-run path is smoke-tested and does not execute refresh scripts.")
    : fail("dry-run guard", "Dry-run path should be tested before release."),
  route.includes("spawnSync") && route.includes("scripts/refresh-all.mjs") && route.includes("CRON_REFRESH_RUN")
    ? pass("refresh execution", "Cron route executes the same refresh:all pipeline as release QA.")
    : fail("refresh execution", "Cron route should execute scripts/refresh-all.mjs with bounded timeout."),
  route.includes("resolvePipelineMode") && route.includes("mode=liveFeed") && route.includes("scripts/news-feed-live-pipeline.mjs") && smoke.includes("/api/cron/refresh?dryRun=true&mode=liveFeed")
    ? pass("live feed mode", "Cron route supports an explicit mode=liveFeed dry-run and execution path for official feed operations.")
    : fail("live feed mode", "Cron route should expose a guarded mode=liveFeed path and smoke should test its dry-run."),
  benefitsRoute.includes("canRunBenefitsCron") && benefitsRoute.includes("CRON_SECRET") && benefitsRoute.includes("scripts/refresh-benefits.mjs") && benefitsRoute.includes("reports/cron-benefits.json") && smoke.includes("/api/cron/benefits?dryRun=true")
    ? pass("benefits cron route", "Dedicated cron benefits endpoint refreshes official free benefit events with the same auth guard.")
    : fail("benefits cron route", "Cron benefits endpoint should refresh official free benefit events and be smoke-tested."),
  cronConfig?.schedule === "0 18 * * *"
    ? pass("vercel schedule", "Vercel schedules /api/cron/refresh once daily for Hobby plan compatibility.")
    : fail("vercel schedule", "vercel.json should schedule /api/cron/refresh once daily for Vercel Hobby compatibility."),
  benefitsCronConfig?.schedule === "0 21 * * *"
    ? pass("vercel benefits schedule", "Vercel schedules /api/cron/benefits once daily for free-benefit-first operations.")
    : fail("vercel benefits schedule", "vercel.json should schedule /api/cron/benefits once daily for Vercel Hobby compatibility."),
  githubBenefitRefreshWorkflow.includes('cron: "*/30 * * * *"') &&
    githubBenefitRefreshWorkflow.includes("/api/cron/benefits") &&
    githubBenefitRefreshWorkflow.includes("/api/cron/refresh?mode=liveFeed") &&
    githubBenefitRefreshWorkflow.includes("/api/health") &&
    githubBenefitRefreshWorkflow.includes("/api/freebies?limit=12") &&
    githubBenefitRefreshWorkflow.includes("officialBenefitVisibleCount") &&
    githubBenefitRefreshWorkflow.includes("officialBenefitFresh") &&
    githubBenefitRefreshWorkflow.includes("CRON_SECRET") &&
    githubBenefitRefreshWorkflow.includes("HALINDOSA_CRON_SECRET")
    ? pass("github scheduled benefit refresh", "GitHub Actions can call protected benefits refresh every 30 minutes, live feed refresh hourly, and verify production /api/health plus /api/freebies after refresh.")
    : fail("github scheduled benefit refresh", "A protected GitHub Actions scheduler should call /api/cron/benefits frequently, /api/cron/refresh?mode=liveFeed on a bounded cadence, then verify production /api/health and /api/freebies readiness."),
  envExample.includes("CRON_SECRET=") && envExample.includes("CRON_REFRESH_TIMEOUT_MS=")
    ? pass("environment keys", ".env.example documents cron secret and timeout knobs.")
    : fail("environment keys", ".env.example should document CRON_SECRET and CRON_REFRESH_TIMEOUT_MS."),
  cronOperations.includes("getCronRefreshOperationsReport") && cronOperations.includes("reports/cron-refresh.json")
    ? pass("operations report", "Cron operations layer exposes last-run status and report path.")
    : fail("operations report", "Cron operations layer should summarize last-run status."),
  cronOperations.includes("benefitsEndpoint") && cronOperations.includes("reports/cron-benefits.json") && cronOperations.includes("reports/free-benefit-events.json")
    ? pass("benefits operations report", "Cron operations layer exposes dedicated benefits cron status and event evidence.")
    : fail("benefits operations report", "Cron operations layer should summarize benefits cron status and event evidence."),
  healthRoute.includes("cronRefreshStatus") && healthRoute.includes("cronBenefitsStatus") && adminPage.includes("자동 refresh cron 운영")
    ? pass("health and admin surfaces", "Health API and admin dashboard expose refresh and benefits cron readiness.")
    : fail("health and admin surfaces", "Health API and admin dashboard should expose refresh and benefits cron readiness."),
  refreshAllOk
    ? pass("refresh-all evidence", `refresh:all is healthy with ${refreshAll.productDealsCount} product deals and ${refreshAll.newsDealsCount} official benefits.`)
    : fail("refresh-all evidence", "reports/refresh-all.json should show a passing product/news refresh."),
  livePipelineOk
    ? pass("live feed evidence", `news:feed:live is ${livePipeline.status} with ${livePipeline.officialBenefits?.visibleCount} official benefits and zero unsafe exposed links.`)
    : fail("live feed evidence", "reports/news-feed-live-pipeline.json should show a passing live feed pipeline with official benefits and zero unsafe exposed links."),
  benefitsRefreshOk
    ? pass("benefits refresh evidence", `refresh:benefits is healthy with ${benefitsRefresh.passedSteps}/${benefitsRefresh.totalSteps} passing steps.`)
    : fail("benefits refresh evidence", "reports/benefits-refresh.json should show a passing benefits refresh."),
  freeBenefitEventsOk
    ? pass("free benefit event evidence", `free benefit events expose ${freeBenefitEvents.visibleActiveEvents} active events across ${freeBenefitEvents.sourceCount} sources and ${freeBenefitEvents.hostCount} hosts.`)
    : fail("free benefit event evidence", "reports/free-benefit-events.json should show at least 100 visible active events with broad source and host coverage."),
  ["healthy", "manual_refresh_ready"].includes(healthCronStatus) && healthCronOk
    ? pass("health readiness status", `Health readiness marks cron refresh as ${healthCronStatus}.`)
    : fail("health readiness status", `Health readiness cron status is ${healthCronStatus || "missing"}.`),
  runbook.includes("/api/cron/refresh") && runbook.includes("CRON_SECRET") && runbook.includes("reports/cron-refresh.json")
    ? pass("runbook", "RUNBOOK documents protected cron execution and report inspection.")
    : fail("runbook", "RUNBOOK should document protected cron execution and report inspection.")
];

const failures = checks.filter((check) => !check.ok);
const checkOk = (name) => checks.find((check) => check.name === name)?.ok === true;
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  status: failures.length ? "needs_fix" : "ready",
  endpoint: "/api/cron/refresh",
  benefitsEndpoint: "/api/cron/benefits",
  schedule: cronConfig?.schedule ?? "",
  benefitsSchedule: benefitsCronConfig?.schedule ?? "",
  githubSchedule: githubBenefitRefreshWorkflow.includes('cron: "*/30 * * * *"') ? "*/30 * * * *" : "",
  packageScript: packageJson.scripts?.["cron:refresh:doctor"] ?? "",
  routeProtected: checkOk("protected route"),
  trustedOriginGuarded: checkOk("trusted origin guard"),
  processOutputSanitized: checkOk("sanitized process output"),
  noStoreRoutePolicy: checkOk("cron no-store route policy"),
  dryRunGuarded: checkOk("dry-run guard"),
  refreshAllOk,
  livePipelineOk,
  livePipelineStatus: livePipeline.status ?? "",
  livePipelineOfficialBenefits: Number(livePipeline.officialBenefits?.visibleCount ?? 0),
  livePipelineConfiguredUrlCount: Number(livePipeline.configuredUrlCount ?? 0),
  benefitsRefreshOk,
  freeBenefitEventsOk,
  freeBenefitVisibleActiveEvents: Number(freeBenefitEvents.visibleActiveEvents ?? 0),
  freeBenefitMinimumVisibleEvents: Number(freeBenefitEvents.minimumVisibleEvents ?? 0),
  freeBenefitSourceCount: Number(freeBenefitEvents.sourceCount ?? 0),
  freeBenefitHostCount: Number(freeBenefitEvents.hostCount ?? 0),
  healthCronStatus,
  cronReportExists: Boolean(cronReport),
  cronReportGeneratedAt: cronReport?.generatedAt ?? "",
  benefitsCronReportExists: Boolean(benefitsCronReport),
  benefitsCronReportGeneratedAt: benefitsCronReport?.generatedAt ?? "",
  reportPath: "reports/cron-refresh.json",
  benefitsReportPath: "reports/cron-benefits.json",
  readinessReportPath: "reports/cron-refresh-readiness.json",
  checks
};

const markdown = `# 할인도사 Cron Refresh Readiness

Generated: npm run cron:refresh:doctor
Status: ${report.status}

## Summary

| Metric | Value |
| --- | --- |
| Endpoint | ${report.endpoint} |
| Benefits endpoint | ${report.benefitsEndpoint} |
| Schedule | ${report.schedule || "not configured"} |
| Benefits schedule | ${report.benefitsSchedule || "not configured"} |
| GitHub scheduler | ${report.githubSchedule || "not configured"} |
| Protected route | ${report.routeProtected ? "PASS" : "FAIL"} |
| No-store route policy | ${report.noStoreRoutePolicy ? "PASS" : "FAIL"} |
| Dry-run guard | ${report.dryRunGuarded ? "PASS" : "FAIL"} |
| refresh:all evidence | ${report.refreshAllOk ? "PASS" : "FAIL"} |
| news:feed:live evidence | ${report.livePipelineOk ? "PASS" : "FAIL"} |
| Live feed status | ${report.livePipelineStatus || "missing"} |
| Live feed configured URL | ${report.livePipelineConfiguredUrlCount} |
| Live feed official benefits | ${report.livePipelineOfficialBenefits} |
| refresh:benefits evidence | ${report.benefitsRefreshOk ? "PASS" : "FAIL"} |
| Free benefit events evidence | ${report.freeBenefitEventsOk ? "PASS" : "FAIL"} |
| Free benefit visible active events | ${report.freeBenefitVisibleActiveEvents} |
| Free benefit source count | ${report.freeBenefitSourceCount} |
| Free benefit host count | ${report.freeBenefitHostCount} |
| Health cron status | ${report.healthCronStatus || "missing"} |
| Actual cron report | ${report.cronReportExists ? report.cronReportGeneratedAt : "not generated yet"} |
| Actual benefits cron report | ${report.benefitsCronReportExists ? report.benefitsCronReportGeneratedAt : "not generated yet"} |

## Checks

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail.replace(/\|/g, "/")} |`).join("\n")}

## Operation Notes

- 실제 배포 환경에서는 \`CRON_SECRET\` 설정 후 Vercel Cron이 \`/api/cron/refresh\`를 호출합니다.
- 무료혜택 우선 갱신은 Vercel Cron이 \`/api/cron/benefits\`를 별도로 호출하며, 같은 \`CRON_SECRET\` 보호를 사용합니다.
- 더 빠른 무료혜택 갱신은 GitHub Actions \`Benefit Refresh Scheduler\`가 \`CRON_SECRET\` 또는 \`HALINDOSA_CRON_SECRET\`이 있을 때 30분마다 \`/api/cron/benefits\`를 호출하고, 정각에는 \`/api/cron/refresh?mode=liveFeed\`도 호출합니다.
- \`/api/health\`는 \`cronBenefitsStatus\`, \`cronBenefitsVisibleActiveEvents\`, \`cronBenefitsSourceCount\`를 노출해 무료혜택 자동 갱신 상태를 별도로 확인합니다.
- \`dryRun=true\`는 리포트 상태만 확인하고 수집 스크립트를 실행하지 않습니다.
- 공식 API/RSS/제휴 JSON feed를 점검할 때는 \`/api/cron/refresh?mode=liveFeed\`를 명시 호출합니다. 기본 daily cron은 기존 \`refresh:all\` 경로를 유지합니다.
- \`reports/cron-refresh.json\`은 실제 실행 증거이므로 오래된 파일을 커밋해 출시 게이트를 흔들지 않습니다.
- 자동 실행 전에도 \`reports/refresh-all.json\`, \`reports/news-feed-live-pipeline.json\`과 이 readiness 리포트로 수동 갱신 기준을 확인합니다.
`;

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(reportsDir, "cron-refresh-readiness.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "CRON_REFRESH_READINESS.md"), markdown, "utf8");

if (failures.length) {
  console.error("Cron refresh doctor failed.");
  for (const check of failures) console.error(`- ${check.name}: ${check.detail}`);
  process.exit(1);
}

console.log(`Cron refresh doctor passed: ${checks.length}/${checks.length}`);
