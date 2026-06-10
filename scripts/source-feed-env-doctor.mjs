import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseFeedUrlList } from "./feed-url-utils.mjs";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "source-feed-env-readiness.json");
const docsPath = join(docsDir, "SOURCE_FEED_ENV_REPORT.md");
const starterPackPath = join(reportsDir, "free-benefit-feed-starter-pack.json");

const feedKeys = [
  "DEAL_NEWS_FEED_URLS",
  "DEAL_NEWS_RSS_URLS",
  "DEAL_EVENT_NEWS_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "DEAL_EVENT_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS",
  "BENEFIT_REFRESH_FEED_URLS",
  "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS"
];

const communityHostPatterns = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "arca.live",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "theqoo.net",
  "blog.naver.com",
  "m.blog.naver.com",
  "tistory.com",
  "brunch.co.kr",
  "velog.io",
  "medium.com"
];

const searchPathPatterns = [
  /\/search(?:[./?]|$)/i,
  /\/msearch(?:[./?]|$)/i,
  /shopping\/search/i,
  /\/np\/search/i,
  /\/find(?:[./?]|$)/i,
  /\/result(?:[./?]|$)/i,
  /\/results(?:[./?]|$)/i
];

const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/i,
  /\.local$/i,
  /^metadata\.google$/i,
  /^169\.254\.169\.254$/i
];

const machineReadablePatterns = [
  /\.json(?:$|\?)/i,
  /\.ndjson(?:$|\?)/i,
  /\.xml(?:$|\?)/i,
  /\.rss(?:$|\?)/i,
  /\.atom(?:$|\?)/i,
  /\/api(?:\/|$|\?)/i,
  /\/feed(?:\/|$|\?)/i,
  /\/feeds(?:\/|$|\?)/i,
  /\/rss(?:\/|$|\?)/i,
  /\/atom(?:\/|$|\?)/i,
  /format=(?:json|rss|xml|atom)/i,
  /output=(?:json|rss|xml|atom)/i
];

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeHost(host) {
  return String(host ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function readEnvFile(fileName) {
  const path = join(root, fileName);
  if (!existsSync(path)) return {};
  const values = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/g);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!feedKeys.includes(key) && key !== "HALINDOSA_APPROVED_FEED_HOSTS" && key !== "BENEFIT_REFRESH_APPROVED_HOSTS" && key !== "HALINDOSA_ALLOW_DATA_FEED_URLS") continue;
    values[key] = stripEnvQuotes(rawValue);
  }

  return values;
}

function stripEnvQuotes(value) {
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getEnvValue(key) {
  const fileValues = [".env", ".env.local", ".env.production.local"].map(readEnvFile);
  const collected = [];

  for (const values of fileValues) {
    if (values[key]) collected.push(values[key]);
  }

  if (process.env[key]) collected.push(process.env[key]);
  return collected.join("\n");
}

function getApprovedExtraHosts() {
  const value = [getEnvValue("HALINDOSA_APPROVED_FEED_HOSTS"), getEnvValue("BENEFIT_REFRESH_APPROVED_HOSTS")]
    .filter(Boolean)
    .join(",");
  return new Set(
    String(value ?? "")
      .split(/[,\s;]+/g)
      .map(normalizeHost)
      .filter(Boolean)
  );
}

function getCatalogHostMap() {
  const catalog = readJson(join(root, "data", "officialSourceCatalog.json"), []);
  const map = new Map();

  for (const source of Array.isArray(catalog) ? catalog : []) {
    try {
      const host = normalizeHost(new URL(source.officialUrl).hostname);
      const rows = map.get(host) ?? [];
      rows.push({
        id: source.id,
        label: source.label,
        provider: source.provider,
        category: source.category ?? [],
        officialUrl: source.officialUrl
      });
      map.set(host, rows);
    } catch {
      // Catalog report already validates source URLs; ignore malformed entries here.
    }
  }

  return map;
}

function hasHostMatch(host, hostMap) {
  const normalized = normalizeHost(host);
  if (hostMap.has(normalized)) return hostMap.get(normalized);

  for (const [catalogHost, sources] of hostMap.entries()) {
    if (normalized.endsWith(`.${catalogHost}`)) return sources;
  }

  return [];
}

function sanitizeUrl(url) {
  if (String(url).startsWith("data:")) return "data:[inline-feed]";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "invalid-url";
  }
}

