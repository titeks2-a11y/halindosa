import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = "data/officialSourceCatalog.json";
const jsonPath = "reports/official-source-live-check.json";
const csvPath = "reports/official-source-live-check.csv";
const docsPath = "docs/OFFICIAL_SOURCE_LIVE_CHECK.md";
const timeoutMs = Number(process.env.SOURCE_LIVE_TIMEOUT_MS ?? 4500);
const maxConcurrent = Number(process.env.SOURCE_LIVE_CONCURRENCY ?? 6);

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
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
    "id",
    "label",
    "provider",
    "category",
    "priority",
    "officialUrl",
    "finalUrl",
    "host",
    "status",
    "httpStatus",
    "method",
    "redirected",
    "reason",
    "operatorAction",
    "checkedAt",
    "durationMs"
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function getHost(value) {
  try {
    const input = String(value ?? "").trim();
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function hostMatchesExpected(source, finalUrl) {
  const expected = getHost(source.officialUrl);
  const actual = getHost(finalUrl);
  if (!expected || !actual) return false;
  const allowedHosts = Array.isArray(source.allowedFinalHosts) ? source.allowedFinalHosts.map(getHost).filter(Boolean) : [];
  return (
    actual === expected ||
    actual.endsWith(`.${expected}`) ||
    expected.endsWith(`.${actual}`) ||
    allowedHosts.some((host) => actual === host || actual.endsWith(`.${host}`))
  );
}

function isLoginOrPermissionRedirect(finalUrl) {
  try {
    const url = new URL(finalUrl);
    const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
    return ["login", "nidlogin", "signin", "auth", "member"].some((pattern) => value.includes(pattern));
  } catch {
    return false;
  }
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

async function probeUrl(url, method) {
  const startedAt = Date.now();
  const { controller, timeout } = withTimeout(timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "HalindosaSourceReadiness/1.0 (+https://halindosa.app)",
        accept: method === "HEAD" ? "*/*" : "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
      }
    });
    clearTimeout(timeout);
    return {
      ok: true,
      method,
      httpStatus: response.status,
      finalUrl: response.url,
      redirected: response.redirected,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      method,
      httpStatus: 0,
      finalUrl: url,
      redirected: false,
      durationMs: Date.now() - startedAt,
      error: error?.name === "AbortError" ? "timeout" : error?.message ?? "fetch_error"
    };
  }
}

function classify(source, result) {
  if (!result.ok) {
    const timeout = result.error === "timeout";
    return {
      status: timeout ? "timeout" : "network_error",
      reason: timeout ? "timeout" : "network_error",
      operatorAction: "공식 feed 연결 전 브라우저/제휴 담당자 확인 필요"
    };
  }

  const httpStatus = Number(result.httpStatus ?? 0);
  const domainOk = hostMatchesExpected(source, result.finalUrl);

  if (httpStatus >= 200 && httpStatus < 400 && isLoginOrPermissionRedirect(result.finalUrl)) {
    return {
      status: "guarded",
      reason: "login_or_permission_redirect",
      operatorAction: "로그인/권한 페이지를 수집하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용"
    };
  }

  if (httpStatus >= 200 && httpStatus < 400 && domainOk) {
    return {
      status: "reachable",
      reason: result.redirected ? "official_url_redirected_to_same_host" : "official_url_reachable",
      operatorAction: "승인 feed 후보로 유지하고 refresh:news 또는 수동 매핑에 연결"
    };
  }

  if (httpStatus >= 200 && httpStatus < 400 && !domainOk) {
    return {
      status: "needs_review",
      reason: "redirected_to_different_host",
      operatorAction: "최종 도메인이 공식 운영 도메인인지 확인 후 allowlist에 반영"
    };
  }

  if ([401, 403, 429, 451].includes(httpStatus)) {
    return {
      status: "guarded",
      reason: httpStatus === 429 ? "rate_limited" : "waf_or_permission_guarded",
      operatorAction: "무단 크롤링하지 말고 공식 API/RSS/제휴 feed 또는 수동 승인 매핑 사용"
    };
  }

  if ([404, 410].includes(httpStatus)) {
    return {
      status: "stale_or_removed",
      reason: httpStatus === 410 ? "gone" : "not_found",
      operatorAction: "카탈로그 URL을 최신 공식 이벤트/혜택 URL로 교체"
    };
  }

  if (httpStatus >= 500) {
    return {
      status: "server_error",
      reason: "source_server_error",
      operatorAction: "일시 장애 여부를 재확인하고 노출 데이터는 기존 검증 feed만 유지"
    };
  }

  return {
    status: "needs_review",
    reason: `unexpected_http_${httpStatus}`,
    operatorAction: "공식 URL 정책과 응답 상태를 운영자가 확인"
  };
}

async function probeSource(source) {
  const checkedAt = new Date().toISOString();
  let result = await probeUrl(source.officialUrl, "HEAD");
  if (!result.ok || [405, 403, 406, 429, 501].includes(Number(result.httpStatus ?? 0))) {
    result = await probeUrl(source.officialUrl, "GET");
  }
  const classification = classify(source, result);

  return {
    id: source.id,
    label: source.label,
    provider: source.provider,
    category: source.category,
    priority: source.priority,
    officialUrl: source.officialUrl,
    finalUrl: result.finalUrl,
    host: getHost(result.finalUrl),
    method: result.method,
    httpStatus: result.httpStatus,
    redirected: result.redirected,
    durationMs: result.durationMs,
    checkedAt,
    ...classification
  };
}

