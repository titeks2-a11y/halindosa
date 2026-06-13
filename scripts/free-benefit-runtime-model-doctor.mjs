import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const snapshotPath = join(root, "data", "refreshedNewsDeals.json");

const requiredCanonicalFields = [
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
  "validationStatus",
  "qualityScore",
  "freshnessScore",
  "officialScore",
  "urgencyScore",
  "rewardScore",
  "lastCheckedAt",
  "createdAt",
  "updatedAt",
  "tags",
  "eventUrl",
  "finalUrl",
  "sourceDomain"
];

const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const purchaseRequiredPattern = /구매|주문|결제|최소\s*주문|이상\s*구매|배송비\s*결제|카드\s*발급|자동\s*납부|연회비/i;
const loginRequiredPattern = /로그인|회원|가입|앱\s*설치|멤버십|인증/i;
const publicBenefitPattern = /정부|공공|문화|교육|K-MOOC|복지/i;
const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진/i;

const benefitTypeMap = new Map([
  ["coupon", "coupon"],
  ["freebie", "sample"],
  ["freeShipping", "freeShipping"],
  ["event", "brandEvent"],
  ["point", "pointCashback"],
  ["public", "publicFree"],
  ["public_free", "publicFree"],
  ["education", "publicFree"],
  ["freeTrial", "freeTrial"],
  ["signup", "signup"],
  ["checkIn", "checkIn"],
  ["gifticon", "gifticon"],
  ["roulette", "roulette"]
]);

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
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
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function inferBenefitType(deal) {
  const text = [deal.title, deal.summary, deal.category, deal.benefitType, deal.tags?.join(" ")].join(" ");
  if (/전원|모두|누구나|100%|전부|전체\s*지급/i.test(text)) return "everyone";
  if (/선착순|한정|소진\s*시|수량\s*한정|마감\s*임박/i.test(text)) return "firstCome";
  if (/룰렛|랜덤\s*박스|뽑기|응모권|스크래치/i.test(text)) return "roulette";
  if (/출석|체크인|매일\s*참여|스탬프/i.test(text)) return "checkIn";
  if (/신규|첫\s*구매|첫\s*가입|웰컴/i.test(text)) return "signup";
  if (/기프티콘|교환권|모바일\s*쿠폰|음료권/i.test(text)) return "gifticon";
  if (/무료\s*체험|trial|구독\s*체험/i.test(text)) return "freeTrial";
  if (/포인트|캐시백|적립|페이/i.test(text)) return "pointCashback";
  if (/샘플|체험팩|무료\s*증정/i.test(text)) return "sample";
  if (/무배|무료배송|배송비\s*무료/i.test(text)) return "freeShipping";
  return benefitTypeMap.get(String(deal.benefitType ?? "")) ?? "brandEvent";
}

function freshnessScore(deal, now) {
  const checkedAt = Date.parse(String(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || deal.startDate || ""));
  if (!Number.isFinite(checkedAt)) return 0;
  const ageHours = Math.max(0, (now - checkedAt) / 3_600_000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 72) return 78;
  if (ageHours <= 168) return 62;
  return 25;
}

function officialScore(deal, finalUrl) {
  if (!finalUrl) return 0;
  if (String(deal.linkType || "").startsWith("official")) return 100;
  if (deal.provider === "official_event" || deal.provider === "public_coupon") return 96;
  return 70;
}

function urgencyScore(deal, now) {
  const endTime = Date.parse(String(deal.expiresAt || deal.endDate || ""));
  if (!Number.isFinite(endTime)) return 35;
  const hoursLeft = Math.max(0, (endTime - now) / 3_600_000);
  if (hoursLeft <= 24) return 100;
  if (hoursLeft <= 72) return 86;
  if (hoursLeft <= 168) return 72;
  if (hoursLeft <= 336) return 56;
  return 35;
}

function rewardScore(deal) {
  const text = [deal.title, deal.summary, deal.category, deal.benefitType, deal.tags?.join(" ")].join(" ");
  let score = 55;
  if (/전원|누구나|100%|무료\s*증정/i.test(text)) score += 20;
  if (/쿠폰|기프티콘|포인트|캐시백|샘플|무료\s*체험|출석|룰렛/i.test(text)) score += 15;
  if (/구매|결제|카드\s*발급|연회비/i.test(text)) score -= 18;
  return Math.max(0, Math.min(100, score));
}

