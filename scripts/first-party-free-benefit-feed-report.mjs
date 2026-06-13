import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const dataPath = join(root, "data", "refreshedNewsDeals.json");
const reportPath = join(reportsDir, "first-party-free-benefit-feed.json");
const docsPath = join(docsDir, "FIRST_PARTY_FREE_BENEFIT_FEED.md");

const blockedUrlPattern =
  /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const homepagePathPattern = /^\/?(?:index\.(?:html?|php|jsp))?$/i;
const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진/i;
const publicPolicyPattern = /정부|공공|복지|K-MOOC|HRD|고용|문화가 있는 날|서울시|정부24|복지로/i;

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function parseUrl(value) {
  try {
    const parsed = new URL(String(value ?? ""));
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isHomepageLikeUrl(value) {
  const parsed = parseUrl(value);
  if (!parsed) return true;
  return homepagePathPattern.test(parsed.pathname.replace(/\/+$/, ""));
}

function isPublicPolicyItem(item) {
  return publicPolicyPattern.test(`${item.category ?? ""} ${item.mallName ?? ""} ${item.merchant ?? ""} ${item.title ?? ""}`);
}

function isActivePublishable(item, nowMs) {
  const finalUrl = item.finalUrl || item.eventUrl || item.sourceUrl;
  const parsed = parseUrl(finalUrl);
  const endMs = Date.parse(item.expiresAt || item.endDate || "");
  const text = `${item.title ?? ""} ${item.summary ?? ""} ${item.validationReason ?? ""} ${item.hiddenReason ?? ""}`;
  return (
    Boolean(parsed) &&
    item.publishable === true &&
    item.isHidden !== true &&
    item.availability === "active" &&
    item.validationStatus === "passed" &&
    item.linkType !== "search" &&
    !blockedUrlPattern.test(finalUrl) &&
    !isHomepageLikeUrl(finalUrl) &&
    !endedTextPattern.test(text) &&
    (!Number.isFinite(endMs) || endMs >= nowMs)
  );
}

function canonicalBenefitBuckets(item, nowMs) {
  const haystack = `${item.title ?? ""} ${item.summary ?? ""} ${item.benefitType ?? ""} ${Array.isArray(item.tags) ? item.tags.join(" ") : ""}`;
  const buckets = new Set();
  const type = String(item.benefitType ?? "");
  if (/전원|모두|100%|전체\s*지급|freebie/i.test(haystack)) buckets.add("everyone");
  if (/선착순|한정|소진\s*시|first/i.test(haystack)) buckets.add("firstCome");
  if (/coupon|쿠폰|card|membership|멤버십/i.test(type) || /쿠폰|멤버십|카드/i.test(haystack)) buckets.add("coupon");
  if (/sample|샘플|체험팩/i.test(haystack)) buckets.add("sample");
  if (/freeTrial|무료\s*체험/i.test(haystack)) buckets.add("freeTrial");
  if (/gifticon|기프티콘|초대권/i.test(haystack)) buckets.add("gifticon");
  if (/point|cashback|포인트|캐시백|페이/i.test(haystack)) buckets.add("pointCashback");
  if (/freeShipping|무료\s*배송|무배/i.test(haystack)) buckets.add("freeShipping");
  if (/signup|신규|가입|웰컴/i.test(haystack)) buckets.add("signup");

  const endMs = Date.parse(item.expiresAt || item.endDate || "");
  if (Number.isFinite(endMs)) {
    const hoursLeft = (endMs - nowMs) / 36e5;
    if (hoursLeft >= 0 && hoursLeft <= 24) buckets.add("today");
    if (hoursLeft >= 0 && hoursLeft <= 24 * 7) buckets.add("week");
  }

  if (!buckets.size) buckets.add("brandEvent");
  return [...buckets];
}

function topCounts(values, limit = 12) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "ko"))
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

function dedupeKey(item) {
  const finalUrl = parseUrl(item.finalUrl || item.eventUrl || item.sourceUrl);
  const domain = finalUrl?.hostname.replace(/^www\./, "").toLowerCase() ?? "";
  return [
    normalizeKey(item.title),
    normalizeKey(item.mallName || item.merchant || item.sourceName),
    domain,
    normalizeKey(item.benefitType),
    item.expiresAt || item.endDate || ""
  ].join("|");
}

