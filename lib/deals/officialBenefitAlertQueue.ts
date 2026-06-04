import type { NewsDeal } from "@/types/newsDeal";

export interface OfficialBenefitAlertQueueInput {
  interests?: string[];
  recentNewsIds?: string[];
  limit?: number;
}

export const defaultOfficialBenefitAlertInterests = ["무료/체험", "쿠폰/이벤트", "마트/편의점", "영화/문화"];

function uniqueValues(values: string[] = []) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 12);
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isActiveOfficialBenefit(deal: NewsDeal) {
  const endTime = parseTime(deal.endDate);

  return (
    deal.validationStatus === "passed" &&
    !deal.isHidden &&
    isHttpUrl(deal.finalUrl) &&
    (deal.availability ?? "active") === "active" &&
    (endTime === null || endTime >= Date.now()) &&
    (deal.linkType ?? "official_benefit").startsWith("official")
  );
}

export function newsDealMatchesNotificationInterest(deal: NewsDeal, interest: string) {
  const searchable = [deal.title, deal.summary, deal.merchant, deal.category, deal.benefitType, deal.sourceName, deal.tags.join(" ")]
    .filter(Boolean)
    .join(" ");

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

function rankOfficialBenefit(deal: NewsDeal, interests: string[], recentNewsIds: string[]) {
  const categoryBoost = interests.some((interest) => newsDealMatchesNotificationInterest(deal, interest)) ? 34 : 0;
  const recentBoost = recentNewsIds.includes(deal.id) ? 18 : 0;
  const endTime = parseTime(deal.endDate);
  const checkedTime = parseTime(deal.lastCheckedAt);
  const hoursUntilEnd = endTime === null ? Number.POSITIVE_INFINITY : (endTime - Date.now()) / (60 * 60 * 1000);
  const hoursSinceCheck = checkedTime === null ? Number.POSITIVE_INFINITY : (Date.now() - checkedTime) / (60 * 60 * 1000);
  const endingBoost = Number.isFinite(hoursUntilEnd) ? Math.max(0, 72 - hoursUntilEnd) : 0;
  const freshnessBoost = hoursSinceCheck <= 24 ? 12 : hoursSinceCheck <= 72 ? 6 : hoursSinceCheck <= 168 ? 2 : 0;
  const officialLinkBoost = deal.linkType === "official_coupon" ? 10 : deal.linkType === "official_event" ? 8 : 6;
  const freeBoost = deal.benefitType === "freebie" || deal.benefitType === "coupon" || safeNumber(deal.price) === 0 ? 24 : 0;

  return (
    safeNumber(deal.priorityScore, safeNumber(deal.confidenceScore)) +
    categoryBoost +
    recentBoost +
    endingBoost +
    freshnessBoost +
    officialLinkBoost +
    freeBoost +
    safeNumber(deal.couponAmount) / 1000
  );
}

function buildReason(deal: NewsDeal, interests: string[], recentNewsIds: string[]) {
  const matchedInterest = interests.find((interest) => newsDealMatchesNotificationInterest(deal, interest));
  if (recentNewsIds.includes(deal.id)) return "최근 본 공식 혜택이라 다시 확인하기 좋습니다.";
  if (matchedInterest) return `${matchedInterest} 관심 알림과 맞는 공식 혜택입니다.`;
  if (deal.benefitType === "freebie" || deal.benefitType === "coupon") return "무료 또는 쿠폰 혜택이라 먼저 볼 만합니다.";
  return "공식 페이지 이동이 확인된 혜택입니다.";
}

export function buildOfficialBenefitAlertQueue(newsDeals: NewsDeal[], input: OfficialBenefitAlertQueueInput = {}) {
  const interests = uniqueValues(input.interests?.length ? input.interests : defaultOfficialBenefitAlertInterests);
  const recentNewsIds = uniqueValues(input.recentNewsIds);
  const limit = Math.max(1, Math.min(12, Math.floor(input.limit ?? 6)));
  const activeBenefits = newsDeals.filter(isActiveOfficialBenefit);
  const interestMatches = activeBenefits.filter((deal) => interests.some((interest) => newsDealMatchesNotificationInterest(deal, interest)));
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
      matchedInterests: interests.filter((interest) => newsDealMatchesNotificationInterest(deal, interest)),
      personalizedSignals: {
        interestMatched: interests.filter((interest) => newsDealMatchesNotificationInterest(deal, interest)),
        recentOfficialBenefit: recentNewsIds.includes(deal.id)
      }
    }));

  return {
    audience: "guest",
    loginRequiredFor: ["알림 동기화", "관심 카테고리 계정 저장"],
    interests,
    summary: {
      totalActiveBenefits: activeBenefits.length,
      interestMatchedBenefits: interestMatches.length,
      recentBenefits: recentMatches.length,
      recommendedBenefits: items.length
    },
    items,
    emptyState: {
      title: "공식 혜택 알림 후보를 다시 확인하고 있습니다",
      description: "검색 결과나 커뮤니티 원문이 아니라 공식 페이지 이동이 검증된 혜택만 알림 후보로 사용합니다."
    },
    notice: "비회원도 공식 혜택을 열어본 기록과 알림 받을 카테고리를 이 기기에 저장할 수 있습니다. 실제 푸시는 별도 동의 후에만 연결됩니다."
  };
}