async function mapConcurrent(items, mapper, concurrency) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

const catalog = readJson(catalogPath, []);

if (!Array.isArray(catalog) || !catalog.length) {
  console.error("Official source catalog is missing or empty.");
  process.exit(1);
}

const rows = await mapConcurrent(catalog, probeSource, maxConcurrent);
const statusCounts = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] ?? 0) + 1;
  return acc;
}, {});
const highPriorityRows = rows.filter((row) => row.priority === "high");
const highPriorityReachable = highPriorityRows.filter((row) => ["reachable", "guarded", "needs_review"].includes(row.status)).length;
const blockingStatuses = ["stale_or_removed"];
const staleOrRemoved = rows.filter((row) => blockingStatuses.includes(row.status));
const generatedAt = new Date().toISOString();

const report = {
  ok: true,
  mode: "non_strict_live_readiness",
  generatedAt,
  timeoutMs,
  maxConcurrent,
  totalSources: rows.length,
  reachableCount: statusCounts.reachable ?? 0,
  guardedCount: statusCounts.guarded ?? 0,
  needsReviewCount: statusCounts.needs_review ?? 0,
  timeoutCount: statusCounts.timeout ?? 0,
  networkErrorCount: statusCounts.network_error ?? 0,
  staleOrRemovedCount: staleOrRemoved.length,
  highPrioritySources: highPriorityRows.length,
  highPriorityReachableOrGuarded: highPriorityReachable,
  statusCounts,
  launchPolicy:
    "This doctor records live accessibility for official source onboarding. It must not scrape protected pages and does not change user-visible deals. Only verified product/official benefit URLs remain exposed.",
  operatorActions: [
    "reachable 소스는 승인 JSON/RSS feed 또는 수동 공식 페이지 매핑 후보로 유지합니다.",
    "guarded 소스는 브라우저 자동 수집 대신 공식 API, RSS, 제휴 feed, 담당자 승인 데이터로 연결합니다.",
    "stale_or_removed 소스는 카탈로그 URL을 교체하기 전까지 신규 혜택 source로 사용하지 않습니다."
  ],
  sources: rows
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, jsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(root, csvPath), `\uFEFF${buildCsv(rows)}\n`, "utf8");

const docsLines = [
  "# 공식 소스 라이브 접근성 점검",
  "",
  "이 문서는 공식 이벤트/혜택 소스 후보의 현재 접근 상태를 non-strict 방식으로 기록합니다. 무단 크롤링을 수행하지 않으며, 보호된 페이지는 공식 API/RSS/제휴 feed 또는 수동 승인 데이터로 연결해야 합니다.",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- 모드: ${report.mode}`,
  `- 후보 소스: ${report.totalSources}개`,
  `- 접근 가능: ${report.reachableCount}개`,
  `- 보호/권한 확인 필요: ${report.guardedCount}개`,
  `- 검토 필요: ${report.needsReviewCount}개`,
  `- timeout/network error: ${report.timeoutCount + report.networkErrorCount}개`,
  `- 404/410 교체 필요: ${report.staleOrRemovedCount}개`,
  `- CSV 리포트: ${csvPath}`,
  "",
  "## 운영 원칙",
  "",
  "- 이 리포트는 사용자 노출 데이터를 자동으로 바꾸지 않습니다.",
  "- 검색 결과, 커뮤니티 원문, 종료 이벤트, 보호 페이지 크롤링 결과는 상품/혜택 카드로 노출하지 않습니다.",
  "- protected/guarded 소스는 무리하게 수집하지 않고 공식 feed 또는 제휴 담당자 제공 데이터로 연결합니다.",
  "",
  "## 상태별 요약",
  "",
  "| 상태 | 수 | 운영 액션 |",
  "| --- | ---: | --- |",
  `| reachable | ${report.reachableCount} | 승인 feed 또는 공식 페이지 매핑 후보로 유지 |`,
  `| guarded | ${report.guardedCount} | 공식 API/RSS/제휴 feed 확인 |`,
  `| needs_review | ${report.needsReviewCount} | 최종 도메인과 응답 정책 수동 확인 |`,
  `| timeout/network_error | ${report.timeoutCount + report.networkErrorCount} | 재시도 또는 담당자 확인 |`,
  `| stale_or_removed | ${report.staleOrRemovedCount} | 카탈로그 URL 교체 전 사용 금지 |`,
  "",
  "## 소스별 결과",
  "",
  "| ID | Provider | 우선순위 | 상태 | HTTP | 최종 호스트 | 운영 액션 |",
  "| --- | --- | --- | --- | ---: | --- | --- |",
  ...rows.map((row) => `| ${row.id} | ${row.provider} | ${row.priority} | ${row.status} | ${row.httpStatus} | ${row.host} | ${row.operatorAction} |`),
  "",
  "## 다음 작업",
  "",
  ...report.operatorActions.map((action) => `- ${action}`),
  ""
];
writeFileSync(join(root, docsPath), `${docsLines.join("\n")}\n`, "utf8");

console.log("Official source live check written.");
console.log(`- ${jsonPath}`);
console.log(`- ${csvPath}`);
console.log(`- ${docsPath}`);
console.log(`- reachable: ${report.reachableCount}/${report.totalSources}`);
console.log(`- guarded: ${report.guardedCount}`);
console.log(`- stale_or_removed: ${report.staleOrRemovedCount}`);
