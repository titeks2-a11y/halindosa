import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = join(root, "data", "officialSourceCatalog.json");
const policyPath = join(root, "data", "linkQualityPolicy.json");
const reportPath = join(reportsDir, "official-benefit-discovery.json");
const docsPath = join(docsDir, "OFFICIAL_BENEFIT_DISCOVERY_REPORT.md");
const timeoutMs = Number(process.env.OFFICIAL_DISCOVERY_TIMEOUT_MS ?? 5500);
const sourceLimit = Number(process.env.OFFICIAL_DISCOVERY_SOURCE_LIMIT ?? 36);
const maxCandidatesPerSource = Number(process.env.OFFICIAL_DISCOVERY_CANDIDATES_PER_SOURCE ?? 5);

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeHost(value) {
  try {
    const input = String(value ?? "").trim();
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function sourceText(source) {
  return [
    source.id,
    source.label,
    source.provider,
    ...(Array.isArray(source.category) ? source.category : []),
    source.sourceType,
    source.officialUrl,
    source.allowedUse,
    source.blockedUse,
    source.notes
  ]
    .filter(Boolean)
    .join(" ");
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&middot;/g, "·")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function cleanText(value, maxLength = 120) {
  return decodeHtml(value)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function hostMatchesSource(source, candidateUrl) {
  const sourceHost = normalizeHost(source.officialUrl);
  const candidateHost = normalizeHost(candidateUrl);
  const allowedHosts = Array.isArray(source.allowedFinalHosts) ? source.allowedFinalHosts.map(normalizeHost).filter(Boolean) : [];
  return (
    candidateHost &&
    sourceHost &&
    (candidateHost === sourceHost ||
      candidateHost.endsWith(`.${sourceHost}`) ||
      sourceHost.endsWith(`.${candidateHost}`) ||
      allowedHosts.some((host) => candidateHost === host || candidateHost.endsWith(`.${host}`)))
  );
}

function isHomeOnlyUrl(value, homePaths) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return new Set(homePaths.map((item) => String(item).toLowerCase())).has(path);
  } catch {
    return true;
  }
}

function isBlockedHost(value, blockedHosts) {
  const host = normalizeHost(value);
  return blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function isSearchUrl(value, searchPatterns) {
  try {
    const url = new URL(value);
    const haystack = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
    return searchPatterns.some((pattern) => haystack.includes(String(pattern).toLowerCase()));
  } catch {
    return true;
  }
}

function normalizeComparableUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname}${url.search}`.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function hasBenefitSignal(url, label, signals, evidenceSignals) {
  const urlText = String(url ?? "").toLowerCase();
  const labelText = String(label ?? "").toLowerCase();
  const urlHasSignal = signals.some((signal) => urlText.includes(String(signal).toLowerCase()));
  const labelHasSignal = evidenceSignals.some((signal) => labelText.includes(String(signal).toLowerCase()));
  const urlLooksLikeBenefitSection = /event|coupon|benefit|promotion|campaign|membership|point|reward|sample|experience|roulette|checkin/i.test(urlText);
  return urlHasSignal || (labelHasSignal && urlLooksLikeBenefitSection);
}

function isNavigationOrAccountLink(url, label) {
  const urlText = String(url ?? "").toLowerCase();
  const labelText = String(label ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!labelText || /^(x|top|kr|en|닫기|확인|close|ok|more|더보기|카테고리|소개)$/.test(labelText)) return true;
  if (
    /본문|바로가기|메뉴|로그인|회원가입|고객센터|회사소개|사업자정보|개인정보|이용약관|사이트맵|패밀리사이트|브랜드소개|그룹계열사|공지사항|매장찾기|인스타그램|페이스북|유튜브|닫기|소개|서비스|상담|문의|칭찬|종료된|종료 이벤트|language|다국어|나의 포인트|상품권 안내/.test(
      labelText
    )
  ) {
    return true;
  }
  if (/�/.test(labelText)) return true;
  if (/\/my\/|my-one|mypage|myreview|login|signin|auth|customer|cscenter|notice|faq|privacy|terms|business|company|store-locator|brand-story/.test(urlText)) return true;
  if (/guide\.do|\/guide\//.test(urlText) && !/event|coupon|benefit|promotion|campaign|gift/.test(urlText)) return true;
  if (/\/presentation\/|membership-services\/(?!.*event)|\/event\/old/.test(urlText)) return true;
  if (/point-(donation|gift|exchange)|포인트(기부|선물|전환)/.test(urlText) || /포인트 (기부|선물|전환)/.test(labelText)) return true;
  if (/theme-product-list|product-list|goods-list|category|categories|display|product\/list|collections/.test(urlText) && !/event|coupon|benefit|promotion|campaign/.test(urlText)) return true;
  return false;
}

function extractAnchorCandidates(html, baseUrl) {
  const candidates = [];
  const anchorPattern = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = anchorPattern.exec(html);

  while (match) {
    const href = decodeHtml(match[1]).trim();
    const label = cleanText(match[2], 100);
    try {
      const url = new URL(href, baseUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        candidates.push({
          url: url.toString(),
          label
        });
      }
    } catch {
      // Ignore malformed links from official pages.
    }
    match = anchorPattern.exec(html);
  }

  return candidates;
}

async function fetchSourceHtml(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(source.officialUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "HalindosaOfficialBenefitDiscovery/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    let body = "";
    if (response.ok && /html|xml|text/i.test(contentType)) {
      const charset = /charset=([^;\s]+)/i.exec(contentType)?.[1]?.toLowerCase() ?? "utf-8";
      const buffer = await response.arrayBuffer();
      const encoding = /euc-kr|ks_c_5601|cp949/i.test(charset) ? "euc-kr" : "utf-8";
      body = new TextDecoder(encoding).decode(buffer);
    }
    return {
      ok: response.ok,
      httpStatus: response.status,
      finalUrl: response.url,
      durationMs: Date.now() - startedAt,
      contentType,
      body
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: 0,
      finalUrl: source.officialUrl,
      durationMs: Date.now() - startedAt,
      contentType: "",
      body: "",
      error: error?.name === "AbortError" ? "timeout" : error?.message ?? "fetch_error"
    };
  } finally {
    clearTimeout(timeout);
  }
}

const catalog = readJson(catalogPath, []);
const policy = readJson(policyPath, {});
const blockedHosts = [...(policy.blockedHosts ?? []), ...(policy.placeholderHosts ?? [])];
const homePaths = policy.homePaths ?? ["", "/", "/main", "/index"];
const searchPatterns = policy.searchPatterns ?? [];
const benefitSignals = policy.officialBenefitUrlSignals ?? [];
const evidenceSignals = policy.officialBenefitEvidenceSignals ?? [];
const consumerPattern = /무료혜택|쿠폰|샘플|체험|전원|선착순|포인트|카페|프랜차이즈|편의점|뷰티|식품|생활|외식|배달|오픈마켓|쇼핑몰|멤버십/i;
const publicPattern = /정부|공공|서울시|복지|교육|고용|문화가\s*있는\s*날|공공기관/i;

const selectedSources = (Array.isArray(catalog) ? catalog : [])
  .filter((source) => source?.officialUrl && source.priority !== "low")
  .filter((source) => consumerPattern.test(sourceText(source)) && !publicPattern.test(sourceText(source)))
  .sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return (priority[a.priority] ?? 9) - (priority[b.priority] ?? 9) || String(a.id).localeCompare(String(b.id));
  })
  .slice(0, sourceLimit);

const sources = [];
const candidateMap = new Map();

for (const source of selectedSources) {
  const fetchResult = await fetchSourceHtml(source);
  const sourceCandidates = [];

  if (fetchResult.ok && fetchResult.body) {
    for (const candidate of extractAnchorCandidates(fetchResult.body, fetchResult.finalUrl)) {
      const url = candidate.url.split("#")[0];
      if (!url || candidateMap.has(url)) continue;
      if (normalizeComparableUrl(url) === normalizeComparableUrl(source.officialUrl)) continue;
      if (!hostMatchesSource(source, url)) continue;
      if (isBlockedHost(url, blockedHosts)) continue;
      if (isHomeOnlyUrl(url, homePaths)) continue;
      if (isSearchUrl(url, searchPatterns)) continue;
      if (isNavigationOrAccountLink(url, candidate.label)) continue;
      if (!hasBenefitSignal(url, candidate.label, benefitSignals, evidenceSignals)) continue;

      const item = {
        sourceId: source.id,
        sourceLabel: source.label,
        sourceUrl: source.officialUrl,
        provider: source.provider,
        category: source.category,
        priority: source.priority,
        candidateUrl: url,
        candidateLabel: candidate.label || source.label,
        host: normalizeHost(url),
        reason: "same_host_official_benefit_signal",
        nextAction: "운영자가 종료일, 혜택 조건, 공식 CTA를 확인한 뒤 승인 JSON/RSS feed 또는 seed로 승격"
      };
      candidateMap.set(url, item);
      sourceCandidates.push(item);
      if (sourceCandidates.length >= maxCandidatesPerSource) break;
    }
  }

  sources.push({
    id: source.id,
    label: source.label,
    officialUrl: source.officialUrl,
    priority: source.priority,
    httpStatus: fetchResult.httpStatus,
    finalUrl: fetchResult.finalUrl,
    ok: fetchResult.ok,
    error: fetchResult.error ?? "",
    durationMs: fetchResult.durationMs,
    candidates: sourceCandidates.length
  });
}

const candidates = [...candidateMap.values()];
const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  mode: "advisory_discovery_only",
  sourceLimit,
  scannedSources: selectedSources.length,
  reachableSources: sources.filter((source) => source.ok).length,
  candidateCount: candidates.length,
  distinctHosts: new Set(candidates.map((candidate) => candidate.host)).size,
  guardrails: [
    "사용자 CTA에 바로 노출하지 않고 운영자 승인 후보로만 저장",
    "검색 결과, 대표 홈, 커뮤니티, 다른 도메인 링크 제외",
    "공식 URL의 anchor 중 event/coupon/benefit/promotion/sample 신호가 있는 링크만 후보화"
  ],
  sources,
  candidates
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const topCandidates = candidates.slice(0, 30);
writeFileSync(
  docsPath,
  [
    "# 공식 무료혜택 페이지 발견 리포트",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 스캔한 공식 소비자 소스: ${report.scannedSources}개`,
    `- 접근 가능 소스: ${report.reachableSources}개`,
    `- 발견 후보: ${report.candidateCount}개`,
    `- 후보 도메인: ${report.distinctHosts}개`,
    "",
    "## 운영 원칙",
    "",
    "- 이 리포트는 자동 노출이 아니라 운영자 승인 후보입니다.",
    "- 검색 결과, 대표 홈, 커뮤니티, 다른 도메인 링크는 후보에서 제외합니다.",
    "- 후보는 종료일, 혜택 조건, 공식 CTA를 확인한 뒤 승인 feed 또는 seed로 승격합니다.",
    "",
    "## 상위 후보",
    "",
    "| 출처 | 후보 | 도메인 | 다음 액션 |",
    "| --- | --- | --- | --- |",
    ...topCandidates.map(
      (candidate) =>
        `| ${candidate.sourceLabel} | [${candidate.candidateLabel || candidate.sourceLabel}](${candidate.candidateUrl}) | ${candidate.host} | ${candidate.nextAction} |`
    ),
    "",
    "## 소스별 결과",
    "",
    "| 소스 | 상태 | 후보 | URL |",
    "| --- | --- | ---: | --- |",
    ...sources.map(
      (source) =>
        `| ${source.label} | ${source.ok ? "reachable" : source.error || source.httpStatus} | ${source.candidates} | ${source.officialUrl} |`
    ),
    ""
  ].join("\n"),
  "utf8"
);

console.log("Official benefit discovery completed.");
console.log(`- scannedSources: ${report.scannedSources}`);
console.log(`- reachableSources: ${report.reachableSources}`);
console.log(`- candidateCount: ${report.candidateCount}`);
console.log("- reports/official-benefit-discovery.json");
console.log("- docs/OFFICIAL_BENEFIT_DISCOVERY_REPORT.md");
