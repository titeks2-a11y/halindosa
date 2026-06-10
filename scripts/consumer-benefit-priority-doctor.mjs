import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isPublicPolicyText } from "./lib/consumer-source-policy.mjs";

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

const consumerPattern =
  /쿠폰|무료\s*샘플|샘플|기프티콘|교환권|전원\s*증정|선착순|신규\s*가입|웰컴|출석|룰렛|포인트|캐시백|무료배송|무배|1\+1|2\+1|편의점|마트|배달|카페|뷰티|올리브영|무신사|컬리|SSG|롯데온|롯데잇츠|H\.?Point|해피포인트|G마켓|11번가|쿠팡|이마트|홈플러스|브랜드|던킨|맥도날드|배스킨|GS25|CU|CJ\s*ONE|CJ더마켓|다이소|로얄캐닌/i;
const purchaseConditionPattern = /구매|주문|결제|최소\s*주문|이상\s*구매|장바구니|배송비|카드\s*발급|신규\s*발급|자동\s*납부|자동이체|연회비/i;
const lowFrictionPattern = /무료\s*체험|샘플|쿠폰|포인트|출석|룰렛|기프티콘|0원|전원\s*증정|선착순|신규\s*가입|웰컴/i;
const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum/i;
const publicTypes = new Set(["public", "public_free", "education", "culture"]);
const consumerTypes = new Set(["coupon", "sample", "freebie", "freeShipping", "point", "foodDelivery", "convenienceStore", "mart", "membership", "card"]);

