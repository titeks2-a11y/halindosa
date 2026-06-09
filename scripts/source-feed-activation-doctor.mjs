import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "source-feed-activation.json");
const docsPath = join(docsDir, "SOURCE_FEED_ACTIVATION.md");

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(path, fallback = "") {
  if (!existsSync(path)) return fallback;
  try {
    return readFileSync(path, "utf8");
  } catch {
    return fallback;
  }
}

function check(name, ok, detail, action) {
  return {
    name,
    ok: Boolean(ok),
    detail,
    action
  };
}

const feedEnv = readJson(join(reportsDir, "source-feed-env-readiness.json"), {});
const canary = readJson(join(reportsDir, "news-feed-canary.json"), {});
const handoff = readJson(join(reportsDir, "free-benefit-feed-handoff.json"), {});
const sourceLive = readJson(join(reportsDir, "official-source-live-check.json"), {});
const sourceBreadth = readJson(join(reportsDir, "free-benefit-source-breadth.json"), {});
const eventContract = readJson(join(reportsDir, "free-benefit-event-contract.json"), {});
const health = readJson(join(reportsDir, "health-readiness.json"), {});
const homeRealtime = readJson(join(reportsDir, "home-realtime.json"), {});
const runtimeSnapshotDoc = readText(join(docsDir, "HOME_RUNTIME_SNAPSHOT_REPORT.md"));
const vercelJson = readText(join(root, "vercel.json"));
const packageJson = readJson(join(root, "package.json"), {});
const qaRunner = readText(join(root, "scripts", "run-qa.mjs"));
const harness = readText(join(root, "scripts", "harness.mjs"));

const configuredFeedUrls = Number(feedEnv.configuredUrlCount ?? handoff.feedEnv?.configuredFeedUrls ?? canary.configuredFeedUrls ?? 0);
const configuredProviders = Number(canary.configuredProviderCount ?? 0);
const visibleCandidates = Number(canary.visibleCandidateCount ?? 0);
const canaryStatus = String(canary.status ?? "unknown");
const activationStatus = configuredFeedUrls === 0
  ? "seed_ready"
  : canaryStatus === "live_feed_ready" && visibleCandidates > 0
    ? "live_feed_ready"
    : "needs_attention";

const checks = [
  check(
    "feed env safety",
    feedEnv.ok === true && Number(feedEnv.failedCount ?? 0) === 0,
    `configured=${configuredFeedUrls}, failed=${Number(feedEnv.failedCount ?? 0)}`,
    "Run npm run source:feed-env:doctor and fix any unsafe, search, community, private, or non-machine-readable feed URL."
  ),
  check(
    "feed handoff readiness",
    handoff.ok === true && Number(handoff.starterPack?.laneCount ?? 0) >= 8 && Array.isArray(handoff.verificationCommands) && handoff.verificationCommands.includes("npm run refresh:benefits"),
    `lanes=${Number(handoff.starterPack?.laneCount ?? 0)}, commands=${Array.isArray(handoff.verificationCommands) ? handoff.verificationCommands.length : 0}`,
    "Run npm run source:feed:handoff so Vercel env keys and verification commands stay current."
  ),
  check(
    "official source live readiness",
    sourceLive.ok === true && Number(sourceLive.summary?.staleOrRemovedCount ?? sourceLive.staleOrRemovedCount ?? 0) === 0,
    `reachable=${Number(sourceLive.summary?.reachableCount ?? sourceLive.reachableCount ?? 0)}, guarded=${Number(sourceLive.summary?.guardedCount ?? sourceLive.guardedCount ?? 0)}, stale=${Number(sourceLive.summary?.staleOrRemovedCount ?? sourceLive.staleOrRemovedCount ?? 0)}`,
    "Run npm run source:live:doctor and replace or remove any stale_or_removed official source before feed activation."
  ),
  check(
    "official source breadth readiness",
    sourceBreadth.ok === true &&
      Number(sourceBreadth.passedLaneCount ?? 0) >= Number(sourceBreadth.requiredLaneCount ?? 12) &&
      Number(sourceBreadth.passedBrandSignalCount ?? 0) >= Number(sourceBreadth.requiredBrandSignalCount ?? 0),
    `lanes=${Number(sourceBreadth.passedLaneCount ?? 0)}/${Number(sourceBreadth.requiredLaneCount ?? 0)}, brandSignals=${Number(sourceBreadth.passedBrandSignalCount ?? 0)}/${Number(sourceBreadth.requiredBrandSignalCount ?? 0)}`,
    "Run npm run source:breadth:doctor so telecom, convenience, beauty, cafe, delivery, pay, mart, open-market, public, education, pet, and sample lanes stay covered."
  ),
  check(
    "free benefit event contract",
    eventContract.ok === true && Array.isArray(eventContract.checks) && eventContract.checks.every((item) => item.ok === true),
    `checks=${Array.isArray(eventContract.checks) ? eventContract.checks.filter((item) => item.ok === true).length : 0}/${Array.isArray(eventContract.checks) ? eventContract.checks.length : 0}`,
    "Run npm run benefit:event:contract so FreeBenefitEvent fields, sanitizer, publishable gate, no-store API, filters, and card trust badges remain enforced."
  ),
  check(
    "feed canary activation",
    configuredFeedUrls === 0
      ? canary.ok === true && canaryStatus === "seed_fallback_only"
      : canary.ok === true && canaryStatus === "live_feed_ready" && visibleCandidates > 0 && Number(canary.errorCount ?? 0) === 0 && Number(canary.configuredEmptyFeedCount ?? 0) === 0,
    `status=${canaryStatus}, configured=${configuredFeedUrls}, providers=${configuredProviders}, visible=${visibleCandidates}`,
    configuredFeedUrls === 0
      ? "Seed fallback is allowed until approved JSON/RSS/Atom feeds are connected. Connect OFFICIAL_EVENT_FEED_URLS, PUBLIC_COUPON_FEED_URLS, or BENEFIT_REFRESH_FEED_URLS next."
      : "Configured feeds must produce visible official benefits with zero parser errors before they are allowed into customer surfaces."
  ),
  check(
    "home realtime reflection",
    homeRealtime.ok === true && Number(homeRealtime.failedChecks ?? 0) === 0 && runtimeSnapshotDoc.includes("/api/home") && runtimeSnapshotDoc.includes("PASS"),
    `homeChecks=${Number(homeRealtime.passedChecks ?? 0)}/${Number(homeRealtime.totalChecks ?? 0)}`,
    "Run npm run test:home-realtime after each feed activation to prove /api/home reflects refreshed snapshots without restart."
  ),
  check(
    "free benefit refresh command",
    String(packageJson.scripts?.["refresh:benefits"] ?? "").includes("refresh-benefits.mjs") &&
      qaRunner.includes("refresh:benefits") &&
      harness.includes("security:check"),
    "refresh:benefits is present and QA keeps it in the free-benefit pipeline.",
    "Keep refresh:benefits in QA so freebies/events/verify steps remain release-blocking."
  ),
  check(
    "benefit cron route",
    vercelJson.includes("/api/cron/benefits") && vercelJson.includes("/api/cron/refresh"),
    "Vercel cron includes dedicated benefits refresh and full refresh routes.",
    "Keep /api/cron/benefits for free-benefit-first refresh and /api/cron/refresh for full refresh."
  ),
  check(
    "official benefit floor",
    health.ok === true && Number(health.officialBenefits?.visibleCount ?? 0) >= Number(health.thresholds?.officialBenefits ?? 95),
    `visible=${Number(health.officialBenefits?.visibleCount ?? 0)}, threshold=${Number(health.thresholds?.officialBenefits ?? 95)}`,
    "Run npm run health:readiness after activation to confirm visible official benefits and freshness."
  )
];

