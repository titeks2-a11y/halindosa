import { getConsumerBenefitPriorityAdjustment, getMainFeedConsumerPriorityPenalty, isPublicPolicyBenefit } from "@/lib/consumerBenefitPriority";
import type { NewsDeal, NewsBenefitType } from "@/types/newsDeal";

export const homeFreebieBenefitTypes = new Set<NewsBenefitType>([
  "coupon",
  "freebie",
  "freeShipping",
  "event",
  "point",
  "public",
  "sample",
  "education",
  "public_free",
  "membership",
  "card",
  "culture",
  "convenienceStore",
  "mart",
  "foodDelivery"
]);

const strictFreeBenefitTypes = new Set<NewsBenefitType>([
  "coupon",
  "freebie",
  "freeShipping",
  "event",
  "point",
  "sample",
  "membership",
  "card",
  "convenienceStore",
  "mart",
  "foodDelivery"
]);
const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum/i;
const freeIntentPattern = /무료|0원|무배|무료배송|쿠폰|포인트|샘플|체험|초대|지원|증정|1\+1|2\+1|행사|이벤트|리워드|멤버십|카드|배달|편의점|마트/;
const purchaseConditionPattern = /구매|주문|결제|최소\s*주문|이상\s*구매|장바구니|배송비|카드\s*발급|신규\s*발급|자동\s*납부|자동이체|연회비/i;
const lowFrictionBenefitPattern = /무료\s*체험|샘플|쿠폰|포인트|출석|룰렛|기프티콘|0원|전원\s*증정/i;

function getSearchText(deal: NewsDeal) {
  return [deal.title, deal.summary, deal.category, deal.benefitType, deal.sourceName, deal.tags.join(" ")].join(" ");
}

export function hasPurchaseCondition(deal: NewsDeal) {
  return purchaseConditionPattern.test(getSearchText(deal));
}

export function hasLowFrictionBenefitSignal(deal: NewsDeal) {
  return lowFrictionBenefitPattern.test(getSearchText(deal));
}

export function isHttpOfficialBenefitUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !blockedUrlPattern.test(value);
  } catch {
    return false;
  }
}

export function isPublishableOfficialFreebie(deal: NewsDeal, referenceNow = Date.now()) {
  const endTime = Date.parse(deal.expiresAt || deal.endDate);
  const expired = Number.isFinite(endTime) && endTime < referenceNow;
  const searchable = getSearchText(deal);
  const isFreeIntent =
    strictFreeBenefitTypes.has(deal.benefitType) ||
    deal.category === "무료혜택" ||
    freeIntentPattern.test(searchable);

  return (
    isFreeIntent &&
    !isPublicPolicyBenefit(deal) &&
    deal.publishable === true &&
    deal.isHidden !== true &&
    deal.validationStatus === "passed" &&
    deal.availability === "active" &&
    String(deal.linkType || "").startsWith("official") &&
    isHttpOfficialBenefitUrl(deal.finalUrl) &&
    !expired &&
    Number(deal.qualityScore ?? deal.priorityScore ?? 0) >= 70
  );
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hoursUntil(value: string, referenceNow: number) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return (timestamp - referenceNow) / 3_600_000;
}

function hoursSince(value: string, referenceNow: number) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (referenceNow - timestamp) / 3_600_000);
}

export function getHomeFreebieScore(deal: NewsDeal, referenceNow = Date.now()) {
  const endingHours = hoursUntil(deal.expiresAt || deal.endDate, referenceNow);
  const checkedHours = hoursSince(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt, referenceNow);
  const requiresPurchase = hasPurchaseCondition(deal);
  const lowFriction = hasLowFrictionBenefitSignal(deal);
  const typeBoost =
    deal.benefitType === "sample"
      ? 38
      : deal.benefitType === "freebie"
      ? 34
      : deal.benefitType === "coupon"
        ? 30
        : deal.benefitType === "freeShipping"
          ? 28
          : deal.benefitType === "point"
            ? 24
            : deal.benefitType === "public" || deal.benefitType === "public_free" || deal.benefitType === "education" || deal.benefitType === "culture"
              ? 4
            : deal.benefitType === "card"
              ? 6
              : 16;
  const urgencyBoost = endingHours <= 12 ? 28 : endingHours <= 24 ? 22 : endingHours <= 72 ? 12 : 0;
  const freshnessBoost = checkedHours <= 1 ? 16 : checkedHours <= 6 ? 10 : checkedHours <= 24 ? 5 : 0;
  const conditionAdjustment = (requiresPurchase ? -48 : 20) + (lowFriction ? 18 : 0);

  return Math.round(
    Number(deal.priorityScore ?? 0) * 1.2 +
      Number(deal.qualityScore ?? 0) * 1.1 +
      typeBoost +
      urgencyBoost +
      freshnessBoost +
      conditionAdjustment +
      getConsumerBenefitPriorityAdjustment(deal) +
      getMainFeedConsumerPriorityPenalty(deal) +
      (deal.imageUrl ? 5 : 0)
  );
}

