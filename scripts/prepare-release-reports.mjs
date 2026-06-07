import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const ciMode = args.has("--ci") || process.env.CI === "true";

const steps = [
  ["admin auth", "admin:auth:doctor"],
  ["link verification", "verify:links", ["--", "--no-body"]],
  ["product quality", "verify:products"],
  ["link policy regression", "link:policy:regression"],
  ["exposure policy", "exposure:doctor"],
  ["publishable surface", "surface:publishable:doctor"],
  ["launch link gate", "link:launch:gate"],
  ["link revalidation report", "link:revalidation:report"],
  ["live probe review", "live:probe:review"],
  ["source catalog report", "source:catalog:report"],
  ["source live report", "source:live:doctor"],
  ["source onboarding plan", "source:onboarding:plan"],
  ["source feed env doctor", "source:feed-env:doctor"],
  ["source readiness report", "source:readiness:report"],
  ["news freshness doctor", "news:freshness:doctor"],
  ["news revalidation report", "news:revalidation:report"],
  ["news preview", "news:preview"],
  ["news feed error tests", "test:news-feed-errors"],
  ["news feed dry run", "test:news-feed-dry-run"],
  ["news feed live pipeline", "news:feed:live"],
  ["cron refresh doctor", "cron:refresh:doctor"],
  ["health readiness report", "health:readiness"],
  ["official benefit alerts", "official:alerts:report"],
  ["push readiness report", "push:readiness:report"],
  ["push delivery doctor", "push:delivery:doctor"],
  ["push delivery audit", "push:delivery:audit"],
  ["daily operations report", "daily:operations:report"]
];

function runStep([label, script, extraArgs = []]) {
  const startedAt = new Date().toISOString();
  console.log(`\n[release prepare] ${label}`);
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const commandArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", ["npm", "run", script, ...extraArgs].join(" ")]
      : ["run", script, ...extraArgs];
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  return {
    label,
    script,
    args: extraArgs,
    startedAt,
    completedAt: new Date().toISOString(),
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
    error: result.error?.message ?? null,
    ok: result.status === 0
  };
}

const results = [];
for (const step of steps) {
  const result = runStep(step);
  results.push(result);
  if (!result.ok && !ciMode) break;
}

const failed = results.filter((result) => !result.ok);
const report = {
  ok: failed.length === 0,
  mode: ciMode ? "ci_collect_all_then_release_doctor" : "strict_stop_on_first_failure",
  generatedAt: new Date().toISOString(),
  totalSteps: results.length,
  passedSteps: results.length - failed.length,
  failedSteps: failed.length,
  failures: failed.map((result) => ({
    label: result.label,
    script: result.script,
    args: result.args,
    exitCode: result.exitCode,
    signal: result.signal
  })),
  policy:
    "CI report preparation keeps running to refresh as many evidence files as possible. The following release:doctor step remains the hard launch gate."
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports", "release-prepare-reports.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!report.ok) {
  console.error("\nRelease report preparation recorded failures:");
  for (const failure of report.failures) {
    console.error(`- ${failure.script}: exit ${failure.exitCode}`);
  }
  console.error("reports/release-prepare-reports.json");
}

if (!report.ok && !ciMode) {
  process.exit(1);
}

console.log(
  `Release report preparation completed: ${report.passedSteps}/${report.totalSteps} steps passed${report.failedSteps ? `, ${report.failedSteps} recorded for release:doctor follow-up` : ""}.`
);
