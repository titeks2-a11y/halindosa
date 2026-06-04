import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = join(root, "reports", "official-source-catalog.json");
const livePath = join(root, "reports", "official-source-live-check.json");
const jsonPath = join(root, "reports", "source-onboarding-plan.json");
const csvPath = join(root, "reports", "source-onboarding-plan.csv");
const envTemplatePath = join(root, "reports", "source-onboarding-env-template.env");
const docsPath = join(root, "docs", "SOURCE_ONBOARDING_PLAN.md");

const strategicCategories = new Set(["무료혜택", "마트/편의점", "외식/배달", "영화/문화", "카드/멤버십"]);

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.map(String).join(" | ") : value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows) {
  const headers = [
    "rank",
    "id",
    "label",
    "provider",
    "category",
    "priority",
    "liveStatus",
    "httpStatus",
    "configuredFeedUrls",
    "recommendedEnvKeys",
    "onboardingStatus",
    "score",
    "nextAction",
    "guardrail"
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function buildEnvPlan(rows) {
  const envRows = new Map();

  for (const row of rows) {
    for (const envKey of row.recommendedEnvKeys ?? []) {
      if (!envKey || envKey === "source:onboarding:plan") continue;
      const current = envRows.get(envKey) ?? {
        envKey,
        status: "not_configured",
        configuredFeedUrls: 0,
        candidateCount: 0,
        reachableCandidates: 0,
        guardedCandidates: 0,
        topSources: [],
        categories: new Set(),
        providers: new Set(),
        nextAction: `${envKey}에 공식 JSON/RSS 또는 승인된 파트너 feed URL을 줄바꿈 또는 쉼표로 입력`
      };

      current.candidateCount += 1;
      current.configuredFeedUrls += Number(row.configuredFeedUrls ?? 0);
      if (row.liveStatus === "reachable") current.reachableCandidates += 1;
      if (row.liveStatus === "guarded") current.guardedCandidates += 1;
      current.providers.add(row.provider);
      for (const category of row.category ?? []) current.categories.add(category);
      if (current.topSources.length < 5) {
        current.topSources.push({
          id: row.id,
          label: row.label,
          provider: row.provider,
          officialUrl: row.officialUrl,
          liveStatus: row.liveStatus,
          rank: row.rank
        });
      }

      envRows.set(envKey, current);
    }
  }

  return [...envRows.values()]
    .map((row) => ({
      ...row,
      status: row.configuredFeedUrls > 0 ? "configured_verify" : "ready_to_connect",
      categories: [...row.categories].sort(),
      providers: [...row.providers].sort(),
      topSources: row.topSources.sort((a, b) => a.rank - b.rank)
    }))
    .sort((a, b) => b.candidateCount - a.candidateCount || a.envKey.localeCompare(b.envKey));
}

function buildEnvTemplate(envPlan) {
  const lines = [
    "# 할인도사 공식 혜택 feed 연결 템플릿",
    "# 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 입력하세요.",
    "# 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.",
    "# 여러 URL은 줄바꿈, 쉼표, 세미콜론, JSON 배열 형식 중 하나로 관리할 수 있습니다.",
    ""
  ];

  for (const plan of envPlan) {
    lines.push(`# ${plan.envKey}`);
    lines.push(`# 후보 ${plan.candidateCount}개 · 접근 가능 ${plan.reachableCandidates}개 · 보호/승인 필요 ${plan.guardedCandidates}개`);
    lines.push(`# 대표 후보: ${plan.topSources.map((source) => source.label).join(" / ")}`);
    lines.push(`${plan.envKey}=`);
    lines.push("");
  }

  return lines.join("\n");
}

function scoreSource(source, live, categoryCoverage) {
  let score = 0;
  const reasons = [];
  const categories = Array.isArray(source.category) ? source.category : [];
  const configuredFeedUrls = Number(source.configuredFeedUrls ?? 0);
  const liveStatus = live?.status ?? "missing_live_check";

  if (source.priority === "high") {
    score += 40;
    reasons.push("high priority");
  } else if (source.priority === "medium") {
    score += 25;
    reasons.push("medium priority");
  } else {
    score += 10;
  }

  if (configuredFeedUrls === 0) {
    score += 20;
    reasons.push("no approved feed configured");
  }

  if (liveStatus === "reachable") {
    score += 18;
    reasons.push("official URL reachable");
  } else if (liveStatus === "guarded") {
    score += 14;
    reasons.push("official source guarded; needs API/RSS/partner approval");
  } else {
    score -= 25;
    reasons.push(`live status ${liveStatus}`);
  }

  for (const category of categories) {
    const coverage = Number(categoryCoverage?.[category] ?? 0);
    if (coverage <= 2) {
      score += 12;
      reasons.push(`thin category ${category}`);
    } else if (strategicCategories.has(category)) {
      score += 4;
    }
  }

  if (String(source.sourceType ?? "").includes("official_purchase")) {
    score += 8;
    reasons.push("purchase-capable official page");
  }

  return { score, reasons };
}

function getOnboardingStatus(source, live) {
  const configuredFeedUrls = Number(source.configuredFeedUrls ?? 0);
  const liveStatus = live?.status ?? "missing_live_check";

  if (configuredFeedUrls > 0) return "feed_configured_verify";
  if (liveStatus === "reachable") return "connect_official_feed";
  if (liveStatus === "guarded") return "request_partner_or_api";
  return "do_not_use_until_reviewed";
}

function getNextAction(source, live) {
  const envKeys = Array.isArray(source.preferredEnvKeys) ? source.preferredEnvKeys.join(" 또는 ") : "OFFICIAL_EVENT_FEED_URLS";
  const status = getOnboardingStatus(source, live);

  if (status === "feed_configured_verify") return "연결된 feed를 refresh:news, verify:news, refresh:all로 검증";
  if (status === "connect_official_feed") return `${envKeys}에 공식 JSON/RSS 또는 승인된 파트너 feed URL 연결`;
  if (status === "request_partner_or_api") return "보호 페이지를 자동 수집하지 말고 공식 API/RSS/제휴 담당자 승인 feed 요청";
  return "공식 URL 교체 또는 수동 검수 전까지 신규 혜택 source로 사용 금지";
}

function getGuardrail(source, live) {
  const liveStatus = live?.status ?? "missing_live_check";
  if (liveStatus === "guarded") return "무단 크롤링 금지, 브라우저 자동 수집 금지, 승인 feed만 허용";
  if (liveStatus === "reachable") return "검색 결과·커뮤니티 원문·메인 페이지를 finalUrl로 쓰지 않기";
  return "사용자 노출 금지";
}

const catalogReport = readJson(catalogPath, {});
const liveReport = readJson(livePath, {});
const catalogSources = Array.isArray(catalogReport.sources) ? catalogReport.sources : [];
const liveById = new Map((Array.isArray(liveReport.sources) ? liveReport.sources : []).map((source) => [source.id, source]));
const categoryCoverage = catalogReport.categoryCoverage ?? {};

if (!catalogSources.length || !liveById.size) {
  console.error("Source onboarding plan requires reports/official-source-catalog.json and reports/official-source-live-check.json.");
  process.exit(1);
}

const queue = catalogSources
  .map((source) => {
    const live = liveById.get(source.id);
    const { score, reasons } = scoreSource(source, live, categoryCoverage);
    return {
      id: source.id,
      label: source.label,
      provider: source.provider,
      category: source.category,
      priority: source.priority,
      sourceType: source.sourceType,
      officialUrl: source.officialUrl,
      liveStatus: live?.status ?? "missing_live_check",
      httpStatus: live?.httpStatus ?? 0,
      configuredFeedUrls: Number(source.configuredFeedUrls ?? 0),
      recommendedEnvKeys: source.preferredEnvKeys ?? [],
      onboardingStatus: getOnboardingStatus(source, live),
      score,
      reasons,
      nextAction: getNextAction(source, live),
      guardrail: getGuardrail(source, live)
    };
  })
  .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)))
  .map((row, index) => ({ rank: index + 1, ...row }));

