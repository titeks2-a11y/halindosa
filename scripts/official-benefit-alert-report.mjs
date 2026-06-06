import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "official-benefit-alerts.json");
const docsPath = join(docsDir, "OFFICIAL_BENEFIT_ALERTS_REPORT.md");

const defaultInterests = ["무료/체험", "쿠폰/이벤트", "마트/편의점", "영화/문화"];
const supportedInterests = [
  ...defaultInterests,
  "카드/멤버십",
  "정부/공공혜택",
  "여행",
  "식품",
  "생활용품",
  "디지털",
  "패션",
  "뷰티",
  "외식/배달"
];

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function uniqueValues(values = [], limit = 12) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).slice(0, limit);
}

function textOf(deal) {
  return [deal.title, deal.summary, deal.merchant, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")]
    .filter(Boolean)
    .join(" ");
}

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseTime(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

function isActiveOfficialBenefit(deal) {
  const endTime = parseTime(deal.endDate);

  return (
    deal.validationStatus === "passed" &&
    !deal.isHidden &&
    isHttpUrl(deal.finalUrl) &&
    (deal.availability ?? "active") === "active" &&
    (endTime === null || endTime >= Date.now()) &&
    String(deal.linkType ?? "official_benefit").startsWith("official")
  );
}

function matchesInterest(deal, interest) {
  const searchable = textOf(deal);

  if (interest === "무료/체험") return deal.category === "무료혜택" || /무료|체험|샘플|0원/.test(searchable);
  if (interest === "쿠폰/이벤트") return deal.benefitType === "coupon" || /쿠폰|이벤트|포인트|혜택/.test(searchable);
  if (interest === "마트/편의점") return deal.category === "마트/편의점" || /마트|편의점|1\+1|2\+1/.test(searchable);
  if (interest === "외식/배달") return deal.category === "외식/배달" || deal.benefitType === "foodDelivery";
  if (interest === "영화/문화") return deal.category === "영화/문화" || deal.benefitType === "culture";
  if (interest === "카드/멤버십") return deal.category === "카드/멤버십" || deal.benefitType === "card" || deal.benefitType === "membership";
  if (interest === "정부/공공혜택") return deal.category === "정부/공공혜택" || deal.benefitType === "public";
  if (interest === "여행") return deal.category === "여행/숙박" || deal.benefitType === "travel";
  if (interest === "식품") return deal.category === "식품/생필품";
  if (interest === "생활용품") return deal.category === "식품/생필품" || /생활|생필품/.test(searchable);
  if (interest === "디지털") return deal.category === "디지털/가전";
  if (interest === "패션" || interest === "뷰티") return deal.category === "패션/뷰티";

  return searchable.includes(interest);
}

function rankOfficialBenefit(deal, interests, recentNewsIds) {
  const endTime = parseTime(deal.endDate);
  const checkedTime = parseTime(deal.lastCheckedAt);
  const hoursUntilEnd = endTime === null ? Number.POSITIVE_INFINITY : (endTime - Date.now()) / (60 * 60 * 1000);
  const hoursSinceCheck = checkedTime === null ? Number.POSITIVE_INFINITY : (Date.now() - checkedTime) / (60 * 60 * 1000);
  const categoryBoost = interests.some((interest) => matchesInterest(deal, interest)) ? 34 : 0;
  const recentBoost = recentNewsIds.includes(deal.id) ? 18 : 0;
  const endingBoost = Number.isFinite(hoursUntilEnd) ? Math.max(0, 72 - hoursUntilEnd) : 0;
  const freshnessBoost = hoursSinceCheck <= 24 ? 12 : hoursSinceCheck <= 72 ? 6 : hoursSinceCheck <= 168 ? 2 : 0;
  const officialLinkBoost = deal.linkType === "official_coupon" ? 10 : deal.linkType === "official_event" ? 8 : 6;
  const freeBoost = deal.benefitType === "freebie" || deal.benefitType === "coupon" || Number(deal.price ?? 0) === 0 ? 24 : 0;

  return (
    Number(deal.priorityScore ?? deal.confidenceScore ?? 0) +
    categoryBoost +
    recentBoost +
    endingBoost +
    freshnessBoost +
    officialLinkBoost +
    freeBoost +
    Number(deal.couponAmount ?? 0) / 1000
  );
}

function buildReason(deal, interests, recentNewsIds) {
  const matchedInterest = interests.find((interest) => matchesInterest(deal, interest));
  if (recentNewsIds.includes(deal.id)) return "최근 본 공식 혜택이라 다시 확인하기 좋습니다.";
  if (matchedInterest) return `${matchedInterest} 관심 알림과 맞는 공식 혜택입니다.`;
  if (deal.benefitType === "freebie" || deal.benefitType === "coupon") return "무료 또는 쿠폰 혜택이라 먼저 볼 만합니다.";
  return "공식 페이지 이동이 확인된 혜택입니다.";
}

function buildQueue(newsDeals, input = {}) {
  const interests = uniqueValues(input.interests?.length ? input.interests : defaultInterests);
  const recentNewsIds = uniqueValues(input.recentNewsIds);
  const limit = Math.max(1, Math.min(12, Math.floor(input.limit ?? 8)));
  const activeBenefits = newsDeals.filter(isActiveOfficialBenefit);
  const interestMatches = activeBenefits.filter((deal) => interests.some((interest) => matchesInterest(deal, interest)));
  const recentMatches = activeBenefits.filter((deal) => recentNewsIds.includes(deal.id));
  const source = interestMatches.length ? interestMatches : activeBenefits;
  const items = Array.from(new Map([...recentMatches, ...source].map((deal) => [deal.id, deal])).values())
    .sort((a, b) => rankOfficialBenefit(b, interests, recentNewsIds) - rankOfficialBenefit(a, interests, recentNewsIds))
    .slice(0, limit)
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      summary: deal.summary,
      merchant: deal.merchant,
      sourceName: deal.sourceName,
      category: deal.category,
      benefitType: deal.benefitType,
      endDate: deal.endDate,
      officialHost: deal.officialHost || hostOf(deal.finalUrl),
      redirectUrl: `/go/news/${deal.id}`,
      reason: buildReason(deal, interests, recentNewsIds),
      matchedInterests: interests.filter((interest) => matchesInterest(deal, interest))
    }));

  return {
    interests,
    recentNewsIds,
    summary: {
      totalActiveBenefits: activeBenefits.length,
      interestMatchedBenefits: interestMatches.length,
      recentBenefits: recentMatches.length,
      recommendedBenefits: items.length
    },
    items
  };
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value || "미분류");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function issue(id, detail, action) {
  return { id, detail, action };
}

