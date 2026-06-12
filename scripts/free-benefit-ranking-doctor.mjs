import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dataPath = join(root, "data", "refreshedNewsDeals.json");
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");

const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const publicBenefitPattern = /정부|공공|문화|교육|K-MOOC|복지|지자체|청년정책/i;
const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진|재입고\s*알림/i;
const purchaseRequiredPattern = /구매|주문|결제|최소\s*주문|이상\s*구매|배송비\s*결제|카드\s*발급|자동\s*납부|연회비/i;

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

function normalizeText(value, maxLength = 120) {
  return sanitize(value, maxLength)
    .toLowerCase()
    .replace(/\[[^\]]+\]|\([^)]+\)/g, "")
    .replace(/무료|혜택|이벤트|쿠폰|행사|프로모션|증정|받기/g, "")
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "")
    .trim();
}

function getUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  const url = getUrl(value);
  if (!url) return "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|click|trace|session|ref|source|from|channel|ad)/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.hash = "";
  url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

function getHost(value) {
  const url = getUrl(value);
  return url ? url.hostname.replace(/^www\./, "").toLowerCase() : "";
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
  if (/쿠폰|할인권/i.test(text)) return "coupon";
  return "brandEvent";
}

function scoreFreshness(deal, now) {
  const checkedAt = Date.parse(String(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || deal.collectedAt || ""));
  if (!Number.isFinite(checkedAt)) return 0;
  const ageHours = Math.max(0, (now - checkedAt) / 3_600_000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 72) return 78;
  if (ageHours <= 168) return 62;
  return 25;
}

function getCheckedAgeHours(deal, now) {
  const checkedAt = Date.parse(String(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || deal.collectedAt || ""));
  if (!Number.isFinite(checkedAt)) return null;
  return Math.max(0, (now - checkedAt) / 3_600_000);
}

function scoreUrgency(endDate, now) {
  const endAt = Date.parse(String(endDate ?? ""));
  if (!Number.isFinite(endAt)) return 35;
  const hoursLeft = (endAt - now) / 3_600_000;
  if (hoursLeft < 0) return 0;
  if (hoursLeft <= 24) return 100;
  if (hoursLeft <= 72) return 85;
  if (hoursLeft <= 168) return 68;
  return 42;
}

function scoreReward(deal, benefitType, text) {
  let score = 45;
  if (benefitType === "everyone") score += 25;
  if (benefitType === "sample" || benefitType === "freeTrial" || benefitType === "gifticon") score += 20;
  if (benefitType === "coupon" || benefitType === "pointCashback") score += 14;
  if (benefitType === "checkIn" || benefitType === "roulette") score += 10;
  if (!purchaseRequiredPattern.test(text)) score += 10;
  if (Number(deal.discountRate ?? 0) >= 50) score += 6;
  return Math.max(0, Math.min(100, score));
}

function getClaimUrgencyLabel(endDate, now) {
  const endAt = Date.parse(String(endDate ?? ""));
  if (!Number.isFinite(endAt)) return "상시확인";
  const hoursLeft = (endAt - now) / 3_600_000;
  if (hoursLeft < 0) return "종료";
  if (hoursLeft <= 24) return "오늘마감";
  if (hoursLeft <= 168) return "이번주마감";
  if (hoursLeft <= 336) return "마감임박";
  return "여유있음";
}

