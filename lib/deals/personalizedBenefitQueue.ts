import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { getDailyBenefitScore, toDailyBenefitItem } from "@/lib/deals/todayBenefitQueue";
import type { Deal } from "@/types/deal";

export interface PersonalizedBenefitInput {
  interests?: string[];
  favoriteIds?: string[];
  recentIds?: string[];
  limit?: number;
}

const defaultInterests = ["무료/체험", "쿠폰/이벤트", "식품", "생활용품"];

function uniqueValues(values: string[] = []) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 12);
}

export function dealMatchesPersonalInterest(deal: Deal, interest: string) {
  const searchable = [deal.title, deal.description, deal.category, deal.subCategory, deal.mallName, deal.benefitSummary, deal.tags.join(" ")]
    .filter(Boolean)
    .join(" ");

  if (interest === "무료/체험") return ["freebie", "experience", "freeShipping"].includes(deal.dealType) || /무료|체험|샘플|0원|무배/.test(searchable);
  if (interest === "쿠폰/이벤트") return ["coupon", "event", "foodDelivery", "point"].includes(deal.dealType) || /쿠폰|이벤트|포인트|적립|배달/.test(searchable);
  if (interest === "디지털") return /디지털|전자기기|가전|노트북|TV|스마트|충전|이어폰/.test(searchable);
  if (interest === "패션") return /패션|의류|잡화|신발|무신사|가방|스니커즈/.test(searchable);
  if (interest === "여행") return /여행|티켓|항공|숙박|호텔|공연|전시|영화/.test(searchable);

  return searchable.includes(interest);
}

function scorePersonalDeal(deal: Deal, interests: string[], favoriteIds: string[], recentIds: string[]) {
  const interestScore = interests.some((interest) => dealMatchesPersonalInterest(deal, interest)) ? 34 : 0;
  const favoriteScore = favoriteIds.includes(deal.id) ? 18 : 0;
  const recentScore = recentIds.includes(deal.id) ? 12 : 0;
  const freeScore = ["freebie", "coupon", "experience", "point", "foodDelivery"].includes(deal.dealType) ? 10 : 0;

  return getDailyBenefitScore(deal) + interestScore + favoriteScore + recentScore + freeScore;
}

function buildReason(deal: Deal, interests: string[], favoriteIds: string[], recentIds: string[]) {
  const matchedInterest = interests.find((interest) => dealMatchesPersonalInterest(deal, interest));
  if (favoriteIds.includes(deal.id)) return "찜한 혜택과 이어볼 만한 조건입니다.";
  if (recentIds.includes(deal.id)) return "최근 본 흐름에서 다시 확인하기 좋은 혜택입니다.";
  if (matchedInterest) return `${matchedInterest} 관심사와 맞는 ${getBenefitTypeLabel(deal.dealType)} 혜택입니다.`;
  if (deal.purchaseLinkVerified) return "실제 상세 이동이 확인된 혜택입니다.";
  return "오늘 반응과 혜택 조건을 기준으로 추천합니다.";
}

export function buildPersonalizedBenefitQueue(deals: Deal[], input: PersonalizedBenefitInput = {}) {
  const interests = uniqueValues(input.interests?.length ? input.interests : defaultInterests);
  const favoriteIds = uniqueValues(input.favoriteIds);
  const recentIds = uniqueValues(input.recentIds);
  const limit = Math.max(1, Math.min(12, Math.floor(input.limit ?? 6)));
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");
  const interestMatches = activeDeals.filter((deal) => interests.some((interest) => dealMatchesPersonalInterest(deal, interest)));
  const continuityMatches = activeDeals.filter((deal) => favoriteIds.includes(deal.id) || recentIds.includes(deal.id));
  const source = interestMatches.length ? interestMatches : activeDeals;
  const items = Array.from(new Map([...continuityMatches, ...source].map((deal) => [deal.id, deal])).values())
    .sort((a, b) => scorePersonalDeal(b, interests, favoriteIds, recentIds) - scorePersonalDeal(a, interests, favoriteIds, recentIds))
    .slice(0, limit)
    .map((deal) => ({
      ...toDailyBenefitItem(deal),
      reason: buildReason(deal, interests, favoriteIds, recentIds),
      personalizedSignals: {
        interestMatched: interests.filter((interest) => dealMatchesPersonalInterest(deal, interest)),
        favorite: favoriteIds.includes(deal.id),
        recent: recentIds.includes(deal.id)
      }
    }));

  return {
    audience: "guest",
    loginRequiredFor: ["찜 동기화", "가격 알림 저장", "관심 카테고리 계정 저장"],
    interests,
    summary: {
      totalActiveDeals: activeDeals.length,
      interestMatchedDeals: interestMatches.length,
      continuityDeals: continuityMatches.length,
      recommendedDeals: items.length
    },
    items,
    emptyState: {
      title: "관심사에 맞는 혜택을 찾는 중입니다",
      description: "무료/체험, 쿠폰/이벤트, 식품, 생활용품 같은 기본 관심사로 오늘 볼 혜택을 먼저 보여드립니다."
    },
    notice: "비회원도 관심사를 이 기기에 저장해 추천을 받을 수 있습니다. 계정 저장과 알림 동기화만 선택 로그인이 필요합니다."
  };
}
