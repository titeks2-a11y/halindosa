import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function extractDealIds(source) {
  return [...source.matchAll(/deal\("(?<id>d\d+)"/g)].map((match) => match.groups.id);
}

function extractHiddenIssueIds(issues) {
  return new Set(issues.map((issue) => issue.match(/^(d\d+)/)?.[1]).filter(Boolean));
}

const mockDeals = read("data/mockDeals.ts");
const verifiedPurchaseLinks = read("data/verifiedPurchaseLinks.ts");
const dealTypes = read("types/deal.ts");
const normalizer = read("lib/deals/normalizer.ts");
const quality = read("lib/deals/quality.ts");
const linkValidator = read("lib/deals/linkValidator.ts");
const providerTypes = read("lib/deals/providers/types.ts");
const repository = read("lib/deals/dealRepository.ts");
const affiliate = read("lib/affiliate.ts");
const linkQualityPolicy = JSON.parse(read("data/linkQualityPolicy.json"));
const packageJson = JSON.parse(read("package.json"));
const linkReport = readJson("reports/link-validation.json") ?? readJson("LINK_VERIFICATION_RESULT.json");
const refreshReport = readJson("reports/refresh-deals.json");
const refreshedSnapshot = readJson("data/refreshedDeals.json");
const dealIds = extractDealIds(mockDeals);
const hiddenIssueIds = extractHiddenIssueIds(linkReport?.issues ?? []);
const auditedItems = Array.isArray(linkReport?.auditedItems) ? linkReport.auditedItems : [];
const hiddenAuditIds = new Set(
  auditedItems
    .filter((item) => item?.isHidden === true || item?.publishable !== true || item?.validationStatus !== "passed" || item?.availability !== "active")
    .map((item) => item.id)
    .filter(Boolean)
);
const verifiedLinkIds = new Set([...verifiedPurchaseLinks.matchAll(/^\s*(d\d+):\s*{/gm)].map((match) => match[1]));
const missingVerifiedIds = dealIds.filter((id) => !verifiedLinkIds.has(id));
const issues = [];

const requiredTypeFields = [
  "source",
  "mallName",
  "originalUrl",
  "finalUrl",
  "affiliateUrl",
  "eventUrl",
  "linkType",
  "availability",
  "validationStatus",
  "validationReason",
  "validationCode",
  "lastCheckedAt",
  "priorityScore",
  "isHidden",
  "publishable"
];

for (const field of requiredTypeFields) {
  if (!dealTypes.includes(`${field}:`) && !dealTypes.includes(`${field}?:`)) {
    issues.push(`Deal 타입에 ${field} 필드가 없습니다.`);
  }
  if (!normalizer.includes(field)) {
    issues.push(`normalizeDeal이 ${field} 필드를 채우지 않습니다.`);
  }
}

for (const phrase of [
  "getDealExposureDecision",
  "isPubliclyVisibleDeal",
  "shouldHideDeal",
  "resolveDealAvailability",
  "resolveDealValidationStatus",
  "getDealPriorityScore"
]) {
  if (!quality.includes(`export function ${phrase}`)) {
    issues.push(`품질 유틸 ${phrase}가 없습니다.`);
  }
}

for (const phrase of ["isPolicySearchLikeUrl", "isPolicyHomeOnlyUrl", "isPolicyBlockedHost", "missing_final_url"]) {
  if (!quality.includes(phrase)) {
    issues.push(`품질 유틸이 URL 노출 정책 ${phrase}를 확인하지 않습니다.`);
  }
}

if (linkQualityPolicy.version < 1) {
  issues.push("linkQualityPolicy.json 버전이 유효하지 않습니다.");
}

for (const field of ["blockedHosts", "searchPatterns", "unavailableTextPatterns", "productDetailSignals", "officialBenefitUrlSignals", "exposurePolicy"]) {
  if (!(field in linkQualityPolicy)) {
    issues.push(`linkQualityPolicy.json에 ${field} 필드가 없습니다.`);
  }
}

if (linkQualityPolicy.exposurePolicy?.publishable !== true) {
  issues.push("linkQualityPolicy exposurePolicy는 publishable=true를 요구해야 합니다.");
}

if (!linkValidator.includes("linkQualityPolicy") || !providerTypes.includes("linkQualityPolicy")) {
  issues.push("런타임 링크 검증과 provider 검증이 data/linkQualityPolicy.json 정책을 사용하지 않습니다.");
}

if (!repository.includes("deals.filter(isPubliclyVisibleDeal)")) {
  issues.push("public getDeals 결과가 isPubliclyVisibleDeal로 필터링되지 않습니다.");
}

if (!repository.includes("applyLinkValidationExposureOverride")) {
  issues.push("public getDeals 결과가 link-validation 리포트의 숨김/불일치 판정을 적용하지 않습니다.");
}

if (!normalizer.includes("sanitizePublicAuxiliaryUrl")) {
  issues.push("normalizeDeal이 public search/source/original URL에서 검색·대표·커뮤니티 fallback을 제거하지 않습니다.");
}

if (/searchUrl:\s*validation\.linkVerified\s*\?\s*fallbackUrl/.test(mockDeals) || /searchUrl:\s*fallbackUrl/.test(mockDeals)) {
  issues.push("mockDeals가 검증 상품에도 검색 fallback URL을 public searchUrl로 채웁니다.");
}

if (!repository.includes("availability === \"active\"") && !quality.includes("availability !== \"active\"")) {
  issues.push("노출 정책에 availability=active 조건이 없습니다.");
}

if (!quality.includes("validationStatus !== \"passed\"") || !quality.includes("deal.isHidden === true")) {
  issues.push("노출 정책에 validationStatus=passed 및 isHidden=false 조건이 없습니다.");
}

if (!affiliate.includes('return ""') || !affiliate.includes("isVerifiedPurchaseLink(deal)")) {
  issues.push("외부 이동 URL이 검증 실패 시 검색 링크로 fallback될 위험이 있습니다.");
}

if (!packageJson.scripts?.["verify:products"]) {
  issues.push("package.json에 verify:products 스크립트가 없습니다.");
}

if (!packageJson.scripts?.["refresh:deals"]) {
  issues.push("package.json에 refresh:deals 스크립트가 없습니다.");
}

if (!linkReport) {
  issues.push("링크 검증 리포트가 없습니다. npm run verify:links를 먼저 실행하세요.");
} else {
  const requiredAuditFields = [
    "id",
    "title",
    "mallName",
    "category",
    "source",
    "sourceName",
    "originalUrl",
    "finalUrl",
    "affiliateUrl",
    "eventUrl",
    "linkType",
    "availability",
    "validationStatus",
    "validationReason",
    "validationCode",
    "lastCheckedAt",
    "priorityScore",
    "isHidden",
    "publishable"
  ];
  const auditFieldMissingIds = auditedItems
    .filter((item) => requiredAuditFields.some((field) => !(field in item)))
    .map((item) => item.id ?? "unknown");

  if (!auditedItems.length) {
    issues.push("링크 검증 리포트에 상품별 auditedItems가 없습니다.");
  }

  if (auditFieldMissingIds.length) {
    issues.push(`링크 검증 auditedItems에 필수 감사 필드가 누락된 상품이 있습니다: ${auditFieldMissingIds.slice(0, 10).join(", ")}`);
  }

  if ((linkReport.searchOrCategorySuspected ?? 0) !== 0) {
    issues.push(`검색/카테고리 링크가 남아 있습니다: ${linkReport.searchOrCategorySuspected}`);
  }
  if ((linkReport.exposedSoldOutLinks ?? 0) !== 0) {
    issues.push(`고객에게 노출되는 품절/판매종료 의심 링크가 남아 있습니다: ${linkReport.exposedSoldOutLinks}`);
  }
  if ((linkReport.communitySuspected ?? 0) !== 0) {
    issues.push(`커뮤니티 링크가 남아 있습니다: ${linkReport.communitySuspected}`);
  }
  if ((linkReport.homeOrMainSuspected ?? 0) !== 0) {
    issues.push(`대표몰/홈 링크가 남아 있습니다: ${linkReport.homeOrMainSuspected}`);
  }
  if ((linkReport.exposedIssues ?? []).length) {
    issues.push(`고객에게 노출되는 링크 검증 실패 상품이 있습니다: ${linkReport.exposedIssues.length}`);
  }
  if (linkReport.policy?.source !== "data/linkQualityPolicy.json" || (linkReport.policy?.searchPatterns ?? 0) < 10) {
    issues.push("링크 검증 리포트가 공통 linkQualityPolicy 기준을 기록하지 않습니다.");
  }
  if (!linkReport.httpStatusSummary || !("http404" in linkReport.httpStatusSummary) || !("timeout" in linkReport.httpStatusSummary)) {
    issues.push("링크 검증 리포트에 HTTP/redirect 세부 지표가 없습니다.");
  }
  if (!linkReport.launchGate || linkReport.launchGate.passed !== true) {
    issues.push("링크 검증 리포트의 출시 게이트가 통과 상태가 아닙니다.");
  }
  for (const field of ["exposedSearchLinks", "exposedSoldOutLinks", "exposedBrokenLinks", "exposedInvalidUrls"]) {
    if ((linkReport.launchGate?.actual?.[field] ?? 0) !== 0) {
      issues.push(`출시 게이트에 노출 위험 항목이 남아 있습니다: ${field}=${linkReport.launchGate.actual[field]}`);
    }
  }
  if ((linkReport.launchGate?.actual?.exposedNonPublishableItems ?? 0) !== 0) {
    issues.push(`출시 게이트에 publishable=false 노출 항목이 남아 있습니다: ${linkReport.launchGate.actual.exposedNonPublishableItems}`);
  }
}

if (missingVerifiedIds.length) {
  issues.push(`검증 구매 링크가 없는 상품이 있습니다: ${missingVerifiedIds.join(", ")}`);
}

const requiredRefreshFields = [
  "fetchedCount",
  "normalizedCount",
  "insertedCount",
  "updatedCount",
  "hiddenCount",
  "failedCount",
  "benefitTypeCounts",
  "freeBenefitVisibleCount",
  "providerStats",
  "failureReasons",
  "generatedAt"
];

if (refreshReport) {
  for (const field of requiredRefreshFields) {
    if (!(field in refreshReport)) {
      issues.push(`refresh-deals 리포트에 ${field} 필드가 없습니다.`);
    }
  }

  if (!Array.isArray(refreshReport.providerStats)) {
    issues.push("refresh-deals 리포트의 providerStats가 배열이 아닙니다.");
  }

  const refreshBenefitTypes = Object.keys(refreshReport.benefitTypeCounts ?? {});
  if (!refreshBenefitTypes.length || refreshBenefitTypes.includes("unknown")) {
    issues.push("refresh-deals 리포트에 혜택 유형 분포가 없거나 unknown 유형이 포함되어 있습니다.");
  }

  if ((refreshReport.freeBenefitVisibleCount ?? 0) < 70) {
    issues.push(`refresh-deals 무료/쿠폰/이벤트성 노출 수가 부족합니다: ${refreshReport.freeBenefitVisibleCount ?? 0}/70`);
  }

  if ((refreshReport.reports?.linkValidation?.searchOrCategorySuspected ?? 0) !== 0) {
    issues.push("refresh-deals 리포트에 검색 링크 노출 의심 항목이 남아 있습니다.");
  }
}

if (refreshedSnapshot) {
  const refreshedDeals = Array.isArray(refreshedSnapshot.deals) ? refreshedSnapshot.deals : [];
  const refreshedMissingBenefitTypeIds = refreshedDeals
    .filter((deal) => !deal.dealType || deal.dealType === "unknown" || !deal.benefitSummary)
    .map((deal) => deal.id ?? "unknown");

  if (!refreshedDeals.length) {
    issues.push("data/refreshedDeals.json에 노출 상품 스냅샷이 없습니다.");
  }

  if (refreshedMissingBenefitTypeIds.length) {
    issues.push(`refresh 스냅샷에 dealType/benefitSummary가 누락된 상품이 있습니다: ${refreshedMissingBenefitTypeIds.slice(0, 10).join(", ")}`);
  }
}

const totalProducts = dealIds.length;
const hiddenProducts = new Set([...hiddenIssueIds, ...hiddenAuditIds, ...missingVerifiedIds]).size;
const visibleProducts = Math.max(0, totalProducts - hiddenProducts);
const report = {
  generatedAt: new Date().toISOString(),
  totalProducts,
  passedProducts: issues.length ? 0 : visibleProducts,
  failedProducts: linkReport?.exposureAudit?.failedItems ?? Math.max(0, totalProducts - visibleProducts),
  searchLinks: linkReport?.searchOrCategorySuspected ?? 0,
  soldOutProducts: linkReport?.exposedSoldOutLinks ?? 0,
  hiddenProducts,
  publicSearchFallbacks: issues.some((issue) => issue.includes("searchUrl")) ? 1 : 0,
  exposedSearchLinks: linkReport?.exposedSearchLinks ?? 0,
  exposedSoldOutLinks: linkReport?.exposedSoldOutLinks ?? 0,
  exposedBrokenLinks: linkReport?.exposedBrokenLinks ?? 0,
  exposedInvalidUrls: linkReport?.exposedInvalidUrls ?? 0,
  exposedNonPublishableItems: linkReport?.exposureAudit?.exposedNonPublishableItems ?? 0,
  publishableProducts: linkReport?.exposureAudit?.publishableItems ?? 0,
  visibleProducts: issues.length ? 0 : visibleProducts,
  verifiedPurchaseLinks: verifiedLinkIds.size,
  missingVerifiedIds,
  hiddenIssueIds: [...new Set([...hiddenIssueIds, ...hiddenAuditIds])].sort(),
  policy: {
    version: linkQualityPolicy.version,
    source: "data/linkQualityPolicy.json",
    searchPatterns: linkQualityPolicy.searchPatterns.length,
    unavailableTextPatterns: linkQualityPolicy.unavailableTextPatterns.length,
    productDetailSignals: linkQualityPolicy.productDetailSignals.length,
    exposurePolicy: linkQualityPolicy.exposurePolicy
  },
  httpStatusSummary: linkReport?.httpStatusSummary ?? {},
  exposurePolicy: {
    ...linkQualityPolicy.exposurePolicy,
    linkType: "not search/seller_search/unavailable"
  },
  launchGate: linkReport?.launchGate ?? null,
  issues
};

writeFileSync(join(reportsDir, "product-quality.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (issues.length) {
  console.error("Product quality verification failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Product quality verification passed.");
console.log(`- Total products: ${report.totalProducts}`);
console.log(`- Visible products: ${report.visibleProducts}`);
console.log(`- Hidden products: ${report.hiddenProducts}`);
console.log(`- Search links exposed: ${report.searchLinks}`);