function toCandidate(deal, now) {
  const finalUrl = normalizeUrl(deal.finalUrl || deal.officialUrl || deal.sourceUrl || deal.eventUrl);
  const host = getHost(finalUrl);
  const text = [deal.title, deal.summary, deal.category, deal.sourceName, deal.tags?.join(" ")].join(" ");
  const endDate = String(deal.expiresAt || deal.endDate || "");
  const endAt = Date.parse(endDate);
  const benefitType = inferBenefitType(deal);
  const isExpired = Number.isFinite(endAt) && endAt < now;
  const isOfficial = String(deal.linkType || "").startsWith("official") || deal.provider === "official_event" || deal.provider === "public_coupon";
  const publishable =
    deal.publishable !== false &&
    deal.isHidden !== true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    Boolean(finalUrl) &&
    !blockedUrlPattern.test(finalUrl) &&
    !endedTextPattern.test(text) &&
    !isExpired &&
    Number(deal.qualityScore ?? 0) >= 70 &&
    isOfficial;

  const brand = sanitize(deal.merchant || deal.mallName || deal.sourceName || host || "기타", 60);
  const title = sanitize(deal.title, 140);
  const rewardValue = sanitize(deal.summary || deal.title, 140);
  const freshnessScore = scoreFreshness(deal, now);
  const officialScore = isOfficial ? 100 : 0;
  const urgencyScore = scoreUrgency(endDate, now);
  const rewardScore = scoreReward(deal, benefitType, text);
  const qualityScore = Number(deal.qualityScore ?? 0);
  const priorityScore = Number(deal.priorityScore ?? 0);
  const isNoPurchase = !purchaseRequiredPattern.test(text);
  const checkedAgeHours = getCheckedAgeHours(deal, now);
  const claimEaseScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(qualityScore * 0.35 + officialScore * 0.25 + rewardScore * 0.2 + freshnessScore * 0.1 + (isNoPurchase ? 10 : -18))
    )
  );

  return {
    id: sanitize(deal.id, 80),
    brand,
    title,
    benefitType,
    rewardValue,
    endDate,
    sourceDomain: host,
    finalUrl,
    normalizedUrl: finalUrl,
    officialUrl: normalizeUrl(deal.officialUrl || deal.sourceUrl || finalUrl),
    publishable,
    isConsumer: !publicBenefitPattern.test([brand, title, rewardValue].join(" ")),
    isNoPurchase,
    qualityScore,
    freshnessScore,
    officialScore,
    urgencyScore,
    rewardScore,
    claimEaseScore,
    claimUrgencyLabel: getClaimUrgencyLabel(endDate, now),
    priorityScore,
    checkedAgeHours,
    rankingScore: Math.round(qualityScore + freshnessScore * 0.24 + officialScore * 0.28 + urgencyScore * 0.18 + rewardScore * 0.3 + priorityScore * 0.12),
    exactDedupeKey: [
      normalizeText(brand, 60),
      normalizeText(title, 120),
      host,
      benefitType,
      normalizeText(rewardValue, 80),
      endDate.slice(0, 10),
      finalUrl
    ].join("|"),
    fuzzyDedupeKey: [
      normalizeText(brand, 60),
      normalizeText(title, 120),
      host,
      benefitType,
      normalizeText(rewardValue, 80),
      endDate.slice(0, 10)
    ].join("|")
  };
}

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = typeof key === "function" ? key(item) : item[key];
    const list = groups.get(value) ?? [];
    list.push(item);
    groups.set(value, list);
  }
  return groups;
}

function countBy(items, key) {
  return Object.fromEntries(
    [...groupBy(items, key).entries()]
      .map(([name, rows]) => [name || "unknown", rows.length])
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "ko"))
  );
}

function average(items, key) {
  const values = items.map((item) => Number(item[key] ?? 0)).filter(Number.isFinite);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function topDuplicateGroups(groups, limit = 20) {
  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, rows]) => ({
      key,
      count: rows.length,
      kept: rows.sort((a, b) => b.rankingScore - a.rankingScore)[0],
      mergedIds: rows.map((row) => row.id)
    }));
}

function selectDiverseCandidates(items, limit) {
  const sorted = [...items].sort((a, b) => b.rankingScore - a.rankingScore);
  const selected = [];
  const brandCounts = new Map();
  const typeCounts = new Map();
  const pushIfAllowed = (item, strict) => {
    if (selected.some((selectedItem) => selectedItem.id === item.id)) return;
    const brandCount = brandCounts.get(item.brand) ?? 0;
    const typeCount = typeCounts.get(item.benefitType) ?? 0;
    if (strict && (brandCount >= 3 || typeCount >= 4)) return;
    selected.push(item);
    brandCounts.set(item.brand, brandCount + 1);
    typeCounts.set(item.benefitType, typeCount + 1);
  };

  for (const item of sorted) pushIfAllowed(item, true);
  for (const item of sorted) pushIfAllowed(item, false);

  return selected.slice(0, limit);
}

