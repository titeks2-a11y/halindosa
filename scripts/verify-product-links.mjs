import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");

const blockedHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "theqoo.net",
  "instiz.net",
  "coolenjoy.net",
  "example.com"
];

const searchPatterns = [
  "/search",
  "search.",
  "query=",
  "keyword=",
  "kwd=",
  "sword=",
  "wholesale-",
  "/np/search",
  "/productions/feed",
  "/category",
  "/categories"
];
const allowedSources = new Set(["manual_review", "partner_feed", "official_api"]);
const minimums = {
  distinctHosts: 18,
  evidenceLength: 12
};

function isBlockedHost(host) {
  return blockedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function isHomeOnly(url) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchLike(url) {
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return searchPatterns.some((pattern) => value.includes(pattern));
}

function hasProductDetailSignal(url) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return [
    /\/vp\/products\/\d+/,
    /\/products\/\d+/,
    /\/product\//,
    /\/p\/product\//,
    /\/goods\/\d+/,
    /\/goods\/detail/,
    /\/item\/itemview\.ssg/,
    /\/item\?/,
    /\/item\//,
    /detailview\.aspx/,
    /itemid=/,
    /goodsno=/,
    /goodscode=/,
    /goodscode=/,
    /goodsnum=/,
    /dealno=/,
    /prdno=/,
    /\/deal\/deal\.gs/,
    /\/dp\/[a-z0-9]+/,
    /\/gp\/product\/[a-z0-9]+/,
    /\/item\/\d+\.html/,
    /\/i\/\d+\.html/,
    /\/app\/product\/[a-z0-9]+/,
    /\/app\/goods\/goodsdetail/,
    /\/web\/goods_view\/index\.asp/,
    /\/tna\/products\/[a-z0-9-]+/,
    /\/contents\/notice\/detail\/\d+/
  ].some((pattern) => pattern.test(value));
}

function hasClaimOrBenefitSignal(url, evidence) {
  const value = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceValue = evidence.toLowerCase();
  const urlLooksLikeBenefit = /event|benefit|campaign|coupon|promotion|membership|discount|culture-event|whats_new|page\/event|plus\.do|bbs_category=3|\/cpc\/cr\//.test(value);
  const evidenceLooksLikeBenefit = /이벤트|행사|혜택|쿠폰|초대권|시사회|멤버십|포인트|무료|응모|할인|할인정보|캠페인|소식|공식/.test(evidenceValue);

  return urlLooksLikeBenefit && evidenceLooksLikeBenefit;
}

function parseVerifiedEntries() {
  const entries = [];
  const pattern = /^\s*(d\d+):\s*\{(?<body>[\s\S]*?)^\s*\},?/gm;
  let match;

  while ((match = pattern.exec(verifiedLinks))) {
    const body = match.groups?.body ?? "";
    entries.push({
      id: match[1],
      url: body.match(/url:\s*"([^"]+)"/)?.[1] ?? "",
      checkedAt: body.match(/checkedAt:\s*"([^"]+)"/)?.[1] ?? "",
      source: body.match(/source:\s*"([^"]+)"/)?.[1] ?? "",
      evidence: body.match(/evidence:\s*"([^"]+)"/)?.[1] ?? ""
    });
  }

  return entries;
}

const dealIds = [...mockDeals.matchAll(/deal\("(d\d+)"/g)].map((match) => match[1]);
const entries = parseVerifiedEntries();
const entryMap = new Map(entries.map((entry) => [entry.id, entry.url]));
const metadataMap = new Map(entries.map((entry) => [entry.id, entry]));
const issues = [];
const hosts = new Set();
const domainCounts = new Map();
const excludedReasonCounts = new Map();
let productDetailCount = 0;
let claimBenefitCount = 0;

function addExcludedReason(reason) {
  excludedReasonCounts.set(reason, (excludedReasonCounts.get(reason) ?? 0) + 1);
}

for (const id of dealIds) {
  const urlValue = entryMap.get(id);
  const metadata = metadataMap.get(id);
  if (!urlValue) {
    issues.push(`${id}: verifiedPurchaseLinks.ts에 실제 구매 상세 URL이 없습니다.`);
    addExcludedReason("missing_direct_link");
    continue;
  }

  if (!metadata?.checkedAt || Number.isNaN(Date.parse(metadata.checkedAt))) {
    issues.push(`${id}: checkedAt 검수 시각이 없거나 ISO 날짜가 아닙니다.`);
    addExcludedReason("manual_review_needed");
  }

  if (!allowedSources.has(metadata?.source)) {
    issues.push(`${id}: source는 manual_review, partner_feed, official_api 중 하나여야 합니다. ${metadata?.source ?? "(없음)"}`);
    addExcludedReason("manual_review_needed");
  }

  if (!metadata?.evidence || metadata.evidence.trim().length < minimums.evidenceLength) {
    issues.push(`${id}: evidence 검수 근거가 부족합니다.`);
    addExcludedReason("manual_review_needed");
  }

  try {
    const url = new URL(urlValue);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    hosts.add(host);
    domainCounts.set(host, (domainCounts.get(host) ?? 0) + 1);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      issues.push(`${id}: http/https가 아닌 URL입니다. ${urlValue}`);
      addExcludedReason("broken_url");
    }

    if (isBlockedHost(host)) {
      issues.push(`${id}: 커뮤니티 또는 placeholder 링크입니다. ${urlValue}`);
      addExcludedReason("community_source");
    }

    if (isHomeOnly(url)) {
      issues.push(`${id}: 쇼핑몰 메인 링크입니다. ${urlValue}`);
      addExcludedReason("redirect_to_home");
    }

    if (isSearchLike(url)) {
      issues.push(`${id}: 검색/카테고리 링크입니다. ${urlValue}`);
      addExcludedReason("search_result_url");
    }

    const productDetailLike = hasProductDetailSignal(url);
    const claimBenefitLike = hasClaimOrBenefitSignal(url, metadata?.evidence ?? "");

    if (productDetailLike) productDetailCount += 1;
    if (!productDetailLike && claimBenefitLike) claimBenefitCount += 1;

    if (!productDetailLike && !claimBenefitLike) {
      issues.push(`${id}: 상품 상세 또는 혜택 신청 페이지로 보기 어려운 URL입니다. ${urlValue}`);
      addExcludedReason("manual_review_needed");
    }
  } catch {
    issues.push(`${id}: 올바른 URL이 아닙니다. ${urlValue}`);
    addExcludedReason("broken_url");
  }
}

