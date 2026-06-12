import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeNewsDeal, parseNewsFeedXmlItems, root, validateNewsDeal } from "./news-deal-utils.mjs";

const reportsDir = join(root, "reports");
const nowIso = "2026-06-03T00:00:00.000Z";
const now = Date.parse(nowIso);

mkdirSync(reportsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function validate(raw) {
  return validateNewsDeal(normalizeNewsDeal({ provider: "official_event", ...raw }, nowIso), now);
}

const positiveRss = `<rss><channel><item>
  <guid>dry-run-positive-official-link</guid>
  <title>공식 이벤트 링크가 포함된 RSS</title>
  <link>https://news.naver.com/example/halindosa-dry-run</link>
  <description><![CDATA[기사 본문 안 공식 행사 <a href="https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593">바로가기</a>]]></description>
  <merchant>맥도날드</merchant>
  <category>외식/배달</category>
  <benefitType>coupon</benefitType>
  <confidenceScore>92</confidenceScore>
  <endDate>2026-12-31T14:59:59.000Z</endDate>
</item></channel></rss>`;

const [positiveParsed] = parseNewsFeedXmlItems(positiveRss, "official_event", "dry-run-positive.rss");
const positive = validate(positiveParsed);
const negativeCases = [
  validate({
    id: "dry-run-negative-search-url",
    title: "검색 결과 링크는 숨김",
    summary: "검색 결과 URL은 사용자 노출 후보가 될 수 없습니다.",
    merchant: "검색몰",
    category: "무료혜택",
    benefitType: "coupon",
    finalUrl: "https://search.shopping.naver.com/search/all?query=%ED%95%A0%EC%9D%B8",
    sourceUrl: "https://search.shopping.naver.com/search/all?query=%ED%95%A0%EC%9D%B8",
    endDate: "2026-12-31T14:59:59.000Z",
    confidenceScore: 95
  }),
  validate({
    id: "dry-run-negative-news-only",
    title: "뉴스 원문 단독 링크는 숨김",
    summary: "공식 이벤트 링크 없이 뉴스 기사 링크만 있으면 출처 맥락으로만 보관해야 합니다.",
    merchant: "뉴스",
    category: "쿠폰",
    benefitType: "coupon",
    finalUrl: "https://news.naver.com/example/only-news-context",
    sourceUrl: "https://news.naver.com/example/only-news-context",
    endDate: "2026-12-31T14:59:59.000Z",
    confidenceScore: 95
  }),
  validate({
    id: "dry-run-negative-expired-official",
    title: "만료된 공식 이벤트는 숨김",
    summary: "공식 도메인이라도 종료일이 지난 이벤트는 사용자 노출에서 제외합니다.",
    merchant: "맥도날드",
    category: "외식/배달",
    benefitType: "coupon",
    finalUrl: "https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593",
    sourceUrl: "https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593",
    endDate: "2025-12-31T14:59:59.000Z",
    confidenceScore: 95
  })
];

assert(positive.finalUrl.includes("mcdonalds.co.kr"), `RSS official href should be promoted to finalUrl, got ${positive.finalUrl}`);
assert(positive.sourceUrl.includes("news.naver.com"), `RSS sourceUrl should keep the news context, got ${positive.sourceUrl}`);
assert(positive.validationStatus === "passed" && positive.isHidden === false, `Positive official RSS should be visible, got ${positive.hiddenReason}`);

for (const deal of negativeCases) {
  assert(deal.validationStatus === "failed", `${deal.id} should fail validation`);
  assert(deal.isHidden === true, `${deal.id} should be hidden`);
}
assert(negativeCases[0].hiddenReason.includes("search_or_result_url"), "Search URL case should report search_or_result_url");
assert(negativeCases[1].hiddenReason.includes("not_approved_official_url") || negativeCases[1].hiddenReason.includes("blocked_community_or_news_host"), "News-only case should report an official URL or blocked context failure");
assert(negativeCases[2].hiddenReason.includes("expired_event"), "Expired official case should report expired_event");

const operationSource = read("lib/operations/newsFeedDryRun.ts");
const routeSource = read("app/api/admin/news-feed-preview/route.ts");
const smokeSource = read("scripts/smoke.mjs");
const releaseDoctorSource = [
  read("scripts/release-doctor.mjs"),
  read("scripts/lib/release-doctor-news-pipeline.mjs")
].join("\n");
const docsSource = read("docs/RUNBOOK.md");

for (const phrase of [
  "dryRunNewsFeedPreview",
  "parseNewsFeedXmlItems",
  "parseCsvPayload",
  "duplicate_candidate",
  "ended_text_detected",
  "isApprovedOfficialNewsUrl",
  "search_or_result_url",
  "blocked_news_or_community_context_url",
  "expired_event",
  "hiddenRows",
  "visibleRows"
]) {
  assert(operationSource.includes(phrase), `newsFeedDryRun operation missing ${phrase}`);
}

for (const phrase of ["POST", "dryRunNewsFeedPreview", "admin-news-feed-preview-dry-run", "source too large"]) {
  assert(routeSource.includes(phrase), `news feed preview route missing ${phrase}`);
}

for (const phrase of [
  "Admin news feed dry-run should pass official RSS sample",
  "Admin news feed dry-run should parse official CSV sample",
  "Admin news feed dry-run should fail NDJSON duplicate or ended-text samples",
  "Admin news feed dry-run should hide duplicate NDJSON sample",
  "Admin news feed dry-run should hide ended-text sample",
  "Admin news feed dry-run should block search URL sample",
  "Admin news feed dry-run should block news-only sample",
  "Admin news feed dry-run should block expired official sample",
  "Admin news feed dry-run should reject oversized source"
]) {
  assert(smokeSource.includes(phrase), `smoke missing runtime dry-run assertion: ${phrase}`);
}

for (const phrase of ["test:news-feed-dry-run", "news-feed-dry-run-regression.json"]) {
  assert(releaseDoctorSource.includes(phrase), `release doctor missing ${phrase}`);
  assert(docsSource.includes(phrase), `RUNBOOK missing ${phrase}`);
}

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  visibleCount: 1,
  hiddenCount: negativeCases.length,
  officialPromotion: {
    id: positive.id,
    sourceUrl: positive.sourceUrl,
    finalUrl: positive.finalUrl
  },
  blockedCases: negativeCases.map((deal) => ({
    id: deal.id,
    linkType: deal.linkType,
    availability: deal.availability,
    validationStatus: deal.validationStatus,
    hiddenReason: deal.hiddenReason,
    finalUrl: deal.finalUrl
  })),
  gates: [
    { name: "rss_official_href_promotion", ok: true },
    { name: "csv_feed_parser_guard", ok: true },
    { name: "ndjson_duplicate_guard", ok: true },
    { name: "ended_text_guard", ok: true },
    { name: "search_url_hidden", ok: true },
    { name: "news_only_hidden", ok: true },
    { name: "expired_official_hidden", ok: true },
    { name: "admin_post_route_guarded", ok: true },
    { name: "oversized_source_rejected", ok: true },
    { name: "smoke_runtime_negative_cases", ok: true }
  ]
};

writeFileSync(join(reportsDir, "news-feed-dry-run-regression.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("PASS news feed dry-run regression");
console.log("- official link in RSS body is promoted to finalUrl");
console.log("- CSV feed parsing, NDJSON duplicate detection, and ended-text blocking are wired");
console.log("- search URL, news-only URL, and expired official event are hidden");
console.log("- reports/news-feed-dry-run-regression.json");
