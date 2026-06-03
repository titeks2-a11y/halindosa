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
const repository = read("lib/deals/dealRepository.ts");
const affiliate = read("lib/affiliate.ts");
const packageJson = JSON.parse(read("package.json"));
const linkReport = readJson("reports/link-validation.json") ?? readJson("LINK_VERIFICATION_RESULT.json");
const dealIds = extractDealIds(mockDeals);
const hiddenIssueIds = extractHiddenIssueIds(linkReport?.issues ?? []);
const verifiedLinkIds = new Set([...verifiedPurchaseLinks.matchAll(/^\s*(d\d+):\s*{/gm)].map((match) => match[1]));
const missingVerifiedIds = dealIds.filter((id) => !verifiedLinkIds.has(id));
const issues = [];

const requiredTypeFields = [
  "eventUrl",
  "availability",
  "validationStatus",
  "validationReason",
  "lastCheckedAt",
  "priorityScore",
  "isHidden"
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

if (!repository.includes("deals.filter(isPubliclyVisibleDeal)")) {
  issues.push("public getDeals 결과가 isPubliclyVisibleDeal로 필터링되지 않습니다.");
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
  if ((linkReport.searchOrCategorySuspected ?? 0) !== 0) {
    issues.push(`검색/카테고리 링크가 남아 있습니다: ${linkReport.searchOrCategorySuspected}`);
  }
  if ((linkReport.communitySuspected ?? 0) !== 0) {
    issues.push(`커뮤니티 링크가 남아 있습니다: ${linkReport.communitySuspected}`);
  }
  if ((linkReport.homeOrMainSuspected ?? 0) !== 0) {
    issues.push(`대표몰/홈 링크가 남아 있습니다: ${linkReport.homeOrMainSuspected}`);
  }
  if ((linkReport.issues ?? []).length) {
    issues.push(`링크 검증 실패 상품이 있습니다: ${linkReport.issues.length}`);
  }
}

if (missingVerifiedIds.length) {
  issues.push(`검증 구매 링크가 없는 상품이 있습니다: ${missingVerifiedIds.join(", ")}`);
}

const totalProducts = dealIds.length;
const hiddenProducts = hiddenIssueIds.size + missingVerifiedIds.length;
const visibleProducts = Math.max(0, totalProducts - hiddenProducts);
const report = {
  generatedAt: new Date().toISOString(),
  totalProducts,
  passedProducts: issues.length ? 0 : visibleProducts,
  failedProducts: issues.length ? totalProducts - visibleProducts : 0,
  searchLinks: linkReport?.searchOrCategorySuspected ?? 0,
  soldOutProducts: 0,
  hiddenProducts,
  visibleProducts: issues.length ? 0 : visibleProducts,
  verifiedPurchaseLinks: verifiedLinkIds.size,
  missingVerifiedIds,
  hiddenIssueIds: [...hiddenIssueIds].sort(),
  exposurePolicy: {
    availability: "active",
    validationStatus: "passed",
    isHidden: false,
    linkType: "not search/seller_search/unavailable",
    finalUrlRequired: true
  },
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
