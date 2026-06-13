import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "source-feed-activation.json");
const docsPath = join(docsDir, "SOURCE_FEED_ACTIVATION.md");
const envTemplateReportPath = join(reportsDir, "source-feed-env-template.json");
const envTemplateDocsPath = join(docsDir, "OFFICIAL_FEED_ENV_ACTIVATION.md");
const envTemplateExamplePath = join(root, ".env.official-feeds.example");

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
const starterPack = readJson(join(reportsDir, "free-benefit-feed-starter-pack.json"), {});
const sourceLive = readJson(join(reportsDir, "official-source-live-check.json"), {});
const sourceBreadth = readJson(join(reportsDir, "free-benefit-source-breadth.json"), {});
const consumerFirstPolicy = sourceBreadth.consumerFirstPolicy ?? {};
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

const allActivationCandidates = Array.from(
  new Map(
    (Array.isArray(starterPack.packs) ? starterPack.packs : [])
      .flatMap((pack) =>
        (Array.isArray(pack.candidates) ? pack.candidates : []).map((candidate) => ({
          id: String(candidate.id ?? ""),
          label: String(candidate.label ?? ""),
          lane: String(pack.label ?? pack.id ?? ""),
          provider: String(candidate.provider ?? ""),
          categories: Array.isArray(candidate.categories) ? candidate.categories.map(String) : [],
          officialUrl: String(candidate.officialUrl ?? ""),
          preferredEnvKeys: Array.isArray(candidate.preferredEnvKeys) ? candidate.preferredEnvKeys.map(String) : [],
          liveStatus: String(candidate.liveStatus ?? ""),
          httpStatus: candidate.httpStatus == null ? null : Number(candidate.httpStatus),
          score: Number(candidate.score ?? 0),
          feedConnectionAction: String(candidate.feedConnectionAction ?? ""),
          guardrail: String(candidate.guardrail ?? "")
        }))
      )
      .filter((candidate) => candidate.id && candidate.officialUrl && /^https:\/\//.test(candidate.officialUrl))
      .sort((a, b) => b.score - a.score)
      .map((candidate) => [candidate.id, candidate])
  ).values()
);

const topActivationCandidates = allActivationCandidates.slice(0, 24);

const envKeyLabels = {
  BENEFIT_REFRESH_FEED_URLS: "전체 무료혜택 승인 feed",
  OFFICIAL_EVENT_FEED_URLS: "공식 이벤트 feed",
  PUBLIC_COUPON_FEED_URLS: "쿠폰·멤버십 feed",
  TELECOM_MEMBERSHIP_FEED_URLS: "통신사 멤버십 feed",
  CONVENIENCE_BENEFIT_FEED_URLS: "편의점·마트 feed",
  BEAUTY_SAMPLE_FEED_URLS: "뷰티 샘플·무료체험 feed",
  CAFE_FRANCHISE_COUPON_FEED_URLS: "카페·외식 쿠폰 feed",
  PAY_POINT_BENEFIT_FEED_URLS: "페이·포인트·캐시백 feed",
  PET_SAMPLE_FEED_URLS: "반려동물 샘플 feed",
  SIGNUP_GIFT_FEED_URLS: "신규가입 혜택 feed"
};

const envKeyPriority = [
  "BENEFIT_REFRESH_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS",
  "BEAUTY_SAMPLE_FEED_URLS",
  "CONVENIENCE_BENEFIT_FEED_URLS",
  "PAY_POINT_BENEFIT_FEED_URLS",
  "CAFE_FRANCHISE_COUPON_FEED_URLS",
  "TELECOM_MEMBERSHIP_FEED_URLS",
  "SIGNUP_GIFT_FEED_URLS",
  "PET_SAMPLE_FEED_URLS"
];

function buildEnvTemplate(candidates) {
  const envFallbackMatchers = {
    TELECOM_MEMBERSHIP_FEED_URLS: (candidate) => /통신|skt|t멤버십|kt|u\+/i.test(`${candidate.label} ${candidate.categories.join(" ")}`),
    SIGNUP_GIFT_FEED_URLS: (candidate) => /신규가입|가입|웰컴|welcome/i.test(`${candidate.label} ${candidate.categories.join(" ")}`),
    PET_SAMPLE_FEED_URLS: (candidate) => /반려|펫|pet|강아지|고양이/i.test(`${candidate.label} ${candidate.categories.join(" ")}`)
  };

  const rows = envKeyPriority.map((envKey, index) => {
    const fallbackMatcher = envFallbackMatchers[envKey];
    const matching = candidates
      .filter((candidate) => candidate.preferredEnvKeys.includes(envKey) || (fallbackMatcher ? fallbackMatcher(candidate) : false))
      .slice(0, 5);

    return {
      envKey,
      label: envKeyLabels[envKey] ?? envKey,
      priority: index + 1,
      requiredFormat: "HTTPS JSON/RSS/Atom/API feed endpoint only",
      exampleValue: `https://approved-feed.example/${envKey.toLowerCase().replace(/_/g, "-")}.json`,
      candidateIds: matching.map((candidate) => candidate.id),
      candidateLabels: matching.map((candidate) => candidate.label),
      note: matching.length
        ? "아래 공식 후보를 기준으로 브랜드/파트너 승인 feed endpoint를 만든 뒤 이 env에 연결합니다."
        : "해당 lane 후보가 부족합니다. source:starter:pack과 source:catalog:report로 후보를 먼저 보강합니다."
    };
  });

  return {
    firstPartyCanaryEnvLine: "BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits",
    docsPath: "docs/OFFICIAL_FEED_ENV_ACTIVATION.md",
    examplePath: ".env.official-feeds.example",
    productionEnvKeys: rows.map((row) => row.envKey),
    rows,
    warnings: [
      "공식 이벤트 HTML 페이지를 env feed 값으로 그대로 넣지 마세요. env에는 JSON/RSS/Atom/API feed만 넣습니다.",
      "검색 결과, 커뮤니티, 블로그, 대표몰 메인, 로그인 없이는 내용이 없는 URL은 feed-env doctor에서 차단되어야 합니다.",
      "운영 feed가 없을 때는 first-party canary line으로 파이프라인 연결만 검증하고, 실제 성장 전환은 승인 feed를 별도로 연결합니다."
    ]
  };
}

const envTemplate = buildEnvTemplate(allActivationCandidates);

const checks = [
  check(
    "feed env safety",
    feedEnv.ok === true && Number(feedEnv.failedCount ?? 0) === 0,
    `configured=${configuredFeedUrls}, failed=${Number(feedEnv.failedCount ?? 0)}`,
    "Run npm run source:feed-env:doctor and fix any unsafe, search, community, private, or non-machine-readable feed URL."
  ),
  check(
    "feed handoff readiness",
    handoff.ok === true && Number(handoff.starterPack?.laneCount ?? 0) >= 12 && Array.isArray(handoff.verificationCommands) && handoff.verificationCommands.includes("npm run refresh:benefits"),
    `lanes=${Number(handoff.starterPack?.laneCount ?? 0)}, commands=${Array.isArray(handoff.verificationCommands) ? handoff.verificationCommands.length : 0}`,
    "Run npm run source:feed:handoff so Vercel env keys and verification commands stay current."
  ),
  check(
    "activation candidate queue",
    starterPack.ok === true && topActivationCandidates.length >= 20 && topActivationCandidates.every((candidate) => candidate.officialUrl.startsWith("https://")),
    `topCandidates=${topActivationCandidates.length}, starterPack=${starterPack.ok === true ? "ok" : "missing"}`,
    "Run npm run source:starter:pack and connect the highest scoring official candidates to approved JSON/RSS/API feeds first."
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
      Number(sourceBreadth.passedBrandSignalCount ?? 0) >= Number(sourceBreadth.requiredBrandSignalCount ?? 0) &&
      consumerFirstPolicy.ok === true &&
      Number(consumerFirstPolicy.consumerSourceRate ?? 0) >= Number(consumerFirstPolicy.minimumConsumerSourceRate ?? 70) &&
      Number(consumerFirstPolicy.publicPolicySourceRate ?? 100) <= Number(consumerFirstPolicy.maximumPublicPolicySourceRate ?? 35),
    `lanes=${Number(sourceBreadth.passedLaneCount ?? 0)}/${Number(sourceBreadth.requiredLaneCount ?? 0)}, brandSignals=${Number(sourceBreadth.passedBrandSignalCount ?? 0)}/${Number(sourceBreadth.requiredBrandSignalCount ?? 0)}, consumer=${Number(consumerFirstPolicy.consumerSourceRate ?? 0)}%, publicPolicy=${Number(consumerFirstPolicy.publicPolicySourceRate ?? 0)}%`,
    "Run npm run source:breadth:doctor so telecom, convenience, beauty, cafe, delivery, pay, mart, open-market, public, education, pet, sample lanes, and consumer-first source mix stay covered."
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
  topActivationCandidates,
  envTemplate,
  checks
};

function buildEnvExample(data) {
  const lines = [
    "# 할인도사 공식 무료혜택 feed 연결 템플릿",
    "# 이 파일은 예시입니다. 실제 운영 값은 Vercel Environment Variables에 입력하세요.",
    "# 공식 HTML 이벤트 페이지를 그대로 넣지 말고 승인된 JSON/RSS/Atom/API endpoint만 넣으세요.",
    "",
    "# 1) 파이프라인 canary: 새 feed 연결 전 안전 확인용",
    data.firstPartyCanaryEnvLine,
    "",
    "# 2) 운영 feed: 아래 example URL을 실제 승인 feed endpoint로 교체",
    ...data.rows.flatMap((row) => [
      `# ${row.priority}. ${row.label}`,
      `# 후보: ${row.candidateLabels.slice(0, 3).join(", ") || "후보 보강 필요"}`,
      `# 형식: ${row.requiredFormat}`,
      `${row.envKey}=`,
      `# 예시: ${row.envKey}=${row.exampleValue}`,
      ""
    ]),
    "# 새 host가 공식 카탈로그에 없을 때만 host 이름을 추가하세요. 토큰/URL 전체를 넣지 마세요.",
    "HALINDOSA_APPROVED_FEED_HOSTS=",
    "BENEFIT_REFRESH_APPROVED_HOSTS=",
    ""
  ];
  return lines.join("\n");
}

function buildEnvTemplateDocs(data) {
  return [
    "# 공식 무료혜택 Feed Env 연결 가이드",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 템플릿 파일: \`${data.examplePath}\``,
    `- 관리자 확인: \`/admin\`의 Feed Activation 패널`,
    "",
    "## 가장 먼저 할 일",
    "",
    "1. `BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits`로 canary 연결을 먼저 확인합니다.",
    "2. 브랜드/파트너와 승인된 JSON/RSS/Atom/API feed를 확보합니다.",
    "3. 아래 우선순위 env key에 승인 endpoint를 넣습니다.",
    "4. `npm run source:feed-env:doctor`, `npm run news:feed:canary`, `npm run refresh:benefits`, `npm run test:home-realtime` 순서로 확인합니다.",
    "",
    "## 금지",
    "",
    ...data.warnings.map((warning) => `- ${warning}`),
    "",
    "## Env 우선순위",
    "",
    "| 우선순위 | env key | 용도 | 상위 후보 | 예시 형식 |",
    "| ---: | --- | --- | --- | --- |",
    ...data.rows.map((row) =>
      `| ${row.priority} | \`${row.envKey}\` | ${row.label} | ${row.candidateLabels.slice(0, 3).join("<br>") || "후보 보강 필요"} | \`${row.exampleValue}\` |`
    ),
    "",
    "## 운영 검증 명령",
    "",
    "```bash",
    "npm run source:feed-env:doctor",
    "npm run news:feed:canary",
    "npm run refresh:benefits",
    "npm run verify:benefits",
    "npm run test:home-realtime",
    "npm run smoke:local",
    "npm run release:doctor",
    "```",
    ""
  ].join("\n");
}

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
    "## 우선 연결 공식 후보",
    "",
    "| 후보 | 수집축 | Provider | 점수 | 권장 env | 공식 URL |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...data.topActivationCandidates.map((candidate) =>
      `| ${candidate.label} | ${candidate.lane} | ${candidate.provider} | ${candidate.score} | ${candidate.preferredEnvKeys.join("<br>")} | ${candidate.officialUrl} |`
    ),
    "",
    "## Env 연결 템플릿",
    "",
    `- 템플릿 파일: \`${data.envTemplate.examplePath}\``,
    `- 상세 가이드: \`${data.envTemplate.docsPath}\``,
    `- canary line: \`${data.envTemplate.firstPartyCanaryEnvLine}\``,
    "",
    "| 우선순위 | env key | 용도 | 상위 후보 |",
    "| ---: | --- | --- | --- |",
    ...data.envTemplate.rows.map((row) =>
      `| ${row.priority} | \`${row.envKey}\` | ${row.label} | ${row.candidateLabels.slice(0, 3).join("<br>") || "후보 보강 필요"} |`
    ),
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
writeFileSync(envTemplateReportPath, `${JSON.stringify(envTemplate, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildDocs(report), "utf8");
writeFileSync(envTemplateDocsPath, buildEnvTemplateDocs(envTemplate), "utf8");
writeFileSync(envTemplateExamplePath, buildEnvExample(envTemplate), "utf8");

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
console.log("- reports/source-feed-env-template.json");
console.log("- docs/SOURCE_FEED_ACTIVATION.md");
console.log("- docs/OFFICIAL_FEED_ENV_ACTIVATION.md");
console.log("- .env.official-feeds.example");
