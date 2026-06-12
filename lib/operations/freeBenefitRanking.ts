import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface RankingSourceItem {
  id?: string;
  title?: string;
  summary?: string;
  category?: string;
  benefitType?: string;
  sourceName?: string;
  merchant?: string;
  mallName?: string;
  tags?: string[];
  publishable?: boolean;
  isHidden?: boolean;
  validationStatus?: string;
  availability?: string;
  linkType?: string;
  finalUrl?: string;
  officialUrl?: string;
  sourceUrl?: string;
  eventUrl?: string;
  expiresAt?: string;
  endDate?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  updatedAt?: string;
  collectedAt?: string;
  qualityScore?: number;
  priorityScore?: number;
  discountRate?: number;
  provider?: string;
}

export interface FreeBenefitRankingReport {
  ok: boolean;
  generatedAt: string;
  sourceSnapshotGeneratedAt?: string;
  totalRows: number;
  publishableCount: number;
  consumerPublishableCount: number;
  noPurchaseCount: number;
  claimReadyCount: number;
  topClaimReadyCount: number;
  topBenefitTypeDiversity: number;
  exactDuplicateGroupCount: number;
  fuzzyDuplicateGroupCount: number;
  maxTopBrandRepeat: number;
  maxTopDomainRepeat: number;
  averageScores: {
    quality: number;
    freshness: number;
    official: number;
    urgency: number;
    reward: number;
  };
  operationalReadiness: {
    recentlyCheckedCount: number;
    staleCheckedCount: number;
    missingCheckedAtCount: number;
    expiringTodayCount: number;
    expiringThisWeekCount: number;
    noPurchaseShare: number;
    claimReadyShare: number;
    officialHostDiversity: number;
  };
  categoryCounts: Record<string, number>;
  topBrandCounts: Record<string, number>;
  topDomainCounts: Record<string, number>;
  exactDuplicateGroups: RankingDuplicateGroup[];
  fuzzyDuplicateGroups: RankingDuplicateGroup[];
  topCandidates: RankingCandidate[];
  claimReadyCandidates: RankingCandidate[];
  issues: string[];
}

export interface RankingCandidate {
  id: string;
  brand: string;
  title: string;
  benefitType: string;
  sourceDomain: string;
  rankingScore: number;
  qualityScore: number;
  freshnessScore: number;
  officialScore: number;
  urgencyScore: number;
  rewardScore: number;
  isNoPurchase: boolean;
  claimEaseScore: number;
  claimUrgencyLabel: string;
  endDate: string;
  finalUrl: string;
}

export interface RankingDuplicateGroup {
  key: string;
  count: number;
  kept: RankingCandidate;
  mergedIds: string[];
}

const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const publicBenefitPattern = /정부|공공|문화|교육|K-MOOC|복지|지자체|청년정책/i;
const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진|재입고\s*알림/i;
const purchaseRequiredPattern = /구매|주문|결제|최소\s*주문|이상\s*구매|배송비\s*결제|카드\s*발급|자동\s*납부|연회비/i;

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function sanitize(value: unknown, maxLength = 180) {
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

function normalizeText(value: unknown, maxLength = 120) {
  return sanitize(value, maxLength)
    .toLowerCase()
    .replace(/\[[^\]]+\]|\([^)]+\)/g, "")
    .replace(/무료|혜택|이벤트|쿠폰|행사|프로모션|증정|받기/g, "")
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "")
    .trim();
}