function topItems(items, limit = 8) {
  return items.slice(0, limit).map((item) => ({
    id: item.id,
    title: item.title,
    sourceName: item.sourceName,
    category: item.category,
    benefitType: item.benefitType,
    officialHost: item.officialHost,
    redirectUrl: item.redirectUrl,
    reason: item.reason,
    matchedInterests: item.matchedInterests
  }));
}

function buildRegressionScenarios() {
  const baseDeal = {
    id: "regression-official-active",
    title: "공식 혜택 알림 회귀 테스트",
    summary: "공식 상세 URL이 있는 활성 쿠폰 혜택만 알림 후보로 남겨야 합니다.",
    merchant: "할인도사 테스트 제공처",
    sourceName: "공식 혜택 회귀 테스트",
    category: "무료혜택",
    benefitType: "coupon",
    price: 0,
    originalPrice: 0,
    couponAmount: 3000,
    endDate: "2099-12-31T23:59:59.000Z",
    finalUrl: "https://www.homeplus.co.kr/event/halindosa-regression-benefit",
    linkType: "official_coupon",
    availability: "active",
    validationStatus: "passed",
    isHidden: false,
    tags: ["쿠폰", "무료혜택"],
    priorityScore: 90,
    confidenceScore: 90,
    lastCheckedAt: new Date().toISOString()
  };
  const candidates = [
    baseDeal,
    {
      ...baseDeal,
      id: "regression-invalid-date",
      title: "종료일 형식 이상 공식 혜택",
      endDate: "not-a-date",
      finalUrl: "https://www.homeplus.co.kr/event/halindosa-regression-invalid-date"
    },
    {
      ...baseDeal,
      id: "regression-search-link",
      title: "검색 링크 회귀 테스트",
      finalUrl: "https://www.homeplus.co.kr/search?keyword=coupon",
      linkType: "search"
    },
    {
      ...baseDeal,
      id: "regression-unsafe-url",
      title: "위험 URL 회귀 테스트",
      finalUrl: "javascript:alert(1)"
    },
    {
      ...baseDeal,
      id: "regression-expired",
      title: "종료 혜택 회귀 테스트",
      endDate: "2000-01-01T00:00:00.000Z"
    },
    {
      ...baseDeal,
      id: "regression-hidden",
      title: "숨김 혜택 회귀 테스트",
      isHidden: true
    },
    {
      ...baseDeal,
      id: "regression-sold-out",
      title: "판매 중단 혜택 회귀 테스트",
      availability: "sold_out"
    }
  ];
  const queue = buildQueue(candidates, {
    interests: ["무료/체험", "쿠폰/이벤트"],
    recentNewsIds: ["regression-invalid-date"],
    limit: 8
  });
  const acceptedIds = queue.items.map((item) => item.id);
  const expectedAcceptedIds = ["regression-official-active", "regression-invalid-date"];
  const expectedRejectedIds = [
    "regression-search-link",
    "regression-unsafe-url",
    "regression-expired",
    "regression-hidden",
    "regression-sold-out"
  ];
  const checks = [
    {
      id: "accept-official-active",
      ok: expectedAcceptedIds.every((id) => acceptedIds.includes(id)),
      detail: "활성 공식 혜택과 종료일 형식 이상 공식 혜택은 오류 없이 후보에 남습니다."
    },
    {
      id: "reject-search-link",
      ok: !acceptedIds.includes("regression-search-link"),
      detail: "검색 결과 URL은 linkType=search로 후보에서 제외합니다."
    },
    {
      id: "reject-unsafe-url",
      ok: !acceptedIds.includes("regression-unsafe-url"),
      detail: "http/https가 아닌 URL은 후보에서 제외합니다."
    },
    {
      id: "reject-expired-hidden-sold-out",
      ok: ["regression-expired", "regression-hidden", "regression-sold-out"].every((id) => !acceptedIds.includes(id)),
      detail: "종료, 숨김, 판매 중단 혜택은 후보에서 제외합니다."
    },
    {
      id: "redirect-and-metadata",
      ok: queue.items.every((item) => item.redirectUrl.startsWith("/go/news/") && item.officialHost && Array.isArray(item.matchedInterests)),
      detail: "후보는 내부 redirect 경로, 공식 host, 관심 카테고리 매칭 정보를 유지합니다."
    }
  ];

  return {
    ok: checks.every((check) => check.ok),
    candidateCount: candidates.length,
    acceptedIds,
    rejectedIds: expectedRejectedIds.filter((id) => !acceptedIds.includes(id)),
    expectedAcceptedIds,
    expectedRejectedIds,
    checkedRedirectPrefix: "/go/news/",
    checks
  };
}

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