const now = Date.now();
const generatedAt = new Date(now).toISOString();
const payload = readJson(dataPath, []);
const items = Array.isArray(payload) ? payload : Array.isArray(payload.deals) ? payload.deals : [];
const activePublishable = items.filter((item) => isActivePublishable(item, now));
const consumerPublishable = activePublishable.filter((item) => !isPublicPolicyItem(item));
const publicPolicyPublishable = activePublishable.filter((item) => isPublicPolicyItem(item));
const hiddenOrInvalid = items.filter((item) => !isActivePublishable(item, now));
const blockedSearchLinks = items.filter((item) => blockedUrlPattern.test(item.finalUrl || item.eventUrl || item.sourceUrl || ""));
const homepageLinks = items.filter((item) => isHomepageLikeUrl(item.finalUrl || item.eventUrl || item.sourceUrl));
const expiredItems = items.filter((item) => {
  const endMs = Date.parse(item.expiresAt || item.endDate || "");
  return Number.isFinite(endMs) && endMs < now;
});
const duplicateGroups = [...activePublishable.reduce((acc, item) => {
  const key = dedupeKey(item);
  const group = acc.get(key) ?? [];
  group.push(item.id);
  acc.set(key, group);
  return acc;
}, new Map()).entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([key, ids]) => ({ key, ids, count: ids.length }));

const categoryCounts = topCounts(activePublishable.flatMap((item) => canonicalBenefitBuckets(item, now)), 20);
const consumerCategoryCounts = topCounts(consumerPublishable.flatMap((item) => canonicalBenefitBuckets(item, now)), 20);
const hostCounts = topCounts(
  activePublishable.map((item) => parseUrl(item.finalUrl || item.eventUrl || item.sourceUrl)?.hostname.replace(/^www\./, "").toLowerCase()),
  20
);
const consumerHostCounts = topCounts(
  consumerPublishable.map((item) => parseUrl(item.finalUrl || item.eventUrl || item.sourceUrl)?.hostname.replace(/^www\./, "").toLowerCase()),
  20
);
const topCandidates = consumerPublishable
  .slice()
  .sort(
    (a, b) =>
      Number(b.qualityScore ?? b.priorityScore ?? 0) - Number(a.qualityScore ?? a.priorityScore ?? 0) ||
      Date.parse(b.verifiedAt || b.lastCheckedAt || b.updatedAt || "") - Date.parse(a.verifiedAt || a.lastCheckedAt || a.updatedAt || "")
  )
  .slice(0, 20)
  .map((item) => ({
    id: item.id,
    title: item.title,
    brand: item.mallName || item.merchant || item.sourceName,
    benefitType: item.benefitType,
    finalUrl: item.finalUrl,
    expiresAt: item.expiresAt || item.endDate,
    qualityScore: item.qualityScore,
    freshnessScore: item.freshnessScore ?? 0,
    verifiedAt: item.verifiedAt || item.lastCheckedAt || item.updatedAt
  }));

const report = {
  ok:
    activePublishable.length >= 100 &&
    consumerPublishable.length >= 80 &&
    blockedSearchLinks.filter((item) => activePublishable.includes(item)).length === 0 &&
    homepageLinks.filter((item) => activePublishable.includes(item)).length === 0 &&
    duplicateGroups.length === 0 &&
    topCandidates.every((item) => !publicPolicyPattern.test(`${item.brand ?? ""} ${item.title ?? ""}`)),
  generatedAt,
  source: "data/refreshedNewsDeals.json",
  feedEndpoint: "/api/feeds/free-benefits",
  summary: {
    totalItems: items.length,
    publishableItems: activePublishable.length,
    consumerPublishableItems: consumerPublishable.length,
    publicPolicyPublishableItems: publicPolicyPublishable.length,
    hiddenOrInvalidItems: hiddenOrInvalid.length,
    blockedSearchLinkItems: blockedSearchLinks.length,
    homepageLikeItems: homepageLinks.length,
    expiredItems: expiredItems.length,
    duplicateGroups: duplicateGroups.length,
    officialRate: activePublishable.length
      ? Math.round((activePublishable.filter((item) => /official/i.test(`${item.source ?? ""} ${item.linkType ?? ""}`)).length / activePublishable.length) * 100)
      : 0,
    averageQualityScore: activePublishable.length
      ? Math.round(activePublishable.reduce((sum, item) => sum + Number(item.qualityScore ?? item.priorityScore ?? 0), 0) / activePublishable.length)
      : 0
  },
  categoryCounts,
  consumerCategoryCounts,
  hostCounts,
  consumerHostCounts,
  duplicateGroups,
  excludedSamples: hiddenOrInvalid.slice(0, 30).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.hiddenReason || item.validationReason || item.validationStatus || item.availability || "not_publishable",
    finalUrl: item.finalUrl || item.eventUrl || item.sourceUrl
  })),
  topCandidates
};