function toRuntimeEvent(deal, now) {
  const text = [deal.title, deal.summary, deal.category, deal.sourceName, deal.tags?.join(" ")].join(" ");
  const endTime = Date.parse(String(deal.expiresAt || deal.endDate || ""));
  const isExpired = Number.isFinite(endTime) && endTime < now;
  const finalUrl = isHttpUrl(deal.finalUrl) && !blockedUrlPattern.test(String(deal.finalUrl)) ? String(deal.finalUrl) : "";
  const status =
    deal.isHidden === true ||
    deal.publishable === false ||
    deal.validationStatus !== "passed" ||
    deal.availability !== "active" ||
    !finalUrl ||
    isExpired ||
    endedTextPattern.test(text)
      ? "blocked"
      : "active";

  return {
    id: sanitize(deal.id, 80),
    brand: sanitize(deal.merchant || deal.mallName || deal.sourceName, 60),
    title: sanitize(deal.title, 120),
    description: sanitize(deal.summary || deal.title, 240),
    benefitType: inferBenefitType(deal),
    rewardValue: sanitize(deal.summary || deal.title, 120),
    startDate: String(deal.startDate || deal.updatedAt || ""),
    endDate: String(deal.expiresAt || deal.endDate || ""),
    sourceUrl: String(deal.sourceUrl || deal.eventUrl || finalUrl || ""),
    officialUrl: String(deal.sourceUrl || finalUrl || ""),
    eventUrl: String(deal.eventUrl || deal.sourceUrl || finalUrl || ""),
    imageUrl: String(deal.imageUrl || ""),
    status,
    isOfficial: String(deal.linkType || "").startsWith("official") || deal.provider === "official_event" || deal.provider === "public_coupon",
    isFree: !purchaseRequiredPattern.test(text),
    isVerified: deal.validationStatus === "passed" && status === "active",
    validationStatus: String(deal.validationStatus || "unknown"),
    qualityScore: Number(deal.qualityScore ?? 0),
    freshnessScore: freshnessScore(deal, now),
    officialScore: officialScore(deal, finalUrl),
    urgencyScore: urgencyScore(deal, now),
    rewardScore: rewardScore(deal),
    lastCheckedAt: String(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || ""),
    createdAt: String(deal.updatedAt || deal.startDate || ""),
    updatedAt: String(deal.updatedAt || deal.verifiedAt || deal.lastCheckedAt || ""),
    tags: Array.isArray(deal.tags) ? deal.tags.map((tag) => sanitize(tag, 30)).filter(Boolean) : [],
    requiresLogin: loginRequiredPattern.test(text),
    requiresPurchase: purchaseRequiredPattern.test(text),
    sourceDomain: getHost(finalUrl),
    finalUrl
  };
}

function missingFields(event) {
  return requiredCanonicalFields.filter((field) => {
    const value = event[field];
    if (typeof value === "boolean") return false;
    if (typeof value === "number") return !Number.isFinite(value);
    if (Array.isArray(value)) return value.length === 0;
    return !String(value ?? "").trim();
  });
}