const snapshot = readJson("data/refreshedNewsDeals.json", {});
const newsDeals = (Array.isArray(snapshot.deals) && snapshot.deals.length ? snapshot.deals : snapshot.allDeals ?? []).filter(Boolean);
const activeBenefits = newsDeals.filter(isActiveOfficialBenefit);
const defaultQueue = buildQueue(newsDeals, { interests: defaultInterests, limit: 8 });
const recentSeedIds = activeBenefits.slice(0, 3).map((deal) => deal.id);
const recentQueue = buildQueue(newsDeals, { interests: defaultInterests, recentNewsIds: recentSeedIds, limit: 8 });
const interestCoverage = supportedInterests.map((interest) => {
  const matches = activeBenefits.filter((deal) => matchesInterest(deal, interest));
  return {
    interest,
    matchedCount: matches.length,
    sampleItems: matches.slice(0, 3).map((deal) => ({
      id: deal.id,
      title: deal.title,
      sourceName: deal.sourceName,
      officialHost: deal.officialHost || hostOf(deal.finalUrl)
    }))
  };
});
const defaultInterestCoverage = interestCoverage.filter((item) => defaultInterests.includes(item.interest));
const redirectSafetyIssues = [...defaultQueue.items, ...recentQueue.items].flatMap((item) => {
  const issues = [];
  if (!item.redirectUrl.startsWith("/go/news/")) issues.push(`${item.id} redirectUrl should stay on /go/news/[id]`);
  if (/^https?:\/\//.test(item.redirectUrl)) issues.push(`${item.id} redirectUrl should not expose external URL directly`);
  if (!item.officialHost) issues.push(`${item.id} official host missing`);
  return issues;
});
const invalidActiveBenefits = activeBenefits.filter((deal) => {
  const endTime = Date.parse(deal.endDate ?? "");
  return (
    deal.isHidden ||
    deal.validationStatus !== "passed" ||
    (deal.availability ?? "active") !== "active" ||
    !isHttpUrl(deal.finalUrl) ||
    !String(deal.linkType ?? "").startsWith("official") ||
    (Number.isFinite(endTime) && endTime < Date.now())
  );
});
const sourceHosts = countBy(activeBenefits.map((deal) => deal.officialHost || hostOf(deal.finalUrl)));
const categoryCounts = countBy(activeBenefits.map((deal) => deal.category));
const benefitTypeCounts = countBy(activeBenefits.map((deal) => deal.benefitType));
const sourceCounts = countBy(activeBenefits.map((deal) => deal.sourceName));
const regression = buildRegressionScenarios();
const issues = [
  ...(activeBenefits.length >= 60 ? [] : [issue("active-official-benefits", `공식 혜택 후보가 ${activeBenefits.length}개입니다.`, "npm run refresh:news && npm run verify:news")]),
  ...(defaultQueue.summary.recommendedBenefits >= 6 ? [] : [issue("default-recommendations", `기본 알림 추천 후보가 ${defaultQueue.summary.recommendedBenefits}개입니다.`, "공식 혜택 seed 또는 approved feed를 보강하세요.")]),
  ...(defaultInterestCoverage.every((item) => item.matchedCount > 0)
    ? []
    : [
        issue(
          "default-interest-coverage",
          `기본 관심 카테고리 중 후보 없는 항목: ${defaultInterestCoverage.filter((item) => item.matchedCount === 0).map((item) => item.interest).join(", ")}`,
          "무료/체험, 쿠폰/이벤트, 마트/편의점, 영화/문화 공식 혜택 후보를 보강하세요."
        )
      ]),
  ...(sourceHosts.length >= 8 ? [] : [issue("official-source-diversity", `공식 출처 host가 ${sourceHosts.length}개입니다.`, "공식 이벤트/쿠폰 feed 출처를 더 연결하세요.")]),
  ...(categoryCounts.length >= 8 ? [] : [issue("official-category-diversity", `공식 혜택 카테고리가 ${categoryCounts.length}개입니다.`, "공식 혜택 카테고리 seed를 보강하세요.")]),
  ...(redirectSafetyIssues.length ? [issue("redirect-safety", redirectSafetyIssues.join("; "), "추천 후보는 외부 URL이 아니라 /go/news/[id]만 사용해야 합니다.")] : []),
  ...(invalidActiveBenefits.length ? [issue("active-filter", `${invalidActiveBenefits.length}개 후보가 active 조건을 벗어났습니다.`, "verify:news 결과와 officialBenefitAlertQueue 필터를 확인하세요.")] : []),
  ...(regression.ok ? [] : [issue("official-alert-regression", "검색 링크, unsafe URL, 종료/숨김/판매중단 혜택 차단 회귀 샘플이 실패했습니다.", "officialBenefitAlertQueue 필터와 report script의 회귀 샘플을 함께 확인하세요.")])
];
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  source: snapshot.source ?? "official_event_seed_and_approved_feeds",
  snapshotGeneratedAt: snapshot.generatedAt ?? "",
  totals: {
    newsDeals: newsDeals.length,
    activeOfficialBenefits: activeBenefits.length,
    hiddenBenefits: newsDeals.filter((deal) => deal.isHidden).length,
    failedBenefits: newsDeals.filter((deal) => deal.validationStatus !== "passed").length,
    expiredBenefits: newsDeals.filter((deal) => {
      const endTime = Date.parse(deal.endDate ?? "");
      return Number.isFinite(endTime) && endTime < Date.now();
    }).length,
    officialHosts: sourceHosts.length,
    categories: categoryCounts.length,
    benefitTypes: benefitTypeCounts.length
  },
  defaultInterests,
  supportedInterests,
  interestCoverage,
  redirectSafety: {
    ok: redirectSafetyIssues.length === 0,
    checkedItems: new Set([...defaultQueue.items, ...recentQueue.items].map((item) => item.id)).size,
    expectedInternalPrefix: "/go/news/",
    issues: redirectSafetyIssues
  },
  regression,
  defaultQueue: {
    ...defaultQueue.summary,
    items: topItems(defaultQueue.items)
  },
  recentScenario: {
    recentNewsIds: recentSeedIds,
    ...recentQueue.summary,
    items: topItems(recentQueue.items)
  },
  categoryCounts,
  benefitTypeCounts,
  sourceHosts,
  sourceCounts: sourceCounts.slice(0, 15),
  topRecommendations: topItems(defaultQueue.items, 10),
  issues
};