function getUrl(value: unknown) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeUrl(value: unknown) {
  const url = getUrl(value);
  if (!url) return "";
  for (const key of Array.from(url.searchParams.keys())) {
    if (/^(utm_|fbclid|gclid|click|trace|session|ref|source|from|channel|ad)/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.hash = "";
  url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

function getHost(value: unknown) {
  const url = getUrl(value);
  return url ? url.hostname.replace(/^www\./, "").toLowerCase() : "";
}

function inferBenefitType(item: RankingSourceItem) {
  const text = [item.title, item.summary, item.category, item.benefitType, item.tags?.join(" ")].join(" ");
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

function scoreFreshness(item: RankingSourceItem, now: number) {
  const checkedAt = Date.parse(String(item.verifiedAt || item.lastCheckedAt || item.updatedAt || item.collectedAt || ""));
  if (!Number.isFinite(checkedAt)) return 0;
  const ageHours = Math.max(0, (now - checkedAt) / 3_600_000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 72) return 78;
  if (ageHours <= 168) return 62;
  return 25;
}

function getCheckedAgeHours(item: RankingSourceItem, now: number) {
  const checkedAt = Date.parse(String(item.verifiedAt || item.lastCheckedAt || item.updatedAt || item.collectedAt || ""));
  if (!Number.isFinite(checkedAt)) return null;
  return Math.max(0, (now - checkedAt) / 3_600_000);
}

function scoreUrgency(endDate: unknown, now: number) {
  const endAt = Date.parse(String(endDate ?? ""));
  if (!Number.isFinite(endAt)) return 35;
  const hoursLeft = (endAt - now) / 3_600_000;
  if (hoursLeft < 0) return 0;
  if (hoursLeft <= 24) return 100;
  if (hoursLeft <= 72) return 85;
  if (hoursLeft <= 168) return 68;
  return 42;
}

function scoreReward(item: RankingSourceItem, benefitType: string, text: string) {
  let score = 45;
  if (benefitType === "everyone") score += 25;
  if (benefitType === "sample" || benefitType === "freeTrial" || benefitType === "gifticon") score += 20;
  if (benefitType === "coupon" || benefitType === "pointCashback") score += 14;
  if (benefitType === "checkIn" || benefitType === "roulette") score += 10;
  if (!purchaseRequiredPattern.test(text)) score += 10;
  if (Number(item.discountRate ?? 0) >= 50) score += 6;
  return Math.max(0, Math.min(100, score));
}

function getClaimUrgencyLabel(endDate: string, now: number) {
  const endAt = Date.parse(endDate);
  if (!Number.isFinite(endAt)) return "상시확인";
  const hoursLeft = (endAt - now) / 3_600_000;
  if (hoursLeft < 0) return "종료";
  if (hoursLeft <= 24) return "오늘마감";
  if (hoursLeft <= 168) return "이번주마감";
  if (hoursLeft <= 336) return "마감임박";
  return "여유있음";
}

interface InternalCandidate extends RankingCandidate {
  rewardValue: string;
  endDate: string;
  normalizedUrl: string;
  officialUrl: string;
  publishable: boolean;
  isConsumer: boolean;
  isNoPurchase: boolean;
  officialScore: number;
  urgencyScore: number;
  priorityScore: number;
  checkedAgeHours: number | null;
  exactDedupeKey: string;
  fuzzyDedupeKey: string;
}

function toCandidate(item: RankingSourceItem, now: number): InternalCandidate {
  const finalUrl = normalizeUrl(item.finalUrl || item.officialUrl || item.sourceUrl || item.eventUrl);
  const host = getHost(finalUrl);
  const text = [item.title, item.summary, item.category, item.sourceName, item.tags?.join(" ")].join(" ");
  const endDate = String(item.expiresAt || item.endDate || "");
  const endAt = Date.parse(endDate);
  const benefitType = inferBenefitType(item);
  const isExpired = Number.isFinite(endAt) && endAt < now;
  const isOfficial = String(item.linkType || "").startsWith("official") || item.provider === "official_event" || item.provider === "public_coupon";
  const brand = sanitize(item.merchant || item.mallName || item.sourceName || host || "기타", 60);
  const title = sanitize(item.title, 140);
  const rewardValue = sanitize(item.summary || item.title, 140);
  const qualityScore = Number(item.qualityScore ?? 0);
  const freshnessScore = scoreFreshness(item, now);
  const checkedAgeHours = getCheckedAgeHours(item, now);
  const officialScore = isOfficial ? 100 : 0;
  const urgencyScore = scoreUrgency(endDate, now);
  const rewardScore = scoreReward(item, benefitType, text);
  const priorityScore = Number(item.priorityScore ?? 0);
  const isNoPurchase = !purchaseRequiredPattern.test(text);
  const claimEaseScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        qualityScore * 0.35 +
          officialScore * 0.25 +
          rewardScore * 0.2 +
          freshnessScore * 0.1 +
          (isNoPurchase ? 10 : -18)
      )
    )
  );
  const publishable =
    item.publishable !== false &&
    item.isHidden !== true &&
    item.validationStatus === "passed" &&
    item.availability === "active" &&
    Boolean(finalUrl) &&
    !blockedUrlPattern.test(finalUrl) &&
    !endedTextPattern.test(text) &&
    !isExpired &&
    qualityScore >= 70 &&
    isOfficial;

  return {
    id: sanitize(item.id, 80),
    brand,
    title,
    benefitType,
    rewardValue,
    endDate,
    sourceDomain: host,
    finalUrl,
    normalizedUrl: finalUrl,
    officialUrl: normalizeUrl(item.officialUrl || item.sourceUrl || finalUrl),
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
    exactDedupeKey: [normalizeText(brand, 60), normalizeText(title, 120), host, benefitType, normalizeText(rewardValue, 80), endDate.slice(0, 10), finalUrl].join("|"),
    fuzzyDedupeKey: [normalizeText(brand, 60), normalizeText(title, 120), host, benefitType, normalizeText(rewardValue, 80), endDate.slice(0, 10)].join("|")
  };
}

function groupBy<T>(items: T[], select: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = select(item);
    const rows = groups.get(key) ?? [];
    rows.push(item);
    groups.set(key, rows);
  }
  return groups;
}

