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
const issues = [];
const liveProbeFailureReasonCounts = (linkReport?.liveProbe?.failures ?? []).reduce((acc, failure) => {
  const reason = String(failure.reason ?? "unknown");
  acc[reason] = (acc[reason] ?? 0) + 1;
  return acc;
}, {});

if (!linkReport) issues.push("reports/link-validation.json is missing.");
if (!productReport) issues.push("reports/product-quality.json is missing.");
if (!refreshAllReport) issues.push("reports/refresh-all.json is missing.");
if (!policy) issues.push("data/linkQualityPolicy.json is missing.");
if (!auditedItems.length) issues.push("link-validation report should include auditedItems for product-level traceability.");

if ((linkReport?.exposedSearchLinks ?? 0) !== 0 || badExposedItems.some((item) => item.linkType === "search" || item.linkType === "seller_search")) {
  issues.push("search or seller-search links are exposed.");
}

if ((linkReport?.exposedSoldOutLinks ?? 0) !== 0 || badExposedItems.some((item) => item.availability === "sold_out")) {
  issues.push("sold-out or ended links are exposed.");
}

if ((linkReport?.failedCount ?? 0) !== 0 || (productReport?.failedProducts ?? 0) !== 0 || badExposedItems.length) {
  issues.push("failed link validation items are exposed or product quality failed.");
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
    averagePriorityScore: linkReport?.exposureAudit?.averagePriorityScore ?? 0
  },
  linkTypeCounts: countBy(auditedItems, "linkType"),
  availabilityCounts: countBy(auditedItems, "availability"),
  validationStatusCounts: countBy(auditedItems, "validationStatus"),
  exposurePolicy: policy?.exposurePolicy ?? null,
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
  liveProbeFailureReasonCounts,
  auditedItems: auditedItems.map((item) => ({
    id: item.id,
    source: item.source,
    originalUrl: item.originalUrl,
    finalUrl: item.finalUrl,
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
