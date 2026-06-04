import { dealChannels, dealMatchesChannel, getDealChannel } from "@/data/dealChannels";
import { Deal, DealBenefitType, DealSort } from "@/types/deal";
import { formatPrice, getTimeLeft } from "@/lib/format";
import {
  benefitFilters,
  highIntentSearchKeywords,
  mallFilters,
  priceBands,
  searchPurposePresets,
  type PriceBand
} from "@/lib/homeDiscoveryConfig";
import {
  commercialScore,
  dealMatchesInterestCategory,
  dealMatchesMallFilter,
  dealMatchesPriceBand,
  getCategoryFilterId,
  isFreeShippingDeal
} from "@/lib/homeDealFilters";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { dealMatchesSearch } from "@/lib/deals/search";

export type HomeActiveFilterChip = { id: string; label: string };

export function buildHomeStats(deals: Deal[], favorites: string[]) {
  return {
    hotCount: deals.filter((deal) => deal.isHot).length,
    endingCount: deals.filter((deal) => deal.isEndingSoon).length,
    newCount: deals.filter((deal) => deal.isNew).length,
    favoriteSignalCount: deals.filter((deal) => deal.likeCount >= 500 || favorites.includes(deal.id)).length
  };
}

export function buildHomeDataQuality(deals: Deal[], catalog: Deal[]) {
  const source = deals.length ? deals : catalog;
  const verifiedLinkCount = source.filter(isVerifiedPurchaseLink).length;
  const reviewLinkCount = source.filter((deal) => !isVerifiedPurchaseLink(deal)).length;
  const freeShippingCount = source.filter(isFreeShippingDeal).length;
  const latestPriceCheckedAt = source
    .map((deal) => new Date(deal.priceCheckedAt).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  return {
    total: source.length,
    verifiedLinkCount,
    reviewLinkCount,
    freeShippingCount,
    verifiedLinkRate: source.length ? Math.round((verifiedLinkCount / source.length) * 100) : 0,
    latestPriceCheckedAt: latestPriceCheckedAt ? new Date(latestPriceCheckedAt).toISOString() : ""
  };
}

export function buildHomeCategoryStats(catalog: Deal[]) {
  return dealChannels.map((channel) => {
    const categoryDeals = channel.id === "all" ? catalog : catalog.filter((deal) => dealMatchesChannel(deal, channel.id));
    const bestDiscount = categoryDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0);

    return {
      name: channel.label,
      id: channel.id,
      description: channel.description,
      count: categoryDeals.length,
      bestDiscount
    };
  });
}

export function buildPublicDealSource(catalog: Deal[], deals: Deal[]) {
  const source = catalog.length ? catalog : deals;
  return source.filter((deal) => isVerifiedPurchaseLink(deal) && deal.purchaseLinkVerified && deal.linkStatus === "verified" && Boolean(deal.finalPurchaseUrl));
}

export function selectHomeHeroDeal(publicDealSource: Deal[]) {
  return [...publicDealSource].sort((a, b) => commercialScore(b) - commercialScore(a))[0] ?? null;
}

export function selectHomeTopDeals(publicDealSource: Deal[]) {
  return [...publicDealSource].sort((a, b) => commercialScore(b) + b.clickCount * 0.05 - (commercialScore(a) + a.clickCount * 0.05)).slice(0, 10);
}

export function selectHomeEndingSoonDeals(publicDealSource: Deal[]) {
  return [...publicDealSource]
    .filter((deal) => deal.isEndingSoon && !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime())
    .slice(0, 8);
}

export function selectHomeInstantDealRail(deals: Deal[], publicDealSource: Deal[]) {
  const source = deals.length ? deals : publicDealSource;
  const railScore = (deal: Deal) => Number(deal.isHot) * 70 + deal.discountRate + deal.likeCount * 0.08 + deal.clickCount * 0.03;

  return [...source]
    .filter((deal) => isVerifiedPurchaseLink(deal) && !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => railScore(b) - railScore(a))
    .slice(0, 8);
}

export function selectRecentHomeDeals(publicDealSource: Deal[], deals: Deal[], recentDealIds: string[]) {
  const source = publicDealSource.length ? publicDealSource : deals;
  return recentDealIds
    .map((id) => source.find((deal) => deal.id === id))
    .filter((deal): deal is Deal => Boolean(deal))
    .slice(0, 6);
}

export function selectRecommendedHomeDeals(publicDealSource: Deal[], deals: Deal[]) {
  const source = publicDealSource.length ? publicDealSource : deals;
  return [...source]
    .filter((deal) => deal.isHot || deal.isFreeShipping)
    .sort((a, b) => commercialScore(b) - commercialScore(a))
    .slice(0, 6);
}