const failed = checks.filter((item) => !item.ok);
const report = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  status: failed.length ? "failed" : activationStatus,
  configuredFeedUrls,
  configuredProviders,
  visibleCandidates,
  canaryStatus,
  requiredActivationCommands: [
    "npm run source:catalog:report",
    "npm run source:live:doctor",
    "npm run source:breadth:doctor",
    "npm run source:feed-env:doctor",
    "npm run news:feed:canary",
    "npm run refresh:benefits",
    "npm run verify:benefits",
    "npm run benefit:event:contract",
    "npm run test:home-realtime",
    "npm run health:readiness"
  ],
  nextActions: activationStatus === "live_feed_ready"
    ? [
        "새 feed가 live_feed_ready입니다. refresh:benefits와 test:home-realtime 결과를 배포 전 evidence로 보관하세요.",
        "Vercel deployment 후 /api/home, /api/benefits/events, /free-benefits를 확인하세요."
      ]
    : activationStatus === "seed_ready"
      ? [
          "운영 feed URL이 아직 없습니다. 공식 API/RSS/Atom 또는 승인 JSON endpoint를 Vercel env에 연결하세요.",
          "연결 전에는 seed fallback과 공식 source catalog만 사용자에게 노출합니다."
        ]
      : [
          "Configured feed가 있으나 live activation 기준을 통과하지 못했습니다.",
          "reports/source-feed-env-readiness.json과 reports/news-feed-canary.json의 failed provider를 먼저 수정하세요."
        ],
  checks
};

function buildDocs(data) {
  return [
    "# 무료혜택 Feed Activation 리포트",
    "",
    `- 생성 시각: ${data.generatedAt}`,
    `- 상태: ${data.status}`,
    `- 설정 feed URL: ${data.configuredFeedUrls}개`,
    `- 설정 provider: ${data.configuredProviders}개`,
    `- canary 노출 후보: ${data.visibleCandidates}개`,
    `- canary 상태: ${data.canaryStatus}`,
    "",
    "## 의미",
    "",
    "- `seed_ready`: 승인된 운영 feed URL은 아직 없지만, seed fallback과 안전 게이트로 출시 운영이 가능한 상태입니다.",
    "- `live_feed_ready`: 승인 feed가 실제 노출 가능한 공식 혜택 후보를 만들고 홈 실시간 반영 게이트도 통과한 상태입니다.",
    "- `needs_attention` 또는 `failed`: feed URL, parser, finalUrl, 종료/검색/커뮤니티 차단 정책 중 하나를 먼저 고쳐야 합니다.",
    "",
    "## 필수 확인",
    "",
    "| 검사 | 결과 | 근거 | 다음 작업 |",
    "| --- | --- | --- | --- |",
    ...data.checks.map((item) => `| ${item.name} | ${item.ok ? "PASS" : "FAIL"} | ${item.detail} | ${item.action} |`),
    "",
    "## 운영 연결 순서",
    "",
    "```bash",
    ...data.requiredActivationCommands,
    "```",
    "",
    "## 다음 작업",
    "",
    ...data.nextActions.map((action) => `- ${action}`),
    ""
  ].join("\n");
}

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildDocs(report), "utf8");

if (!report.ok) {
  console.error("Source feed activation doctor failed:");
  for (const item of failed) console.error(`- ${item.name}: ${item.detail}`);
  process.exit(1);
}

console.log("Source feed activation doctor passed.");
console.log(`- status: ${report.status}`);
console.log(`- configured feed URLs: ${report.configuredFeedUrls}`);
console.log(`- visible canary candidates: ${report.visibleCandidates}`);
console.log("- reports/source-feed-activation.json");
console.log("- docs/SOURCE_FEED_ACTIVATION.md");
