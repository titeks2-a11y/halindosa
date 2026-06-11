import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const snapshotPath = join(root, "data", "refreshedNewsDeals.json");
const reportPath = join(root, "reports", "free-benefit-category-coverage.json");
const docsPath = join(root, "docs", "FREE_BENEFIT_CATEGORY_COVERAGE.md");

const endedPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진|재입고\s*알림/i;
const firstComePattern = /선착순|한정|소진\s*시|수량\s*한정|마감\s*임박/i;
const everyoneRewardPattern = /전원|모두|누구나|100%|전부|전체\s*지급/i;
const searchOrJunkUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube|example\.com/i;
const homePathSet = new Set(["", "/", "/main", "/index"]);

const requiredCategories = [
  { id: "everyone", label: "전원증정", minimum: 3 },
  { id: "firstCome", label: "선착순", minimum: 8 },
  { id: "coupon", label: "쿠폰", minimum: 8 },
  { id: "sample", label: "무료 샘플", minimum: 3 },
  { id: "freeTrial", label: "무료체험", minimum: 1 },
  { id: "gifticon", label: "기프티콘", minimum: 1 },
  { id: "pointCashback", label: "포인트/캐시백", minimum: 20 },
  { id: "freeShipping", label: "무료배송", minimum: 3 },
  { id: "signup", label: "신규가입 혜택", minimum: 3 },
  { id: "checkIn", label: "출석체크", minimum: 2 }
];

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function sanitize(value, maxLength = 180) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function classifyCategory(deal) {
  const text = sanitize([deal.title, deal.summary, deal.category, deal.sourceName, (deal.tags ?? []).join(" ")].join(" "), 800);
  if (everyoneRewardPattern.test(text)) return "everyone";
  if (firstComePattern.test(text)) return "firstCome";
  if (/출석|체크인|매일\s*참여|스탬프/i.test(text)) return "checkIn";
  if (/신규|첫\s*구매|첫\s*가입|웰컴/i.test(text)) return "signup";
  if (/기프티콘|교환권|모바일\s*쿠폰|음료권/i.test(text)) return "gifticon";
  if (/포인트|캐시백|적립|페이/i.test(text)) return "pointCashback";
  if (/샘플|체험팩|무료\s*증정|초대권/i.test(text) || deal.benefitType === "freebie") return "sample";
  if (/무료\s*체험|trial|구독\s*체험/i.test(text)) return "freeTrial";
  if (/무배|무료배송|배송비\s*무료/i.test(text) || deal.benefitType === "freeShipping") return "freeShipping";
  if (/쿠폰|할인권|바우처/i.test(text) || deal.benefitType === "coupon") return "coupon";
  if (/공공|정부|지원|문화가\s*있는\s*날|서울시|복지|교육/i.test(text) || deal.benefitType === "public" || deal.benefitType === "public_free" || deal.benefitType === "education") {
    return "publicFree";
  }
  return "brandEvent";
}

function hasSafeActionUrl(value) {
  if (!value || searchOrJunkUrlPattern.test(value)) return false;
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return (url.protocol === "http:" || url.protocol === "https:") && !homePathSet.has(path);
  } catch {
    return false;
  }
}

function isPublishableBenefit(deal, now) {
  const titleText = sanitize([deal.title, deal.summary, deal.hiddenReason, deal.validationReason].join(" "), 800);
  const endAt = Date.parse(deal.expiresAt || deal.endDate);
  return (
    deal.publishable !== false &&
    !deal.isHidden &&
    deal.availability === "active" &&
    deal.validationStatus === "passed" &&
    Number.isFinite(endAt) &&
    endAt >= now &&
    !endedPattern.test(titleText) &&
    hasSafeActionUrl(deal.finalUrl)
  );
}