function countBy<T>(items: T[], select: (item: T) => string) {
  return Object.fromEntries(
    Array.from(groupBy(items, select).entries())
      .map(([name, rows]): [string, number] => [name || "unknown", rows.length])
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "ko"))
  );
}

function average(items: InternalCandidate[], key: keyof Pick<InternalCandidate, "qualityScore" | "freshnessScore" | "officialScore" | "urgencyScore" | "rewardScore">) {
  const values = items.map((item) => Number(item[key] ?? 0)).filter(Number.isFinite);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function topDuplicateGroups(groups: Map<string, InternalCandidate[]>, limit = 20): RankingDuplicateGroup[] {
  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, rows]) => {
      const sorted = [...rows].sort((a, b) => b.rankingScore - a.rankingScore);
      const kept = sorted[0];
      return {
        key,
        count: rows.length,
        kept: {
          id: kept.id,
          brand: kept.brand,
          title: kept.title,
          benefitType: kept.benefitType,
          sourceDomain: kept.sourceDomain,
          rankingScore: kept.rankingScore,
          qualityScore: kept.qualityScore,
          freshnessScore: kept.freshnessScore,
          officialScore: kept.officialScore,
          urgencyScore: kept.urgencyScore,
          rewardScore: kept.rewardScore,
          isNoPurchase: kept.isNoPurchase,
          claimEaseScore: kept.claimEaseScore,
          claimUrgencyLabel: kept.claimUrgencyLabel,
          endDate: kept.endDate,
          finalUrl: kept.finalUrl
        },
        mergedIds: rows.map((row) => row.id)
      };
    });
}

function selectDiverseCandidates(items: InternalCandidate[], limit: number) {
  const sorted = [...items].sort((a, b) => b.rankingScore - a.rankingScore);
  const selected: InternalCandidate[] = [];
  const brandCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const pushIfAllowed = (item: InternalCandidate, strict: boolean) => {
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

export function buildFreeBenefitRankingReport(referenceNow = Date.now()): FreeBenefitRankingReport {
  const snapshot = readJson<{ generatedAt?: string; deals?: RankingSourceItem[] }>(join(process.cwd(), "data", "refreshedNewsDeals.json"), {});
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const candidates = deals.map((deal) => toCandidate(deal, referenceNow));
  const publishable = candidates.filter((item) => item.publishable);
  const consumerPublishable = publishable.filter((item) => item.isConsumer);
  const topConsumer = selectDiverseCandidates(consumerPublishable, 32);
  const exactDuplicateGroups = topDuplicateGroups(groupBy(publishable, (item) => item.exactDedupeKey));
  const fuzzyDuplicateGroups = topDuplicateGroups(groupBy(publishable, (item) => item.fuzzyDedupeKey));
  const topBrandCounts = countBy(topConsumer.slice(0, 24), (item) => item.brand);
  const topDomainCounts = countBy(topConsumer.slice(0, 24), (item) => item.sourceDomain);
  const maxTopBrandRepeat = Math.max(0, ...Object.values(topBrandCounts));
  const maxTopDomainRepeat = Math.max(0, ...Object.values(topDomainCounts));
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

  return {
    ok: issues.length === 0,
    generatedAt: new Date(referenceNow).toISOString(),
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
    categoryCounts: countBy(publishable, (item) => item.benefitType),
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
      officialScore: item.officialScore,
      urgencyScore: item.urgencyScore,
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
      officialScore: item.officialScore,
      urgencyScore: item.urgencyScore,
      rewardScore: item.rewardScore,
      isNoPurchase: item.isNoPurchase,
      claimEaseScore: item.claimEaseScore,
      claimUrgencyLabel: item.claimUrgencyLabel,
      endDate: item.endDate,
      finalUrl: item.finalUrl
    })),
    issues
  };
}

