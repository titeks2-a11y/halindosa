import { dealMatchesChannel } from "@/data/dealChannels";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getCommercialDealScore } from "@/lib/deals/ranking";
import { dealMatchesSearch } from "@/lib/deals/search";
import { priceBands, type PriceBand } from "@/lib/homeDiscoveryConfig";
import type { Deal, DealBenefitType, DealSort } from "@/types/deal";

export function dealMatchesInterestCategory(deal: Deal, interest: string) {
  const searchable = [
    deal.title,
    deal.description,
    deal.mallName,
    deal.category,
    deal.subCategory ?? "",
    deal.dealType,
    deal.benefitSummary ?? "",
    deal.shipping,
    ...deal.tags
  ].join(" ");

  if (interest === "디지털") return /디지털|전자기기|가전|노트북|TV|스마트|충전|이어폰/.test(searchable);
  if (interest === "패션") return /패션|의류|잡화|신발|무신사|가방|스니커즈/.test(searchable);
  if (interest === "여행") return /여행|티켓|항공|숙박|호텔|공연|전시|영화/.test(searchable);
  if (interest === "무료/체험") return ["freebie", "experience", "coupon", "point"].includes(deal.dealType) || /무료|체험|샘플|쿠폰|포인트|0원/.test(searchable);

  return searchable.includes(interest);
}

export function isFreeShippingDeal(deal: Deal) {
  return deal.isFreeShipping || /무료배송|무배|네멤무료|로켓프레시/.test([deal.shipping, ...deal.tags].join(" "));
}

export function dealMatchesMallFilter(deal: Deal, mallFilter: string) {
  if (mallFilter === "all") return true;

  const mall = `${deal.mallName} ${deal.mall}`.toLowerCase();
  if (mallFilter === "gmarket") return /g마켓|지마켓|gmarket/.test(mall);
  if (mallFilter === "naver") return /네이버|naver/.test(mall);
  if (mallFilter === "ssg") return /ssg|쓱|이마트/.test(mall);
  if (mallFilter === "auction") return /옥션|auction/.test(mall);
  if (mallFilter === "aliexpress") return /알리|ali/.test(mall);
  if (mallFilter === "interpark") return /인터파크|interpark/.test(mall);
  return mall.includes(mallFilter.toLowerCase());
}

export function dealMatchesPriceBand(deal: Deal, priceBand: PriceBand) {
  const selectedBand = priceBands.find((band) => band.id === priceBand);
  if (!selectedBand || selectedBand.id === "all") return true;
  return deal.salePrice >= selectedBand.min && deal.salePrice <= selectedBand.max;
}

export function getCategoryFilterId(categoryName: string) {
  if (categoryName === "식품") return "food";
  if (categoryName === "생활용품") return "living";
  if (categoryName === "전자기기" || categoryName === "가전") return "digital";
  if (categoryName === "의류" || categoryName === "뷰티") return "fashion";
  if (categoryName === "육아") return "baby";
  if (categoryName === "여행/티켓") return "travel";
  if (categoryName === "편의점/마트") return "mart";
  if (categoryName === "쿠폰/이벤트") return "coupon";
  return "etc";
}

export function getProviderDisplayLabel(source: string) {
  if (source === "production") return "운영 피드";
  if (source === "staging") return "검수 피드";
  if (source === "hybrid") return "혼합 피드";
  if (source.includes("fallback")) return "기본 특가";
  return "기본 특가";
}

export function commercialScore(deal: Deal) {
  return getCommercialDealScore(deal);
}

export function filterLocalDeals(
  items: Deal[],
  category: string,
  query: string,
  sort: DealSort,
  freeShippingOnly = false,
  hotOnly = false,
  endingSoonOnly = false,
  verifiedOnly = false,
  mallFilter = "all",
  priceBand: PriceBand = "all",
  benefitFilter: "all" | DealBenefitType = "all"
) {
  let filtered = items;

  if (category && category !== "전체" && category !== "all") {
    filtered = filtered.filter((deal) => dealMatchesChannel(deal, category));
  }

  if (query.trim()) {
    filtered = filtered.filter((deal) => dealMatchesSearch(deal, query));
  }

  if (mallFilter !== "all") {
    filtered = filtered.filter((deal) => dealMatchesMallFilter(deal, mallFilter));
  }

  if (priceBand !== "all") {
    filtered = filtered.filter((deal) => dealMatchesPriceBand(deal, priceBand));
  }

  if (benefitFilter !== "all") {
    filtered = filtered.filter((deal) => deal.dealType === benefitFilter);
  }

  if (freeShippingOnly) {
    filtered = filtered.filter(isFreeShippingDeal);
  }

  if (hotOnly) {
    filtered = filtered.filter((deal) => deal.isHot);
  }

  if (endingSoonOnly) {
    filtered = filtered.filter((deal) => deal.isEndingSoon);
  }

  if (verifiedOnly) {
    filtered = filtered.filter(isVerifiedPurchaseLink);
  }

  switch (sort) {
    case "discount":
      return [...filtered].sort((a, b) => b.discountRate - a.discountRate);
    case "price":
      return [...filtered].sort((a, b) => a.salePrice - b.salePrice);
    case "hot":
      return [...filtered].sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.popularityScore - a.popularityScore);
    case "endingSoon":
      return [...filtered].sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime());
    case "latest":
    default:
      return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
