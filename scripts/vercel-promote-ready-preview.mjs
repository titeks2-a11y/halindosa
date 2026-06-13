import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const reportPath = join(reportsDir, "vercel-promote-latest.json");
const productionHealthUrl = process.env.HALINDOSA_PRODUCTION_HEALTH_URL || "https://www.halindosa.com/api/health";
const explicitDeploymentUrl = getArgValue("--url");
const allowStale = process.argv.includes("--allow-stale");

mkdirSync(reportsDir, { recursive: true });

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return "";
  return String(process.argv[index + 1] || "").trim();
}

function run(command, args, options = {}) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });

  if (result.status === 0) {
    return {
      ok: true,
      command: [command, ...args].join(" "),
      elapsedMs: Date.now() - startedAt,
      stdout: String(result.stdout || "").trim(),
      stderr: String(result.stderr || "").trim()
    };
  }

  return {
    ok: false,
    command: [command, ...args].join(" "),
    elapsedMs: Date.now() - startedAt,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || result.error?.message || "").trim()
  };
}

function runNpx(args) {
  if (process.platform === "win32") {
    return run("cmd.exe", ["/d", "/s", "/c", "npx", ...args]);
  }

  return run("npx", args);
}

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-9;]*m/g, "");
}

function parseLatestReadyPreview(vercelLsOutput) {
  const lines = stripAnsi(vercelLsOutput).split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes("https://") || !line.includes("Ready") || !line.includes("Preview")) continue;
    const match = line.match(/https:\/\/[^\s]+/);
    if (match?.[0]) return match[0];
  }

  for (const line of lines) {
    const match = line.match(/https:\/\/[^\s]+/);
    if (match?.[0]) return match[0];
  }

  return "";
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function parseInspectCreatedAt(inspectOutput) {
  const text = stripAnsi(inspectOutput);
  const createdLine = text.split(/\r?\n/).find((line) => /\bcreated\b/i.test(line));
  const createdText = createdLine?.replace(/^\s*created\s+/i, "").replace(/\s+\[[^\]]+\]\s*$/, "").trim() ?? "";
  const timestamp = createdText ? Date.parse(createdText) : Number.NaN;

  return {
    line: createdLine?.trim() ?? "",
    text: createdText,
    timestamp: Number.isFinite(timestamp) ? timestamp : null,
    iso: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : ""
  };
}

async function fetchHealth() {
  try {
    const response = await fetch(productionHealthUrl, {
      headers: {
        "cache-control": "no-cache",
        "user-agent": "halindosa-vercel-promote-ready-preview/1.0"
      },
      signal: AbortSignal.timeout(20000)
    });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      url: productionHealthUrl,
      deployment: body?.deployment ?? null,
      checks: body?.checks ?? null
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url: productionHealthUrl,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function writeReport(report) {
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "started",
  selectedDeploymentUrl: "",
  commands: [],
  localHead: {
    commit: gitOutput(["rev-parse", "HEAD"]),
    shortCommit: gitOutput(["rev-parse", "--short=8", "HEAD"]),
    committedAt: gitOutput(["show", "-s", "--format=%cI", "HEAD"]),
    committedAtTimestamp: Number(gitOutput(["show", "-s", "--format=%ct", "HEAD"])) * 1000 || null
  },
  selectedDeploymentCreatedAt: null,
  productionHealthBefore: await fetchHealth(),
  productionHealthAfter: null,
  nextAction: ""
};

const listResult = explicitDeploymentUrl
  ? { ok: true, command: "manual --url", elapsedMs: 0, stdout: explicitDeploymentUrl, stderr: "" }
  : runNpx(["vercel", "ls", "--yes"]);
report.commands.push(listResult);

const selectedDeploymentUrl = explicitDeploymentUrl || parseLatestReadyPreview(`${listResult.stdout}\n${listResult.stderr}`);
report.selectedDeploymentUrl = selectedDeploymentUrl;

if (!selectedDeploymentUrl) {
  report.status = "failed_no_ready_preview";
  report.nextAction = "Vercel Preview 배포가 Ready 상태인지 확인한 뒤 다시 실행하세요.";
  writeReport(report);
  console.error(`No Ready Preview deployment found. Report: ${reportPath}`);
  process.exit(1);
}

const inspectResult = runNpx(["vercel", "inspect", selectedDeploymentUrl, "--wait"]);
report.commands.push(inspectResult);
report.selectedDeploymentCreatedAt = parseInspectCreatedAt(`${inspectResult.stdout}\n${inspectResult.stderr}`);

if (!inspectResult.ok) {
  report.status = "failed_inspect";
  report.nextAction = "선택한 Preview 배포가 접근 가능한지 확인하세요.";
  writeReport(report);
  console.error(`Vercel inspect failed. Report: ${reportPath}`);
  process.exit(1);
}

if (
  !allowStale &&
  report.localHead.committedAtTimestamp &&
  report.selectedDeploymentCreatedAt?.timestamp &&
  report.selectedDeploymentCreatedAt.timestamp + 60_000 < report.localHead.committedAtTimestamp
) {
  report.status = "blocked_stale_preview";
  report.nextAction =
    "선택한 Preview가 현재 로컬 HEAD 커밋보다 먼저 생성됐습니다. 최신 커밋의 Preview가 Ready가 된 뒤 다시 실행하세요. 의도적으로 예전 Preview를 올릴 때만 --allow-stale을 사용하세요.";
  writeReport(report);
  console.error(`Refusing to promote stale Preview. Report: ${reportPath}`);
  process.exit(1);
}

const promoteResult = runNpx(["vercel", "promote", selectedDeploymentUrl, "--yes"]);
report.commands.push(promoteResult);
report.productionHealthAfter = await fetchHealth();

if (!promoteResult.ok) {
  const limited = /api-deployments-free-per-day|Resource is limited|try again in 24 hours/i.test(
    `${promoteResult.stdout}\n${promoteResult.stderr}`
  );

  report.status = limited ? "blocked_vercel_daily_limit" : "failed_promote";
  report.nextAction = limited
    ? "Vercel Hobby 일일 배포 제한이 풀리면 같은 명령을 다시 실행하세요."
    : "promote 오류 메시지를 확인하고 Vercel 프로젝트 권한과 배포 상태를 점검하세요.";
  writeReport(report);
  console.error(`Vercel promote did not complete: ${report.status}. Report: ${reportPath}`);
  process.exit(1);
}

report.status = "promoted";
report.nextAction = "운영 /api/health의 deployment.shortCommit이 최신 커밋인지 확인하세요.";
writeReport(report);

console.log(`Promoted ${selectedDeploymentUrl}`);
console.log(`Report: ${reportPath}`);