export function buildFreeBenefitRankingCsv(report: FreeBenefitRankingReport) {
  const rows: string[][] = [["section", "name", "status", "value", "detail", "action"]];
  rows.push(["summary", "publishableCount", report.ok ? "passed" : "failed", String(report.publishableCount), "노출 가능한 공식 무료혜택", "npm run benefit:ranking:doctor"]);
  rows.push(["summary", "consumerPublishableCount", "count", String(report.consumerPublishableCount), "소비자형 무료혜택", "npm run refresh:benefits"]);
  rows.push(["summary", "noPurchaseCount", "count", String(report.noPurchaseCount), "구매 조건 없는 혜택", "npm run verify:freebies"]);
  rows.push(["claim_ready", "claimReadyCount", report.claimReadyCount >= 40 ? "passed" : "failed", String(report.claimReadyCount), "바로 받을 수 있는 고신뢰 혜택 후보", "npm run benefit:ranking:doctor"]);
  rows.push(["claim_ready", "topClaimReadyCount", report.topClaimReadyCount >= 16 ? "passed" : "failed", String(report.topClaimReadyCount), "첫 화면 쉬운 참여 혜택 수", "홈 무료혜택 상단 큐 확인"]);
  rows.push(["claim_ready", "topBenefitTypeDiversity", report.topBenefitTypeDiversity >= 7 ? "passed" : "failed", String(report.topBenefitTypeDiversity), "첫 화면 혜택 유형 다양성", "혜택 유형별 공식 후보 보강"]);
  rows.push(["operations", "recentlyCheckedCount", report.operationalReadiness.recentlyCheckedCount >= 120 ? "passed" : "failed", String(report.operationalReadiness.recentlyCheckedCount), "24시간 내 재검증된 publishable 혜택", "npm run refresh:benefits"]);
  rows.push(["operations", "staleCheckedCount", report.operationalReadiness.staleCheckedCount === 0 ? "passed" : "failed", String(report.operationalReadiness.staleCheckedCount), "24시간 이상 재검증되지 않은 publishable 혜택", "npm run refresh:news"]);
  rows.push(["operations", "missingCheckedAtCount", report.operationalReadiness.missingCheckedAtCount === 0 ? "passed" : "failed", String(report.operationalReadiness.missingCheckedAtCount), "검증 시각 누락 혜택", "무료혜택 normalizer 확인"]);
  rows.push(["operations", "officialHostDiversity", report.operationalReadiness.officialHostDiversity >= 80 ? "passed" : "failed", String(report.operationalReadiness.officialHostDiversity), "공식 도메인 다양성", "source:catalog:report"]);
  rows.push(["operations", "noPurchaseShare", "ratio", `${report.operationalReadiness.noPurchaseShare}%`, "구매조건 없는 혜택 비율", "claim-ready 후보 확인"]);
  rows.push(["operations", "claimReadyShare", "ratio", `${report.operationalReadiness.claimReadyShare}%`, "바로받기 후보 비율", "claim-ready 후보 확인"]);
  rows.push(["operations", "expiringTodayCount", "count", String(report.operationalReadiness.expiringTodayCount), "오늘마감 혜택", "/free-benefits?deadline=today"]);
  rows.push(["operations", "expiringThisWeekCount", "count", String(report.operationalReadiness.expiringThisWeekCount), "이번주 마감 혜택", "/free-benefits?deadline=week"]);
  rows.push(["quality", "exactDuplicateGroupCount", report.exactDuplicateGroupCount === 0 ? "passed" : "failed", String(report.exactDuplicateGroupCount), "정확 중복 그룹", "dedupe key 확인"]);
  rows.push(["quality", "fuzzyDuplicateGroupCount", report.fuzzyDuplicateGroupCount <= 8 ? "passed" : "watch", String(report.fuzzyDuplicateGroupCount), "유사 중복 후보", "상위 후보 브랜드 반복 확인"]);
  rows.push(["quality", "maxTopBrandRepeat", report.maxTopBrandRepeat <= 4 ? "passed" : "failed", String(report.maxTopBrandRepeat), "첫 화면 브랜드 최대 반복", "홈 무료혜택 다양성 조정"]);
  rows.push(["quality", "maxTopDomainRepeat", report.maxTopDomainRepeat <= 5 ? "passed" : "failed", String(report.maxTopDomainRepeat), "첫 화면 도메인 최대 반복", "홈 무료혜택 다양성 조정"]);
  for (const [name, count] of Object.entries(report.categoryCounts)) {
    rows.push(["benefit_type", name, "count", String(count), "혜택 유형별 노출 수", `/free-benefits?eventType=${name}`]);
  }
  for (const item of report.topCandidates) {
    rows.push(["top_candidate", item.id, "candidate", String(item.rankingScore), `${item.brand}; ${item.title}; ${item.benefitType}; ${item.sourceDomain}; quality=${item.qualityScore}; freshness=${item.freshnessScore}; official=${item.officialScore}; urgency=${item.urgencyScore}; reward=${item.rewardScore}; claimEase=${item.claimEaseScore}; ${item.claimUrgencyLabel}`, item.finalUrl]);
  }
  for (const item of report.claimReadyCandidates) {
    rows.push(["claim_ready_candidate", item.id, "candidate", String(item.claimEaseScore), `${item.brand}; ${item.title}; ${item.benefitType}; ${item.sourceDomain}; official=${item.officialScore}; urgency=${item.urgencyScore}; reward=${item.rewardScore}; ${item.claimUrgencyLabel}`, item.finalUrl]);
  }
  for (const issue of report.issues) {
    rows.push(["issue", "ranking_quality", "failed", "", issue, "npm run benefit:ranking:doctor"]);
  }

  return `${rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(",")).join("\n")}\n`;
}