function countBy(items, select) {
  return items.reduce((counts, item) => {
    const key = select(item) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function average(items, select) {
  const values = items.map(select).filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

const snapshot = readJson(snapshotPath, { deals: [], generatedAt: "" });
const rawDeals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
const now = Date.now();
const visible = rawDeals
  .filter((deal) => isPublishableBenefit(deal, now))
  .map((deal) => ({
    id: deal.id,
    title: sanitize(deal.title, 90),
    sourceName: sanitize(deal.sourceName || deal.mallName || deal.merchant, 48),
    category: classifyCategory(deal),
    finalUrl: deal.finalUrl,
    host: normalizeHost(deal.finalUrl),
    endAt: deal.expiresAt || deal.endDate,
    requiresPurchase: /구매|주문|결제|최소\s*주문|이상\s*구매|배송비/.test(
      sanitize([deal.title, deal.summary, deal.tags?.join(" ")].join(" "), 600)
    ),
    qualityScore: Number(deal.qualityScore ?? 0),
    priorityScore: Number(deal.priorityScore ?? deal.confidenceScore ?? 0)
  }));

const categoryCounts = countBy(visible, (item) => item.category);
const hostCount = new Set(visible.map((item) => item.host).filter(Boolean)).size;
const noPurchaseCount = visible.filter((item) => !item.requiresPurchase).length;
const weekEndingCount = visible.filter((item) => {
  const endAt = Date.parse(item.endAt);
  return Number.isFinite(endAt) && endAt >= now && endAt - now <= 7 * 24 * 60 * 60 * 1000;
}).length;
const todayEndingCount = visible.filter((item) => {
  const endAt = Date.parse(item.endAt);
  return Number.isFinite(endAt) && endAt >= now && endAt - now <= 24 * 60 * 60 * 1000;
}).length;

const categoryCoverage = requiredCategories.map((category) => ({
  ...category,
  count: Number(categoryCounts[category.id] ?? 0),
  ok: Number(categoryCounts[category.id] ?? 0) >= category.minimum
}));
const problems = [];

if (visible.length < 150) problems.push(`visible active benefits ${visible.length}/150`);
if (hostCount < 70) problems.push(`official host coverage ${hostCount}/70`);
if (noPurchaseCount < 120) problems.push(`no-purchase visible benefits ${noPurchaseCount}/120`);
if (weekEndingCount < 3) problems.push(`this-week ending benefits ${weekEndingCount}/3`);
for (const category of categoryCoverage) {
  if (!category.ok) problems.push(`${category.label} category ${category.count}/${category.minimum}`);
}
if (visible.some((item) => searchOrJunkUrlPattern.test(item.finalUrl))) problems.push("visible benefit contains search/community/news URL");

const report = {
  ok: problems.length === 0,
  generatedAt: new Date().toISOString(),
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  totalRawDeals: rawDeals.length,
  visibleActiveBenefits: visible.length,
  noPurchaseVisibleBenefits: noPurchaseCount,
  purchaseRequiredVisibleBenefits: visible.length - noPurchaseCount,
  todayEndingBenefits: todayEndingCount,
  weekEndingBenefits: weekEndingCount,
  officialHostCount: hostCount,
  categoryCounts,
  categoryCoverage,
  averageScores: {
    quality: average(visible, (item) => item.qualityScore),
    priority: average(visible, (item) => item.priorityScore)
  },
  topCandidates: [...visible]
    .sort((a, b) => b.qualityScore + b.priorityScore - (a.qualityScore + a.priorityScore))
    .slice(0, 20),
  advisories: todayEndingCount === 0 ? ["오늘마감 혜택은 현재 0건입니다. 홈은 이번주 마감과 선착순 혜택으로 대체 노출해야 합니다."] : [],
  problems
};

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const table = categoryCoverage
  .map((category) => `| ${category.label} | ${category.count} | ${category.minimum} | ${category.ok ? "PASS" : "FAIL"} |`)
  .join("\n");
const markdown = `# Free Benefit Category Coverage

Generated: ${report.generatedAt}

| Metric | Value |
| --- | ---: |
| Visible active benefits | ${report.visibleActiveBenefits} |
| No-purchase visible benefits | ${report.noPurchaseVisibleBenefits} |
| Purchase-required visible benefits | ${report.purchaseRequiredVisibleBenefits} |
| Today-ending benefits | ${report.todayEndingBenefits} |
| This-week ending benefits | ${report.weekEndingBenefits} |
| Official host count | ${report.officialHostCount} |
| Avg quality score | ${report.averageScores.quality} |
| Avg priority score | ${report.averageScores.priority} |

## Required Category Coverage

| Category | Count | Minimum | Result |
| --- | ---: | ---: | --- |
${table}

## Policy

- 홈 상단은 전원증정, 선착순, 쿠폰, 샘플, 무료체험, 기프티콘, 포인트, 무료배송, 신규가입, 출석체크 중 검증된 active 혜택만 사용합니다.
- 검색 결과, 대표 홈페이지, 커뮤니티/뉴스 중계, 종료/품절/숨김/미검증 링크는 visible count에 포함하지 않습니다.
- 오늘마감 혜택이 없으면 실패가 아니라 advisory로 남기고, 이번주 마감과 선착순 혜택을 대체 노출합니다.

## Problems

${report.problems.length ? report.problems.map((problem) => `- ${problem}`).join("\n") : "- None"}

## Advisories

${report.advisories.length ? report.advisories.map((advisory) => `- ${advisory}`).join("\n") : "- None"}
`;

writeFileSync(docsPath, markdown, "utf8");

if (!report.ok) {
  console.error(`free benefit category coverage failed: ${problems.join("; ")}`);
  process.exit(1);
}

console.log(
  `free benefit category coverage passed: ${visible.length} visible benefits, ${hostCount} hosts, ${categoryCoverage.length}/${categoryCoverage.length} categories.`
);