export function selectMemberFavoriteHomeDeals(publicDealSource: Deal[], deals: Deal[]) {
  const source = publicDealSource.length ? publicDealSource : deals;
  return [...source].sort((a, b) => b.likeCount - a.likeCount || commercialScore(b) - commercialScore(a)).slice(0, 6);
}

export function selectPersonalizedHomeDeals(
  catalog: Deal[],
  deals: Deal[],
  favoriteCategories: string[],
  fallbackInterestCategories: string[],
  memberFavoriteDeals: Deal[],
  recommendedDeals: Deal[]
) {
  const source = catalog.length ? catalog : deals;
  const interests = favoriteCategories.length ? favoriteCategories : fallbackInterestCategories;
  const matchedDeals = source.filter((deal) => interests.some((interest) => dealMatchesInterestCategory(deal, interest)));
  const fallbackDeals = memberFavoriteDeals.length ? memberFavoriteDeals : recommendedDeals;

  return [...(matchedDeals.length ? matchedDeals : fallbackDeals)]
    .sort((a, b) => b.likeCount - a.likeCount || commercialScore(b) - commercialScore(a))
    .slice(0, 6);
}

export function buildHomeCategoryHighlights(publicDealSource: Deal[]) {
  return ["food", "living", "digital", "fashion", "baby", "travel", "etc"]
    .map((id) => {
      const channel = getDealChannel(id);
      const items = publicDealSource.filter((deal) => dealMatchesChannel(deal, id)).sort((a, b) => commercialScore(b) - commercialScore(a));
      return { id, label: channel.label, deal: items[0] };
    })
    .filter((item) => item.deal);
}

export function buildHomeMallHighlights(catalog: Deal[]) {
  return mallFilters
    .filter((mall) => mall.id !== "all")
    .map((mall) => {
      const mallDeals = catalog.filter((deal) => dealMatchesMallFilter(deal, mall.id));
      const bestDeal = [...mallDeals].sort((a, b) => commercialScore(b) - commercialScore(a))[0];

      return {
        ...mall,
        count: mallDeals.length,
        verifiedCount: mallDeals.filter(isVerifiedPurchaseLink).length,
        freeShippingCount: mallDeals.filter(isFreeShippingDeal).length,
        bestDeal,
        bestDiscount: mallDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0)
      };
    })
    .filter((mall) => mall.count > 0)
    .sort((a, b) => b.verifiedCount - a.verifiedCount || b.count - a.count || b.bestDiscount - a.bestDiscount)
    .slice(0, 8);
}

export function buildHomeCategoryCounts(catalog: Deal[]) {
  return Object.fromEntries(
    dealChannels.map((channel) => [
      channel.id,
      channel.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesChannel(deal, channel.id)).length
    ])
  );
}

export function buildQuickCategoryShortcuts(categoryCounts: Record<string, number>) {
  return ["all", "freezero", "today", "food", "living", "digital", "fashion", "baby", "mart", "coupon", "travel"]
    .map((id) => {
      const channel = getDealChannel(id);
      return {
        id,
        label: channel.label,
        count: categoryCounts[id] ?? 0
      };
    })
    .filter((item) => item.id === "all" || item.count > 0);
}

export function buildHomeMallCounts(catalog: Deal[]) {
  return Object.fromEntries(
    mallFilters.map((mall) => [
      mall.id,
      mall.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesMallFilter(deal, mall.id)).length
    ])
  );
}

export function buildHomePriceBandCounts(catalog: Deal[]) {
  return Object.fromEntries(
    priceBands.map((band) => [
      band.id,
      band.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesPriceBand(deal, band.id)).length
    ])
  );
}

export function buildQuickMallFilterChips(mallCounts: Record<string, number>) {
  return mallFilters.filter((mall) => mall.id !== "all" && (mallCounts[mall.id] ?? 0) > 0).slice(0, 7);
}

export function buildQuickPriceFilterChips(priceBandCounts: Record<string, number>) {
  return priceBands.filter((band) => band.id !== "all" && (priceBandCounts[band.id] ?? 0) > 0);
}

export function buildQuickBenefitFilterChips() {
  return benefitFilters.filter((filter) => ["discount", "freebie", "coupon", "freeShipping", "point", "foodDelivery"].includes(filter.id));
}

