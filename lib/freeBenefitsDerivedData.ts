import { getClaimEffort } from "@/lib/deals/claimEffort";
import { BenefitSort, ClaimEffortFilter, freeBenefitTabs, getPriorityScore } from "@/lib/freeBenefitsConfig";
import { Deal, DealBenefitType } from "@/types/deal";

export interface FreeBenefitFilterState {
  activeType: "all" | DealBenefitType;
  query: string;
  sort: BenefitSort;
  endingSoonOnly: boolean;
  freeShippingOnly: boolean;
  noSignupOnly: boolean;
  firstComeOnly: boolean;
  activeOnly: boolean;
  claimEffortFilter: ClaimEffortFilter;
  referenceNow: number;
}

export function isActiveFreeBenefit(deal: Deal) {
  return !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken";
}

export function buildFilteredFreeBenefits(deals: Deal[], filters: FreeBenefitFilterState) {
  const searchQuery = filters.query.trim().toLowerCase();
  let source = filters.activeType === "all" ? deals : deals.filter((deal) => deal.dealType === filters.activeType);

  if (searchQuery) {
    source = source.filter((deal) =>
      [
        deal.title,
        deal.mallName,
        deal.category,
        deal.subCategory ?? "",
        deal.benefitSummary,
        deal.couponCondition ?? "",
        ...deal.tags
      ].some((value) => value.toLowerCase().includes(searchQuery))
    );
  }

  if (filters.endingSoonOnly) {
    source = source.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - filters.referenceNow < 12 * 60 * 60 * 1000);
  }

  if (filters.freeShippingOnly) source = source.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송");
  if (filters.noSignupOnly) source = source.filter((deal) => !deal.requiresSignup);
  if (filters.firstComeOnly) source = source.filter((deal) => deal.isFirstComeFirstServed);
  if (filters.activeOnly) source = source.filter(isActiveFreeBenefit);
  if (filters.claimEffortFilter !== "all") source = source.filter((deal) => getClaimEffort(deal, filters.referenceNow) === filters.claimEffortFilter);

  return [...source].sort((a, b) => {
    const activeScore = Number(a.isExpired) - Number(b.isExpired);
    if (activeScore !== 0) return activeScore;
    if (filters.sort === "endingSoon") return new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
    if (filters.sort === "popular") return b.clickCount - a.clickCount || b.likeCount - a.likeCount;
    if (filters.sort === "savings") return b.savingsAmount - a.savingsAmount || b.savingsRate - a.savingsRate;
    return b.reliabilityScore - a.reliabilityScore || b.clickCount - a.clickCount || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
  });
}

export function buildFreeBenefitTabCounts(deals: Deal[]) {
  return Object.fromEntries(
    freeBenefitTabs.map((tab) => [
      tab.id,
      tab.id === "all" ? deals.length : deals.filter((deal) => deal.dealType === tab.id).length
    ])
  );
}

export function buildFreeBenefitRoutines(deals: Deal[]) {
  return [
    {
      id: "freebie" as const,
      title: "오늘 먼저 받을 혜택",
      copy: "무료 샘플, 체험단, 초대권처럼 비용 없이 확인할 수 있는 혜택입니다.",
      count: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
      action: "무료부터 보기"
    },
    {
      id: "coupon" as const,
      title: "결제 전 쿠폰 챙기기",
      copy: "첫 구매, 카드사, 브랜드 공식몰 쿠폰 조건을 구매 전에 확인합니다.",
      count: deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery").length,
      action: "쿠폰 모아보기"
    },
    {
      id: "point" as const,
      title: "앱테크·포인트 적립",
      copy: "출석체크, 페이 리워드, 멤버십 포인트처럼 생활비를 줄이는 혜택입니다.",
      count: deals.filter((deal) => deal.dealType === "point").length,
      action: "포인트 보기"
    },
    {
      id: "convenienceStore" as const,
      title: "장보기·편의점 행사",
      copy: "편의점 1+1, 마트 무료배송, 장보기 쿠폰을 한 번에 좁혀봅니다.",
      count: deals.filter((deal) => deal.dealType === "convenienceStore" || deal.dealType === "mart" || deal.isFreeShipping).length,
      action: "생활 혜택 보기"
    },
    {
      id: "cultureInvite" as const,
      title: "문화 초대권 찾기",
      copy: "영화 시사회, 전시, 공연, 티켓 초대권처럼 빨리 마감되는 문화 혜택만 바로 좁혀봅니다.",
      count: deals.filter((deal) => /영화|시사회|전시|공연|초대권|티켓/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`)).length,
      action: "초대권 보기"
    }
  ];
}

export function selectFreeBenefitPriorityQueue(deals: Deal[], referenceNow: number) {
  return [...deals]
    .filter((deal) => !deal.isSoldOut && deal.linkStatus !== "broken")
    .sort((a, b) => getPriorityScore(b, referenceNow) - getPriorityScore(a, referenceNow))
    .slice(0, 5);
}

export function selectZeroCostStarterPack(deals: Deal[], referenceNow: number) {
  return [...deals]
    .filter((deal) => {
      const zeroCostLike =
        deal.salePrice === 0 ||
        deal.dealType === "freebie" ||
        deal.dealType === "experience" ||
        /무료|0원|샘플|체험|초대권/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`);
      return zeroCostLike && isActiveFreeBenefit(deal);
    })
    .sort((a, b) => Number(b.isFirstComeFirstServed) - Number(a.isFirstComeFirstServed) || getPriorityScore(b, referenceNow) - getPriorityScore(a, referenceNow))
    .slice(0, 3);
}