function buildActivationReadiness(configuredUrlCount) {
  const starterPack = readJson(starterPackPath, {});
  const packs = Array.isArray(starterPack.packs) ? starterPack.packs : [];
  const recommendedFirstLanes = packs
    .map((pack) => ({
      id: pack.id,
      label: pack.label,
      envKeys: Array.isArray(pack.envKeys) ? pack.envKeys.slice(0, 3) : [],
      candidateCount: Number(pack.candidateCount ?? 0),
      reachableCount: Number(pack.reachableCount ?? 0),
      guardedCount: Number(pack.guardedCount ?? 0),
      firstAction: pack.firstAction ?? "공식 JSON/RSS/API feed endpoint를 승인 후 연결",
      firstCandidates: (Array.isArray(pack.candidates) ? pack.candidates : []).slice(0, 3).map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        officialUrl: candidate.officialUrl,
        liveStatus: candidate.liveStatus,
        recommendedEnvKeys: Array.isArray(candidate.preferredEnvKeys) ? candidate.preferredEnvKeys.slice(0, 3) : []
      }))
    }))
    .slice(0, 12);

  return {
    status: configuredUrlCount > 0 ? "feed_configured" : "seed_fallback_only",
    starterPackAvailable: packs.length > 0,
    recommendedLaneCount: recommendedFirstLanes.length,
    recommendedFirstLanes,
    operatorChecklist: [
      "공식 URL은 검토 기준으로만 사용하고, env에는 JSON/RSS/Atom/API/승인 파트너 feed endpoint만 넣습니다.",
      "HTML 이벤트 목록, 검색 결과, 커뮤니티/블로그 URL, 대표 홈페이지 URL은 source:feed-env:doctor에서 차단되어야 합니다.",
      "새 host가 카탈로그에 없으면 host만 HALINDOSA_APPROVED_FEED_HOSTS 또는 BENEFIT_REFRESH_APPROVED_HOSTS에 추가하고 계약/승인 근거를 문서화합니다.",
      "feed 연결 후 source:feed-env:doctor, news:feed:canary, refresh:news, verify:news, refresh:benefits, security:check 순서로 확인합니다."
    ]
  };
}

function classifyUrl(envKey, rawUrl, catalogHostMap, approvedExtraHosts, allowDataUrls) {
  const base = {
    envKey,
    configuredValue: sanitizeUrl(rawUrl),
    host: "",
    status: "failed",
    reason: "",
    matchedSources: [],
    action: ""
  };

  if (String(rawUrl).startsWith("data:")) {
    return {
      ...base,
      host: "inline-data-feed",
      status: allowDataUrls ? "passed" : "failed",
      reason: allowDataUrls ? "local_inline_feed_allowed" : "data_url_feed_not_allowed",
      action: allowDataUrls
        ? "로컬 테스트 전용입니다. 운영 배포 전에는 공식 HTTPS JSON/RSS feed로 교체합니다."
        : "data: feed는 운영 환경에서 금지됩니다. 로컬 테스트가 꼭 필요하면 HALINDOSA_ALLOW_DATA_FEED_URLS=true를 명시합니다."
    };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ...base,
      reason: "invalid_url",
      action: "URL 형식을 확인하고 https://로 시작하는 공식 JSON/RSS/API feed만 입력합니다."
    };
  }

  const host = normalizeHost(parsed.hostname);
  const pathAndSearch = `${parsed.pathname}${parsed.search}`;
  const matchedSources = hasHostMatch(host, catalogHostMap);
  const isApprovedExtraHost = approvedExtraHosts.has(host);
  const isCommunityHost = communityHostPatterns.some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
  const isSearchUrl = searchPathPatterns.some((pattern) => pattern.test(pathAndSearch));
  const isPrivateHost = privateHostPatterns.some((pattern) => pattern.test(host));
  const isMachineReadable = machineReadablePatterns.some((pattern) => pattern.test(pathAndSearch));

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      ...base,
      host,
      reason: "unsafe_protocol",
      action: "javascript:, file:, data: 같은 위험 프로토콜은 feed로 사용할 수 없습니다."
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      ...base,
      host,
      reason: "http_not_https",
      action: "운영 feed는 HTTPS만 허용합니다."
    };
  }

  if (isPrivateHost) {
    return {
      ...base,
      host,
      reason: "private_or_metadata_host",
      action: "내부망, localhost, link-local, cloud metadata 주소는 SSRF 위험 때문에 feed로 사용할 수 없습니다."
    };
  }

  if (isCommunityHost) {
    return {
      ...base,
      host,
      reason: "community_or_blog_host",
      action: "커뮤니티, 블로그, 게시판 URL은 source context로만 검토하고 사용자 feed로 연결하지 않습니다."
    };
  }

  if (isSearchUrl) {
    return {
      ...base,
      host,
      reason: "search_or_result_url",
      action: "검색 결과 URL은 feed로 금지됩니다. 공식 JSON/RSS/API 또는 승인된 파트너 feed를 연결합니다."
    };
  }

  if (!matchedSources.length && !isApprovedExtraHost) {
    return {
      ...base,
      host,
      reason: "unlisted_feed_host",
      action: "공식 소스 카탈로그에 없는 feed host입니다. 승인된 제휴 feed라면 HALINDOSA_APPROVED_FEED_HOSTS에 host를 추가하고 계약 근거를 문서화합니다."
    };
  }

  if (!isMachineReadable) {
    return {
      ...base,
      host,
      matchedSources,
      reason: "not_machine_readable_feed",
      action: "HTML 이벤트 페이지를 직접 수집하지 않습니다. JSON, RSS, Atom, 공식 API, 승인 파트너 feed endpoint로 교체합니다."
    };
  }

  return {
    ...base,
    host,
    status: "passed",
    reason: isApprovedExtraHost ? "approved_external_feed_host" : "official_catalog_host_feed",
    matchedSources,
    action: "refresh:news, verify:news, refresh:all 순서로 feed payload와 사용자 노출 조건을 검증합니다."
  };
}

