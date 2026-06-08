import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const startedAt = Date.now();
const steps = [
  ["refresh:freebies", ["scripts/refresh-official-benefit-slice.mjs", "freebies"]],
  ["refresh:events", ["scripts/refresh-official-benefit-slice.mjs", "events", "--no-refresh"]],
  ["verify:freebies", ["scripts/verify-freebies.mjs"]],
  ["verify:benefits", ["scripts/verify-benefit-events.mjs"]]
];
const results = [];

for (const [name, args] of steps) {
  const stepStartedAt = Date.now();
  console.log(`RUN ${name}`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 240_000,
    env: {
      ...process.env,
      DEAL_LINK_TIMEOUT_MS: process.env.DEAL_LINK_TIMEOUT_MS ?? "2500"
    }
  });

  const item = {
    name,
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    durationMs: Date.now() - stepStartedAt,
    stdoutTail: String(result.stdout ?? "").slice(-3000),
    stderrTail: String(result.stderr ?? "").slice(-3000)
  };
  results.push(item);
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (!item.ok) break;
}

const failed = results.filter((result) => !result.ok);
const report = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  totalSteps: steps.length,
  passedSteps: results.filter((result) => result.ok).length,
  failedSteps: failed.length,
  results
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports", "benefits-refresh.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failed.length) {
  console.error(`refresh:benefits failed at ${failed[0].name}. See reports/benefits-refresh.json.`);
  process.exit(1);
}

console.log(`refresh:benefits passed: ${report.passedSteps}/${report.totalSteps} steps in ${(report.durationMs / 1000).toFixed(1)}s.`);