const snapshot = readJson(dataPath, {});
const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
const now = Date.now();
const candidates = deals.map((deal) => toCandidate(deal, now));
const publishable = candidates.filter((item) => item.publishable);
const consumerPublishable = publishable.filter((item) => item.isConsumer);
const topConsumer = selectDiverseCandidates(consumerPublishable, 32);
const exactDuplicateGroups = topDuplicateGroups(groupBy(publishable, "exactDedupeKey"));
const fuzzyDuplicateGroups = topDuplicateGroups(groupBy(publishable, "fuzzyDedupeKey"));
const topBrandCounts = countBy(topConsumer.slice(0, 24), "brand");
const topDomainCounts = countBy(topConsumer.slice(0, 24), "sourceDomain");
const maxTopBrandRepeat = Math.max(0, ...Object.values(topBrandCounts));
const maxTopDomainRepeat = Math.max(0, ...Object.values(topDomainCounts));
const categoryCounts = countBy(publishable, "benefitType");
const noPurchaseCount = publishable.filter((item) => item.isNoPurchase).length;
const claimReadyAll = [...consumerPublishable]
  .filter((item) => item.isNoPurchase && item.qualityScore >= 90 && item.freshnessScore >= 70 && item.claimEaseScore >= 80)
  .sort((a, b) => b.claimEaseScore - a.claimEaseScore || b.rankingScore - a.rankingScore);
const claimReadyCandidates = selectDiverseCandidates(claimReadyAll, 24);
const topWindow = topConsumer.slice(0, 24);
const topClaimReadyCount = topWindow.filter((item) => item.isNoPurchase && item.claimEaseScore >= 80).length;
const topBenefitTypeDiversity = new Set(topWindow.map((item) => item.benefitType)).size;
const recentlyCheckedCount = publishable.filter((item) => item.checkedAgeHours !== null && item.checkedAgeHours <= 24).length;
const staleCheckedCount = publishable.filter((item) => item.checkedAgeHours !== null && item.checkedAgeHours > 24).length;
const missingCheckedAtCount = publishable.filter((item) => item.checkedAgeHours === null).length;
const expiringTodayCount = publishable.filter((item) => item.claimUrgencyLabel === "오늘마감").length;
const expiringThisWeekCount = publishable.filter((item) => item.claimUrgencyLabel === "이번주마감").length;
const officialHostDiversity = new Set(publishable.map((item) => item.sourceDomain).filter(Boolean)).size;

const issues = [
  publishable.length < 120 ? `publishable 공식 무료혜택이 120개 미만입니다. 현재 ${publishable.length}개입니다.` : "",
  consumerPublishable.length < 90 ? `소비자형 publishable 무료혜택이 90개 미만입니다. 현재 ${consumerPublishable.length}개입니다.` : "",
  exactDuplicateGroups.length > 0 ? `정확히 같은 dedupe key가 ${exactDuplicateGroups.length}개 남아 있습니다.` : "",
  fuzzyDuplicateGroups.length > 8 ? `비슷한 혜택 중복 후보가 ${fuzzyDuplicateGroups.length}개로 많습니다.` : "",
  noPurchaseCount < 100 ? `구매 조건 없는 무료혜택이 100개 미만입니다. 현재 ${noPurchaseCount}개입니다.` : "",
  claimReadyAll.length < 40 ? `바로 받을 수 있는 고신뢰 혜택 후보가 40개 미만입니다. 현재 ${claimReadyAll.length}개입니다.` : "",
  topClaimReadyCount < 16 ? `첫 화면 후보 24개 중 쉬운 참여 혜택이 16개 미만입니다. 현재 ${topClaimReadyCount}개입니다.` : "",
  topBenefitTypeDiversity < 7 ? `첫 화면 후보 24개 안의 혜택 유형이 7개 미만입니다. 현재 ${topBenefitTypeDiversity}개입니다.` : "",
  recentlyCheckedCount < 120 ? `24시간 내 검증된 publishable 혜택이 120개 미만입니다. 현재 ${recentlyCheckedCount}개입니다.` : "",
  staleCheckedCount > 0 ? `24시간 이상 재검증되지 않은 publishable 혜택이 ${staleCheckedCount}개 있습니다.` : "",
  missingCheckedAtCount > 0 ? `검증 시각이 없는 publishable 혜택이 ${missingCheckedAtCount}개 있습니다.` : "",
  officialHostDiversity < 80 ? `공식 도메인 다양성이 80개 미만입니다. 현재 ${officialHostDiversity}개입니다.` : "",
  average(publishable, "qualityScore") < 90 ? `평균 qualityScore가 90 미만입니다. 현재 ${average(publishable, "qualityScore")}점입니다.` : "",
  average(publishable, "freshnessScore") < 70 ? `평균 freshnessScore가 70 미만입니다. 현재 ${average(publishable, "freshnessScore")}점입니다.` : "",
  maxTopBrandRepeat > 4 ? `첫 화면 후보 24개 안에서 같은 브랜드가 ${maxTopBrandRepeat}회 반복됩니다.` : "",
  maxTopDomainRepeat > 5 ? `첫 화면 후보 24개 안에서 같은 도메인이 ${maxTopDomainRepeat}회 반복됩니다.` : ""
].filter(Boolean);