function buildMarkdown(report) {
  const rows = report.rows.length
    ? report.rows.map((row) => `| ${row.envKey} | ${row.configuredValue} | ${row.host} | ${row.status} | ${row.reason} | ${row.action} |`)
    : ["| - | - | - | passed | no_configured_feed_urls | 공식 feed가 설정되기 전에는 seed fallback으로 운영합니다. |"];
  const regressionRows = report.policyRegressionSamples.map(
    (sample) =>
      `| ${sample.label} | ${sample.expectedStatus} | ${sample.expectedReason} | ${sample.actualStatus} | ${sample.actualReason} | ${sample.passed ? "pass" : "fail"} |`
  );
  const activationRows = report.activationReadiness.recommendedFirstLanes.length
    ? report.activationReadiness.recommendedFirstLanes.map(
        (lane) =>
          `| ${lane.label} | ${lane.envKeys.join("<br>")} | ${lane.candidateCount} | ${lane.reachableCount} | ${lane.guardedCount} | ${lane.firstAction} |`
      )
    : ["| - | - | 0 | 0 | 0 | `npm run source:starter:pack`으로 starter pack을 먼저 생성합니다. |"];
  const candidateRows = report.activationReadiness.recommendedFirstLanes
    .flatMap((lane) =>
      lane.firstCandidates.map(
        (candidate) =>
          `| ${lane.label} | ${candidate.label} | ${candidate.liveStatus} | ${candidate.recommendedEnvKeys.join("<br>")} | ${candidate.officialUrl} |`
      )
    )
    .slice(0, 24);

  return [
    "# 공식 feed 환경변수 안전성 리포트",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 검사한 env key: ${report.checkedKeys.join(", ")}`,
    `- 설정된 feed URL: ${report.configuredUrlCount}개`,
    `- 통과: ${report.passedCount}개`,
    `- 실패: ${report.failedCount}개`,
    `- 승인 추가 host: ${report.approvedExtraHosts.length ? report.approvedExtraHosts.join(", ") : "없음"}`,
    "",
    "## 운영 원칙",
    "",
    "- 공식 API, RSS, Atom, 승인된 JSON/파트너 feed만 연결합니다.",
    "- 검색 결과, 커뮤니티 원문, 블로그, 쇼핑몰 메인 또는 HTML 이벤트 페이지 직접 수집은 금지합니다.",
    "- 승인된 외부 feed host는 `HALINDOSA_APPROVED_FEED_HOSTS`에 host만 기록하고, 토큰·query 값은 리포트에 남기지 않습니다.",
    "- 무료혜택 전용 feed는 `BENEFIT_REFRESH_FEED_URLS`에 연결하고, 별도 승인 host는 `BENEFIT_REFRESH_APPROVED_HOSTS`에 host만 기록합니다.",
    `- 현재 활성화 상태: ${report.activationReadiness.status}`,
    "",
    "## 검사 결과",
    "",
    "| Env key | URL(민감 query 제거) | Host | 상태 | 사유 | 다음 작업 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## 다음 Feed 활성화 큐",
    "",
    "| Lane | 우선 Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...activationRows,
    "",
    "## 우선 검토 후보",
    "",
    "| Lane | 공식 소스 후보 | Live 상태 | 추천 Env | 공식 기준 URL |",
    "| --- | --- | --- | --- | --- |",
    ...(candidateRows.length ? candidateRows : ["| - | - | - | - | - |"]),
    "",
    "## 운영자 체크리스트",
    "",
    ...report.activationReadiness.operatorChecklist.map((item) => `- ${item}`),
    "",
    "## 정책 회귀 샘플",
    "",
    "| 샘플 | 기대 상태 | 기대 사유 | 실제 상태 | 실제 사유 | 결과 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...regressionRows,
    "",
    "## 재검증",
    "",
    "```bash",
    "npm run source:feed-env:doctor",
    "npm run refresh:news",
    "npm run verify:news",
    "npm run refresh:all",
    "```",
    ""
  ].join("\n");
}

