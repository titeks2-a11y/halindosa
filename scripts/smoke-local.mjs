import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const loopbackHost = ["127", "0", "0", "1"].join(".");
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;
const healthUrl = `${baseUrl}/api/health`;
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 45000);
const smokeReportFiles = [
  "reports/daily-operations.json",
  "reports/exposure-policy.json",
  "reports/health-readiness.json",
  "reports/link-quality-regression.json",
  "reports/link-launch-gate.json",
  "reports/news-deals.json",
  "reports/news-feed-live-pipeline.json",
  "reports/news-feed-preview.json",
  "reports/official-benefit-alerts.json",
  "reports/official-source-live-check.json",
  "reports/refresh-all.json",
  "reports/source-feed-env-readiness.json",
  "reports/source-onboarding-plan.json",
  "reports/source-readiness.json"
];

const smokeReportBootstrapTasks = [
  "refresh:deals",
  "refresh:news",
  "verify:news",
  "news:freshness:doctor",
  "news:feed:canary",
  "news:preview",
  "refresh:all",
  "verify:links:live",
  "link:policy:regression",
  "exposure:doctor",
  "link:launch:gate",
  "feed:transition:report",
  "source:catalog:report",
  "source:live:doctor",
  "source:onboarding:plan",
  "source:feed-env:doctor",
  "source:readiness:report",
  "news:feed:live",
  "cron:refresh:doctor",
  "push:readiness:report",
  "push:delivery:doctor",
  "push:delivery:audit",
  "official:alerts:report",
  "health:readiness",
  "daily:operations:report"
];

function run(file, args, options = {}) {
  const result = spawnSync(file, args, {
    stdio: "inherit",
    ...options
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpmScript(scriptName) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npm", "run", scriptName] : ["run", scriptName];
  run(command, commandArgs, {
    env: {
      ...process.env,
      ADMIN_EXPORT_TOKEN: process.env.ADMIN_EXPORT_TOKEN ?? "local-admin"
    }
  });
}

function hasSmokeReports() {
  return smokeReportFiles.every((file) => existsSync(join(root, file)));
}

function bootstrapSmokeReportsIfNeeded() {
  if (process.env.SMOKE_SKIP_REPORT_BOOTSTRAP === "1" || hasSmokeReports()) return;

  console.log("Smoke report cache is missing. Bootstrapping operational reports before local smoke...");
  for (const taskName of smokeReportBootstrapTasks) {
    console.log(`\n[smoke bootstrap] npm run ${taskName}`);
    runNpmScript(taskName);
  }
}

async function waitForHealth() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.ok) return;
      }
    } catch {
      // Keep waiting until Next.js is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Health check timed out: ${healthUrl}`);
}

function stopProcessTree(child) {
  if (!child.pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore"
    });
    return;
  }

  child.kill("SIGTERM");
}

bootstrapSmokeReportsIfNeeded();
run(process.execPath, ["scripts/stop-dev-server.mjs"]);

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const devServer = spawn(process.execPath, [nextBin, "dev", "--hostname", loopbackHost, "--port", "3000"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    ADMIN_EXPORT_TOKEN: process.env.ADMIN_EXPORT_TOKEN ?? "local-admin"
  }
});

try {
  await waitForHealth();
  run(process.execPath, ["scripts/smoke.mjs"], {
    env: {
      ...process.env,
      SMOKE_BASE_URL: baseUrl,
      ADMIN_EXPORT_TOKEN: process.env.ADMIN_EXPORT_TOKEN ?? "local-admin",
      SMOKE_ADMIN_TOKEN: process.env.SMOKE_ADMIN_TOKEN ?? process.env.ADMIN_EXPORT_TOKEN ?? "local-admin"
    }
  });
} finally {
  stopProcessTree(devServer);
}