const extraEntries = entries.filter((entry) => !dealIds.includes(entry.id));
if (extraEntries.length) {
  issues.push(`사용하지 않는 검증 링크 ID가 있습니다: ${extraEntries.map((entry) => entry.id).join(", ")}`);
  addExcludedReason("manual_review_needed");
}

if (hosts.size < minimums.distinctHosts) {
  issues.push(`검증 링크 판매처 도메인이 부족합니다: ${hosts.size}/${minimums.distinctHosts}`);
  addExcludedReason("manual_review_needed");
}

const report = {
  generatedAt: new Date().toISOString(),
  totalDeals: dealIds.length,
  verificationTargets: dealIds.length,
  passedDirectLinks: issues.length ? Math.max(0, entries.length - issues.length) : entries.length,
  visibleDeals: issues.length ? 0 : dealIds.length,
  excludedDeals: issues.length ? new Set(issues.map((issue) => issue.match(/^(d\d+)/)?.[1]).filter(Boolean)).size : 0,
  productDetailUrls: productDetailCount,
  officialBenefitUrls: claimBenefitCount,
  searchOrCategorySuspected: excludedReasonCounts.get("search_result_url") ?? 0,
  homeOrMainSuspected: excludedReasonCounts.get("redirect_to_home") ?? 0,
  communitySuspected: excludedReasonCounts.get("community_source") ?? 0,
  manualReviewNeeded: excludedReasonCounts.get("manual_review_needed") ?? 0,
  excludedReasonCounts: Object.fromEntries([...excludedReasonCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  domainCounts: Object.fromEntries([...domainCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  issues
};

writeFileSync(join(root, "LINK_VERIFICATION_RESULT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(
  join(root, "LINK_VERIFICATION_REPORT.md"),
  `# 할인도사 Link Verification Report

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
| --- | ---: |
| 총 상품 수 | ${report.totalDeals} |
| 검증 대상 수 | ${report.verificationTargets} |
| 직접 링크 통과 수 | ${report.passedDirectLinks} |
| 노출 가능 상품 수 | ${report.visibleDeals} |
| 제외 상품 수 | ${report.excludedDeals} |
| 상품 상세 URL | ${report.productDetailUrls} |
| 공식 혜택/이벤트 URL | ${report.officialBenefitUrls} |
| 검색/카테고리 의심 | ${report.searchOrCategorySuspected} |
| 메인/홈 링크 의심 | ${report.homeOrMainSuspected} |
| 커뮤니티 의심 | ${report.communitySuspected} |
| 수동 검토 필요 | ${report.manualReviewNeeded} |

## Excluded Reasons

${Object.entries(report.excludedReasonCounts).length ? Object.entries(report.excludedReasonCounts).map(([reason, count]) => `- ${reason}: ${count}`).join("\n") : "- 없음"}

## Domain Distribution

${Object.entries(report.domainCounts).slice(0, 30).map(([domain, count]) => `- ${domain}: ${count}`).join("\n")}

## Issues

${report.issues.length ? report.issues.map((issue) => `- ${issue}`).join("\n") : "- 링크 검증 이슈 없음"}
`,
  "utf8"
);

if (issues.length) {
  console.error("Product link verification failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const coverageRate = dealIds.length ? Math.round((entries.length / dealIds.length) * 100) : 0;
console.log(`Product link verification passed: ${entries.length}/${dealIds.length} verified purchase URLs (${coverageRate}%).`);
console.log(`- Distinct purchase hosts: ${hosts.size}`);
console.log(`- Product detail URLs: ${productDetailCount}`);
console.log(`- Official benefit/event URLs: ${claimBenefitCount}`);
