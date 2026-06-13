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

function hoursSince(value, now = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.round(((now.getTime() - date.getTime()) / (60 * 60 * 1000)) * 10) / 10;
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

function isRecentlyCreated(value, now = new Date(), hours = 24) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

function buildOperatorActionQueue({ reportCore, visible, now }) {
  const actions = [];
  const staleThresholdHours = 6;
  const latestRefreshAgeHours = hoursSince(reportCore.refreshStatus.benefitsRefreshGeneratedAt, now);
  const requiredBenefitTypes = [
    ["freebie", "전원증정"],
    ["sample", "무료 샘플"],
    ["freeTrial", "무료체험"],
    ["coupon", "쿠폰"],
    ["gifticon", "기프티콘"],
    ["point", "포인트/캐시백"],
    ["freeShipping", "무료배송"],
    ["signup", "신규가입"],
    ["checkIn", "출석체크"],
    ["convenienceStore", "편의점"]
  ];
  const benefitTypeCounts = reportCore.benefitTypeCounts ?? {};
  const lowCoverageTypes = requiredBenefitTypes
    .map(([type, label]) => ({ type, label, count: Number(benefitTypeCounts[type] ?? 0) }))
    .filter((item) => item.count < 2);
  const todayCount = Number(reportCore.totals.todayEndingVisibleItems ?? 0);
  const weekCount = Number(reportCore.totals.thisWeekEndingVisibleItems ?? 0);
  const searchLinks = Number(reportCore.qualityGates.exposedSearchLinks ?? 0);
  const nonOfficialLinks = Number(reportCore.qualityGates.exposedNonOfficialLinks ?? 0);
  const brokenImages = Number(reportCore.qualityGates.brokenImages ?? 0);
  const excludedCount = Number(reportCore.totals.excludedOfficialBenefitItems ?? 0);

  if (latestRefreshAgeHours > staleThresholdHours) {
    actions.push({
      id: "refresh-official-benefits",
      priority: latestRefreshAgeHours >= 24 ? "high" : "medium",
      area: "수집 갱신",
      title: "공식 무료혜택 스냅샷 갱신",
      reason: `마지막 refresh가 ${latestRefreshAgeHours}시간 전입니다. 운영 홈과 WebView 앱의 최신성을 먼저 회복해야 합니다.`,
      action: "npm run refresh:benefits && npm run verify:freebies && npm run benefit:operations:report",
      href: "/api/admin/free-benefit-operations",
      evidence: `${reportCore.refreshStatus.benefitsRefreshGeneratedAt || "unknown"}`
    });
  }

  if (searchLinks > 0 || nonOfficialLinks > 0 || brokenImages > 0) {
    actions.push({
      id: "block-untrusted-benefit-links",
      priority: "high",
      area: "링크 품질",
      title: "비공식·검색·깨진 이미지 노출 차단",
      reason: `검색 ${searchLinks}건, 비공식 ${nonOfficialLinks}건, 깨진 이미지 ${brokenImages}건이 감지되면 사용자 CTA를 즉시 막아야 합니다.`,
      action: "npm run verify:freebies로 실패 항목을 찾고 공식 이벤트 URL 또는 이미지로 교체",
      href: "/admin",
      evidence: `search=${searchLinks}; nonOfficial=${nonOfficialLinks}; brokenImages=${brokenImages}`
    });
  }

  if (todayCount === 0 && weekCount > 0) {
    actions.push({
      id: "promote-week-deadline",
      priority: "low",
      area: "마감 편성",
      title: "이번주마감 대체 편성 활성",
      reason: "오늘마감 혜택은 0건이지만 이번주 마감 혜택이 있어 고객 화면은 대체 슬롯으로 유지됩니다.",
      action: "이번주마감 후보를 홈 마감임박 영역에 유지하고 오늘마감 0건 카피는 숨김",
      href: "/free-benefits?deadline=week",
      evidence: `today=${todayCount}; week=${weekCount}`
    });
  } else if (todayCount > 0) {
    actions.push({
      id: "review-today-deadline",
      priority: "high",
      area: "마감 편성",
      title: "오늘마감 무료혜택 우선 검수",
      reason: `오늘 종료되는 공식 혜택 ${todayCount}개는 고객 클릭 전 종료 문구를 다시 확인해야 합니다.`,
      action: "오늘마감 링크를 먼저 열어 종료 문구가 있으면 즉시 숨김 처리",
      href: "/free-benefits?deadline=today",
      evidence: `today=${todayCount}`
    });
  }

  if (lowCoverageTypes.length) {
    actions.push({
      id: "fill-benefit-type-gaps",
      priority: lowCoverageTypes.length >= 3 ? "medium" : "low",
      area: "카테고리 보강",
      title: "혜택 유형 공백 보강",
      reason: lowCoverageTypes.map((item) => `${item.label} ${item.count}개`).join(", "),
      action: "공식 소스 카탈로그와 feed env 후보에서 부족한 유형의 공식 이벤트 URL을 우선 추가",
      href: "/admin",
      evidence: lowCoverageTypes.map((item) => `${item.type}:${item.count}`).join("; ")
    });
  }

  if (excludedCount > 0) {
    actions.push({
      id: "review-hidden-benefits",
      priority: "medium",
      area: "제외 후보",
      title: "숨김 처리된 공식 혜택 후보 재검토",
      reason: `공식 혜택 후보 ${excludedCount}개가 노출 조건을 통과하지 못했습니다.`,
      action: "excludedReasons를 확인해 종료/미검증/비공식 사유별로 공식 URL 또는 마감일을 보강",
      href: "/api/admin/free-benefit-operations?format=csv",
      evidence: Object.entries(reportCore.excludedReasons ?? {}).map(([name, count]) => `${name}:${count}`).join("; ")
    });
  }

  if (!actions.length) {
    const topNoPurchase = visible
      .filter((item) => item.requiresPurchase !== true)
      .slice()
      .sort((a, b) => Number(b.rewardScore ?? 0) - Number(a.rewardScore ?? 0))
      .slice(0, 3)
      .map((item) => item.title);
    actions.push({
      id: "maintain-high-quality-rotation",
      priority: "low",
      area: "홈 편성",
      title: "고품질 무료혜택 회전 편성 유지",
      reason: "검색·비공식·깨진 이미지가 0건이며 공식 무료혜택 풀이 안정적입니다.",
      action: "상위 후보를 브랜드 중복 없이 홈 무료혜택, 즉시 수령, 이번주마감 슬롯에 회전 노출",
      href: "/free-benefits",
      evidence: topNoPurchase.join(" / ")
    });
  }

  return actions
    .sort((a, b) => {
      const weights = { high: 0, medium: 1, low: 2 };
      return (weights[a.priority] ?? 3) - (weights[b.priority] ?? 3) || a.area.localeCompare(b.area, "ko");
    })
    .slice(0, 8);
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
const officialLinkRate = visible.length
  ? Math.round((visible.filter((item) => String(item.linkType || "").startsWith("official")).length / visible.length) * 100)
  : 0;
const newOfficialBenefitItems = visible.filter((item) => isRecentlyCreated(item.updatedAt || item.createdAt || item.startDate, now, 24)).length;
const expiredExcludedItems = excluded.filter((item) => {
  const endTime = Date.parse(String(item.expiresAt || item.endDate || ""));
  return Number.isFinite(endTime) && endTime < now.getTime();
}).length;

const reportCore = {
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
    newOfficialBenefitItems,
    visibleOfficialBenefitItems: visible.length,
    excludedOfficialBenefitItems: excluded.length,
    expiredExcludedItems,
    officialHosts: hosts.size,
    brands: brands.size,
    officialLinkRate,
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

const operatorActionQueue = buildOperatorActionQueue({ reportCore, visible, now });
const report = {
  ...reportCore,
  operatorActionQueue
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
  `- 24시간 내 신규/갱신 무료혜택: ${report.totals.newOfficialBenefitItems}개`,
  `- 제외된 공식 무료혜택 후보: ${report.totals.excludedOfficialBenefitItems}개`,
  `- 만료 제외 후보: ${report.totals.expiredExcludedItems}개`,
  `- 공식 링크 비율: ${report.totals.officialLinkRate}%`,
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
  "## 오늘 운영 액션 큐",
  "",
  "| 우선순위 | 영역 | 작업 | 이유 | 실행 |",
  "| --- | --- | --- | --- | --- |",
  ...report.operatorActionQueue.map((item) => `| ${item.priority} | ${item.area} | ${String(item.title).replace(/\|/g, "/")} | ${String(item.reason).replace(/\|/g, "/")} | ${String(item.action).replace(/\|/g, "/")} |`),
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