function textOf(deal) {
  return [deal.title, deal.summary, deal.merchant, deal.mallName, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")].join(" ");
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isVisible(deal, now) {
  const endTime = Date.parse(String(deal.expiresAt || deal.endDate || ""));
  return (
    deal.publishable === true &&
    deal.isHidden !== true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    String(deal.linkType || "").startsWith("official") &&
    isHttpUrl(deal.finalUrl) &&
    !blockedUrlPattern.test(String(deal.finalUrl || "")) &&
    (!Number.isFinite(endTime) || endTime >= now) &&
    Number(deal.qualityScore ?? deal.priorityScore ?? 0) >= 70
  );
}

function isConsumerBenefit(deal) {
  return consumerTypes.has(deal.benefitType) || /무료혜택|마트\/편의점|외식\/배달|패션\/뷰티|카드\/멤버십|식품\/생필품|디지털\/가전|여행\/숙박/i.test(deal.category || "") || consumerPattern.test(textOf(deal));
}

function isPublicPolicyBenefit(deal) {
  return publicTypes.has(deal.benefitType) || deal.category === "정부/공공혜택" || isPublicPolicyText(textOf(deal));
}

function hoursUntil(value, now) {
  const timestamp = Date.parse(String(value || ""));
  if (!Number.isFinite(timestamp)) return 9999;
  return (timestamp - now) / 3_600_000;
}

function score(deal, now) {
  const text = textOf(deal);
  const endingHours = hoursUntil(deal.expiresAt || deal.endDate, now);
  const urgencyBoost = endingHours <= 12 ? 28 : endingHours <= 24 ? 22 : endingHours <= 72 ? 12 : 0;
  const consumerBoost = isConsumerBenefit(deal) ? 70 : 0;
  const publicPenalty = isPublicPolicyBenefit(deal) ? (isConsumerBenefit(deal) ? -70 : -140) : 0;
  const lowFrictionBoost = lowFrictionPattern.test(text) ? 28 : 0;
  const conditionPenalty = purchaseConditionPattern.test(text) ? -48 : 20;
  const typeBoost = consumerTypes.has(deal.benefitType) ? 40 : publicTypes.has(deal.benefitType) ? 4 : 16;

  return Math.round(
    Number(deal.priorityScore ?? deal.confidenceScore ?? 0) +
      Number(deal.qualityScore ?? 0) +
      Number(deal.couponAmount ?? 0) / 1000 +
      typeBoost +
      urgencyBoost +
      consumerBoost +
      lowFrictionBoost +
      conditionPenalty +
      publicPenalty
  );
}

const now = Date.now();
const snapshot = readJson("data/refreshedNewsDeals.json", {});
const source = Array.isArray(snapshot.deals) ? snapshot.deals : Array.isArray(snapshot.allDeals) ? snapshot.allDeals : [];
const newsDealsSource = readFileSync(join(root, "lib", "deals", "newsDeals.ts"), "utf8");
const homeRouteSource = readFileSync(join(root, "app", "api", "home", "route.ts"), "utf8");
const freebiesRouteSource = readFileSync(join(root, "app", "api", "freebies", "route.ts"), "utf8");
const newsDealsRouteSource = readFileSync(join(root, "app", "api", "news-deals", "route.ts"), "utf8");
const visible = source.filter((deal) => isVisible(deal, now));
const ranked = visible
  .map((deal) => ({
    id: deal.id,
    title: deal.title,
    category: deal.category,
    benefitType: deal.benefitType,
    sourceName: deal.sourceName,
    finalUrl: deal.finalUrl,
    score: score(deal, now),
    consumerFacing: isConsumerBenefit(deal),
    publicPolicy: isPublicPolicyBenefit(deal)
  }))
  .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"));

const top8 = ranked.slice(0, 8);
const top12 = ranked.slice(0, 12);
const top8Consumer = top8.filter((item) => item.consumerFacing).length;
const top8Public = top8.filter((item) => item.publicPolicy).length;
const top12Consumer = top12.filter((item) => item.consumerFacing).length;
const top12Public = top12.filter((item) => item.publicPolicy).length;
const defaultConsumerFirstWired =
  newsDealsSource.includes("includePublicPolicy?: boolean") &&
  newsDealsSource.includes("options.includePublicPolicy === true") &&
  homeRouteSource.includes("includePublicPolicy") &&
  homeRouteSource.includes('category === "정부/공공혜택"') &&
  freebiesRouteSource.includes("includePublicPolicy: includePublic") &&
  freebiesRouteSource.includes("publicPolicyBenefits") &&
  newsDealsRouteSource.includes("includePublicPolicy") &&
  newsDealsRouteSource.includes("includePublic");
const ok = visible.length >= 80 && top8Consumer >= 6 && top8Public <= 2 && top12Consumer >= 9 && top12Public <= 3 && defaultConsumerFirstWired;

const report = {
  ok,
  generatedAt: new Date(now).toISOString(),
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  visibleCount: visible.length,
  top8Consumer,
  top8Public,
  top12Consumer,
  top12Public,
  defaultConsumerFirstWired,
  policy: {
    top8ConsumerMinimum: 6,
    top8PublicMaximum: 2,
    top12ConsumerMinimum: 9,
    top12PublicMaximum: 3,
    description: "메인 상단은 쇼핑몰, 브랜드, 쿠폰, 샘플, 편의점/마트, 포인트 혜택을 우선하고 정부/공공/정책성 혜택은 낮은 우선순위로 분리합니다."
  },
  topItems: ranked.slice(0, 20)
};

const markdown = [
  "# Consumer Benefit Priority Report",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `- Status: ${ok ? "PASS" : "FAIL"}`,
  `- Visible benefits: ${visible.length}`,
  `- Top 8 consumer-facing: ${top8Consumer}/8`,
  `- Top 8 public/policy: ${top8Public}/8`,
  `- Top 12 consumer-facing: ${top12Consumer}/12`,
  `- Top 12 public/policy: ${top12Public}/12`,
  `- Default consumer-first API wiring: ${defaultConsumerFirstWired ? "yes" : "no"}`,
  "",
  "## Top Items",
  "",
  "| Rank | Title | Source | Type | Consumer | Public/Policy |",
  "| --- | --- | --- | --- | --- | --- |",
  ...ranked.slice(0, 20).map((item, index) => `| ${index + 1} | ${String(item.title).replace(/\|/g, "/")} | ${item.sourceName} | ${item.benefitType} | ${item.consumerFacing ? "yes" : "no"} | ${item.publicPolicy ? "yes" : "no"} |`),
  ""
].join("\n");

writeFileSync(join(reportsDir, "consumer-benefit-priority.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "CONSUMER_BENEFIT_PRIORITY_REPORT.md"), `${markdown}\n`, "utf8");

console.log(`Consumer benefit priority: ${ok ? "PASS" : "FAIL"}`);
console.log(`- visible benefits: ${visible.length}`);
console.log(`- top8 consumer: ${top8Consumer}/8`);
console.log(`- top8 public/policy: ${top8Public}/8`);
console.log(`- reports/consumer-benefit-priority.json`);
console.log(`- docs/CONSUMER_BENEFIT_PRIORITY_REPORT.md`);

if (!ok) {
  console.error("Consumer-facing benefit priority gate failed.");
  process.exit(1);
}