const catalogHostMap = getCatalogHostMap();
const approvedExtraHosts = getApprovedExtraHosts();
const allowDataUrls = String(getEnvValue("HALINDOSA_ALLOW_DATA_FEED_URLS")).toLowerCase() === "true";
const rows = [];

for (const key of feedKeys) {
  const urls = parseFeedUrlList(getEnvValue(key));
  for (const url of urls) {
    rows.push(classifyUrl(key, url, catalogHostMap, approvedExtraHosts, allowDataUrls));
  }
}

const policyRegressionSamples = [
  {
    label: "official_machine_feed_allowed",
    url: "https://www.ssg.com/api/events.json",
    expectedStatus: "passed"
  },
  {
    label: "search_url_blocked",
    url: "https://www.ssg.com/search.ssg?query=coupon",
    expectedReason: "search_or_result_url"
  },
  {
    label: "community_host_blocked",
    url: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=1",
    expectedReason: "community_or_blog_host"
  },
  {
    label: "official_html_page_blocked",
    url: "https://www.ssg.com/event/eventMain.ssg",
    expectedReason: "not_machine_readable_feed"
  },
  {
    label: "unlisted_host_blocked",
    url: "https://example.com/feed.json",
    expectedReason: "unlisted_feed_host"
  },
  {
    label: "unsafe_protocol_blocked",
    url: "file:///tmp/feed.json",
    expectedReason: "unsafe_protocol"
  },
  {
    label: "private_host_blocked",
    url: "https://127.0.0.1/feed.json",
    expectedReason: "private_or_metadata_host"
  }
].map((sample) => {
  const result = classifyUrl("OFFICIAL_EVENT_FEED_URLS", sample.url, catalogHostMap, new Set(), false);
  const passed =
    sample.expectedStatus ? result.status === sample.expectedStatus : result.status === "failed" && result.reason === sample.expectedReason;
  return {
    label: sample.label,
    expectedStatus: sample.expectedStatus ?? "failed",
    expectedReason: sample.expectedReason ?? result.reason,
    actualStatus: result.status,
    actualReason: result.reason,
    passed
  };
});

const failedRows = rows.filter((row) => row.status !== "passed");
const failedRegressionSamples = policyRegressionSamples.filter((sample) => !sample.passed);
const activationReadiness = buildActivationReadiness(rows.length);
const report = {
  ok: failedRows.length === 0 && failedRegressionSamples.length === 0,
  generatedAt: new Date().toISOString(),
  checkedKeys: feedKeys,
  configuredUrlCount: rows.length,
  configuredKeyCount: feedKeys.filter((key) => parseFeedUrlList(getEnvValue(key)).length > 0).length,
  passedCount: rows.length - failedRows.length,
  failedCount: failedRows.length,
  allowedCatalogHosts: [...catalogHostMap.keys()].sort(),
  approvedExtraHosts: [...approvedExtraHosts].sort(),
  activationReadiness,
  policy: {
    httpsOnly: true,
    machineReadableFeedRequired: true,
    officialCatalogHostOrApprovedPartnerHostRequired: true,
    blockedCommunityAndBlogHosts: communityHostPatterns,
    blockedSearchUrlPatterns: searchPathPatterns.map((pattern) => pattern.source),
    blockedPrivateHostPatterns: privateHostPatterns.map((pattern) => pattern.source)
  },
  policyRegressionSamples,
  rows
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildMarkdown(report), "utf8");

if (!report.ok) {
  console.error("Official source feed env doctor failed:");
  for (const row of failedRows) {
    console.error(`- ${row.envKey}: ${row.configuredValue} (${row.reason})`);
  }
  for (const sample of failedRegressionSamples) {
    console.error(`- policy regression ${sample.label}: expected ${sample.expectedReason}, got ${sample.actualReason}`);
  }
  process.exit(1);
}

console.log("Official source feed env doctor passed.");
console.log(`- checked keys: ${feedKeys.length}`);
console.log(`- configured feed URLs: ${report.configuredUrlCount}`);
console.log("- reports/source-feed-env-readiness.json");
console.log("- docs/SOURCE_FEED_ENV_REPORT.md");