const report = {
  ok: issues.length === 0,
  generatedAt: new Date(now).toISOString(),
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  totalRows: deals.length,
  publishableCount: publishable.length,
  consumerPublishableCount: consumerPublishable.length,
  noPurchaseCount,
  claimReadyCount: claimReadyAll.length,
  topClaimReadyCount,
  topBenefitTypeDiversity,
  exactDuplicateGroupCount: exactDuplicateGroups.length,
  fuzzyDuplicateGroupCount: fuzzyDuplicateGroups.length,
  maxTopBrandRepeat,
  maxTopDomainRepeat,
  averageScores: {
    quality: average(publishable, "qualityScore"),
    freshness: average(publishable, "freshnessScore"),
    official: average(publishable, "officialScore"),
    urgency: average(publishable, "urgencyScore"),
    reward: average(publishable, "rewardScore")
  },
  operationalReadiness: {
    recentlyCheckedCount,
    staleCheckedCount,
    missingCheckedAtCount,
    expiringTodayCount,
    expiringThisWeekCount,
    noPurchaseShare: percent(noPurchaseCount, publishable.length),
    claimReadyShare: percent(claimReadyAll.length, publishable.length),
    officialHostDiversity
  },
  categoryCounts,
  topBrandCounts,
  topDomainCounts,
  exactDuplicateGroups,
  fuzzyDuplicateGroups,
  topCandidates: topConsumer.slice(0, 24).map((item) => ({
    id: item.id,
    brand: item.brand,
    title: item.title,
    benefitType: item.benefitType,
    sourceDomain: item.sourceDomain,
    rankingScore: item.rankingScore,
    qualityScore: item.qualityScore,
    freshnessScore: item.freshnessScore,
    rewardScore: item.rewardScore,
    isNoPurchase: item.isNoPurchase,
    claimEaseScore: item.claimEaseScore,
    claimUrgencyLabel: item.claimUrgencyLabel,
    endDate: item.endDate,
    finalUrl: item.finalUrl
  })),
  claimReadyCandidates: claimReadyCandidates.map((item) => ({
    id: item.id,
    brand: item.brand,
    title: item.title,
    benefitType: item.benefitType,
    sourceDomain: item.sourceDomain,
    rankingScore: item.rankingScore,
    qualityScore: item.qualityScore,
    freshnessScore: item.freshnessScore,
    rewardScore: item.rewardScore,
    isNoPurchase: item.isNoPurchase,
    claimEaseScore: item.claimEaseScore,
    claimUrgencyLabel: item.claimUrgencyLabel,
    endDate: item.endDate,
    finalUrl: item.finalUrl
  })),
  issues
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(reportsDir, "free-benefit-ranking.json"), JSON.stringify(report, null, 2));

