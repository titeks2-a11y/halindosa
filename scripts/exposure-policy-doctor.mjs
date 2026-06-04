import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

function readJson(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function readText(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = String(item[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function hostMatches(host, candidate) {
  return host === candidate || host.endsWith(`.${candidate}`);
}

function isPolicyHost(host, candidates = []) {
  return candidates.some((candidate) => hostMatches(host, String(candidate).replace(/^www\./, "").toLowerCase()));
}

function parseHttpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function isHomeOnlyUrl(url) {
  const normalizedPath = url.pathname.replace(/\/+$/, "").toLowerCase();
  return ["", "/", "/main", "/index"].includes(normalizedPath);
}

function isSearchLikeUrl(url, policy) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  const productSignals = policy?.productDetailSignals ?? [];
  const officialSignals = policy?.officialBenefitUrlSignals ?? [];

  if (productSignals.some((pattern) => new RegExp(pattern, "i").test(value))) return false;
  if (officialSignals.some((signal) => `${url.pathname}${url.search}${url.hash}`.toLowerCase().includes(String(signal).toLowerCase()))) return false;

  return (policy?.searchPatterns ?? []).some((pattern) => value.includes(String(pattern).toLowerCase()));
}

function getSyntheticExposureDecision(item, policy) {
  const issues = [];
  const finalUrl = String(item.finalUrl ?? "").trim();

  if (item.isHidden === true) issues.push("manual_hidden");
  if (item.availability !== "active") issues.push(`availability_${item.availability ?? "missing"}`);
  if (item.validationStatus !== "passed") issues.push(`validation_${item.validationStatus ?? "missing"}`);
  if (item.linkStatus !== "verified") issues.push(`link_status_${item.linkStatus ?? "missing"}`);
  if (["seller_search", "search", "unavailable"].includes(item.linkType)) issues.push(`link_type_${item.linkType ?? "missing"}`);
  if (!finalUrl) issues.push("missing_final_url");

  if (finalUrl) {
    const parsedUrl = parseHttpUrl(finalUrl);
    if (!parsedUrl) {
      issues.push("unsafe_protocol_or_invalid_url");
    } else {
      const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
      if (isPolicyHost(host, [...(policy?.blockedHosts ?? []), ...(policy?.placeholderHosts ?? [])])) issues.push("blocked_or_community_host");
      if (isHomeOnlyUrl(parsedUrl)) issues.push("home_or_landing_url");
      if (isSearchLikeUrl(parsedUrl, policy)) issues.push("search_or_category_url");
    }
  }

  return {
    canExpose: issues.length === 0,
    issues
  };
}

function buildSyntheticExposureScenarios(policy) {
  const base = {
    id: "synthetic-active-direct",
    title: "정상 직접 구매 링크 샘플",
    linkStatus: "verified",
    linkType: "direct_purchase",
    availability: "active",
    validationStatus: "passed",
    isHidden: false,
    finalUrl: "https://www.coupang.com/vp/products/130180913?itemId=383114455&vendorItemId=3930090438",
    expectedCanExpose: true
  };
  const scenarios = [
    base,
    {
      ...base,
      id: "synthetic-official-benefit",
      title: "정상 공식 혜택 링크 샘플",
      linkType: "affiliate",
      finalUrl: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
      expectedCanExpose: true
    },
    {
      ...base,
      id: "synthetic-search-url",
      title: "검색 URL 차단 샘플",
      finalUrl: "https://www.coupang.com/np/search?q=%EC%9A%B0%EC%9C%A0",
      expectedCanExpose: false,
      expectedIssue: "search_or_category_url"
    },
    {
      ...base,
      id: "synthetic-search-type",
      title: "검색 linkType 차단 샘플",
      linkType: "search",
      expectedCanExpose: false,
      expectedIssue: "link_type_search"
    },
    {
      ...base,
      id: "synthetic-sold-out",
      title: "품절 상품 차단 샘플",
      availability: "sold_out",
      expectedCanExpose: false,
      expectedIssue: "availability_sold_out"
    },
    {
      ...base,
      id: "synthetic-failed-validation",
      title: "검증 실패 차단 샘플",
      validationStatus: "failed",
      expectedCanExpose: false,
      expectedIssue: "validation_failed"
    },
    {
      ...base,
      id: "synthetic-hidden",
      title: "운영 숨김 차단 샘플",
      isHidden: true,
      expectedCanExpose: false,
      expectedIssue: "manual_hidden"
    },
    {
      ...base,
      id: "synthetic-unsafe-url",
      title: "위험 프로토콜 차단 샘플",
      finalUrl: "javascript:alert(1)",
      expectedCanExpose: false,
      expectedIssue: "unsafe_protocol_or_invalid_url"
    },
    {
      ...base,
      id: "synthetic-home-url",
      title: "대표몰 홈 차단 샘플",
      finalUrl: "https://www.gmarket.co.kr/",
      expectedCanExpose: false,
      expectedIssue: "home_or_landing_url"
    },
    {
      ...base,
      id: "synthetic-community-url",
      title: "커뮤니티 원문 차단 샘플",
      finalUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
      expectedCanExpose: false,
      expectedIssue: "blocked_or_community_host"
    },
    {
      ...base,
      id: "synthetic-missing-final-url",
      title: "최종 URL 누락 차단 샘플",
      finalUrl: "",
      expectedCanExpose: false,
      expectedIssue: "missing_final_url"
    }
  ];
  const results = scenarios.map((scenario) => {
    const decision = getSyntheticExposureDecision(scenario, policy);
    const issueOk = scenario.expectedIssue ? decision.issues.includes(scenario.expectedIssue) : true;

    return {
      id: scenario.id,
      title: scenario.title,
      expectedCanExpose: scenario.expectedCanExpose,
      actualCanExpose: decision.canExpose,
      expectedIssue: scenario.expectedIssue ?? "",
      issues: decision.issues,
      ok: decision.canExpose === scenario.expectedCanExpose && issueOk
    };
  });

  return {
    ok: results.every((item) => item.ok),
    total: results.length,
    passed: results.filter((item) => item.ok).length,
    exposedPositiveSamples: results.filter((item) => item.expectedCanExpose && item.actualCanExpose).length,
    blockedNegativeSamples: results.filter((item) => !item.expectedCanExpose && !item.actualCanExpose).length,
    results
  };
}

const linkReport = readJson("reports/link-validation.json");
const productReport = readJson("reports/product-quality.json");
const refreshAllReport = readJson("reports/refresh-all.json");
const policy = readJson("data/linkQualityPolicy.json");
const dealApiRoute = readText("app/api/deals/route.ts");
const dealRepository = readText("lib/deals/dealRepository.ts");
const qualityRules = readText("lib/deals/quality.ts");
const goRoute = readText("app/go/[id]/route.ts");
const redirectRoute = readText("app/api/redirect/[id]/route.ts");

const auditedItems = Array.isArray(linkReport?.auditedItems) ? linkReport.auditedItems : [];
const exposedItems = auditedItems.filter((item) => !item.isHidden);
const badExposedItems = exposedItems.filter(
  (item) =>
    item.availability !== "active" ||
    item.validationStatus !== "passed" ||
    item.linkType === "search" ||
    item.linkType === "seller_search" ||
    item.linkType === "unavailable" ||
    !item.finalUrl
);
const hiddenItems = auditedItems.filter((item) => item.isHidden);
const syntheticExposureScenarios = buildSyntheticExposureScenarios(policy);
const issues = [];
const liveProbeFailureReasonCounts = (linkReport?.liveProbe?.failures ?? []).reduce((acc, failure) => {
  const reason = String(failure.reason ?? "unknown");
  acc[reason] = (acc[reason] ?? 0) + 1;
  return acc;
}, {});
const liveProbeReviewSummary = linkReport?.liveProbeReviewSummary ?? {
  status: linkReport?.liveProbe?.enabled ? "legacy_live_probe_report" : "disabled",
  hardFailureCount: 0,
  transientNetworkCount: linkReport?.liveProbe?.timeout ?? 0,
  accessProtectedCount: linkReport?.liveProbe?.robotsBlocked ?? 0,
  sellerUnavailableSignals: linkReport?.liveProbe?.unavailableText ?? 0,
  interpretation: "Run npm run verify:links:live to refresh the live probe review summary."
};
const liveProbeReasonCounts = linkReport?.liveProbeReasonCounts ?? liveProbeFailureReasonCounts;
const liveProbeHostFailureCounts = linkReport?.liveProbeHostFailureCounts ?? {};

if (!linkReport) issues.push("reports/link-validation.json is missing.");
if (!productReport) issues.push("reports/product-quality.json is missing.");
if (!refreshAllReport) issues.push("reports/refresh-all.json is missing.");
if (!policy) issues.push("data/linkQualityPolicy.json is missing.");
if (!auditedItems.length) issues.push("link-validation report should include auditedItems for product-level traceability.");
if (!syntheticExposureScenarios.ok) issues.push("synthetic exposure scenarios should block search, sold-out, hidden, unsafe, home, community, and missing-final-url samples.");

if ((linkReport?.exposedSearchLinks ?? 0) !== 0 || badExposedItems.some((item) => item.linkType === "search" || item.linkType === "seller_search")) {
  issues.push("search or seller-search links are exposed.");
}

if ((linkReport?.exposedSoldOutLinks ?? 0) !== 0 || badExposedItems.some((item) => item.availability === "sold_out")) {
  issues.push("sold-out or ended links are exposed.");
}

if ((linkReport?.failedCount ?? 0) !== 0 || (productReport?.failedProducts ?? 0) !== 0 || badExposedItems.length) {
  issues.push("failed link validation items are exposed or product quality failed.");
}

if (linkReport?.launchGate?.passed !== true) {
  issues.push("link-validation launch gate is not passed.");
}

if ((liveProbeReviewSummary.hardFailureCount ?? 0) > 0 || (liveProbeReviewSummary.sellerUnavailableSignals ?? 0) > 0) {
  issues.push("live probe hard failure or seller unavailable signals remain.");
}

if ((linkReport?.homeOrMainSuspected ?? 0) !== 0 || (linkReport?.communitySuspected ?? 0) !== 0) {
  issues.push("home/community links remain in product link report.");
}

if (policy?.exposurePolicy?.availability !== "active" || policy?.exposurePolicy?.validationStatus !== "passed" || policy?.exposurePolicy?.isHidden !== false) {
  issues.push("exposurePolicy must require availability=active, validationStatus=passed, and isHidden=false.");
}

if (!dealApiRoute.includes("verifiedOnly") || !dealApiRoute.includes("isPubliclyVisibleDeal")) {
  issues.push("/api/deals should default to verified-only visible data and use public visibility fallback filtering.");
}

if (!dealRepository.includes("deals.filter(isPubliclyVisibleDeal)") || !qualityRules.includes("export function isPubliclyVisibleDeal")) {
  issues.push("deal repository should filter public results through shared isPubliclyVisibleDeal policy.");
}

if (
  !qualityRules.includes("getDealExposureDecision") ||
  !qualityRules.includes("isPolicySearchLikeUrl") ||
  !qualityRules.includes("isPolicyHomeOnlyUrl") ||
  !qualityRules.includes("isPolicyBlockedHost") ||
  !qualityRules.includes("missing_final_url")
) {
  issues.push("shared quality rules should block unsafe final URLs, search/category URLs, home/landing URLs, and blocked hosts before public exposure.");
}

if (!goRoute.includes("canOpenDealLink") || !redirectRoute.includes("canOpenDealLink")) {
  issues.push("go/redirect routes should block unsafe links through canOpenDealLink.");
}

const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  summary: {
    auditedItems: auditedItems.length,
    exposedItems: exposedItems.length,
    hiddenItems: hiddenItems.length,
    badExposedItems: badExposedItems.length,
    searchLinksExposed: exposedItems.filter((item) => item.linkType === "search" || item.linkType === "seller_search").length,
    soldOutExposed: exposedItems.filter((item) => item.availability === "sold_out").length,
    failedExposed: exposedItems.filter((item) => item.validationStatus !== "passed").length,
    syntheticExposurePassed: syntheticExposureScenarios.passed,
    syntheticExposureTotal: syntheticExposureScenarios.total,
    averagePriorityScore: linkReport?.exposureAudit?.averagePriorityScore ?? 0
  },
  linkTypeCounts: countBy(auditedItems, "linkType"),
  availabilityCounts: countBy(auditedItems, "availability"),
  validationStatusCounts: countBy(auditedItems, "validationStatus"),
  exposurePolicy: policy?.exposurePolicy ?? null,
  launchGate: linkReport?.launchGate ?? null,
  liveProbe: linkReport?.liveProbe ?? {
    enabled: false,
    strict: false,
    bodyProbe: false,
    timeoutMs: 0,
    checked: 0,
    passed: 0,
    failed: 0,
    redirected: 0,
    finalUrlChanged: 0,
    http404: 0,
    http410: 0,
    http5xx: 0,
    timeout: 0,
    robotsBlocked: 0,
    unavailableText: 0,
    failures: []
  },
  liveProbeReviewSummary,
  liveProbeFailureReasonCounts: liveProbeReasonCounts,
  liveProbeHostFailureCounts,
  syntheticExposureScenarios,
  auditedItems: auditedItems.map((item) => ({
    id: item.id,
    title: item.title ?? "",
    mallName: item.mallName ?? "",
    category: item.category ?? "",
    source: item.source,
    sourceName: item.sourceName ?? "",
    originalUrl: item.originalUrl,
    finalUrl: item.finalUrl,
    affiliateUrl: item.affiliateUrl ?? "",
    eventUrl: item.eventUrl ?? "",
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    validationReason: item.validationReason,
    lastCheckedAt: item.lastCheckedAt,
    priorityScore: item.priorityScore,
    isHidden: item.isHidden,
    host: item.host,
    evidence: item.evidence,
    httpUrl: item.checks?.httpUrl ?? false,
    searchLikeUrl: item.checks?.searchLikeUrl ?? false,
    productDetailUrl: item.checks?.productDetailUrl ?? false,
    officialBenefitUrl: item.checks?.officialBenefitUrl ?? false,
    unavailableText: item.checks?.unavailableText ?? false,
    liveProbeOk: item.liveProbe?.ok ?? null,
    liveProbeReason: item.liveProbe?.reason ?? ""
  })),
  badExposedItems: badExposedItems.map((item) => ({
    id: item.id,
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: item.finalUrl,
    validationReason: item.validationReason
  })),
  hiddenItems: hiddenItems.map((item) => ({
    id: item.id,
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    validationReason: item.validationReason
  })),
  sourceReports: {
    linkValidationGeneratedAt: linkReport?.generatedAt ?? null,
    productQualityGeneratedAt: productReport?.generatedAt ?? null,
    refreshAllGeneratedAt: refreshAllReport?.generatedAt ?? null
  },
  issues
};

writeFileSync(join(reportsDir, "exposure-policy.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (issues.length) {
  console.error("Exposure policy doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Exposure policy doctor passed.");
console.log(`- Audited items: ${report.summary.auditedItems}`);
console.log(`- Exposed items: ${report.summary.exposedItems}`);
console.log(`- Bad exposed items: ${report.summary.badExposedItems}`);
