import { mockDeals } from "@/data/mockDeals";
import { dealMatchesChannel, getProviderCategory } from "@/data/dealChannels";
import { fetchLiveDeals } from "@/lib/liveDealProvider";
import { Deal, DealSort } from "@/types/deal";

export interface DealQuery {
  category?: string;
  q?: string;
  sort?: DealSort;
  limit?: number;
  freeShippingOnly?: boolean;
  hotOnly?: boolean;
  endingSoonOnly?: boolean;
}

export interface DealProviderResult {
  deals: Deal[];
  source: "mock" | "naver_shopping" | "partner_feed" | "hybrid";
  updatedAt: string;
}

const validSorts = new Set<DealSort>(["latest", "discount", "price", "hot", "endingSoon"]);
const dealCache = new Map<string, Deal>();

function rememberDeals(deals: Deal[]) {
  for (const deal of deals) {
    dealCache.set(deal.id, deal);
  }
}

export function normalizeSort(sort?: string | null): DealSort {
  return validSorts.has(sort as DealSort) ? (sort as DealSort) : "latest";
}

export function sortDeals(deals: Deal[], sort: DealSort) {
  const sorted = [...deals];

  switch (sort) {
    case "discount":
      return sorted.sort((a, b) => b.discountRate - a.discountRate);
    case "price":
      return sorted.sort((a, b) => a.salePrice - b.salePrice);
    case "hot":
      return sorted.sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.popularityScore - a.popularityScore);
    case "endingSoon":
      return sorted.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    case "latest":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function fetchDealProvider(query: Pick<DealQuery, "category" | "q"> = {}): Promise<DealProviderResult> {
  const providerMode = process.env.DEAL_PROVIDER?.trim() || "hybrid";
  const shouldFetchLive = ["hybrid", "naver", "naver_shopping", "partner_feed"].includes(providerMode);

  if (shouldFetchLive) {
    try {
      const liveDeals = await fetchLiveDeals({
        category: getProviderCategory(query.category) ?? query.category,
        q: query.q
      });

      if (liveDeals.length > 0) {
        const deals = providerMode === "hybrid" ? [...liveDeals, ...mockDeals] : liveDeals;
        rememberDeals(deals);

        return {
          deals,
          source: providerMode === "partner_feed" ? "partner_feed" : providerMode === "hybrid" ? "hybrid" : "naver_shopping",
          updatedAt: new Date().toISOString()
        };
      }
    } catch {
      // Keep local fallback stable if an external provider is unavailable or misconfigured.
    }
  }

  rememberDeals(mockDeals);
  return {
    deals: [...mockDeals],
    source: "mock",
    updatedAt: new Date().toISOString()
  };
}

export async function getDeals(query: DealQuery = {}) {
  const provider = await fetchDealProvider(query);
  const searchQuery = query.q?.trim().toLowerCase();
  const sort = normalizeSort(query.sort);
  const limit = query.limit ?? 0;
  let deals = provider.deals;

  if (query.category && query.category !== "전체" && query.category !== "all") {
    deals = deals.filter((deal) => dealMatchesChannel(deal, query.category));
  }

  if (searchQuery) {
    deals = deals.filter((deal) =>
      [deal.title, deal.mall, deal.category, deal.source, ...deal.tags].some((value) =>
        value.toLowerCase().includes(searchQuery)
      )
    );
  }

  if (query.freeShippingOnly) {
    deals = deals.filter((deal) => /무료배송|무배|네멤무료|로켓프레시/.test([deal.shippingInfo, ...deal.tags].join(" ")));
  }

  if (query.hotOnly) {
    deals = deals.filter((deal) => deal.isHot);
  }

  if (query.endingSoonOnly) {
    deals = deals.filter((deal) => deal.isEndingSoon);
  }

  deals = sortDeals(deals, sort);

  if (Number.isFinite(limit) && limit > 0) {
    deals = deals.slice(0, limit);
  }

  return {
    deals,
    sort,
    source: provider.source,
    updatedAt: provider.updatedAt
  };
}

export function findDealById(id: string) {
  return dealCache.get(id) ?? mockDeals.find((deal) => deal.id === id) ?? null;
}

export async function findDealByIdLive(id: string) {
  const cached = findDealById(id);
  if (cached) return cached;

  await fetchDealProvider();
  return findDealById(id);
}

export function getRelatedDeals(dealId: string, limit = 4) {
  const deal = findDealById(dealId);
  if (!deal) return [];

  return mockDeals
    .filter((candidate) => candidate.id !== deal.id)
    .sort((a, b) => {
      const categoryScore = Number(b.category === deal.category) - Number(a.category === deal.category);
      if (categoryScore !== 0) return categoryScore;
      return b.popularityScore - a.popularityScore;
    })
    .slice(0, limit);
}
