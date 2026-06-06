import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

function readJson(path, fallback = {}) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function readText(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function writeJson(path, payload) {
  writeFileSync(join(root, path), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function hostMatches(host, candidate) {
  const normalized = String(candidate ?? "").replace(/^www\./, "").toLowerCase();
  return Boolean(normalized) && (host === normalized || host.endsWith(`.${normalized}`));
}

function isHomeOnlyUrl(url) {
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  return ["", "/", "/main", "/index"].includes(path);
}

function isSearchLikeUrl(url, policy) {
  const full = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  const pathAndQuery = `${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const productSignals = policy?.productDetailSignals ?? [];
  const officialSignals = policy?.officialBenefitUrlSignals ?? [];

  if (productSignals.some((pattern) => new RegExp(pattern, "i").test(full))) return false;
  if (officialSignals.some((signal) => pathAndQuery.includes(String(signal).toLowerCase()))) return false;

  return (policy?.searchPatterns ?? ["/search", "search?", "query=", "keyword=", "msearch", "/result", "/find"]).some((pattern) =>
    full.includes(String(pattern).toLowerCase())
  );
}

function getUrlPolicyIssues(item, policy) {
  const issues = [];
  const finalUrl = String(item.finalUrl ?? item.finalPurchaseUrl ?? "").trim();

  if (!finalUrl) {
    issues.push("missing_final_url");
    return issues;
  }

  const url = parseHttpUrl(finalUrl);
  if (!url) {
    issues.push("unsafe_or_invalid_url");
    return issues;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const blockedHosts = [...(policy?.blockedHosts ?? []), ...(policy?.placeholderHosts ?? [])];

  if (blockedHosts.some((candidate) => hostMatches(host, candidate))) issues.push("blocked_or_community_host");
  if (isHomeOnlyUrl(url)) issues.push("homepage_link");
  if (isSearchLikeUrl(url, policy)) issues.push("search_or_result_link");

  return issues;
}

function getProductExposureIssues(item, policy) {
  const issues = [];

  if (item.isHidden === true) issues.push("hidden_item");
  if (item.publishable !== true) issues.push("not_publishable");
  if (item.availability !== "active") issues.push(`availability_${item.availability ?? "missing"}`);
  if (item.validationStatus !== "passed") issues.push(`validation_${item.validationStatus ?? "missing"}`);
  if (["search", "seller_search", "unavailable"].includes(item.linkType)) issues.push(`link_type_${item.linkType}`);
  if (item.linkStatus && item.linkStatus !== "verified") issues.push(`link_status_${item.linkStatus}`);

  return [...issues, ...getUrlPolicyIssues(item, policy)];
}

function getNewsExposureIssues(item, policy) {
  const issues = [];

  if (item.isHidden === true) issues.push("hidden_item");
  if (item.publishable !== true) issues.push("not_publishable");
  if (item.availability !== "active") issues.push(`availability_${item.availability ?? "missing"}`);
  if (item.validationStatus !== "passed") issues.push(`validation_${item.validationStatus ?? "missing"}`);
  if (!String(item.linkType ?? "").startsWith("official")) issues.push(`link_type_${item.linkType ?? "missing"}`);
  if (Number(item.priorityScore ?? 0) < 70) issues.push("low_priority_score");

  return [...issues, ...getUrlPolicyIssues(item, policy)];
}

function compactViolation(item, issues, kind) {
  return {
    kind,
    id: item.id,
    title: item.title ?? "",
    sourceName: item.sourceName ?? item.mallName ?? item.merchant ?? "",
    finalUrl: item.finalUrl ?? item.finalPurchaseUrl ?? "",
    linkType: item.linkType ?? "",
    availability: item.availability ?? "",
    validationStatus: item.validationStatus ?? "",
    publishable: item.publishable === true,
    isHidden: item.isHidden === true,
    issues
  };
}

function assertSourceContains(issues, path, snippets, label) {
  const source = readText(path);
  if (!source) {
    issues.push(`${label}: missing ${path}`);
    return;
  }

  for (const snippet of snippets) {
    if (!source.includes(snippet)) issues.push(`${label}: ${path} should include ${snippet}`);
  }
}

const policy = readJson("data/linkQualityPolicy.json", {});
const linkReport = readJson("reports/link-validation.json", {});
const newsReport = readJson("reports/news-deals.json", {});
const freebiesReport = readJson("reports/freebies-refresh.json", {});
const eventsReport = readJson("reports/events-refresh.json", {});
const refreshedDeals = readJson("data/refreshedDeals.json", {});
const refreshedNews = readJson("data/refreshedNewsDeals.json", {});
const accountPanelSource = readText("components/AccountPanel.tsx");
const homePageSource = readText("app/page.tsx");
const hotSignalSectionSource = readText("components/HotSignalSection.tsx");
const hotSignalProviderSource = readText("lib/hotSignalProvider.ts");
const mockHotSignalsSource = readText("data/mockHotSignals.ts");
const mockDealsSource = readText("data/mockDeals.ts");

const productCandidates = Array.isArray(linkReport.auditedItems) ? linkReport.auditedItems.filter((item) => item.isHidden !== true) : [];
const newsSnapshotItems = Array.isArray(refreshedNews.allDeals) && refreshedNews.allDeals.length
  ? refreshedNews.allDeals
  : Array.isArray(refreshedNews.deals)
    ? refreshedNews.deals
    : [];
const newsCandidates = newsSnapshotItems.filter((item) => item.isHidden !== true && item.validationStatus === "passed" && item.publishable === true);
const productViolations = productCandidates
  .map((item) => ({ item, issues: getProductExposureIssues(item, policy) }))
  .filter((entry) => entry.issues.length)
  .map((entry) => compactViolation(entry.item, entry.issues, "product"));
const newsViolations = newsCandidates
  .map((item) => ({ item, issues: getNewsExposureIssues(item, policy) }))
  .filter((entry) => entry.issues.length)
  .map((entry) => compactViolation(entry.item, entry.issues, "official_benefit"));

const sourceIssues = [];
assertSourceContains(sourceIssues, "app/api/deals/route.ts", ["isPubliclyVisibleDeal", "verifiedOnly"], "product api");
assertSourceContains(sourceIssues, "lib/deals/dealRepository.ts", ["deals.filter(isPubliclyVisibleDeal)", "applyLinkValidationExposureOverride"], "deal repository");
assertSourceContains(sourceIssues, "app/api/news-deals/route.ts", ["getVisibleNewsDeals"], "news api");
assertSourceContains(sourceIssues, "lib/deals/newsDeals.ts", ["isVisibleNewsDeal", "publishable !== false", "linkType.startsWith(\"official\")"], "news repository");
assertSourceContains(sourceIssues, "app/go/[id]/route.ts", ["canOpenDealLink"], "product redirect");
assertSourceContains(sourceIssues, "lib/deals/newsLinkPolicy.ts", ["canOpenNewsDealLink", "isHomeOnlyUrl"], "news link policy");
assertSourceContains(sourceIssues, "app/go/news/[id]/route.ts", ["resolveNewsDealDestinationUrl"], "news redirect");

if (accountPanelSource.includes("href={deal.finalUrl}")) {
  sourceIssues.push("mypage recent official benefits must not bypass /go/news/[id] with direct finalUrl anchors");
}

if (!accountPanelSource.includes("mypage-recent-benefit") || !accountPanelSource.includes("/go/news/${deal.id}")) {
  sourceIssues.push("mypage recent official benefits should route through /go/news/[id] for click logging and URL policy checks");
}

if (homePageSource.includes("window.open(signal.url") || homePageSource.includes("Browser.open({ url: signal.url")) {
  sourceIssues.push("home hot signals must not open raw signal.url because community/news source links are not publishable purchase destinations");
}

if (hotSignalSectionSource.includes("signal.url") && !hotSignalSectionSource.includes("buildPublicHotSignalDiscoveryUrl")) {
  sourceIssues.push("hot signal sharing should use an internal verified-deal discovery URL instead of raw signal.url");
}

if (mockHotSignalsSource.includes("ppomppu.co.kr") || mockHotSignalsSource.includes("zboard/view.php")) {
  sourceIssues.push("mock hot signals must not expose community post URLs in the client bundle");
}

if (/deal\([^\n]*(ppomppu\.co\.kr|zboard\/view\.php|fmkorea|quasarzone|algumon)/i.test(mockDealsSource)) {
  sourceIssues.push("mock deal seed entries must use verified product/event URLs instead of community post URLs");
}

if (!hotSignalProviderSource.includes("buildHotSignalDiscoveryPath") || !hotSignalProviderSource.includes("url: buildHotSignalDiscoveryPath(signal)")) {
  sourceIssues.push("hot signal API responses should replace raw source URLs with internal discovery URLs before customer exposure");
}

const sliceIssues = [];
if (freebiesReport.ok !== true) sliceIssues.push("freebies report is not passing");
if ((freebiesReport.visibleCount ?? 0) < 27) sliceIssues.push("freebies report visible count is below launch floor");
if ((freebiesReport.exposedSearchLinks ?? 999) !== 0 || (freebiesReport.exposedNonOfficialLinks ?? 999) !== 0) {
  sliceIssues.push("freebies report exposes search or non-official links");
}
if (eventsReport.ok !== true) sliceIssues.push("events report is not passing");
if ((eventsReport.visibleCount ?? 0) < 75) sliceIssues.push("events report visible count is below launch floor");
if ((eventsReport.exposedSearchLinks ?? 999) !== 0 || (eventsReport.exposedNonOfficialLinks ?? 999) !== 0) {
  sliceIssues.push("events report exposes search or non-official links");
}

const issues = [
  ...productViolations.map((item) => `product ${item.id}: ${item.issues.join(",")}`),
  ...newsViolations.map((item) => `official benefit ${item.id}: ${item.issues.join(",")}`),
  ...sourceIssues,
  ...sliceIssues
];

const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  summary: {
    productCandidates: productCandidates.length,
    productViolations: productViolations.length,
    newsCandidates: newsCandidates.length,
    newsViolations: newsViolations.length,
    freebiesVisible: freebiesReport.visibleCount ?? 0,
    eventsVisible: eventsReport.visibleCount ?? 0,
    exposedSearchLinks: (linkReport.exposedSearchLinks ?? 0) + (newsReport.exposedSearchLinkCount ?? 0) + (freebiesReport.exposedSearchLinks ?? 0) + (eventsReport.exposedSearchLinks ?? 0),
    exposedSoldOutLinks: linkReport.exposedSoldOutLinks ?? 0,
    exposedNonOfficialLinks: (newsReport.exposedNonOfficialLinkCount ?? 0) + (freebiesReport.exposedNonOfficialLinks ?? 0) + (eventsReport.exposedNonOfficialLinks ?? 0),
    refreshedProductSnapshotCount: Array.isArray(refreshedDeals.deals) ? refreshedDeals.deals.length : 0,
    refreshedNewsSnapshotCount: newsSnapshotItems.length
  },
  surfacePolicy: {
    products: "availability=active, validationStatus=passed, publishable=true, isHidden=false, non-search linkType, safe finalUrl",
    officialBenefits: "availability=active, validationStatus=passed, publishable=true, isHidden=false, official linkType, safe finalUrl, priorityScore>=70",
    redirects: "all customer purchase/application buttons must pass /go/[id] or /go/news/[id]"
  },
  surfaceChecks: {
    productApi: "app/api/deals/route.ts",
    productRepository: "lib/deals/dealRepository.ts",
    newsApi: "app/api/news-deals/route.ts",
    newsRepository: "lib/deals/newsDeals.ts",
    productRedirect: "app/go/[id]/route.ts",
    officialBenefitRedirect: "app/go/news/[id]/route.ts"
  },
  productViolations,
  newsViolations,
  sourceIssues,
  sliceIssues,
  issues
};

writeJson("reports/publishable-surface.json", report);

const docs = `# Publishable Surface Report

- Generated at: ${report.generatedAt}
- Status: ${report.ok ? "PASS" : "FAIL"}
- Product customer candidates: ${report.summary.productCandidates}
- Product violations: ${report.summary.productViolations}
- Official benefit customer candidates: ${report.summary.newsCandidates}
- Official benefit violations: ${report.summary.newsViolations}
- Free benefit slice visible: ${report.summary.freebiesVisible}
- Official event slice visible: ${report.summary.eventsVisible}
- Exposed search links: ${report.summary.exposedSearchLinks}
- Exposed sold-out links: ${report.summary.exposedSoldOutLinks}
- Exposed non-official benefit links: ${report.summary.exposedNonOfficialLinks}

## Policy

Products are visible only when they are active, passed, publishable, not hidden, non-search, and backed by a safe final URL.

Official benefits are visible only when they are active, passed, publishable, not hidden, official-link typed, high priority, and backed by a safe final URL.

All purchase or claim actions should continue to route through \`/go/[id]\` or \`/go/news/[id]\` so click logging, consent guardrails, and URL policy checks remain centralized.

## Issues

${issues.length ? issues.map((issue) => `- ${issue}`).join("\n") : "- None"}
`;

writeFileSync(join(root, "docs", "PUBLISHABLE_SURFACE_REPORT.md"), docs, "utf8");

if (!report.ok) {
  console.error("Publishable surface doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Publishable surface doctor passed.");
console.log(`- Product candidates: ${report.summary.productCandidates}`);
console.log(`- Official benefit candidates: ${report.summary.newsCandidates}`);
console.log(`- Free benefits: ${report.summary.freebiesVisible}`);
console.log(`- Official events: ${report.summary.eventsVisible}`);
