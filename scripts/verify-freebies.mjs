import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
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

const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum/i;
const freeIntentPattern = /무료|0원|무배|무료배송|쿠폰|포인트|샘플|체험|초대|지원|증정|1\+1|2\+1|행사|이벤트|리워드|멤버십|카드|배달|편의점|마트/;
const freeBenefitTypes = new Set(["coupon", "freebie", "freeShipping", "event", "point", "public"]);

function isFreebieCandidate(deal) {
  const searchable = [deal.title, deal.summary, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")].join(" ");
  return freeBenefitTypes.has(deal.benefitType) || deal.category === "무료혜택" || freeIntentPattern.test(searchable);
}

function isPublishableFreebie(deal, now = Date.now()) {
  const endTime = Date.parse(String(deal.expiresAt || deal.endDate || ""));
  const expired = Number.isFinite(endTime) && endTime < now;

  return (
    isFreebieCandidate(deal) &&
    deal.publishable === true &&
    deal.isHidden !== true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    String(deal.linkType || "").startsWith("official") &&
    isHttpUrl(deal.finalUrl) &&
    !blockedUrlPattern.test(String(deal.finalUrl || "")) &&
    !expired &&
    Number(deal.qualityScore ?? deal.priorityScore ?? 0) >= 70
  );
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    const value = String(item[key] || "미분류");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")));
}

const now = Date.now();
const generatedAt = new Date(now).toISOString();
const snapshot = readJson("data/refreshedNewsDeals.json", {});
const source = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : Array.isArray(snapshot.deals) ? snapshot.deals : [];
const candidates = source.filter(isFreebieCandidate);
const visible = candidates.filter((deal) => isPublishableFreebie(deal, now));
const blocked = candidates.filter((deal) => !isPublishableFreebie(deal, now));
const exposedSearchLinks = visible.filter((deal) => blockedUrlPattern.test(String(deal.finalUrl || "")) || deal.linkType === "search").length;
const exposedNonOfficialLinks = visible.filter((deal) => !String(deal.linkType || "").startsWith("official")).length;
const brokenImages = visible.filter((deal) => !deal.imageUrl || String(deal.imageUrl).includes("example.com")).length;
const minimumVisible = 27;
const ok = visible.length >= minimumVisible && exposedSearchLinks === 0 && exposedNonOfficialLinks === 0 && brokenImages === 0;

const report = {
  ok,
  generatedAt,
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  totalOfficialBenefits: source.length,
  candidateCount: candidates.length,
  visibleCount: visible.length,
  blockedCount: blocked.length,
  exposedSearchLinks,
  exposedNonOfficialLinks,
  brokenImages,
  minimumVisible,
  categoryCounts: countBy(visible, "category"),
  benefitTypeCounts: countBy(visible, "benefitType"),
  sourceCounts: countBy(visible, "sourceName"),
  topItems: visible.slice(0, 20).map((deal) => ({
    id: deal.id,
    title: deal.title,
    sourceName: deal.sourceName,
    benefitType: deal.benefitType,
    finalUrl: deal.finalUrl,
    redirectUrl: `/go/news/${deal.id}`,
    expiresAt: deal.expiresAt || deal.endDate,
    verifiedAt: deal.verifiedAt || deal.lastCheckedAt
  })),
  blockedItems: blocked.slice(0, 30).map((deal) => ({
    id: deal.id,
    title: deal.title,
    reason: deal.hiddenReason || deal.validationReason || deal.validationCode || "not_publishable_freebie",
    linkType: deal.linkType,
    availability: deal.availability,
    validationStatus: deal.validationStatus,
    finalUrl: deal.finalUrl
  }))
};

const docs = [
  "# 무료혜택 Verification Report",
  "",
  `Generated: ${generatedAt}`,
  "",
  "## Summary",
  "",
  `- Status: ${ok ? "PASS" : "FAIL"}`,
  `- Visible official freebies: ${visible.length}`,
  `- Candidate freebies: ${candidates.length}`,
  `- Blocked freebies: ${blocked.length}`,
  `- Exposed search links: ${exposedSearchLinks}`,
  `- Exposed non-official links: ${exposedNonOfficialLinks}`,
  `- Broken images: ${brokenImages}`,
  "",
  "## Policy",
  "",
  "무료/쿠폰/0원/무배/공식 이벤트는 publishable=true, active, validationStatus=passed, official linkType, http(s) finalUrl, 검색/커뮤니티 URL 차단, 품질점수 70 이상 조건을 모두 만족해야 홈 상단에 노출됩니다.",
  "",
  "## Top Items",
  "",
  "| ID | Title | Source | Type | Redirect |",
  "| --- | --- | --- | --- | --- |",
  ...report.topItems.map((item) => `| ${item.id} | ${String(item.title).replace(/\|/g, "/")} | ${item.sourceName} | ${item.benefitType} | \`${item.redirectUrl}\` |`),
  ""
].join("\n");

writeFileSync(join(root, "reports/freebies-verification.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(root, "docs/FREEBIES_VERIFICATION_REPORT.md"), `${docs}\n`, "utf8");

console.log(`무료혜택 검증: ${visible.length}/${candidates.length} visible`);
console.log(`검색 링크 노출: ${exposedSearchLinks}`);
console.log(`비공식 링크 노출: ${exposedNonOfficialLinks}`);
console.log(`깨진 이미지: ${brokenImages}`);
console.log("- reports/freebies-verification.json");
console.log("- docs/FREEBIES_VERIFICATION_REPORT.md");

if (!ok) {
  console.error("무료혜택 검증 기준을 통과하지 못했습니다.");
  process.exit(1);
}
