import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportJsonPath = "reports/feed-transition.json";
const reportDocsPath = "docs/FEED_TRANSITION_REPORT.md";

const feedProfiles = [
  {
    provider: "news",
    label: "뉴스·보도자료",
    envKeys: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"],
    acceptedSources: "공식 보도자료, 승인 RSS/Atom, 승인 JSON feed",
    nextAction: "공식 보도자료 RSS 또는 승인 JSON feed를 연결하고 finalUrl은 공식 혜택 페이지로만 유지",
    priority: "medium"
  },
  {
    provider: "event_news",
    label: "이벤트 뉴스",
    envKeys: ["DEAL_EVENT_NEWS_FEED_URLS"],
    acceptedSources: "공식 이벤트 보도자료 feed",
    nextAction: "뉴스 원문은 sourceUrl로만 보관하고 사용자 이동 finalUrl은 공식 이벤트 상세로 교체",
    priority: "medium"
  },
  {
    provider: "official_event",
    label: "공식 이벤트·혜택",
    envKeys: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    acceptedSources: "쇼핑몰, 카드사, 통신사, 편의점, 마트 공식 이벤트 JSON/RSS feed",
    nextAction: "상용 운영 전 가장 먼저 공식 이벤트 feed를 연결해 seed 의존도 축소",
    priority: "high"
  },
  {
    provider: "public_coupon",
    label: "공공·쿠폰·무료혜택",
    envKeys: ["PUBLIC_COUPON_FEED_URLS"],
    acceptedSources: "공공기관, 브랜드, 쿠폰 제공처의 공식 혜택 feed",
    nextAction: "무료·쿠폰·포인트 혜택은 공식 수령 페이지가 있는 feed만 연결",
    priority: "high"
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

function readConfiguredFeedUrls(envKeys) {
  return envKeys.flatMap((key) =>
    (process.env[key] ?? "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  );
}

function riskForProvider(stat) {
  const visibleCount = Number(stat?.visibleCount ?? 0);
  const hiddenCount = Number(stat?.hiddenCount ?? 0);
  const failedCount = Number(stat?.failedCount ?? 0);
  const expiredCount = Number(stat?.expiredCount ?? 0);
  const officialMissingCount = Number(stat?.officialMissingCount ?? 0);
  const errorCount = Number(stat?.errorCount ?? 0);

  if (failedCount || errorCount || officialMissingCount) {
    return {
      severity: "danger",
      label: "즉시 점검",
      reason: `실패 ${failedCount} · 오류 ${errorCount} · 공식 링크 누락 ${officialMissingCount}`
    };
  }

  if (expiredCount || hiddenCount) {
    return {
      severity: "watch",
      label: "정리 필요",
      reason: `숨김 ${hiddenCount} · 종료 ${expiredCount}`
    };
  }

  if (!visibleCount) {
    return {
      severity: "watch",
      label: "수집 대기",
      reason: "노출 가능한 공식 혜택이 아직 없습니다."
    };
  }

  if (!stat?.configured) {
    return {
      severity: "watch",
      label: "seed 운영",
      reason: "공식 feed 미연결 상태에서 승인된 seed/fallback으로 운영 중입니다."
    };
  }

  return {
    severity: "healthy",
    label: "정상",
    reason: "공식 feed가 연결되어 있고 노출/검증 실패가 없습니다."
  };
}

const newsReport = readJson("reports/news-deals.json", {});
const refreshAll = readJson("reports/refresh-all.json", {});
const providerStats = Array.isArray(newsReport.providerStats)
  ? newsReport.providerStats
  : Array.isArray(refreshAll.providerStats?.news)
    ? refreshAll.providerStats.news
    : [];
const statsByProvider = new Map(providerStats.map((stat) => [stat.provider, stat]));

const providers = feedProfiles.map((profile) => {
  const stat = statsByProvider.get(profile.provider) ?? {};
  const configuredFeedUrls = readConfiguredFeedUrls(profile.envKeys);
  const feedUrls = configuredFeedUrls.length || Number(stat.feedUrls ?? 0);
  const configured = Boolean(stat.configured) || feedUrls > 0;
  const visibleCount = Number(stat.visibleCount ?? 0);
  const hiddenCount = Number(stat.hiddenCount ?? 0);
  const failedCount = Number(stat.failedCount ?? 0);
  const expiredCount = Number(stat.expiredCount ?? 0);
  const officialMissingCount = Number(stat.officialMissingCount ?? 0);
  const errorCount = Number(stat.errorCount ?? 0);
  const issueCount = hiddenCount + failedCount + expiredCount + officialMissingCount + errorCount;
  const risk = riskForProvider({ ...stat, configured, feedUrls });

  return {
    ...profile,
    mode: configured ? "external_feed" : "seed_fallback",
    modeLabel: configured ? "공식 feed 연결" : "seed fallback",
    configured,
    feedUrls,
    visibleCount,
    hiddenCount,
    failedCount,
    expiredCount,
    officialMissingCount,
    errorCount,
    issueCount,
    launchBlocking: visibleCount === 0 || risk.severity === "danger",
    risk
  };
});

const configuredProviders = providers.filter((provider) => provider.configured).length;
const seedOnlyProviders = providers.length - configuredProviders;
const configuredFeedUrls = providers.reduce((sum, provider) => sum + provider.feedUrls, 0);
const readinessRate = Math.round((configuredProviders / Math.max(1, providers.length)) * 100);
const launchBlockingCount = providers.filter((provider) => provider.launchBlocking).length;
const recommendedNextEnvKeys = providers
  .filter((provider) => !provider.configured)
  .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1))
  .flatMap((provider) => provider.envKeys);
const status =
  configuredProviders === providers.length
    ? "production_feed_ready"
    : configuredProviders > 0
      ? "hybrid_feed_ready"
      : "seed_launch_ready";
const label =
  status === "production_feed_ready"
    ? "공식 feed 운영 가능"
    : status === "hybrid_feed_ready"
      ? "부분 feed 전환"
      : "seed fallback 운영";
const generatedAt = new Date().toISOString();
const report = {
  ok: launchBlockingCount === 0,
  generatedAt,
  status,
  label,
  readinessRate,
  totalProviders: providers.length,
  configuredProviders,
  seedOnlyProviders,
  configuredFeedUrls,
  launchBlockingCount,
  recommendedNextEnvKeys,
  guardrails: [
    "공식 API/RSS/Atom/제휴 JSON feed만 연결합니다.",
    "뉴스·커뮤니티 원문은 sourceUrl로만 보관하고 사용자 이동 finalUrl은 공식 이벤트·쿠폰·구매 페이지로 제한합니다.",
    "검색 결과 URL, 종료 이벤트, 공식 링크 누락 항목은 verify:news와 refresh:all에서 노출 제외합니다."
  ],
  nextCommand: "npm run news:feed:doctor && npm run refresh:all && npm run verify:news && npm run release:doctor",
  providers
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportJsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# 공식 혜택 feed 전환 리포트",
  "",
  "이 문서는 할인도사가 seed fallback에서 공식 API/RSS/제휴 JSON feed 운영으로 전환할 때 필요한 provider별 상태를 요약합니다.",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- 상태: ${label} (${status})`,
  `- 전환 준비율: ${readinessRate}%`,
  `- Provider: ${configuredProviders}/${providers.length}개 연결`,
  `- Seed fallback: ${seedOnlyProviders}개`,
  `- Feed URL: ${configuredFeedUrls}개`,
  `- 출시 차단 Provider: ${launchBlockingCount}개`,
  "",
  "## Provider별 전환 상태",
  "",
  "| Provider | 라벨 | 모드 | 노출 | 이슈 | 위험도 | 우선 env | 다음 액션 |",
  "| --- | --- | --- | ---: | ---: | --- | --- | --- |",
  ...providers.map(
    (provider) =>
      `| ${provider.provider} | ${provider.label} | ${provider.modeLabel} | ${provider.visibleCount} | ${provider.issueCount} | ${provider.risk.label} | ${provider.envKeys.join(", ")} | ${provider.nextAction} |`
  ),
  "",
  "## 다음 연결 우선순위",
  "",
  ...(recommendedNextEnvKeys.length
    ? recommendedNextEnvKeys.map((key, index) => `${index + 1}. \`${key}\``)
    : ["- 모든 provider에 공식 feed URL이 연결되어 있습니다."]),
  "",
  "## 운영 가드레일",
  "",
  ...report.guardrails.map((item) => `- ${item}`),
  "",
  "## 검증 명령",
  "",
  "```bash",
  report.nextCommand,
  "```",
  ""
];
writeFileSync(join(root, reportDocsPath), `${docsLines.join("\n")}\n`, "utf8");

console.log("Feed transition report written.");
console.log(`- ${reportJsonPath}`);
console.log(`- ${reportDocsPath}`);
console.log(`- status: ${status}`);
console.log(`- configuredProviders: ${configuredProviders}/${providers.length}`);
console.log(`- launchBlockingCount: ${launchBlockingCount}`);

if (!report.ok) {
  console.log("Feed transition has launch-blocking provider gaps, but seed/fallback exposure remains governed by verify:news.");
}