function withDiversity(items: NewsDeal[], limit: number) {
  const selected: NewsDeal[] = [];
  const usedSources = new Map<string, number>();
  const usedTypes = new Map<string, number>();

  for (const item of items) {
    const sourceKey = item.sourceName || item.mallName || item.officialHost || "unknown";
    const typeKey = item.benefitType || "unknown";
    const sourceCount = usedSources.get(sourceKey) ?? 0;
    const typeCount = usedTypes.get(typeKey) ?? 0;

    if (selected.length < Math.min(limit, 8) && (sourceCount >= 1 || typeCount >= 3)) continue;

    selected.push(item);
    usedSources.set(sourceKey, sourceCount + 1);
    usedTypes.set(typeKey, typeCount + 1);
    if (selected.length >= limit) return selected;
  }

  for (const item of items) {
    if (selected.some((selectedItem) => selectedItem.id === item.id)) continue;
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function selectHomeFreebies(deals: NewsDeal[], limit = 12, referenceNow = Date.now()) {
  const rotationBucket = Math.floor(referenceNow / (30 * 60 * 1000));
  const scored = deals
    .filter((deal) => isPublishableOfficialFreebie(deal, referenceNow))
    .map((deal) => ({
      deal,
      score: getHomeFreebieScore(deal, referenceNow) + (stableHash(`${deal.id}:${rotationBucket}`) % 17)
    }))
    .sort((a, b) => b.score - a.score || Date.parse(a.deal.expiresAt || a.deal.endDate) - Date.parse(b.deal.expiresAt || b.deal.endDate))
    .map((item) => item.deal);

  return withDiversity(scored, limit);
}

export function buildHomeFreebieSummary(deals: NewsDeal[], referenceNow = Date.now()) {
  const visible = deals.filter((deal) => isPublishableOfficialFreebie(deal, referenceNow));
  const endingToday = visible.filter((deal) => {
    const hours = hoursUntil(deal.expiresAt || deal.endDate, referenceNow);
    return hours >= 0 && hours <= 24;
  });

  return {
    total: visible.length,
    zeroCost: visible.filter((deal) => deal.price === 0 || deal.benefitType === "freebie" || /무료|0원|샘플|체험/.test(`${deal.title} ${deal.summary}`)).length,
    coupon: visible.filter((deal) => deal.benefitType === "coupon" || deal.couponAmount > 0 || /쿠폰/.test(`${deal.title} ${deal.summary}`)).length,
    freeShipping: visible.filter((deal) => deal.benefitType === "freeShipping" || /무료배송|무배/.test(`${deal.title} ${deal.summary}`)).length,
    endingToday: endingToday.length,
    sourceCount: new Set(visible.map((deal) => deal.sourceName || deal.officialHost).filter(Boolean)).size,
    averageQualityScore: visible.length ? Math.round(visible.reduce((sum, deal) => sum + Number(deal.qualityScore ?? 0), 0) / visible.length) : 0
  };
}

export function getHomeFreebieBenefitLabel(type: NewsBenefitType) {
  const labels: Record<NewsBenefitType, string> = {
    discount: "할인",
    coupon: "쿠폰",
    freebie: "무료",
    freeShipping: "무배",
    event: "이벤트",
    membership: "멤버십",
    card: "카드",
    culture: "문화",
    travel: "여행",
    public: "공공",
    point: "포인트",
    foodDelivery: "배달",
    convenienceStore: "편의점",
    mart: "마트",
    sample: "샘플",
    education: "교육",
    public_free: "공공"
  };

  return labels[type] ?? "혜택";
}