const docs = `# 무료혜택 랭킹/중복 품질 리포트

생성 시각: ${report.generatedAt}

## 요약

| 항목 | 값 |
| --- | ---: |
| 전체 스냅샷 행 | ${report.totalRows} |
| 노출 가능 공식 무료혜택 | ${report.publishableCount} |
| 소비자형 노출 가능 혜택 | ${report.consumerPublishableCount} |
| 구매 조건 없는 혜택 | ${report.noPurchaseCount} |
| 바로 받을 수 있는 고신뢰 혜택 | ${report.claimReadyCount} |
| 첫 화면 쉬운 참여 혜택 | ${report.topClaimReadyCount} |
| 첫 화면 혜택 유형 수 | ${report.topBenefitTypeDiversity} |
| 정확 중복 그룹 | ${report.exactDuplicateGroupCount} |
| 유사 중복 후보 그룹 | ${report.fuzzyDuplicateGroupCount} |
| 첫 화면 후보 브랜드 최대 반복 | ${report.maxTopBrandRepeat} |
| 첫 화면 후보 도메인 최대 반복 | ${report.maxTopDomainRepeat} |

## 운영 SLA

| 항목 | 값 |
| --- | ---: |
| 24시간 내 검증된 혜택 | ${report.operationalReadiness.recentlyCheckedCount} |
| 24시간 이상 미검증 혜택 | ${report.operationalReadiness.staleCheckedCount} |
| 검증 시각 누락 혜택 | ${report.operationalReadiness.missingCheckedAtCount} |
| 오늘마감 혜택 | ${report.operationalReadiness.expiringTodayCount} |
| 이번주 마감 혜택 | ${report.operationalReadiness.expiringThisWeekCount} |
| 구매조건 없는 혜택 비율 | ${report.operationalReadiness.noPurchaseShare}% |
| 바로받기 후보 비율 | ${report.operationalReadiness.claimReadyShare}% |
| 공식 도메인 다양성 | ${report.operationalReadiness.officialHostDiversity} |

## 평균 점수

| 품질 | 최신성 | 공식성 | 마감성 | 보상가치 |
| ---: | ---: | ---: | ---: | ---: |
| ${report.averageScores.quality} | ${report.averageScores.freshness} | ${report.averageScores.official} | ${report.averageScores.urgency} | ${report.averageScores.reward} |

## 상위 노출 후보

| ID | 브랜드 | 혜택 | 유형 | 도메인 | 쉬움 | 마감 | 점수 |
| --- | --- | --- | --- | --- | ---: | --- | ---: |
${report.topCandidates.map((item) => `| ${item.id} | ${item.brand.replace(/\|/g, "/")} | ${item.title.replace(/\|/g, "/")} | ${item.benefitType} | ${item.sourceDomain} | ${item.claimEaseScore} | ${item.claimUrgencyLabel} | ${item.rankingScore} |`).join("\n")}

## 바로 받을 수 있는 혜택 후보

| ID | 브랜드 | 혜택 | 유형 | 도메인 | 쉬움 | 마감 |
| --- | --- | --- | --- | --- | ---: | --- |
${report.claimReadyCandidates.map((item) => `| ${item.id} | ${item.brand.replace(/\|/g, "/")} | ${item.title.replace(/\|/g, "/")} | ${item.benefitType} | ${item.sourceDomain} | ${item.claimEaseScore} | ${item.claimUrgencyLabel} |`).join("\n")}

## 이슈

${report.issues.length ? report.issues.map((issue) => `- ${issue}`).join("\n") : "- 없음"}
`;

writeFileSync(join(docsDir, "FREE_BENEFIT_RANKING_REPORT.md"), docs);

if (!report.ok) {
  console.error(`Free benefit ranking doctor failed: ${report.issues.join(" / ")}`);
  process.exit(1);
}

console.log(`Free benefit ranking doctor passed: ${report.publishableCount} publishable, ${report.consumerPublishableCount} consumer, ${report.exactDuplicateGroupCount} exact duplicate groups.`);