function countBy(items, select) {
  const counts = new Map();
  for (const item of items) {
    const key = select(item) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")));
}

const now = Date.now();
const snapshot = readJson(snapshotPath, {});
const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
const officialCandidates = deals.filter((deal) => deal.publishable !== false && deal.validationStatus === "passed");
const events = officialCandidates.map((deal) => toRuntimeEvent(deal, now));
const activeEvents = events.filter((event) => event.status === "active");
const failures = events
  .map((event) => ({ event, missing: missingFields(event) }))
  .filter((row) => row.missing.length > 0);
const blockedSearchLinks = activeEvents.filter((event) => blockedUrlPattern.test(event.finalUrl));
const expiredActiveEvents = activeEvents.filter((event) => {
  const endTime = Date.parse(event.endDate);
  return Number.isFinite(endTime) && endTime < now;
});
const badOfficialUrlEvents = activeEvents.filter((event) => !isHttpUrl(event.officialUrl) || blockedUrlPattern.test(event.officialUrl));
const badEventUrlEvents = activeEvents.filter((event) => !isHttpUrl(event.eventUrl) || blockedUrlPattern.test(event.eventUrl));
const scoreFieldFailures = activeEvents.filter((event) =>
  ["qualityScore", "freshnessScore", "officialScore", "urgencyScore", "rewardScore"].some((field) => {
    const value = Number(event[field]);
    return !Number.isFinite(value) || value < 0 || value > 100;
  })
);
const officialRate = activeEvents.length
  ? Math.round((activeEvents.filter((event) => event.isOfficial).length / activeEvents.length) * 100)
  : 0;
const lowFrictionCount = activeEvents.filter((event) => event.isFree && !event.requiresPurchase).length;
const consumerActiveEvents = activeEvents.filter((event) => !publicBenefitPattern.test([event.brand, event.title, event.description].join(" ")));
const ok =
  events.length >= 100 &&
  activeEvents.length >= 100 &&
  failures.length === 0 &&
  blockedSearchLinks.length === 0 &&
  expiredActiveEvents.length === 0 &&
  badOfficialUrlEvents.length === 0 &&
  badEventUrlEvents.length === 0 &&
  scoreFieldFailures.length === 0 &&
  officialRate >= 95 &&
  lowFrictionCount >= 50 &&
  consumerActiveEvents.length >= 80;

const report = {
  ok,
  generatedAt: new Date(now).toISOString(),
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  requiredCanonicalFields,
  totalCandidates: events.length,
  activeEvents: activeEvents.length,
  consumerActiveEvents: consumerActiveEvents.length,
  lowFrictionCount,
  officialRate,
  missingFieldFailureCount: failures.length,
  blockedSearchLinkCount: blockedSearchLinks.length,
  expiredActiveEventCount: expiredActiveEvents.length,
  badOfficialUrlCount: badOfficialUrlEvents.length,
  badEventUrlCount: badEventUrlEvents.length,
  scoreFieldFailureCount: scoreFieldFailures.length,
  benefitTypeCounts: countBy(activeEvents, (event) => event.benefitType),
  sourceDomainCounts: countBy(activeEvents, (event) => event.sourceDomain),
  fieldFailures: failures.slice(0, 20).map((row) => ({
    id: row.event.id,
    title: row.event.title,
    missing: row.missing
  })),
  topActiveEvents: consumerActiveEvents.slice(0, 20).map((event) => ({
    id: event.id,
    brand: event.brand,
    title: event.title,
    benefitType: event.benefitType,
    sourceDomain: event.sourceDomain,
    endDate: event.endDate,
    qualityScore: event.qualityScore,
    freshnessScore: event.freshnessScore,
    officialScore: event.officialScore,
    urgencyScore: event.urgencyScore,
    rewardScore: event.rewardScore
  }))
};

const docs = [
  "# 무료혜택 런타임 모델 점검",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 상태: ${report.ok ? "PASS" : "FAIL"}`,
  `- 후보 이벤트: ${report.totalCandidates}개`,
  `- active 이벤트: ${report.activeEvents}개`,
  `- 소비자형 active 이벤트: ${report.consumerActiveEvents}개`,
  `- 구매조건 낮은 이벤트: ${report.lowFrictionCount}개`,
  `- 공식 링크 비율: ${report.officialRate}%`,
  `- 필드 누락 실패: ${report.missingFieldFailureCount}개`,
  `- 검색/커뮤니티 링크 active 노출: ${report.blockedSearchLinkCount}개`,
  `- 만료 active 이벤트: ${report.expiredActiveEventCount}개`,
  `- 공식 URL 오류: ${report.badOfficialUrlCount}개`,
  `- 이벤트 URL 오류: ${report.badEventUrlCount}개`,
  `- 점수 필드 오류: ${report.scoreFieldFailureCount}개`,
  "",
  "## 필수 런타임 필드",
  "",
  ...requiredCanonicalFields.map((field) => `- \`${field}\``),
  "",
  "## 혜택 유형별 active 수",
  "",
  "| 유형 | 수 |",
  "| --- | ---: |",
  ...Object.entries(report.benefitTypeCounts).map(([type, count]) => `| ${type} | ${count} |`),
  "",
  "## 상위 active 이벤트 샘플",
  "",
  "| ID | Brand | Type | Host | Title |",
  "| --- | --- | --- | --- | --- |",
  ...report.topActiveEvents
    .slice(0, 12)
    .map((event) => `| ${event.id} | ${event.brand} | ${event.benefitType} | ${event.sourceDomain} | ${event.title.replace(/\|/g, "/")} |`),
  ""
].join("\n");

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(reportsDir, "free-benefit-runtime-model.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "FREE_BENEFIT_RUNTIME_MODEL.md"), `${docs}\n`, "utf8");

console.log("Free benefit runtime model doctor");
console.log(`- candidates: ${report.totalCandidates}`);
console.log(`- active: ${report.activeEvents}`);
console.log(`- consumer active: ${report.consumerActiveEvents}`);
console.log(`- official rate: ${report.officialRate}%`);
console.log(`- missing field failures: ${report.missingFieldFailureCount}`);
console.log(`- reports/free-benefit-runtime-model.json`);
console.log(`- docs/FREE_BENEFIT_RUNTIME_MODEL.md`);

if (!report.ok) {
  console.error("Free benefit runtime model doctor failed.");
  process.exit(1);
}