const statusCounts = queue.reduce((acc, row) => {
  acc[row.onboardingStatus] = (acc[row.onboardingStatus] ?? 0) + 1;
  return acc;
}, {});
const envPlan = buildEnvPlan(queue);
const envTemplate = buildEnvTemplate(envPlan);

const topActions = queue.slice(0, 10).map((row) => ({
  rank: row.rank,
  id: row.id,
  label: row.label,
  provider: row.provider,
  status: row.onboardingStatus,
  score: row.score,
  nextAction: row.nextAction
}));

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  totalSources: queue.length,
  reachableSources: Number(liveReport.reachableCount ?? 0),
  guardedSources: Number(liveReport.guardedCount ?? 0),
  blockedLiveIssues:
    Number(liveReport.needsReviewCount ?? 0) +
    Number(liveReport.timeoutCount ?? 0) +
    Number(liveReport.networkErrorCount ?? 0) +
    Number(liveReport.staleOrRemovedCount ?? 0) +
    Number(liveReport.statusCounts?.server_error ?? 0),
  configuredFeedSources: queue.filter((row) => row.configuredFeedUrls > 0).length,
  statusCounts,
  envPlan,
  envTemplate,
  topActions,
  guardrails: [
    "공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 운영 feed로 연결합니다.",
    "검색 결과, 커뮤니티 원문, 블로그 글, 쇼핑몰 메인 페이지는 사용자 finalUrl로 쓰지 않습니다.",
    "guarded 소스는 무단 크롤링하지 않고 공식 제휴 또는 수동 승인 매핑으로만 운영합니다."
  ],
  queue
};