export function buildPopularSearchKeywords(catalog: Deal[], deals: Deal[]) {
  const source = catalog.length ? catalog : deals;
  const keywordScores = new Map<string, number>();

  for (const deal of source) {
    const baseScore = commercialScore(deal);
    const candidates = [
      deal.mallName,
      deal.category,
      ...deal.tags.slice(0, 3),
      ...deal.title.split(/\s+/).filter((word) => word.length >= 2).slice(0, 3)
    ];

    for (const candidate of candidates) {
      const keyword = candidate.replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ/+.-]/g, "").trim();
      if (keyword.length < 2 || /^\d+$/.test(keyword)) continue;
      keywordScores.set(keyword, (keywordScores.get(keyword) ?? 0) + baseScore);
    }
  }

  return Array.from(keywordScores.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([keyword]) => keyword)
    .slice(0, 10);
}

export function buildQuickSearchSuggestions(recentSearchKeywords: string[], popularSearchKeywords: string[]) {
  const merged = [...recentSearchKeywords, ...highIntentSearchKeywords, ...popularSearchKeywords];
  return Array.from(new Set(merged)).slice(0, 24);
}

export function buildHomeActiveFilterChips(params: {
  query: string;
  category: string;
  mallFilter: string;
  priceBand: PriceBand;
  benefitFilter: "all" | DealBenefitType;
  verifiedOnly: boolean;
  freeShippingOnly: boolean;
  hotOnly: boolean;
  endingSoonOnly: boolean;
  sort: DealSort;
}) {
  const chips: HomeActiveFilterChip[] = [];
  const selectedChannel = getDealChannel(params.category);
  const selectedMall = mallFilters.find((mall) => mall.id === params.mallFilter);
  const selectedPriceBand = priceBands.find((band) => band.id === params.priceBand);
  const selectedBenefit = benefitFilters.find((filter) => filter.id === params.benefitFilter);

  if (params.query.trim()) chips.push({ id: "query", label: `검색: ${params.query.trim()}` });
  if (params.category !== "all") chips.push({ id: "category", label: selectedChannel.label });
  if (params.mallFilter !== "all" && selectedMall) chips.push({ id: "mall", label: selectedMall.label });
  if (params.priceBand !== "all" && selectedPriceBand) chips.push({ id: "price", label: selectedPriceBand.label });
  if (params.benefitFilter !== "all" && selectedBenefit) chips.push({ id: "benefit", label: selectedBenefit.label });
  if (params.verifiedOnly) chips.push({ id: "verified", label: "구매링크 확인" });
  if (params.freeShippingOnly) chips.push({ id: "freeShipping", label: "무료배송" });
  if (params.hotOnly) chips.push({ id: "hot", label: "핫딜" });
  if (params.endingSoonOnly) chips.push({ id: "endingSoon", label: "마감임박" });

  if (params.sort !== "latest") {
    const sortLabel: Record<DealSort, string> = {
      latest: "최신순",
      discount: "할인율순",
      price: "낮은 가격순",
      hot: "핫딜순",
      endingSoon: "마감임박순"
    };
    chips.push({ id: "sort", label: sortLabel[params.sort] });
  }

  return chips;
}

export function buildFilterOutcomeCards(deals: Deal[], activeFilterLabels: string[]) {
  return [
    {
      title: "현재 조건으로 볼 혜택",
      value: `${deals.length}개`,
      copy: activeFilterLabels.length ? "선택한 조건에 맞는 상품과 무료 혜택입니다." : "전체 혜택을 넓게 보고 있습니다."
    },
    {
      title: "구매처 바로 확인",
      value: `${deals.filter(isVerifiedPurchaseLink).length}개`,
      copy: "검색 결과가 아닌 실제 상품·혜택 상세 이동을 우선 표시합니다."
    },
    {
      title: "마감 전 확인",
      value: `${deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length}개`,
      copy: "시간 제한, 선착순, 종료 가능성이 있는 혜택입니다."
    },
    {
      title: "배송비 부담 낮음",
      value: `${deals.filter(isFreeShippingDeal).length}개`,
      copy: "무료배송 또는 배송비 조건이 좋은 혜택입니다."
    }
  ];
}

