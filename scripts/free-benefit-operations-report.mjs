import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function readJson(relativePath, fallback = {}) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const value = String(selector(item) || "미분류").trim() || "미분류";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")));
}

function average(items, selector) {
  const values = items.map(selector).map(Number).filter(Number.isFinite);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function firstFinite(...values) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
}

function getHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isToday(value, now = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

function isThisWeek(value, now = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  const diffMs = date.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function getOfficialBenefits(snapshot) {
  const source = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : Array.isArray(snapshot.deals) ? snapshot.deals : [];
  return source.filter((deal) => {
    const text = [deal.title, deal.summary, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")].join(" ");
    return /무료|0원|무배|무료배송|쿠폰|포인트|샘플|체험|초대|지원|증정|1\+1|2\+1|행사|이벤트|리워드|멤버십|카드|배달|편의점|마트/.test(text);
  });
}

function isVisibleOfficialBenefit(item, now = Date.now()) {
  const endTime = Date.parse(String(item.expiresAt || item.endDate || ""));
  const expired = Number.isFinite(endTime) && endTime < now;
  return (
    item.publishable === true &&
    item.isHidden !== true &&
    item.validationStatus === "passed" &&
    item.availability === "active" &&
    String(item.linkType || "").startsWith("official") &&
    Boolean(item.finalUrl) &&
    !expired
  );
}

const now = new Date();
const newsSnapshot = readJson("data/refreshedNewsDeals.json", {});
const freebiesVerification = readJson("reports/freebies-verification.json", {});
const eventVerification = readJson("reports/free-benefit-events.json", {});
const benefitsRefresh = readJson("reports/benefits-refresh.json", {});

const candidates = getOfficialBenefits(newsSnapshot);
const visible = candidates.filter((item) => isVisibleOfficialBenefit(item, now.getTime()));
const excluded = candidates.filter((item) => !isVisibleOfficialBenefit(item, now.getTime()));
const hosts = new Set(visible.map((item) => getHost(item.finalUrl)).filter(Boolean));
const brands = new Set(visible.map((item) => String(item.merchant || item.mallName || item.sourceName || "").trim()).filter(Boolean));
const topCandidates = visible
  .slice()
  .sort((a, b) => Number(b.qualityScore ?? b.priorityScore ?? 0) - Number(a.qualityScore ?? a.priorityScore ?? 0))
  .slice(0, 25)
  .map((item) => ({
    id: item.id,
    title: item.title,
    brand: item.merchant || item.mallName || item.sourceName || "",
    benefitType: item.benefitType || "event",
    category: item.category || "무료혜택",
    finalUrl: item.finalUrl,
    redirectUrl: `/go/news/${item.id}`,
    endDate: item.expiresAt || item.endDate || "",
    lastCheckedAt: item.verifiedAt || item.lastCheckedAt || "",
    qualityScore: item.qualityScore ?? item.priorityScore ?? 0,
    rewardScore: item.rewardScore ?? null,
    freshnessScore: item.freshnessScore ?? null
  }));

const excludedReasons = countBy(excluded, (item) => {
  if (item.isHidden === true) return item.hiddenReason || "hidden";
  if (item.validationStatus !== "passed") return item.validationReason || item.validationStatus || "validation_failed";
  if (item.availability !== "active") return item.availability || "inactive";
  if (!String(item.linkType || "").startsWith("official")) return item.linkType || "non_official";
  if (!item.finalUrl) return "missing_final_url";
  const endTime = Date.parse(String(item.expiresAt || item.endDate || ""));
  if (Number.isFinite(endTime) && endTime < now.getTime()) return "expired";
  return "not_publishable";
});

const report = {
  ok:
    visible.length >= 100 &&
    hosts.size >= 45 &&
    Number(freebiesVerification.exposedSearchLinks ?? 0) === 0 &&
    Number(freebiesVerification.exposedNonOfficialLinks ?? 0) === 0 &&
    Number(freebiesVerification.brokenImages ?? 0) === 0 &&
    eventVerification.ok === true &&
    benefitsRefresh.ok === true,
  generatedAt: now.toISOString(),
  sourceSnapshotGeneratedAt: newsSnapshot.generatedAt ?? "",
  refreshStatus: {
    benefitsRefreshOk: benefitsRefresh.ok === true,
    benefitsRefreshGeneratedAt: benefitsRefresh.generatedAt ?? "",
    freebiesVerificationOk: freebiesVerification.ok === true,
    eventVerificationOk: eventVerification.ok === true
  },
  totals: {
    rawOfficialBenefitItems: candidates.length,
    visibleOfficialBenefitItems: visible.length,
    excludedOfficialBenefitItems: excluded.length,
    officialHosts: hosts.size,
    brands: brands.size,
    lowFrictionVisibleItems: freebiesVerification.lowFrictionVisibleCount ?? 0,
    todayEndingVisibleItems: visible.filter((item) => isToday(item.expiresAt || item.endDate, now)).length,
    thisWeekEndingVisibleItems: visible.filter((item) => isThisWeek(item.expiresAt || item.endDate, now)).length
  },
  qualityGates: {
    exposedSearchLinks: freebiesVerification.exposedSearchLinks ?? 0,
    exposedNonOfficialLinks: freebiesVerification.exposedNonOfficialLinks ?? 0,
    brokenImages: freebiesVerification.brokenImages ?? 0,
    duplicateMergedCount: eventVerification.duplicateMergedCount ?? 0,
    expiredEvents: eventVerification.expiredEvents ?? 0,
    blockedEvents: eventVerification.blockedEvents ?? 0
  },
  scoreAverages: {
    qualityScore: firstFinite(eventVerification.averageScores?.quality, average(visible, (item) => item.qualityScore ?? item.priorityScore ?? 0)),
    freshnessScore: firstFinite(eventVerification.averageScores?.freshness, average(visible, (item) => item.freshnessScore)),
    officialScore: firstFinite(eventVerification.averageScores?.official, average(visible, (item) => item.officialScore)),
    urgencyScore: firstFinite(eventVerification.averageScores?.urgency, average(visible, (item) => item.urgencyScore)),
    rewardScore: firstFinite(eventVerification.averageScores?.reward, average(visible, (item) => item.rewardScore))
  },
  categoryCounts: countBy(visible, (item) => item.category),
  benefitTypeCounts: countBy(visible, (item) => item.benefitType),
  sourceCounts: countBy(visible, (item) => item.sourceName),
  excludedReasons,
  topCandidates
};

const markdown = [
  "# 무료혜택 운영 리포트",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## 요약",
  "",
  `- 상태: ${report.ok ? "PASS" : "FAIL"}`,
  `- 노출 가능한 공식 무료혜택: ${report.totals.visibleOfficialBenefitItems}개`,
  `- 제외된 공식 무료혜택 후보: ${report.totals.excludedOfficialBenefitItems}개`,
  `- 공식 도메인: ${report.totals.officialHosts}개`,
  `- 브랜드/출처: ${report.totals.brands}개`,
  `- 오늘 마감: ${report.totals.todayEndingVisibleItems}개`,
  `- 이번주 마감: ${report.totals.thisWeekEndingVisibleItems}개`,
  `- 검색 링크 노출: ${report.qualityGates.exposedSearchLinks}개`,
  `- 비공식 링크 노출: ${report.qualityGates.exposedNonOfficialLinks}개`,
  `- 깨진 이미지: ${report.qualityGates.brokenImages}개`,
  "",
  "## 품질 점수 평균",
  "",
  `- 품질: ${report.scoreAverages.qualityScore}`,
  `- 최신성: ${report.scoreAverages.freshnessScore}`,
  `- 공식성: ${report.scoreAverages.officialScore}`,
  `- 마감성: ${report.scoreAverages.urgencyScore}`,
  `- 보상가치: ${report.scoreAverages.rewardScore}`,
  "",
  "## 카테고리별 노출 수",
  "",
  "| 카테고리 | 수량 |",
  "| --- | ---: |",
  ...Object.entries(report.categoryCounts).map(([name, count]) => `| ${name} | ${count} |`),
  "",
  "## 혜택 유형별 노출 수",
  "",
  "| 혜택 유형 | 수량 |",
  "| --- | ---: |",
  ...Object.entries(report.benefitTypeCounts).map(([name, count]) => `| ${name} | ${count} |`),
  "",
  "## 제외 사유",
  "",
  "| 사유 | 수량 |",
  "| --- | ---: |",
  ...Object.entries(report.excludedReasons).map(([name, count]) => `| ${name} | ${count} |`),
  "",
  "## 상위 노출 후보",
  "",
  "| ID | 제목 | 출처 | 유형 | 점수 | 이동 경로 |",
  "| --- | --- | --- | --- | ---: | --- |",
  ...report.topCandidates.map((item) => `| ${item.id} | ${String(item.title).replace(/\|/g, "/")} | ${String(item.brand).replace(/\|/g, "/")} | ${item.benefitType} | ${item.qualityScore} | \`${item.redirectUrl}\` |`),
  "",
  "## 운영 정책",
  "",
  "- 사용자 CTA에는 공식 이벤트, 공식 쿠폰, 공식 샘플, 공식 신청 페이지처럼 직접 혜택 확인이 가능한 URL만 연결한다.",
  "- 검색 결과, 대표몰 메인, 커뮤니티 글, 뉴스 기사, 종료/품절/미검증 링크는 노출하지 않는다.",
  "- 새 혜택 수집 후 `refresh:benefits`와 `benefit:operations:report`를 실행하면 운영자가 최신 상태를 한눈에 확인할 수 있다.",
  ""
].join("\n");

writeFileSync(join(reportsDir, "free-benefit-operations.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "FREE_BENEFIT_OPERATIONS_REPORT.md"), `${markdown}\n`, "utf8");

console.log(`무료혜택 운영 리포트: ${report.totals.visibleOfficialBenefitItems} visible, ${report.totals.excludedOfficialBenefitItems} excluded`);
console.log("- reports/free-benefit-operations.json");
console.log("- docs/FREE_BENEFIT_OPERATIONS_REPORT.md");

if (!report.ok) {
  console.error("무료혜택 운영 리포트 기준을 통과하지 못했습니다.");
  process.exit(1);
}