function buildMarkdown(data) {
  const lines = [
    "# First-party 무료혜택 Feed 리포트",
    "",
    `- 생성 시각: ${data.generatedAt}`,
    `- feed endpoint: \`${data.feedEndpoint}\``,
    `- 원본 스냅샷: \`${data.source}\``,
    `- 상태: ${data.ok ? "통과" : "확인 필요"}`,
    "",
    "## 요약",
    "",
    `- 전체 후보: ${data.summary.totalItems}개`,
    `- 사용자 노출 가능: ${data.summary.publishableItems}개`,
    `- 소비자형 노출 가능: ${data.summary.consumerPublishableItems}개`,
    `- 공공/교육성 보관 가능: ${data.summary.publicPolicyPublishableItems}개`,
    `- 제외/숨김 후보: ${data.summary.hiddenOrInvalidItems}개`,
    `- 검색 링크 후보: ${data.summary.blockedSearchLinkItems}개`,
    `- 대표/메인 URL 후보: ${data.summary.homepageLikeItems}개`,
    `- 만료 후보: ${data.summary.expiredItems}개`,
    `- 중복 그룹: ${data.summary.duplicateGroups}개`,
    `- 공식 링크 비율: ${data.summary.officialRate}%`,
    `- 평균 품질 점수: ${data.summary.averageQualityScore}점`,
    "",
    "## 무료혜택 카테고리",
    "",
    "| 카테고리 | 수량 |",
    "| --- | ---: |",
    ...data.categoryCounts.map((row) => `| ${row.id} | ${row.count} |`),
    "",
    "## 소비자형 카테고리",
    "",
    "| 카테고리 | 수량 |",
    "| --- | ---: |",
    ...data.consumerCategoryCounts.map((row) => `| ${row.id} | ${row.count} |`),
    "",
    "## 상위 공식 도메인",
    "",
    "| 도메인 | 수량 |",
    "| --- | ---: |",
    ...data.hostCounts.map((row) => `| ${row.id} | ${row.count} |`),
    "",
    "## 소비자형 공식 도메인",
    "",
    "| 도메인 | 수량 |",
    "| --- | ---: |",
    ...data.consumerHostCounts.map((row) => `| ${row.id} | ${row.count} |`),
    "",
    "## 홈 상단 추천 후보",
    "",
    "| 브랜드 | 혜택 | 유형 | 마감 | 점수 |",
    "| --- | --- | --- | --- | ---: |",
    ...data.topCandidates
      .slice(0, 12)
      .map((item) => `| ${item.brand} | ${item.title} | ${item.benefitType} | ${item.expiresAt || "-"} | ${item.qualityScore ?? 0} |`),
    "",
    "## 운영 원칙",
    "",
    "- `/api/feeds/free-benefits`는 publishable, active, validationStatus=passed, 공식 URL 중심 혜택만 내보낸다.",
    "- 검색 결과, 커뮤니티, 블로그, 뉴스, 쇼핑몰 대표/메인 URL은 사용자 CTA에 노출하지 않는다.",
    "- 공공/교육성 혜택은 기본 홈 상위 노출보다 명시 필터 또는 별도 카테고리에서 다룬다.",
    "- Vercel Production에 최신 커밋이 올라간 뒤 `BENEFIT_REFRESH_FEED_URLS=https://www.halindosa.com/api/feeds/free-benefits`를 smoke/starter feed로 연결할 수 있다.",
    ""
  ];

  if (data.duplicateGroups.length) {
    lines.push("## 중복 후보");
    lines.push("");
    for (const group of data.duplicateGroups.slice(0, 10)) lines.push(`- ${group.key}: ${group.ids.join(", ")}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildMarkdown(report), "utf8");

if (!report.ok) {
  console.error("First-party free benefit feed report failed:");
  console.error(JSON.stringify(report.summary, null, 2));
  process.exit(1);
}

console.log("First-party free benefit feed report passed.");
console.log(`- publishable: ${report.summary.publishableItems}/${report.summary.totalItems}`);
console.log(`- consumer publishable: ${report.summary.consumerPublishableItems}`);
console.log(`- search links: ${report.summary.blockedSearchLinkItems}`);
console.log(`- duplicate groups: ${report.summary.duplicateGroups}`);
console.log(`- ${reportPath}`);
console.log(`- ${docsPath}`);