export function countActiveFreeBenefits(deals: Deal[]) {
  return deals.filter(isActiveFreeBenefit).length;
}

export function buildFilteredReadinessSummary(filteredDeals: Deal[]) {
  return [
    {
      id: "noSignup" as const,
      title: "바로 받을 가능성",
      value: `${filteredDeals.filter((deal) => !deal.requiresSignup && !deal.isExpired && !deal.isSoldOut).length}개`,
      copy: "가입 없이 받기, 진행 중 상태를 우선 봅니다.",
      action: "가입 없이"
    },
    {
      id: "freeShipping" as const,
      title: "추가 비용 낮음",
      value: `${filteredDeals.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송" || deal.salePrice <= 1000).length}개`,
      copy: "무료배송, 0원, 배송비 부담이 낮은 혜택입니다.",
      action: "무배/0원"
    },
    {
      id: "endingSoon" as const,
      title: "오늘 먼저 확인",
      value: `${filteredDeals.filter((deal) => deal.isEndingSoon || deal.isFirstComeFirstServed).length}개`,
      copy: "마감 임박, 선착순 가능성이 있는 혜택입니다.",
      action: "마감순"
    },
    {
      id: "verified" as const,
      title: "실제 링크 확인",
      value: `${filteredDeals.filter((deal) => deal.linkStatus === "verified" && deal.finalPurchaseUrl).length}개`,
      copy: "신청/구매 상세로 바로 이동 가능한 혜택입니다.",
      action: "신뢰 링크"
    }
  ];
}

export function buildFilteredRiskReview(filteredDeals: Deal[]) {
  return [
    {
      id: "shipping" as const,
      title: "숨은 비용 확인",
      value: `${filteredDeals.filter((deal) => !deal.isFreeShipping && deal.shippingFee !== "무료배송" && deal.salePrice > 0).length}개`,
      copy: "무료처럼 보여도 배송비, 옵션가, 최소 주문 금액이 붙을 수 있는 혜택입니다.",
      action: "배송비 보기"
    },
    {
      id: "signup" as const,
      title: "가입 조건 확인",
      value: `${filteredDeals.filter((deal) => deal.requiresSignup).length}개`,
      copy: "판매처 회원가입, 앱 설치, 신규 가입 조건이 붙을 수 있어 먼저 확인합니다.",
      action: "가입 없는 혜택"
    },
    {
      id: "deadline" as const,
      title: "선착순·마감 위험",
      value: `${filteredDeals.filter((deal) => deal.isFirstComeFirstServed || deal.isEndingSoon || deal.isExpired).length}개`,
      copy: "마감 시간, 수량 제한, 종료 가능성을 기준으로 빨리 봐야 할 혜택입니다.",
      action: "마감순 보기"
    },
    {
      id: "review" as const,
      title: "신고 전 확인",
      value: `${filteredDeals.filter((deal) => deal.reportCount > 0 || deal.linkStatus !== "verified" || deal.isSoldOut).length}개`,
      copy: "신고 누적, 링크 확인 필요, 품절 가능성이 있어 판매처 상태를 다시 봅니다.",
      action: "진행 중만"
    }
  ];
}

export function buildClaimEffortSummary(deals: Deal[], referenceNow: number) {
  return [
    {
      id: "easy" as const,
      title: "간편 수령",
      value: deals.filter((deal) => getClaimEffort(deal, referenceNow) === "easy").length,
      copy: "가입, 배송비, 쿠폰 조건 부담이 낮아 먼저 눌러볼 혜택입니다.",
      action: "간편 혜택만"
    },
    {
      id: "condition" as const,
      title: "조건 확인",
      value: deals.filter((deal) => getClaimEffort(deal, referenceNow) === "condition").length,
      copy: "회원가입, 최소 주문, 쿠폰 조건, 배송비를 확인해야 하는 혜택입니다.",
      action: "조건 있는 혜택"
    },
    {
      id: "deadline" as const,
      title: "마감 주의",
      value: deals.filter((deal) => getClaimEffort(deal, referenceNow) === "deadline").length,
      copy: "선착순, 마감 임박, 종료 가능성이 있어 빨리 확인할 혜택입니다.",
      action: "마감 먼저"
    }
  ];
}