export function buildSearchResultSnapshot(deals: Deal[]) {
  const mallCounts = new Map<string, number>();
  for (const deal of deals) mallCounts.set(deal.mallName, (mallCounts.get(deal.mallName) ?? 0) + 1);

  const topMall = Array.from(mallCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))[0];
  const bestDiscount = deals.reduce((best, deal) => Math.max(best, deal.discountRate), 0);
  const lowestPrice = deals.reduce((best, deal) => Math.min(best, deal.salePrice), Number.POSITIVE_INFINITY);
  const endingSoonCount = deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length;

  return [
    {
      label: "많은 판매처",
      value: topMall ? topMall[0] : "대기 중",
      helper: topMall ? `${topMall[1]}개 혜택` : "검색 결과 없음"
    },
    {
      label: "최대 할인",
      value: deals.length ? `${bestDiscount}%` : "0%",
      helper: "할인율 높은순으로 바로 비교"
    },
    {
      label: "낮은 현재가",
      value: Number.isFinite(lowestPrice) ? formatPrice(lowestPrice) : "-",
      helper: "가격 낮은순과 함께 확인"
    },
    {
      label: "마감 임박",
      value: `${endingSoonCount}개`,
      helper: endingSoonCount ? "오늘 먼저 확인할 후보" : "여유 있는 혜택 위주"
    }
  ];
}

export function buildSearchDecisionGuide(deals: Deal[]) {
  const verifiedCount = deals.filter(isVerifiedPurchaseLink).length;
  const freeShippingCount = deals.filter(isFreeShippingDeal).length;
  const endingSoonCount = deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length;
  const hotCount = deals.filter((deal) => deal.isHot).length;
  const averageDiscount = deals.length ? Math.round(deals.reduce((sum, deal) => sum + deal.discountRate, 0) / deals.length) : 0;

  if (!deals.length) {
    return {
      label: "결과 없음",
      title: "조건을 조금 넓혀보세요",
      copy: "검색어를 줄이거나 쇼핑몰, 가격대, 혜택 필터를 초기화하면 다시 찾을 수 있습니다.",
      actionLabel: "조건 초기화",
      action: "reset" as const
    };
  }

  if (verifiedCount && verifiedCount < deals.length) {
    return {
      label: "먼저 볼 기준",
      title: `구매처 확인 ${verifiedCount}개부터 보세요`,
      copy: "검색 결과나 대표몰이 아니라 실제 상품·혜택 상세로 이동 가능한 항목을 먼저 추립니다.",
      actionLabel: "구매처 확인만 보기",
      action: "verified" as const
    };
  }

  if (endingSoonCount >= Math.max(2, Math.ceil(deals.length * 0.2))) {
    return {
      label: "먼저 볼 기준",
      title: `마감 임박 ${endingSoonCount}개를 먼저 확인하세요`,
      copy: "시간 제한, 선착순, 쿠폰 종료 가능성이 있는 항목부터 놓치지 않게 정렬합니다.",
      actionLabel: "마감 임박 보기",
      action: "endingSoon" as const
    };
  }

  if (freeShippingCount >= Math.max(2, Math.ceil(deals.length * 0.25))) {
    return {
      label: "먼저 볼 기준",
      title: `무료배송 ${freeShippingCount}개로 배송비를 줄이세요`,
      copy: "실제 결제 전 배송비 조건을 함께 확인하기 좋은 결과입니다.",
      actionLabel: "무료배송 보기",
      action: "freeShipping" as const
    };
  }

  if (hotCount >= Math.max(2, Math.ceil(deals.length * 0.2))) {
    return {
      label: "먼저 볼 기준",
      title: `반응 좋은 핫딜 ${hotCount}개를 먼저 보세요`,
      copy: "클릭, 찜, 인기 신호가 높은 후보부터 빠르게 비교합니다.",
      actionLabel: "핫딜 보기",
      action: "hot" as const
    };
  }

  return {
    label: "먼저 볼 기준",
    title: `평균 할인율 ${averageDiscount}% 결과입니다`,
    copy: "가격 낮은순이나 할인율 높은순으로 바꾸면 비교 기준이 더 또렷해집니다.",
    actionLabel: "할인율순 보기",
    action: "discount" as const
  };
}

export function buildSearchResultGroups(catalog: Deal[], deals: Deal[], query: string) {
  const normalizedQuery = query.trim();
  const source = catalog.length ? catalog : deals;
  const matchedDeals = normalizedQuery ? source.filter((deal) => dealMatchesSearch(deal, normalizedQuery)) : source;
  const countBy = <T extends string>(items: T[]) => {
    const counts = new Map<T, number>();
    for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
  };

  const malls = countBy(matchedDeals.map((deal) => deal.mallName)).map((item) => ({ ...item, label: item.id }));
  const categories = countBy(matchedDeals.map((deal) => deal.category)).map((item) => ({
    id: getCategoryFilterId(item.id),
    label: item.id,
    count: item.count
  }));
  const benefits = countBy(matchedDeals.map((deal) => deal.dealType)).map((item) => ({
    ...item,
    label: benefitFilters.find((filter) => filter.id === item.id)?.label ?? item.id
  }));

  return {
    queryMatchedCount: matchedDeals.length,
    malls,
    categories,
    benefits
  };
}

