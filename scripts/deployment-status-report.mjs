import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const origins = ["https://www.halindosa.com", "https://halindosa.com"];

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function fetchHealth(origin) {
  const startedAt = Date.now();

  try {
    const response = await fetch(`${origin}/api/health`, {
      headers: {
        "cache-control": "no-cache",
        "user-agent": "halindosa-deployment-status/1.0"
      },
      signal: AbortSignal.timeout(Number(process.env.DEPLOYMENT_STATUS_TIMEOUT_MS ?? 15000))
    });
    const body = await response.json().catch(() => null);

    return {
      origin,
      ok: response.ok && body?.ok === true,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      cacheControl: response.headers.get("cache-control") ?? "",
      xVercelId: response.headers.get("x-vercel-id") ?? "",
      deployment: body?.deployment ?? null,
      officialBenefitVisibleCount: body?.checks?.officialBenefitVisibleCount ?? null,
      officialBenefitFresh: body?.checks?.officialBenefitFresh ?? null,
      freeBenefitCollectionLaneOk: body?.checks?.freeBenefitCollectionLaneOk ?? null,
      freeBenefitCollectionLaneStatuses: Array.isArray(body?.checks?.freeBenefitCollectionLaneStatuses)
        ? body.checks.freeBenefitCollectionLaneStatuses.map((lane) => ({
            id: lane.id,
            status: lane.status,
            envKey: lane.envKey,
            recommendedEnvKeys: lane.recommendedEnvKeys ?? []
          }))
        : []
    };
  } catch (error) {
    return {
      origin,
      ok: false,
      status: 0,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const currentCommit = run("git", ["rev-parse", "HEAD"]);
const currentShortCommit = currentCommit ? currentCommit.slice(0, 8) : "";
const branch = run("git", ["branch", "--show-current"]);
const remoteMain = run("git", ["rev-parse", "origin/main"]);
const remoteBranch = branch ? run("git", ["rev-parse", `origin/${branch}`]) : "";
const probes = await Promise.all(origins.map(fetchHealth));
const deployedShortCommits = Array.from(
  new Set(
    probes
      .map((probe) => String(probe.deployment?.shortCommit ?? "").trim())
      .filter(Boolean)
  )
);
const latestIsLive = deployedShortCommits.includes(currentShortCommit);
const allOriginsHealthy = probes.every((probe) => probe.ok);
const status = latestIsLive && allOriginsHealthy ? "live" : allOriginsHealthy ? "pending_deploy" : "degraded";
const recommendedNextActions =
  status === "live"
    ? ["운영 웹과 Android WebView가 최신 커밋을 보고 있습니다."]
    : [
        "GitHub Actions Vercel Production Deploy가 끝났는지 확인합니다.",
        "Vercel Hobby 일일 배포 제한이 풀리면 `npx vercel deploy --prod --force --yes`를 다시 실행합니다.",
        "`/api/health.deployment.shortCommit`이 최신 커밋과 같아질 때까지 운영 반영 완료로 보지 않습니다."
      ];
const androidWebViewUpdate =
  status === "live"
    ? "최신 웹 배포가 Android WebView 앱에도 반영됩니다. 네이티브 설정 변경이 없으면 새 AAB 업로드는 필요 없습니다."
    : "Android 앱은 https://www.halindosa.com 운영 웹을 로드하므로, Vercel Production이 최신 커밋을 서빙할 때 앱 화면도 함께 바뀝니다. 이번 상태 점검은 네이티브 설정을 바꾸지 않으므로 새 AAB 업로드는 필요 없습니다.";

const report = {
  generatedAt: new Date().toISOString(),
  status,
  branch,
  currentCommit,
  currentShortCommit,
  remoteMainShortCommit: remoteMain ? remoteMain.slice(0, 8) : "",
  remoteBranchShortCommit: remoteBranch ? remoteBranch.slice(0, 8) : "",
  deployedShortCommits,
  latestIsLive,
  allOriginsHealthy,
  probes,
  androidWebViewUpdate,
  recommendedNextActions
};

const markdown = `# Deployment Status

Generated: ${report.generatedAt}

## Summary

- Status: ${status}
- Local branch: \`${branch || "unknown"}\`
- Local commit: \`${currentShortCommit || "unknown"}\`
- origin/main: \`${report.remoteMainShortCommit || "unknown"}\`
- Deployed commits: ${deployedShortCommits.length ? deployedShortCommits.map((commit) => `\`${commit}\``).join(", ") : "unknown"}
- Latest commit live: ${latestIsLive ? "yes" : "no"}
- Android app update: ${androidWebViewUpdate}

## Production Health

| Origin | HTTP | OK | Deployed commit | Free benefits | Fresh | Collection lanes |
| --- | ---: | --- | --- | ---: | --- | --- |
${probes.map((probe) => `| ${probe.origin} | ${probe.status} | ${probe.ok ? "yes" : "no"} | \`${probe.deployment?.shortCommit ?? "unknown"}\` | ${probe.officialBenefitVisibleCount ?? "unknown"} | ${probe.officialBenefitFresh === null ? "unknown" : probe.officialBenefitFresh ? "yes" : "no"} | ${probe.freeBenefitCollectionLaneOk === null ? "unknown" : probe.freeBenefitCollectionLaneOk ? "ready" : "needs review"} |`).join("\n")}

## Next Actions

${recommendedNextActions.map((action) => `- ${action}`).join("\n")}
`;

writeFileSync(join(reportsDir, "deployment-status.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "DEPLOYMENT_STATUS.md"), markdown, "utf8");

console.log(`Deployment status: ${status}`);
console.log(`- local: ${currentShortCommit || "unknown"}`);
console.log(`- deployed: ${deployedShortCommits.join(", ") || "unknown"}`);
console.log("- reports/deployment-status.json");
console.log("- docs/DEPLOYMENT_STATUS.md");
