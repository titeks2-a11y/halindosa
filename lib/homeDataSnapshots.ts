import { buildNewsDeadlineSummary } from "@/lib/deals/newsDeadlineInsights";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { dealMatchesPriceBand, filterLocalDeals, isFreeShippingDeal } from "@/lib/homeDealFilters";
import type { PriceBand } from "@/lib/homeDiscoveryConfig";
import type { DealsResponse, HomeResponse, NewsDealsResponse } from "@/lib/homeApi";
import type { Deal, DealBenefitType, DealSort } from "@/types/deal";
import type { NewsDeal } from "@/types/newsDeal";

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

const freeBenefitTypes = new Set(["coupon", "freebie", "freeShipping", "point", "event"]);

function countNewsDealsBy<T extends string>(deals: NewsDeal[], select: (deal: NewsDeal) => T | undefined) {
  return deals.reduce<Record<string, number>>((counts, deal) => {
    const key = select(deal);
    if (!key) return counts;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function getNewsFreeBenefitCount(benefitTypeCounts?: Record<string, number>, categoryCounts?: Record<string, number>, deals: NewsDeal[] = []) {
  const safeBenefitCounts = benefitTypeCounts ?? countNewsDealsBy(deals, (deal) => deal.benefitType);
  const safeCategoryCounts = categoryCounts ?? countNewsDealsBy(deals, (deal) => deal.category);
  const benefitTypeTotal = Array.from(freeBenefitTypes).reduce((total, type) => total + (safeBenefitCounts[type] ?? 0), 0);

  return Math.max(benefitTypeTotal, safeCategoryCounts["무료혜택"] ?? 0);
}

export function buildHomeNewsSnapshot(data: NewsDealsResponse) {
  const deals = Array.isArray(data.deals) ? data.deals : [];
  const categoryCounts = data.categoryCounts ?? countNewsDealsBy(deals, (deal) => deal.category);
  const benefitTypeCounts = data.benefitTypeCounts ?? countNewsDealsBy(deals, (deal) => deal.benefitType);

  return {
    deals,
    totalCount: Number.isFinite(data.count) ? data.count : deals.length,
    categoryCounts,
    benefitTypeCounts,
    sourceCounts: data.sourceCounts ?? countNewsDealsBy(deals, (deal) => deal.sourceName),
    freeBenefitCount: getNewsFreeBenefitCount(benefitTypeCounts, categoryCounts, deals),
    recommendedQueries: Array.isArray(data.recommendedQueries) ? data.recommendedQueries : [],
    targetSections: Array.isArray(data.targetSections) ? data.targetSections : [],
    intentGroups: Array.isArray(data.intentGroups) ? data.intentGroups : [],
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

export function buildCombinedHomeSnapshot(data: HomeResponse, filters: HomeDealFilters) {
  const source =
    typeof data.source === "object"
      ? data.source
      : {
          deals: data.source ?? "home",
          news: data.source ?? "home",
          hotSignals: data.source ?? "home"
        };
  const dealsResponse: DealsResponse = {
    ok: data.ok,
    deals: Array.isArray(data.deals) ? data.deals : [],
    count: data.counts?.deals ?? data.deals?.length ?? 0,
    updatedAt: data.dealUpdatedAt || data.updatedAt,
    source: source.deals,
    message: data.message
  };
  const newsResponse: NewsDealsResponse = {
    ok: data.ok,
    deals: Array.isArray(data.newsDeals) ? data.newsDeals : [],
    count: data.counts?.newsDeals ?? data.newsDeals?.length ?? 0,
    updatedAt: data.newsUpdatedAt || data.updatedAt,
    source: source.news,
    categoryCounts: data.newsMeta?.categoryCounts,
    benefitTypeCounts: data.newsMeta?.benefitTypeCounts,
    sourceCounts: data.newsMeta?.sourceCounts,
    recommendedQueries: data.newsMeta?.recommendedQueries,
    targetSections: data.newsMeta?.targetSections,
    intentGroups: data.newsMeta?.intentGroups,
    sourceTrustScores: data.newsMeta?.sourceTrustScores,
    deadlineSummary: data.newsMeta?.deadlineSummary,
    freshnessStatus: data.newsMeta?.freshnessStatus,
    freshnessLabel: data.newsMeta?.freshnessLabel,
    freshnessAgeMinutes: data.newsMeta?.freshnessAgeMinutes,
    nextRefreshAt: data.newsMeta?.nextRefreshAt,
    message: data.message
  };

  return {
    deals: buildHomeDealsSnapshot(dealsResponse, filters),
    news: buildHomeNewsSnapshot(newsResponse),
    freebies: {
      deals: Array.isArray(data.freebies) ? data.freebies : [],
      totalCount: data.freebiesMeta?.totalCount ?? data.counts?.freebies ?? data.freebies?.length ?? 0,
      summary: data.freebiesMeta?.summary,
      freshness: {
        status: data.freebiesMeta?.freshnessStatus ?? data.newsMeta?.freshnessStatus ?? "seed",
        label: data.freebiesMeta?.freshnessLabel ?? data.newsMeta?.freshnessLabel ?? "최근 확인",
        ageMinutes:
          typeof data.freebiesMeta?.freshnessAgeMinutes === "number"
            ? data.freebiesMeta.freshnessAgeMinutes
            : typeof data.newsMeta?.freshnessAgeMinutes === "number"
              ? data.newsMeta.freshnessAgeMinutes
              : null,
        nextRefreshAt: data.freebiesMeta?.nextRefreshAt ?? data.newsMeta?.nextRefreshAt ?? ""
      }
    },
    hotSignals: Array.isArray(data.hotSignals) ? data.hotSignals : [],
    updatedAt: data.updatedAt,
    freshness: data.freshness,
    quality: data.quality,
    source
  };
}