export function buildListComparisonCards(deals: Deal[]) {
  const availableDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);
  const pickLowestPrice = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.salePrice < best.salePrice ? deal : best), null);
  const pickTopDiscount = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.discountRate > best.discountRate ? deal : best), null);
  const pickBigSavings = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.discountAmount > best.discountAmount ? deal : best), null);
  const pickEndingSoon = availableDeals.reduce<Deal | null>((best, deal) => {
    if (!best) return deal;
    return new Date(deal.expireAt).getTime() < new Date(best.expireAt).getTime() ? deal : best;
  }, null);

  return [
    {
      label: "가장 낮은 가격",
      value: pickLowestPrice ? formatPrice(pickLowestPrice.salePrice) : "-",
      helper: pickLowestPrice ? `${pickLowestPrice.mallName} · ${pickLowestPrice.shipping}` : "조건을 넓히면 비교 후보가 늘어납니다.",
      deal: pickLowestPrice
    },
    {
      label: "할인율 최고",
      value: pickTopDiscount ? `${pickTopDiscount.discountRate}% 할인` : "0% 할인",
      helper: pickTopDiscount ? `${pickTopDiscount.mallName} · ${formatPrice(pickTopDiscount.salePrice)}` : "할인율 높은 상품이 없습니다.",
      deal: pickTopDiscount
    },
    {
      label: "절약액 큼",
      value: pickBigSavings ? `${formatPrice(pickBigSavings.discountAmount)} 아낌` : "-",
      helper: pickBigSavings ? `${pickBigSavings.mallName} · 정상가 대비` : "원가 정보가 있는 상품을 우선 비교합니다.",
      deal: pickBigSavings
    },
    {
      label: "마감 먼저",
      value: pickEndingSoon ? getTimeLeft(pickEndingSoon.expiresAt ?? pickEndingSoon.expireAt) : "-",
      helper: pickEndingSoon ? `${pickEndingSoon.mallName} · 구매 전 종료 시간을 확인하세요.` : "진행 중인 후보가 없습니다.",
      deal: pickEndingSoon
    }
  ];
}

export function buildTodayBenefitQueue(catalog: Deal[], deals: Deal[]) {
  const source = catalog.length ? catalog : deals;
  const byScore = (items: Deal[]) => [...items].sort((a, b) => commercialScore(b) - commercialScore(a));
  const freeItems = byScore(source.filter((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice === 0));
  const couponItems = byScore(source.filter((deal) => ["coupon", "point", "event"].includes(deal.dealType)));
  const shippingItems = byScore(source.filter(isFreeShippingDeal));
  const endingItems = byScore(source.filter((deal) => deal.isEndingSoon && !deal.isExpired));
  const verifiedItems = byScore(source.filter(isVerifiedPurchaseLink));

  return [
    {
      id: "freebie",
      title: "무료 혜택 먼저",
      label: "무료/체험",
      copy: "돈 쓰기 전 받을 수 있는 샘플, 체험, 무료 쿠폰",
      count: freeItems.length,
      deal: freeItems[0] ?? null
    },
    {
      id: "coupon",
      title: "쿠폰·포인트 적용",
      label: "쿠폰",
      copy: "구매 전 바로 눌러볼 쿠폰과 적립 혜택",
      count: couponItems.length,
      deal: couponItems[0] ?? null
    },
    {
      id: "freeShipping",
      title: "배송비 줄이기",
      label: "무배",
      copy: "무료배송 또는 배송비 부담이 낮은 혜택",
      count: shippingItems.length,
      deal: shippingItems[0] ?? null
    },
    {
      id: "endingSoon",
      title: "마감 전 확인",
      label: "마감",
      copy: "오늘 끝날 수 있는 선착순, 기간 한정 혜택",
      count: endingItems.length,
      deal: endingItems[0] ?? null
    },
    {
      id: "verified",
      title: "구매처 바로 이동",
      label: "링크",
      copy: "검색 페이지보다 실제 상세 이동을 우선 확인",
      count: verifiedItems.length,
      deal: verifiedItems[0] ?? null
    }
  ];
}

export function buildSearchPurposeCards(catalog: Deal[], deals: Deal[]) {
  const source = catalog.length ? catalog : deals;
  return searchPurposePresets.map((item) => ({
    ...item,
    count: source.filter(item.match).length
  }));
}
