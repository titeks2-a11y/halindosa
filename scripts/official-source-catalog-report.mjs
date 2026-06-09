import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getEnvFeedUrls } from "./feed-url-utils.mjs";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = "data/officialSourceCatalog.json";
const reportPath = "reports/official-source-catalog.json";
const csvPath = "reports/official-source-catalog.csv";
const docsPath = "docs/OFFICIAL_SOURCE_CATALOG.md";
const requiredCategories = [
  "식품/생필품",
  "마트/편의점",
  "디지털/가전",
  "패션/뷰티",
  "외식/배달",
  "여행/숙박",
  "영화/문화",
  "카드/멤버십",
  "무료혜택",
  "정부/공공혜택"
];
const requiredProviders = ["news", "event_news", "official_event", "public_coupon"];
const allowedEnvKeys = new Set([
  "DEAL_NEWS_FEED_URLS",
  "DEAL_NEWS_RSS_URLS",
  "DEAL_EVENT_NEWS_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "DEAL_EVENT_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS",
  "BENEFIT_REFRESH_FEED_URLS"
]);

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function configuredFeedCount(envKeys) {
  return getEnvFeedUrls(...envKeys).length;
}

function toList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(" | ");
  if (value == null) return "";
  return String(value);
}

function csvEscape(value) {
  const text = toList(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows) {
  const headers = [
    "section",
    "id",
    "label",
    "provider",
    "category",
    "sourceType",
    "priority",
    "officialUrl",
    "host",
    "refreshCadenceHours",
    "preferredEnvKeys",
    "configuredFeedUrls",
    "allowedUse",
    "blockedUse",
    "status",
    "mode",
    "modeLabel",
    "visibleCount",
    "issueCount",
    "readinessRate",
    "nextAction",
    "operatorAction"
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function hostMatches(host, candidate) {
  return host === candidate || host.endsWith(`.${candidate}`);
}

function parseOfficialUrl(source, issues) {
  try {
    const url = new URL(source.officialUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      issues.push(`${source.id}: officialUrl must use http/https.`);
    }
    return url;
  } catch {
    issues.push(`${source.id}: officialUrl is invalid.`);
    return null;
  }
}

const catalog = readJson(catalogPath, []);
const linkPolicy = readJson("data/linkQualityPolicy.json", {});
const newsReport = readJson("reports/news-deals.json", {});
const feedTransition = readJson("reports/feed-transition.json", {});
const issues = [];
const ids = new Set();
const officialUrls = new Map();
const categories = new Map(requiredCategories.map((category) => [category, 0]));
const providerCounts = new Map(requiredProviders.map((provider) => [provider, 0]));
const sourceTypes = new Map();
const configuredEnvKeys = new Map();
const catalogRows = [];
const blockedHosts = [...(linkPolicy.blockedHosts ?? []), ...(linkPolicy.placeholderHosts ?? [])];
const searchPatterns = linkPolicy.searchPatterns ?? [];

if (!Array.isArray(catalog)) {
  issues.push(`${catalogPath} should be an array.`);
}

for (const source of Array.isArray(catalog) ? catalog : []) {
  const rowIssues = [];
  const requiredFields = ["id", "label", "provider", "category", "sourceType", "officialUrl", "preferredEnvKeys", "integrationMethod", "priority", "refreshCadenceHours", "allowedUse", "blockedUse", "notes"];

  for (const field of requiredFields) {
    if (!(field in source) || source[field] === "" || source[field] == null) rowIssues.push(`missing_${field}`);
  }

  if (ids.has(source.id)) rowIssues.push("duplicate_id");
  ids.add(source.id);

  if (!requiredProviders.includes(source.provider)) rowIssues.push("unknown_provider");
  providerCounts.set(source.provider, (providerCounts.get(source.provider) ?? 0) + 1);

  const sourceCategories = Array.isArray(source.category) ? source.category : [];
  if (!sourceCategories.length) rowIssues.push("missing_category");
  for (const category of sourceCategories) {
    if (!requiredCategories.includes(category)) rowIssues.push(`unsupported_category_${category}`);
    categories.set(category, (categories.get(category) ?? 0) + 1);
  }

  const envKeys = Array.isArray(source.preferredEnvKeys) ? source.preferredEnvKeys : [];
  if (!envKeys.length) rowIssues.push("missing_env_keys");
  for (const key of envKeys) {
    if (!allowedEnvKeys.has(key)) rowIssues.push(`unsupported_env_${key}`);
    configuredEnvKeys.set(key, configuredFeedCount([key]));
  }

  const url = parseOfficialUrl(source, rowIssues);
  let host = "";
  let searchLike = false;
  let blockedHost = false;
  let homeLike = false;

  if (url) {
    host = url.hostname.replace(/^www\./, "").toLowerCase();
    const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
    const normalizedOfficialUrl = url.href.replace(/\/$/, "");
    const existingSourceId = officialUrls.get(normalizedOfficialUrl);
    if (existingSourceId) rowIssues.push(`duplicate_official_url_${existingSourceId}`);
    officialUrls.set(normalizedOfficialUrl, source.id);
    searchLike = searchPatterns.some((pattern) => value.includes(pattern));
    blockedHost = blockedHosts.some((candidate) => hostMatches(host, candidate));
    homeLike = ["", "/", "/main", "/index"].includes(url.pathname.replace(/\/+$/, "").toLowerCase());
    if (searchLike) rowIssues.push("search_or_result_url");
    if (blockedHost) rowIssues.push("blocked_or_placeholder_host");
    if (homeLike) rowIssues.push("home_or_landing_url");
  }

  sourceTypes.set(source.sourceType, (sourceTypes.get(source.sourceType) ?? 0) + 1);

  catalogRows.push({
    ...source,
    host,
    configuredFeedUrls: configuredFeedCount(envKeys),
    searchLike,
    blockedHost,
    homeLike,
    ok: rowIssues.length === 0,
    issues: rowIssues
  });

  issues.push(...rowIssues.map((issue) => `${source.id}: ${issue}`));
}

const missingCategories = [...categories.entries()].filter(([, count]) => count === 0).map(([category]) => category);
const thinCategories = [...categories.entries()].filter(([, count]) => count > 0 && count < 2).map(([category]) => category);
const missingProviders = [...providerCounts.entries()].filter(([, count]) => count === 0).map(([provider]) => provider);
const highPriorityCount = catalogRows.filter((source) => source.priority === "high").length;
const configuredSourceCount = catalogRows.filter((source) => source.configuredFeedUrls > 0).length;

if (catalogRows.length < 30) issues.push(`catalog should include at least 30 official source candidates, got ${catalogRows.length}.`);
if (missingCategories.length) issues.push(`missing category coverage: ${missingCategories.join(", ")}`);
if (thinCategories.length) issues.push(`thin category coverage: ${thinCategories.join(", ")}`);
if (missingProviders.length) issues.push(`missing provider coverage: ${missingProviders.join(", ")}`);
if (highPriorityCount < 10) issues.push(`catalog should include at least 10 high-priority source candidates, got ${highPriorityCount}.`);

const nextActions = [
  configuredSourceCount
    ? "연결된 공식 feed를 refresh:news와 verify:news로 매일 검증합니다."
    : "OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결해 seed 의존도를 줄입니다.",
  "새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록합니다.",
  "사용자 finalUrl은 검색 결과, 커뮤니티 원문, 쇼핑몰 메인이 아니라 공식 이벤트·혜택·구매 상세 페이지여야 합니다."
];
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  catalogCount: catalogRows.length,
  highPriorityCount,
  configuredSourceCount,
  configuredEnvKeys: Object.fromEntries([...configuredEnvKeys.entries()].sort(([a], [b]) => a.localeCompare(b))),
  categoryCoverage: Object.fromEntries([...categories.entries()]),
  missingCategories,
  thinCategories,
  providerCoverage: Object.fromEntries([...providerCounts.entries()]),
  missingProviders,
  sourceTypes: Object.fromEntries([...sourceTypes.entries()].sort(([a], [b]) => a.localeCompare(b))),
  feedTransitionStatus: feedTransition.status ?? "unknown",
  officialBenefitsVisible: Number(newsReport.visibleCount ?? 0),
  officialBenefitsHidden: Number(newsReport.hiddenCount ?? 0),
  officialBenefitsExpired: Number(newsReport.expiredCount ?? 0),
  officialBenefitsFailed: Number(newsReport.failedCount ?? 0),
  nextActions,
  sources: catalogRows,
  issues
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const feedTransitionRows = Array.isArray(feedTransition.providers)
  ? feedTransition.providers.map((provider) => ({
      section: "feed_transition",
      id: provider.provider,
      label: provider.label,
      provider: provider.provider,
      priority: provider.priority,
      configuredFeedUrls: provider.feedUrls,
      preferredEnvKeys: provider.envKeys,
      allowedUse: provider.acceptedSources,
      status: feedTransition.status ?? "unknown",
      mode: provider.mode,
      modeLabel: provider.modeLabel,
      visibleCount: provider.visibleCount,
      issueCount: provider.issueCount,
      readinessRate: feedTransition.readinessRate ?? 0,
      nextAction: provider.nextAction,
      operatorAction: feedTransition.operatorAction ?? nextActions[0]
    }))
  : [];
const csvRows = [
  ...catalogRows.map((source) => ({
    section: "source_catalog",
    id: source.id,
    label: source.label,
    provider: source.provider,
    category: source.category,
    sourceType: source.sourceType,
    priority: source.priority,
    officialUrl: source.officialUrl,
    host: source.host,
    refreshCadenceHours: source.refreshCadenceHours,
    preferredEnvKeys: source.preferredEnvKeys,
    configuredFeedUrls: source.configuredFeedUrls,
    allowedUse: source.allowedUse,
    blockedUse: source.blockedUse,
    nextAction: source.configuredFeedUrls
      ? "연결된 공식 feed를 refresh:news와 verify:news로 검증"
      : `${source.preferredEnvKeys.join(" 또는 ")}에 승인 feed URL 연결`
  })),
  ...feedTransitionRows,
  ...nextActions.map((action, index) => ({
    section: "next_action",
    id: `next_${index + 1}`,
    label: action,
    status: feedTransition.status ?? "unknown",
    readinessRate: feedTransition.readinessRate ?? 0,
    operatorAction: feedTransition.operatorAction ?? nextActions[0]
  }))
];
writeFileSync(join(root, csvPath), `\uFEFF${buildCsv(csvRows)}\n`, "utf8");

const docsLines = [
  "# 공식 소스 카탈로그",
  "",
  "이 문서는 할인도사에 연결할 수 있는 공식 이벤트, 공공 혜택, 제휴 JSON/RSS 후보를 정리합니다. 무단 크롤링 후보가 아니라 운영자가 승인 feed 또는 공식 페이지 매핑으로 전환할 때 쓰는 출발점입니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 상태: ${report.ok ? "PASS" : "FAIL"}`,
  `- 후보 소스: ${report.catalogCount}개`,
  `- 고우선순위 후보: ${report.highPriorityCount}개`,
  `- 현재 env feed 연결 후보: ${report.configuredSourceCount}개`,
  `- 공식 혜택 노출: ${report.officialBenefitsVisible}개`,
  `- feed 전환 상태: ${report.feedTransitionStatus}`,
  `- CSV 리포트: ${csvPath}`,
  "",
  "## 카테고리 커버리지",
  "",
  "| 카테고리 | 후보 수 | 상태 |",
  "| --- | ---: | --- |",
  ...requiredCategories.map((category) => {
    const count = categories.get(category) ?? 0;
    return `| ${category} | ${count} | ${count >= 2 ? "충분" : count ? "보강" : "공백"} |`;
  }),
  "",
  "## Provider 커버리지",
  "",
  "| Provider | 후보 수 | 상태 |",
  "| --- | ---: | --- |",
  ...requiredProviders.map((provider) => {
    const count = providerCounts.get(provider) ?? 0;
    return `| ${provider} | ${count} | ${count ? "포함" : "공백"} |`;
  }),
  "",
  "## 후보 목록",
  "",
  "| ID | Provider | 카테고리 | 우선순위 | 공식 URL | Env |",
  "| --- | --- | --- | --- | --- | --- |",
  ...catalogRows.map((source) => `| ${source.id} | ${source.provider} | ${source.category.join(", ")} | ${source.priority} | ${source.officialUrl} | ${source.preferredEnvKeys.join(", ")} |`),
  "",
  "## 다음 작업",
  "",
  ...nextActions.map((action) => `- ${action}`),
  "",
  "## CSV 사용",
  "",
  `- \`${csvPath}\`는 \`source_catalog\`, \`feed_transition\`, \`next_action\` 행을 포함한다.`,
  "- 운영자는 CSV를 스프레드시트로 열어 공식 URL, 카테고리, 우선 연결 env key, 현재 feed URL 수, 다음 액션을 함께 검수한다.",
  "",
  "## 검증 결과",
  "",
  report.issues.length ? report.issues.map((issue) => `- ${issue}`).join("\n") : "- 이슈 없음",
  ""
];
writeFileSync(join(root, docsPath), `${docsLines.join("\n")}\n`, "utf8");

if (issues.length) {
  console.error("Official source catalog report failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Official source catalog report written.");
console.log(`- ${reportPath}`);
console.log(`- ${csvPath}`);
console.log(`- ${docsPath}`);
console.log(`- sources: ${report.catalogCount}`);
console.log(`- category coverage: ${requiredCategories.length - missingCategories.length}/${requiredCategories.length}`);
console.log(`- provider coverage: ${requiredProviders.length - missingProviders.length}/${requiredProviders.length}`);
