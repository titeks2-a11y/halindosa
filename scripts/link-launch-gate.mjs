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

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function count(items, predicate) {
  return items.filter(predicate).length;
}

function getItemIssues(item) {
  const issues = [];

  if (item.isHidden === true) issues.push("hidden");
  if (item.availability !== "active") issues.push(`availability:${item.availability ?? "missing"}`);
  if (item.validationStatus !== "passed") issues.push(`validation:${item.validationStatus ?? "missing"}`);
  if (["search", "seller_search", "unavailable"].includes(item.linkType)) issues.push(`linkType:${item.linkType}`);
  if (!item.finalUrl || !isHttpUrl(item.finalUrl)) issues.push("invalid_finalUrl");
  if (item.httpUrl === false) issues.push("non_http_url");
  if (item.searchLikeUrl === true) issues.push("search_like_url");
  if (item.unavailableText === true) issues.push("sold_out_or_ended_text");

  return issues;
}

const linkReport = readJson("reports/link-validation.json");
const productReport = readJson("reports/product-quality.json");
const exposureReport = readJson("reports/exposure-policy.json");
const refreshReport = readJson("reports/refresh-deals.json");
const policy = readJson("data/linkQualityPolicy.json");

const auditedItems = Array.isArray(exposureReport?.auditedItems)
  ? exposureReport.auditedItems
  : Array.isArray(linkReport?.auditedItems)
    ? linkReport.auditedItems
    : [];
const exposedItems = auditedItems.filter((item) => !item.isHidden);
const failedExposureItems = exposedItems
  .map((item) => ({ ...item, issues: getItemIssues(item) }))
  .filter((item) => item.issues.length);
const hiddenItems = auditedItems.filter((item) => item.isHidden);
const liveReview = exposureReport?.liveProbeReviewSummary ?? linkReport?.liveProbeReviewSummary ?? {};

const criteria = {
  reportsPresent: Boolean(linkReport && productReport && exposureReport && refreshReport),
  minimumAuditedItems: 140,
  exposedSearchLinks: 0,
  exposedSoldOutLinks: 0,
  exposedBrokenLinks: 0,
  exposedInvalidUrls: 0,
  failedProducts: 0,
  hiddenProducts: 0,
  liveHardFailures: 0,
  sellerUnavailableSignals: 0
};

const actual = {
  reportsPresent: criteria.reportsPresent,
  auditedItems: auditedItems.length,
  exposedItems: exposedItems.length,
  hiddenItems: hiddenItems.length,
  failedExposureItems: failedExposureItems.length,
  exposedSearchLinks:
    exposureReport?.summary?.searchLinksExposed ??
    linkReport?.exposedSearchLinks ??
    count(exposedItems, (item) => item.linkType === "search" || item.linkType === "seller_search"),
  exposedSoldOutLinks:
    exposureReport?.summary?.soldOutExposed ??
    linkReport?.exposedSoldOutLinks ??
    count(exposedItems, (item) => item.availability === "sold_out"),
  exposedBrokenLinks:
    productReport?.exposedBrokenLinks ??
    linkReport?.exposedBrokenLinks ??
    count(exposedItems, (item) => item.validationStatus !== "passed"),
  exposedInvalidUrls:
    productReport?.exposedInvalidUrls ??
    linkReport?.exposedInvalidUrls ??
    count(exposedItems, (item) => !isHttpUrl(item.finalUrl)),
  failedProducts: productReport?.failedProducts ?? linkReport?.failedCount ?? 0,
  searchLinks: productReport?.searchLinks ?? linkReport?.searchLinks ?? 0,
  soldOutProducts: productReport?.soldOutProducts ?? linkReport?.soldOutOrEndedSuspected ?? 0,
  hiddenProducts: productReport?.hiddenProducts ?? linkReport?.hiddenCount ?? hiddenItems.length,
  visibleProducts: productReport?.visibleProducts ?? linkReport?.visibleCount ?? exposedItems.length,
  verifiedPurchaseLinks: productReport?.verifiedPurchaseLinks ?? linkReport?.passedDirectLinks ?? 0,
  refreshOk: refreshReport?.ok === true,
  refreshVisibleCount: refreshReport?.visibleCount ?? 0,
  refreshFailedCount: refreshReport?.failedCount ?? 0,
  liveHardFailures: liveReview?.hardFailureCount ?? 0,
  sellerUnavailableSignals: liveReview?.sellerUnavailableSignals ?? 0
};

const issues = [];

