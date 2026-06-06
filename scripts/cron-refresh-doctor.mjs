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
const cronOperations = readText("lib/operations/cronRefresh.ts");
const healthRoute = readText("app/api/health/route.ts");
const adminPage = [
  readText("app/admin/page.tsx"),
  readText("components/AdminCronRefreshPanel.tsx")
].join("\n");
const smoke = readText("scripts/smoke.mjs");
const runbook = readText("docs/RUNBOOK.md");
const envExample = readText(".env.example");
const refreshAll = readJson("reports/refresh-all.json");
const livePipeline = readJson("reports/news-feed-live-pipeline.json");
const healthReadiness = readJson("reports/health-readiness.json");
const cronReport = readJson("reports/cron-refresh.json", null);
const cronConfig = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/refresh") : null;
const minimumVisibleOfficialBenefits = 85;

const refreshAllOk = refreshAll.ok === true && Number(refreshAll.productDealsCount ?? 0) >= 140 && Number(refreshAll.newsDealsCount ?? 0) >= minimumVisibleOfficialBenefits && Number(refreshAll.failedCount ?? 0) === 0;
const livePipelineOk =
  livePipeline.ok === true &&
  ["seed_launch_ready", "live_feed_ready"].includes(String(livePipeline.status ?? "")) &&
  Number(livePipeline.officialBenefits?.visibleCount ?? 0) >= minimumVisibleOfficialBenefits &&
  Number(livePipeline.officialBenefits?.exposedSearchLinkCount ?? 0) === 0 &&
  Number(livePipeline.officialBenefits?.exposedNonOfficialLinkCount ?? 0) === 0;
const healthCronStatus = healthReadiness.cronRefresh?.status ?? "";
const healthCronOk = healthReadiness.cronRefresh?.ok === true;
const checks = [
  route.includes("canRunCronRefresh") && route.includes("CRON_SECRET") && route.includes("x-cron-secret")
    ? pass("protected route", "Cron endpoint requires CRON_SECRET, bearer/header secret, or admin token.")
    : fail("protected route", "Cron endpoint should reject unauthenticated refresh attempts."),
  route.includes("dryRun") && route.includes("buildDryRunReport") && smoke.includes("/api/cron/refresh?dryRun=true")
    ? pass("dry-run guard", "Dry-run path is smoke-tested and does not execute refresh scripts.")
    : fail("dry-run guard", "Dry-run path should be tested before release."),
  route.includes("spawnSync") && route.includes("scripts/refresh-all.mjs") && route.includes("CRON_REFRESH_RUN")
    ? pass("refresh execution", "Cron route executes the same refresh:all pipeline as release QA.")
    : fail("refresh execution", "Cron route should execute scripts/refresh-all.mjs with bounded timeout."),
  route.includes("resolvePipelineMode") && route.includes("mode=liveFeed") && route.includes("scripts/news-feed-live-pipeline.mjs") && smoke.includes("/api/cron/refresh?dryRun=true&mode=liveFeed")
    ? pass("live feed mode", "Cron route supports an explicit mode=liveFeed dry-run and execution path for official feed operations.")
    : fail("live feed mode", "Cron route should expose a guarded mode=liveFeed path and smoke should test its dry-run."),
  cronConfig?.schedule === "0 */6 * * *"
    ? pass("vercel schedule", "Vercel schedules /api/cron/refresh every 6 hours.")
    : fail("vercel schedule", "vercel.json should schedule /api/cron/refresh every 6 hours."),
  envExample.includes("CRON_SECRET=") && envExample.includes("CRON_REFRESH_TIMEOUT_MS=")
    ? pass("environment keys", ".env.example documents cron secret and timeout knobs.")
    : fail("environment keys", ".env.example should document CRON_SECRET and CRON_REFRESH_TIMEOUT_MS."),
  cronOperations.includes("getCronRefreshOperationsReport") && cronOperations.includes("reports/cron-refresh.json")
    ? pass("operations report", "Cron operations layer exposes last-run status and report path.")
    : fail("operations report", "Cron operations layer should summarize last-run status."),
  healthRoute.includes("cronRefreshStatus") && adminPage.includes("자동 refresh cron 운영")
    ? pass("health and admin surfaces", "Health API and admin dashboard expose cron readiness.")
    : fail("health and admin surfaces", "Health API and admin dashboard should expose cron readiness."),
  refreshAllOk
    ? pass("refresh-all evidence", `refresh:all is healthy with ${refreshAll.productDealsCount} product deals and ${refreshAll.newsDealsCount} official benefits.`)
    : fail("refresh-all evidence", "reports/refresh-all.json should show a passing product/news refresh."),
  livePipelineOk
    ? pass("live feed evidence", `news:feed:live is ${livePipeline.status} with ${livePipeline.officialBenefits?.visibleCount} official benefits and zero unsafe exposed links.`)
    : fail("live feed evidence", "reports/news-feed-live-pipeline.json should show a passing live feed pipeline with official benefits and zero unsafe exposed links."),
  ["healthy", "manual_refresh_ready"].includes(healthCronStatus) && healthCronOk
    ? pass("health readiness status", `Health readiness marks cron refresh as ${healthCronStatus}.`)
    : fail("health readiness status", `Health readiness cron status is ${healthCronStatus || "missing"}.`),
  runbook.includes("/api/cron/refresh") && runbook.includes("CRON_SECRET") && runbook.includes("reports/cron-refresh.json")
    ? pass("runbook", "RUNBOOK documents protected cron execution and report inspection.")
    : fail("runbook", "RUNBOOK should document protected cron execution and report inspection.")
];

