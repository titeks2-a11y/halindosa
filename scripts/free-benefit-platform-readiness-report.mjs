import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = "reports/free-benefit-platform-readiness.json";
const docsPath = "docs/FREE_BENEFIT_PLATFORM_READINESS.md";

const requiredModelFields = [
  "id",
  "brand",
  "title",
  "description",
  "benefitType",
  "rewardValue",
  "startDate",
  "endDate",
  "sourceUrl",
  "officialUrl",
  "imageUrl",
  "status",
  "isOfficial",
  "isFree",
  "isVerified",
  "qualityScore",
  "freshnessScore",
  "lastCheckedAt",
  "createdAt",
  "tags"
];

const requiredBenefitCategories = [
  "everyone",
  "firstCome",
  "sample",
  "freeTrial",
  "coupon",
  "gifticon",
  "pointCashback",
  "freeShipping",
  "signup",
  "today",
  "week"
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

function readText(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8");
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function getByPath(object, path, fallback = undefined) {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) return current[key];
    return undefined;
  }, object) ?? fallback;
}

function gate(name, ok, detail, evidence = []) {
  return { name, ok: Boolean(ok), status: ok ? "passed" : "needs_work", detail, evidence };
}

function table(rows) {
  return rows.map((row) => `| ${row.map((cell) => String(cell).replaceAll("|", "\\|")).join(" | ")} |`).join("\n");
}

const now = new Date().toISOString();
const refreshedNews = readJson("data/refreshedNewsDeals.json", {});
const operationReport = readJson("reports/free-benefit-operations.json", {});
const rankingReport = readJson("reports/free-benefit-ranking.json", {});
const sourceReadiness = readJson("reports/source-readiness.json", {});
const firstPartyFeed = readJson("reports/first-party-free-benefit-feed.json", {});
const healthReadiness = readJson("reports/health-readiness.json", {});
const packageJson = readJson("package.json", {});
const freeBenefitTypes = readText("types/freeBenefitEvent.ts");
const androidConfig = readText("android/app/src/main/res/xml/config.xml");
const androidNetworkSecurity = readText("android/app/src/main/res/xml/network_security_config.xml");

