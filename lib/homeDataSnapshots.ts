import { buildNewsDeadlineSummary } from "@/lib/deals/newsDeadlineInsights";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { dealMatchesPriceBand, filterLocalDeals, isFreeShippingDeal } from "@/lib/homeDealFilters";
import type { PriceBand } from "@/lib/homeDiscoveryConfig";
import type { DealsResponse, NewsDealsResponse } from "@/lib/homeApi";
import type { Deal, DealBenefitType, DealSort } from "@/types/deal";

export interface HomeDealFilters {
  category: string;
  query: string;
  sort: DealSort;
  freeShippingOnly: boolean;
  hotOnly: boolean;
  endingSoonOnly: boolean;
  verifiedOnly: boolean;
  mallFilter: string;
  priceBand: PriceBand;
  benefitFilter: "all" | DealBenefitType;
}

export function buildHomeNewsSnapshot(data: NewsDealsResponse) {
  const deals = Array.isArray(data.deals) ? data.deals : [];

  return {
    deals,
    totalCount: Number.isFinite(data.count) ? data.count : deals.length,
    recommendedQueries: Array.isArray(data.recommendedQueries) ? data.recommendedQueries : [],
    targetSections: Array.isArray(data.targetSections) ? data.targetSections : [],
    sourceTrustScores: Array.isArray(data.sourceTrustScores) ? data.sourceTrustScores : [],
    deadlineSummary: data.deadlineSummary ?? buildNewsDeadlineSummary(deals),
    updatedAt: data.updatedAt,
    freshness: {
      status: data.freshnessStatus ?? "seed",
      label: data.freshnessLabel ?? (data.source === "seed" ? "seed 기준" : "최근 확인"),
      ageMinutes: typeof data.freshnessAgeMinutes === "number" ? data.freshnessAgeMinutes : null,
      nextRefreshAt: data.nextRefreshAt ?? ""
    }
  };
}

export function filterHomeResponseDeals(deals: Deal[], filters: Pick<HomeDealFilters, "freeShippingOnly" | "hotOnly" | "endingSoonOnly" | "verifiedOnly" | "priceBand" | "benefitFilter">) {
  return deals
    .filter((deal) => !filters.freeShippingOnly || isFreeShippingDeal(deal))
    .filter((deal) => !filters.hotOnly || deal.isHot)
    .filter((deal) => !filters.endingSoonOnly || deal.isEndingSoon)
    .filter((deal) => !filters.verifiedOnly || isVerifiedPurchaseLink(deal))
    .filter((deal) => dealMatchesPriceBand(deal, filters.priceBand))
    .filter((deal) => filters.benefitFilter === "all" || deal.dealType === filters.benefitFilter);
}

export function buildHomeDealsSnapshot(data: DealsResponse, filters: HomeDealFilters) {
  const sourceDeals = Array.isArray(data.deals) ? data.deals : [];

  return {
    deals: filterHomeResponseDeals(sourceDeals, filters),
    catalog: !filters.query.trim() && filters.category === "all" ? sourceDeals : null,
    updatedAt: data.updatedAt,
    providerSource: data.source ?? "mock"
  };
}

export function buildLocalHomeDealsSnapshot(deals: Deal[], filters: HomeDealFilters, providerSource: string) {
  return {
    deals: filterLocalDeals(
      deals,
      filters.category,
      filters.query,
      filters.sort,
      filters.freeShippingOnly,
      filters.hotOnly,
      filters.endingSoonOnly,
      filters.verifiedOnly,
      filters.mallFilter,
      filters.priceBand,
      filters.benefitFilter
    ),
    catalog: deals,
    updatedAt: new Date().toISOString(),
    providerSource
  };
}