const docs = [
  "# 공식 혜택 알림 후보 리포트",
  "",
  "공식 이벤트·쿠폰·공공혜택을 실제 푸시 발송 전에 검수하기 위한 운영 리포트입니다. 비회원도 보는 인앱 알림 후보를 기준으로 하며, 실제 푸시는 별도 동의 후에만 연결합니다.",
  "",
  "## 요약",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 원본 스냅샷: ${report.snapshotGeneratedAt || "확인 필요"}`,
  `- 전체 공식 혜택: ${report.totals.newsDeals}개`,
  `- 알림 후보 가능 혜택: ${report.totals.activeOfficialBenefits}개`,
  `- 기본 추천 후보: ${report.defaultQueue.recommendedBenefits}개`,
  `- 최근 본 혜택 시나리오 후보: ${report.recentScenario.recommendedBenefits}개`,
  `- 공식 출처 host: ${report.totals.officialHosts}개`,
  `- 상태: ${report.ok ? "PASS" : "CHECK"}`,
  "",
  "## 기본 관심 카테고리 커버리지",
  "",
  "| 관심 카테고리 | 후보 수 | 샘플 |",
  "| --- | ---: | --- |",
  ...defaultInterestCoverage.map((item) => `| ${item.interest} | ${item.matchedCount} | ${item.sampleItems.map((sample) => sample.title).join("<br>") || "보강 필요"} |`),
  "",
  "## 알림 후보 Top",
  "",
  "| 혜택 | 출처 | 카테고리 | 이동 경로 | 이유 |",
  "| --- | --- | --- | --- | --- |",
  ...report.topRecommendations.map((item) => `| ${item.title} | ${item.sourceName} | ${item.category} | \`${item.redirectUrl}\` | ${item.reason} |`),
  "",
  "## 회귀 방지 샘플",
  "",
  `- 상태: ${report.regression.ok ? "PASS" : "CHECK"}`,
  `- 합성 후보 수: ${report.regression.candidateCount}개`,
  `- 후보 유지: ${report.regression.acceptedIds.join(", ") || "없음"}`,
  `- 후보 차단: ${report.regression.rejectedIds.join(", ") || "없음"}`,
  `- 내부 이동 경로 기준: \`${report.regression.checkedRedirectPrefix}\``,
  "",
  "| 검사 | 상태 | 내용 |",
  "| --- | --- | --- |",
  ...report.regression.checks.map((item) => `| ${item.id} | ${item.ok ? "PASS" : "CHECK"} | ${item.detail} |`),
  "",
  "검색 링크, unsafe URL, 종료·숨김·판매 중단 혜택은 알림 후보에서 제외하고, 날짜 형식 이상값은 점수 계산을 깨지 않는지 매번 확인합니다.",
  "",
  "## 운영 기준",
  "",
  "- 알림 후보는 `validationStatus=passed`, `availability=active`, `isHidden=false`, `linkType=official*`, `finalUrl=http(s)` 조건을 통과해야 합니다.",
  "- 사용자 이동은 외부 URL을 직접 노출하지 않고 `/go/news/[id]`를 거칩니다.",
  "- 검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 공식 혜택 알림 후보에서 제외합니다.",
  "- 알림 발송 전에는 `npm run official:alerts:report`와 `/api/benefits/official-alerts` 결과를 함께 확인합니다.",
  "",
  "## 이슈",
  "",
  ...(report.issues.length
    ? report.issues.map((item) => `- ${item.id}: ${item.detail} / 조치: ${item.action}`)
    : ["- Critical 이슈 없음"]),
  ""
];

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, `${docs.join("\n")}\n`, "utf8");

if (!report.ok) {
  console.error(`Official benefit alert report failed with ${issues.length} issue(s).`);
  for (const item of issues) console.error(`- ${item.id}: ${item.detail}`);
  process.exit(1);
}

console.log(`Official benefit alert report written: reports/official-benefit-alerts.json`);
console.log(`Official benefit alert docs written: docs/OFFICIAL_BENEFIT_ALERTS_REPORT.md`);
console.log(`PASS official benefit alert queue: ${report.totals.activeOfficialBenefits} active benefits, ${report.defaultQueue.recommendedBenefits} recommendations`);