if (!actual.reportsPresent) issues.push("required_reports_missing");
if (actual.auditedItems < criteria.minimumAuditedItems) issues.push(`audited_items_below_${criteria.minimumAuditedItems}`);
if (actual.exposedSearchLinks !== criteria.exposedSearchLinks) issues.push("search_links_exposed");
if (actual.exposedSoldOutLinks !== criteria.exposedSoldOutLinks) issues.push("sold_out_links_exposed");
if (actual.exposedBrokenLinks !== criteria.exposedBrokenLinks) issues.push("broken_links_exposed");
if (actual.exposedInvalidUrls !== criteria.exposedInvalidUrls) issues.push("invalid_urls_exposed");
if (actual.failedProducts !== criteria.failedProducts) issues.push("failed_products_present");
if (actual.hiddenProducts !== criteria.hiddenProducts) issues.push("hidden_products_present");
if (!actual.refreshOk || actual.refreshFailedCount !== 0) issues.push("refresh_pipeline_not_clean");
if (actual.liveHardFailures !== criteria.liveHardFailures) issues.push("live_probe_hard_failures");
if (actual.sellerUnavailableSignals !== criteria.sellerUnavailableSignals) issues.push("seller_unavailable_signals");
if (failedExposureItems.length) issues.push("failed_exposure_items_present");
if (policy?.exposurePolicy?.availability !== "active" || policy?.exposurePolicy?.validationStatus !== "passed") {
  issues.push("exposure_policy_not_strict");
}

const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  criteria,
  actual,
  policy: {
    version: policy?.version ?? null,
    exposurePolicy: policy?.exposurePolicy ?? null,
    launchGate: policy?.launchGate ?? null
  },
  sourceReports: {
    linkValidation: linkReport?.generatedAt ?? null,
    productQuality: productReport?.generatedAt ?? null,
    exposurePolicy: exposureReport?.generatedAt ?? null,
    refreshDeals: refreshReport?.generatedAt ?? null
  },
  linkTypeCounts: exposureReport?.linkTypeCounts ?? {},
  availabilityCounts: exposureReport?.availabilityCounts ?? {},
  validationStatusCounts: exposureReport?.validationStatusCounts ?? {},
  liveProbeReviewSummary: liveReview,
  failedExposureItems: failedExposureItems.map((item) => ({
    id: item.id,
    title: item.title,
    mallName: item.mallName,
    linkType: item.linkType,
    availability: item.availability,
    validationStatus: item.validationStatus,
    finalUrl: item.finalUrl,
    issues: item.issues
  })),
  hiddenItems: hiddenItems.map((item) => ({
    id: item.id,
    title: item.title,
    mallName: item.mallName,
    availability: item.availability,
    validationStatus: item.validationStatus,
    validationReason: item.validationReason
  })),
  issues
};

const markdown = `# Link Launch Gate

Generated: ${report.generatedAt}

Status: ${report.ok ? "PASS" : "FAIL"}

## Summary

- Audited items: ${actual.auditedItems}
- Exposed items: ${actual.exposedItems}
- Verified purchase links: ${actual.verifiedPurchaseLinks}
- Exposed search links: ${actual.exposedSearchLinks}
- Exposed sold-out links: ${actual.exposedSoldOutLinks}
- Exposed broken links: ${actual.exposedBrokenLinks}
- Exposed invalid URLs: ${actual.exposedInvalidUrls}
- Hidden products: ${actual.hiddenProducts}
- Live hard failures: ${actual.liveHardFailures}
- Seller unavailable signals: ${actual.sellerUnavailableSignals}

## Launch Rule

Only deals with \`availability=active\`, \`validationStatus=passed\`, \`isHidden=false\`, non-search \`linkType\`, and a valid HTTP(S) \`finalUrl\` can be exposed.

## Issues

${issues.length ? issues.map((issue) => `- ${issue}`).join("\n") : "- None"}
`;

writeFileSync(join(reportsDir, "link-launch-gate.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(reportsDir, "LINK_LAUNCH_GATE.md"), markdown, "utf8");

if (issues.length) {
  console.error("Link launch gate failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Link launch gate passed.");
console.log(`- Audited items: ${actual.auditedItems}`);
console.log(`- Exposed search links: ${actual.exposedSearchLinks}`);
console.log(`- Exposed sold-out links: ${actual.exposedSoldOutLinks}`);
console.log(`- Verified purchase links: ${actual.verifiedPurchaseLinks}`);