const docsLines = [
  "# 공식 소스 온보딩 우선순위",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 공식 소스 후보: ${report.totalSources}개`,
  `- 접근 가능: ${report.reachableSources}개`,
  `- 보호/권한 확인 필요: ${report.guardedSources}개`,
  `- 차단 live 이슈: ${report.blockedLiveIssues}개`,
  `- feed 설정 완료 소스: ${report.configuredFeedSources}개`,
  "",
  "## 운영 원칙",
  "",
  ...report.guardrails.map((line) => `- ${line}`),
  "",
  "## 다음 연결 우선순위 TOP 10",
  "",
  "| 순위 | 소스 | Provider | 상태 | 점수 | 다음 액션 |",
  "| --- | --- | --- | --- | ---: | --- |",
  ...topActions.map((row) => `| ${row.rank} | ${row.label} | ${row.provider} | ${row.status} | ${row.score} | ${row.nextAction} |`),
  "",
  "## 환경변수 연결 템플릿",
  "",
  "운영자는 아래 env key별로 공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 연결합니다. 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 URL은 입력하지 않습니다.",
  "",
  "| Env key | 후보 | 접근 가능 | 보호/승인 필요 | 대표 후보 |",
  "| --- | ---: | ---: | ---: | --- |",
  ...envPlan.map(
    (plan) =>
      `| ${plan.envKey} | ${plan.candidateCount} | ${plan.reachableCandidates} | ${plan.guardedCandidates} | ${plan.topSources.map((source) => source.label).join(" / ")} |`
  ),
  "",
  "```env",
  ...envTemplate.split("\n"),
  "```",
  "",
  "## 전체 큐",
  "",
  "| 순위 | ID | 카테고리 | Live | HTTP | Env | Guardrail |",
  "| --- | --- | --- | --- | ---: | --- | --- |",
  ...queue.map(
    (row) =>
      `| ${row.rank} | ${row.id} | ${row.category.join(" / ")} | ${row.liveStatus} | ${row.httpStatus} | ${row.recommendedEnvKeys.join(" / ")} | ${row.guardrail} |`
  ),
  "",
  "## 재생성",
  "",
  "```bash",
  "npm run source:catalog:report",
  "npm run source:live:doctor",
  "npm run source:onboarding:plan",
  "```",
  ""
];

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(csvPath, `\uFEFF${buildCsv(queue)}\n`, "utf8");
writeFileSync(envTemplatePath, `${envTemplate}\n`, "utf8");
writeFileSync(docsPath, docsLines.join("\n"), "utf8");

console.log("Source onboarding plan written.");
console.log("- reports/source-onboarding-plan.json");
console.log("- reports/source-onboarding-plan.csv");
console.log("- reports/source-onboarding-env-template.env");
console.log("- docs/SOURCE_ONBOARDING_PLAN.md");
console.log(`- sources: ${report.totalSources}`);
console.log(`- top action: ${topActions[0]?.label ?? "none"}`);