const failures = checks.filter((check) => !check.ok);
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  status: failures.length ? "needs_fix" : "ready",
  endpoint: "/api/cron/refresh",
  schedule: cronConfig?.schedule ?? "",
  packageScript: packageJson.scripts?.["cron:refresh:doctor"] ?? "",
  routeProtected: checks[0].ok,
  dryRunGuarded: checks[1].ok,
  refreshAllOk,
  livePipelineOk,
  livePipelineStatus: livePipeline.status ?? "",
  livePipelineOfficialBenefits: Number(livePipeline.officialBenefits?.visibleCount ?? 0),
  livePipelineConfiguredUrlCount: Number(livePipeline.configuredUrlCount ?? 0),
  healthCronStatus,
  cronReportExists: Boolean(cronReport),
  cronReportGeneratedAt: cronReport?.generatedAt ?? "",
  reportPath: "reports/cron-refresh.json",
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
| Schedule | ${report.schedule || "not configured"} |
| Protected route | ${report.routeProtected ? "PASS" : "FAIL"} |
| Dry-run guard | ${report.dryRunGuarded ? "PASS" : "FAIL"} |
| refresh:all evidence | ${report.refreshAllOk ? "PASS" : "FAIL"} |
| news:feed:live evidence | ${report.livePipelineOk ? "PASS" : "FAIL"} |
| Live feed status | ${report.livePipelineStatus || "missing"} |
| Live feed configured URL | ${report.livePipelineConfiguredUrlCount} |
| Live feed official benefits | ${report.livePipelineOfficialBenefits} |
| Health cron status | ${report.healthCronStatus || "missing"} |
| Actual cron report | ${report.cronReportExists ? report.cronReportGeneratedAt : "not generated yet"} |

## Checks

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail.replace(/\|/g, "/")} |`).join("\n")}

## Operation Notes

- 실제 배포 환경에서는 \`CRON_SECRET\` 설정 후 Vercel Cron이 \`/api/cron/refresh\`를 호출합니다.
- \`dryRun=true\`는 리포트 상태만 확인하고 수집 스크립트를 실행하지 않습니다.
- 공식 API/RSS/제휴 JSON feed를 점검할 때는 \`/api/cron/refresh?mode=liveFeed\`를 명시 호출합니다. 기본 6시간 cron은 기존 \`refresh:all\` 경로를 유지합니다.
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
