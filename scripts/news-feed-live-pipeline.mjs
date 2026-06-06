import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const generatedAt = new Date().toISOString();

const pipelineSteps = [
  {
    name: "source:feed-env:doctor",
    label: "공식 feed URL 안전성",
    script: "scripts/source-feed-env-doctor.mjs",
    purpose: "환경변수에 검색 결과, 커뮤니티, HTML 랜딩, 비 HTTPS URL이 섞였는지 차단"
  },
  {
    name: "news:feed:doctor",
    label: "Feed 계약 검사",
    script: "scripts/news-feed-contract-doctor.mjs",
    purpose: "JSON/RSS/Atom 계약, 공식 링크 승격, 회귀 샘플 확인"
  },
  {
    name: "news:feed:canary",
    label: "실시간 feed canary",
    script: "scripts/news-feed-canary.mjs",
    purpose: "연결된 공식 feed가 노출 가능한 후보를 만들 수 있는지 사전 점검"
  },
  {
    name: "refresh:news",
    label: "공식 혜택 갱신",
    script: "scripts/refresh-news-deals.mjs",
    purpose: "공식/승인 feed와 seed fallback을 같은 스키마로 정규화"
  },
  {
    name: "verify:news",
    label: "공식 혜택 검증",
    script: "scripts/verify-news-deals.mjs",
    purpose: "검색 URL, 뉴스 원문 단독, 커뮤니티, 종료 혜택 노출 차단"
  },
  {
    name: "refresh:all",
    label: "전체 데이터 갱신",
    script: "scripts/refresh-all.mjs",
    purpose: "상품 링크와 공식 혜택을 같은 출시 파이프라인으로 묶음"
  },
  {
    name: "verify:links:live",
    label: "상품 링크 live probe",
    script: "scripts/verify-product-links-live.mjs",
    purpose: "refresh:all 이후 출시 증거용 non-strict 판매처 live probe 리포트 복원"
  },
  {
    name: "health:readiness",
    label: "운영 헬스 준비도",
    script: "scripts/health-readiness-report.mjs",
    purpose: "상품/공식 혜택/소스/refresh/canary 상태를 출시 게이트로 확인"
  }
];

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function trimOutput(value, maxLength = 1600) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n... output trimmed ...`;
}

function runStep(step) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, [step.script], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    ...step,
    command: `node ${step.script}`,
    ok: result.status === 0,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr)
  };
}

const steps = [];
for (const step of pipelineSteps) {
  const result = runStep(step);
  steps.push(result);
  console.log(`${result.ok ? "PASS" : "FAIL"} ${step.name}`);
  if (!result.ok) {
    if (result.stderr) console.error(result.stderr);
    break;
  }
}

const sourceFeedEnv = readJson("reports/source-feed-env-readiness.json", {});
const feedCanary = readJson("reports/news-feed-canary.json", {});
const newsDeals = readJson("reports/news-deals.json", {});
const refreshAll = readJson("reports/refresh-all.json", {});
const healthReadiness = readJson("reports/health-readiness.json", {});
const configuredUrlCount = Number(sourceFeedEnv.configuredUrlCount ?? feedCanary.configuredFeedUrls ?? 0);
const failedConfiguredFeedCount = Number(sourceFeedEnv.failedCount ?? 0) + Number(newsDeals.configuredFeedErrors?.length ?? 0);
const allStepsOk = steps.length === pipelineSteps.length && steps.every((step) => step.ok);
const canaryOk = feedCanary.ok === true && !["stale", "missing"].includes(String(feedCanary.freshnessStatus ?? ""));
const exposureOk =
  newsDeals.ok !== false &&
  Number(newsDeals.visibleCount ?? 0) >= 95 &&
  Number(newsDeals.exposedSearchLinkCount ?? 0) === 0 &&
  Number(newsDeals.exposedNonOfficialLinkCount ?? 0) === 0 &&
  Number(newsDeals.expiredCount ?? 0) === 0 &&
  Number(newsDeals.failedCount ?? 0) === 0;
const healthOk =
  healthReadiness.ok === true ||
  (Array.isArray(healthReadiness.checks) && healthReadiness.checks.every((check) => check.ok === true));
const ok = allStepsOk && failedConfiguredFeedCount === 0 && canaryOk && exposureOk && refreshAll.ok !== false && healthOk;
const status = ok
  ? configuredUrlCount > 0
    ? "live_feed_ready"
    : "seed_launch_ready"
  : "needs_attention";
const nextActions = ok
  ? configuredUrlCount > 0
    ? [
        "운영 feed가 연결된 상태입니다. 6시간마다 news:feed:live 또는 배포 cron으로 freshness를 갱신하세요.",
        "새 provider를 추가할 때는 source:feed-env:doctor와 news:feed:canary를 먼저 통과시킨 뒤 refresh:all을 실행하세요."
      ]
    : [
        "아직 운영 feed URL이 없어 승인 seed fallback으로 안전하게 노출 중입니다.",
        "PUBLIC_COUPON_FEED_URLS 또는 OFFICIAL_EVENT_FEED_URLS부터 공식 JSON/RSS/Atom feed를 연결하세요.",
        "무단 HTML 크롤링 대신 공식 API, RSS, Atom, 승인된 제휴 JSON만 연결하세요."
      ]
  : [
      "실패한 step의 stderr와 reports/source-feed-env-readiness.json, reports/news-feed-canary.json을 먼저 확인하세요.",
      "검색 결과, 커뮤니티, 뉴스 원문 단독, 종료 이벤트 URL은 finalUrl로 쓰지 않습니다.",
      "수정 후 npm run news:feed:live를 다시 실행하세요."
    ];

const report = {
  ok,
  generatedAt,
  status,
  configuredUrlCount,
  configuredKeyCount: Number(sourceFeedEnv.configuredKeyCount ?? 0),
  failedConfiguredFeedCount,
  canary: {
    ok: canaryOk,
    status: feedCanary.status ?? "missing",
    freshnessStatus: feedCanary.freshnessStatus ?? "missing",
    ageHours: feedCanary.ageHours ?? null,
    staleHours: feedCanary.staleHours ?? 24,
    configuredFeedUrls: Number(feedCanary.configuredFeedUrls ?? 0),
    visibleCandidateCount: Number(feedCanary.visibleCandidateCount ?? 0),
    errorCount: Number(feedCanary.errorCount ?? 0),
    configuredEmptyFeedCount: Number(feedCanary.configuredEmptyFeedCount ?? 0)
  },
  officialBenefits: {
    visibleCount: Number(newsDeals.visibleCount ?? 0),
    hiddenCount: Number(newsDeals.hiddenCount ?? 0),
    expiredCount: Number(newsDeals.expiredCount ?? 0),
    failedCount: Number(newsDeals.failedCount ?? 0),
    exposedSearchLinkCount: Number(newsDeals.exposedSearchLinkCount ?? 0),
    exposedNonOfficialLinkCount: Number(newsDeals.exposedNonOfficialLinkCount ?? 0),
    providerStats: Array.isArray(newsDeals.providerStats) ? newsDeals.providerStats : []
  },
  refreshAll: {
    ok: refreshAll.ok !== false,
    productDealsCount: Number(refreshAll.productDealsCount ?? 0),
    newsDealsCount: Number(refreshAll.newsDealsCount ?? 0),
    failedCount: Number(refreshAll.failedCount ?? 0)
  },
  healthReadiness: {
    ok: healthOk,
    passedCount: Array.isArray(healthReadiness.checks) ? healthReadiness.checks.filter((check) => check.ok).length : 0,
    totalCount: Array.isArray(healthReadiness.checks) ? healthReadiness.checks.length : 0
  },
  steps,
  nextActions
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, "reports/news-feed-live-pipeline.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# 실시간 공식 feed 운영 파이프라인",
  "",
  "공식 API/RSS/Atom/제휴 JSON feed를 할인도사에 연결한 뒤 사용자 노출 전 반드시 실행하는 end-to-end 검증 리포트입니다.",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- 상태: ${status}`,
  `- 전체 결과: ${ok ? "통과" : "점검 필요"}`,
  `- 설정 feed URL: ${configuredUrlCount}개`,
  `- feed env 실패: ${failedConfiguredFeedCount}개`,
  `- canary: ${report.canary.status} · ${report.canary.freshnessStatus} · 후보 ${report.canary.visibleCandidateCount}개`,
  `- 공식 혜택 노출: ${report.officialBenefits.visibleCount}개`,
  `- 검색/비공식/종료 노출: ${report.officialBenefits.exposedSearchLinkCount}/${report.officialBenefits.exposedNonOfficialLinkCount}/${report.officialBenefits.expiredCount}`,
  "",
  "## 실행 Step",
  "",
  "| Step | 결과 | 목적 |",
  "| --- | --- | --- |",
  ...steps.map((step) => `| ${step.name} | ${step.ok ? "pass" : "fail"} | ${step.purpose} |`),
  "",
  "## 다음 액션",
  "",
  ...nextActions.map((action) => `- ${action}`),
  "",
  "## 운영 명령",
  "",
  "```bash",
  "npm run news:feed:live",
  "```",
  "",
  "## 가드레일",
  "",
  "- 검색 결과 URL, 커뮤니티 글, 블로그 글, 뉴스 기사 원문 단독 링크는 사용자 이동 URL로 쓰지 않습니다.",
  "- 공식 혜택/이벤트/쿠폰/구매 상세 URL이 finalUrl로 확인된 항목만 사용자에게 노출합니다.",
  "- protected/guarded 페이지는 브라우저 자동 수집 대상이 아니라 공식 API, RSS, Atom, 제휴 feed 또는 담당자 승인 JSON으로 연결합니다.",
  ""
];
writeFileSync(join(root, "docs/NEWS_FEED_LIVE_PIPELINE.md"), `${docsLines.join("\n")}\n`, "utf8");

console.log("News feed live pipeline report written.");
console.log("- reports/news-feed-live-pipeline.json");
console.log("- docs/NEWS_FEED_LIVE_PIPELINE.md");
console.log(`- status: ${status}`);

if (!ok) {
  console.error("news:feed:live failed. See reports/news-feed-live-pipeline.json");
  process.exit(1);
}