const allDeals = Array.isArray(refreshedNews.allDeals) ? refreshedNews.allDeals : [];
const visibleOfficialDeals = allDeals.filter(
  (item) =>
    item?.availability === "active" &&
    item?.validationStatus === "passed" &&
    item?.isHidden !== true &&
    item?.isOfficial !== false &&
    String(item?.finalUrl ?? "").startsWith("https://")
);
const consumerOfficialDeals = visibleOfficialDeals.filter((item) => !["public", "public_free", "education"].includes(item.benefitType));
const hosts = visibleOfficialDeals.map((item) => {
  try {
    return new URL(item.finalUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
});
const modelMissingFields = requiredModelFields.filter((field) => !freeBenefitTypes.includes(`${field}:`));
const blockedPatterns = [/\/search/i, /[?&](?:q|query|keyword)=/i, /cafe\.naver\.com/i, /blog\.naver\.com/i];
const exposedBlockedLinks = visibleOfficialDeals.filter((item) => blockedPatterns.some((pattern) => pattern.test(String(item.finalUrl ?? ""))));
const exposedExpiredOrBlocked = visibleOfficialDeals.filter((item) => {
  const status = String(item.status ?? item.availability ?? "");
  const availability = String(item.availability ?? "");
  const validationStatus = String(item.validationStatus ?? "");
  const isActive = status === "active" || (availability === "active" && validationStatus === "passed");
  const hasHardStopCopy = /이벤트가 종료|판매종료|품절|재고 소진|선착순 종료|구매불가|행사종료/.test(
    [item.title, item.summary, item.validationReason, item.hiddenReason].join(" ")
  );
  return !isActive || hasHardStopCopy;
});

const categoryCounts = {
  everyone: getByPath(rankingReport, "categoryCounts.everyone", 0),
  firstCome: getByPath(rankingReport, "categoryCounts.firstCome", 0),
  sample: getByPath(rankingReport, "categoryCounts.sample", 0),
  freeTrial: getByPath(rankingReport, "categoryCounts.freeTrial", 0),
  coupon: getByPath(rankingReport, "categoryCounts.coupon", 0),
  gifticon: getByPath(rankingReport, "categoryCounts.gifticon", 0),
  pointCashback: getByPath(rankingReport, "categoryCounts.pointCashback", 0),
  freeShipping: getByPath(rankingReport, "categoryCounts.freeShipping", 0),
  signup: getByPath(rankingReport, "categoryCounts.signup", 0),
  today: getByPath(rankingReport, "operationalReadiness.expiringTodayCount", 0),
  week: getByPath(rankingReport, "operationalReadiness.expiringThisWeekCount", 0)
};
const missingCategories = requiredBenefitCategories.filter((category) => Number(categoryCounts[category] ?? 0) <= 0);

const automationEvidence = [
  packageJson.scripts?.["refresh:benefits"],
  packageJson.scripts?.["verify:freebies"],
  packageJson.scripts?.["benefit:operations:report"],
  packageJson.scripts?.["benefit:ranking:doctor"],
  packageJson.scripts?.["benefit:category:doctor"],
  packageJson.scripts?.["test:home-realtime"]
].filter(Boolean);

const gates = [
  gate(
    "free benefit first product direction",
    visibleOfficialDeals.length >= 100 && consumerOfficialDeals.length >= 100,
    `노출 가능한 공식 혜택 ${visibleOfficialDeals.length}개, 소비자형 공식 혜택 ${consumerOfficialDeals.length}개`,
    ["data/refreshedNewsDeals.json", "reports/free-benefit-operations.json"]
  ),
  gate(
    "official link only exposure",
    exposedBlockedLinks.length === 0 && Number(getByPath(operationReport, "qualityGates.exposedSearchLinks", 0)) === 0 && Number(getByPath(operationReport, "qualityGates.exposedNonOfficialLinks", 0)) === 0,
    `검색/비공식 노출 ${exposedBlockedLinks.length + Number(getByPath(operationReport, "qualityGates.exposedSearchLinks", 0)) + Number(getByPath(operationReport, "qualityGates.exposedNonOfficialLinks", 0))}건`,
    ["reports/free-benefit-operations.json", "reports/first-party-free-benefit-feed.json"]
  ),
  gate(
    "expired and invalid exclusion",
    exposedExpiredOrBlocked.length === 0 && Number(getByPath(operationReport, "totals.expiredExcludedItems", 0)) >= 0,
    `노출 중 종료/품절 의심 ${exposedExpiredOrBlocked.length}건, 만료 제외 후보 ${getByPath(operationReport, "qualityGates.expiredEvents", 0)}건`,
    ["reports/free-benefit-operations.json"]
  ),
  gate(
    "dedupe and scoring",
    Number(getByPath(rankingReport, "exactDuplicateGroupCount", 999)) === 0 &&
      Number(getByPath(rankingReport, "averageScores.quality", 0)) >= 90 &&
      Number(getByPath(rankingReport, "averageScores.official", 0)) >= 90,
    `정확 중복 ${getByPath(rankingReport, "exactDuplicateGroupCount", "n/a")}개, 평균 품질 ${getByPath(rankingReport, "averageScores.quality", "n/a")}, 공식성 ${getByPath(rankingReport, "averageScores.official", "n/a")}`,
    ["reports/free-benefit-ranking.json"]
  ),
  gate(
    "required benefit categories",
    missingCategories.length === 0,
    missingCategories.length ? `부족 카테고리: ${missingCategories.join(", ")}` : "전원증정, 선착순, 샘플, 무료체험, 쿠폰, 기프티콘, 포인트, 무료배송, 신규가입, 오늘/이번주 마감 축이 존재",
    ["reports/free-benefit-category-coverage.json", "reports/free-benefit-ranking.json"]
  ),
  gate(
    "safe realtime automation",
    automationEvidence.length >= 6 && Boolean(packageJson.scripts?.["refresh:benefits"]) && Boolean(packageJson.scripts?.["test:home-realtime"]),
    `refresh/verify/report/home realtime 스크립트 ${automationEvidence.length}개 확인`,
    automationEvidence
  ),
  gate(
    "free benefit data model",
    modelMissingFields.length === 0,
    modelMissingFields.length ? `누락 필드: ${modelMissingFields.join(", ")}` : "목표 무료혜택 핵심 필드를 FreeBenefitEvent 모델이 포함",
    ["types/freeBenefitEvent.ts"]
  ),
  gate(
    "webview production safety",
    androidConfig.includes("https://halindosa.com") &&
      androidConfig.includes("https://www.halindosa.com") &&
      !androidConfig.includes('<access origin="*"') &&
      androidNetworkSecurity.includes("cleartextTrafficPermitted=\"false\""),
    "Android WebView는 halindosa.com HTTPS 운영 도메인 중심으로 제한",
    ["android/app/src/main/res/xml/config.xml", "android/app/src/main/res/xml/network_security_config.xml"]
  )
];

const report = {
  ok: gates.every((item) => item.ok),
  generatedAt: now,
  summary: {
    visibleOfficialBenefits: visibleOfficialDeals.length,
    consumerOfficialBenefits: consumerOfficialDeals.length,
    officialHosts: uniqueCount(hosts),
    officialSourceCandidates: getByPath(sourceReadiness, "summary.officialSourceCandidates", 0),
    reachableOfficialSources: getByPath(sourceReadiness, "summary.reachableSources", 0),
    configuredFeedUrls: getByPath(sourceReadiness, "summary.configuredFeedUrls", 0),
    publishableFirstPartyFeedItems: getByPath(firstPartyFeed, "summary.publishableItems", getByPath(firstPartyFeed, "publishableItems", 0)),
    claimReadyCount: getByPath(rankingReport, "claimReadyCount", 0),
    instantClaimCount: getByPath(rankingReport, "instantClaimCount", 0),
    exactDuplicateGroupCount: getByPath(rankingReport, "exactDuplicateGroupCount", 0),
    exposedBlockedLinks: exposedBlockedLinks.length,
    exposedExpiredOrBlocked: exposedExpiredOrBlocked.length,
    latestHealthDeployment: getByPath(healthReadiness, "deployment.shortCommit", "local-evidence")
  },
  categoryCounts,
  gates,
  nextActions: [
    "Vercel 일일 배포 제한이 풀리면 최신 main을 Production에 배포하고 /api/health.deployment.shortCommit을 확인",
    "Vercel/GitHub 환경변수에 승인된 공식 feed URL을 연결해 seed fallback 비중을 낮추기",
    "오늘마감 혜택이 0개일 때 편의점/카페/포인트 공식 이벤트 feed를 우선 추가",
    "실제 사용자 클릭 로그를 바탕으로 claimReadyCount와 instantClaimCount 상위 후보를 매주 재정렬"
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const markdown = `# 무료혜택 실시간 플랫폼 준비 리포트

생성 시각: ${now}

## 요약

| 항목 | 값 |
| --- | --- |
| 노출 가능한 공식 무료혜택 | ${report.summary.visibleOfficialBenefits}개 |
| 소비자형 공식 무료혜택 | ${report.summary.consumerOfficialBenefits}개 |
| 공식 도메인 | ${report.summary.officialHosts}개 |
| 공식 소스 후보 | ${report.summary.officialSourceCandidates}개 |
| 접근 가능한 공식 소스 | ${report.summary.reachableOfficialSources}개 |
| configured feed URL | ${report.summary.configuredFeedUrls}개 |
| 바로 받을 수 있는 후보 | ${report.summary.claimReadyCount}개 |
| 즉시 수령 후보 | ${report.summary.instantClaimCount}개 |
| 정확 중복 그룹 | ${report.summary.exactDuplicateGroupCount}개 |
| 검색/비공식 노출 | ${report.summary.exposedBlockedLinks}개 |
| 종료/품절 의심 노출 | ${report.summary.exposedExpiredOrBlocked}개 |

## 출시 목표별 게이트

| 게이트 | 상태 | 설명 |
| --- | --- | --- |
${table(gates.map((item) => [item.name, item.ok ? "PASS" : "NEEDS WORK", item.detail]))}

## 필수 무료혜택 카테고리

| 카테고리 | 수량 |
| --- | --- |
${table(Object.entries(categoryCounts).map(([key, value]) => [key, value]))}

## 운영자가 다음에 할 일

${report.nextActions.map((action) => `- ${action}`).join("\n")}

## 기준

- 공식 링크 기준: 사용자 CTA에는 검증된 공식 브랜드/공식몰/공식 이벤트/신청/쿠폰/샘플/출석체크/무료체험 URL만 연결한다.
- 사용자 CTA에는 공식 이벤트, 신청, 쿠폰, 샘플, 출석체크, 무료체험 URL만 연결한다.
- 검색 결과, 대표몰 메인, 블로그/카페 중계 링크, 종료/품절/미검증 링크는 노출하지 않는다.
- Android 앱은 운영 웹 \`https://www.halindosa.com\`을 WebView로 불러오므로 Vercel Production 배포가 반영되면 앱 화면도 함께 바뀐다.
`;

writeFileSync(join(root, docsPath), markdown, "utf8");

for (const item of gates) {
  console.log(`${item.ok ? "PASS" : "NEEDS_WORK"} ${item.name} - ${item.detail}`);
}
console.log(`Wrote ${reportPath}`);
console.log(`Wrote ${docsPath}`);

if (!report.ok) {
  process.exitCode = 1;
}
