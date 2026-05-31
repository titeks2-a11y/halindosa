import { dealMatchesChannel, getProviderCategory } from "@/data/dealChannels";
import { mockDeals as curatedMockDeals } from "@/data/mockDeals";
import { normalizeDeals } from "@/lib/deals/normalizer";
import { fetchMockDeals } from "@/lib/deals/providers/mockProvider";
import { fetchProductionDeals } from "@/lib/deals/providers/productionProvider";
import { fetchStagingDeals } from "@/lib/deals/providers/stagingProvider";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { Deal, DealDataMode, DealSort } from "@/types/deal";

export interface DealQuery {
  category?: string;
  q?: string;
  sort?: DealSort;
  limit?: number;
  freeShippingOnly?: boolean;
  hotOnly?: boolean;
  endingSoonOnly?: boolean;
  verifiedOnly?: boolean;
  mall?: string;
}

export interface DealProviderResult {
  deals: Deal[];
  source: "mock" | "staging" | "production" | "hybrid";
  updatedAt: string;
}

const validSorts = new Set<DealSort>(["latest", "discount", "price", "hot", "endingSoon"]);
const dealCache = new Map<string, Deal>();

function getDataMode(): DealDataMode {
  const mode = (process.env.DEAL_DATA_MODE ?? process.env.DEAL_PROVIDER ?? "mock").trim();
  return ["mock", "staging", "production", "hybrid"].includes(mode) ? (mode as DealDataMode) : "mock";
}

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
      return sorted.sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime());
    case "latest":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

async function fetchProviderDeals(query: Pick<DealQuery, "category" | "q"> = {}): Promise<DealProviderResult> {
  const mode = getDataMode();
  const mockDeals = await fetchMockDeals();

  try {
    if (mode === "staging") {
      const stagingDeals = await fetchStagingDeals({ category: getProviderCategory(query.category) ?? query.category, q: query.q });
      if (stagingDeals.length) return { deals: stagingDeals, source: "staging", updatedAt: new Date().toISOString() };
    }

    if (mode === "production") {
      const productionDeals = normalizeDeals(await fetchProductionDeals(), "production");
      if (productionDeals.length) return { deals: productionDeals, source: "production", updatedAt: new Date().toISOString() };
    }

    if (mode === "hybrid") {
      const [stagingDeals, productionDeals] = await Promise.allSettled([
        fetchStagingDeals({ category: getProviderCategory(query.category) ?? query.category, q: query.q }),
        fetchProductionDeals()
      ]);
      const externalDeals = [
        ...(stagingDeals.status === "fulfilled" ? stagingDeals.value : []),
        ...(productionDeals.status === "fulfilled" ? normalizeDeals(productionDeals.value, "production") : [])
      ];
      if (externalDeals.length) return { deals: [...externalDeals, ...mockDeals], source: "hybrid", updatedAt: new Date().toISOString() };
    }
  } catch {
    // Keep V1 stable by falling back to curated mock deals when external providers fail.
  }

  return { deals: mockDeals, source: "mock", updatedAt: new Date().toISOString() };
}

export async function getDeals(query: DealQuery = {}) {
  const provider = await fetchProviderDeals(query);
  const searchQuery = query.q?.trim().toLowerCase();
  const sort = normalizeSort(query.sort);
  const limit = query.limit ?? 0;
  let deals = provider.deals;

  if (query.category && query.category !== "전체" && query.category !== "all") {
    deals = deals.filter((deal) => dealMatchesChannel(deal, query.category));
  }

  if (searchQuery) {
    deals = deals.filter((deal) =>
      [deal.title, deal.mallName, deal.category, deal.source, ...deal.tags].some((value) => value.toLowerCase().includes(searchQuery))
    );
  }

  if (query.mall && query.mall !== "all") {
    const mallQuery = query.mall.trim().toLowerCase();
    deals = deals.filter((deal) => {
      const mall = `${deal.mallName} ${deal.mall}`.toLowerCase();
      if (mallQuery === "gmarket") return /g마켓|지마켓|gmarket/.test(mall);
      if (mallQuery === "naver") return /네이버|naver/.test(mall);
      if (mallQuery === "ssg") return /ssg|쓱|이마트/.test(mall);
      if (mallQuery === "auction") return /옥션|auction/.test(mall);
      if (mallQuery === "aliexpress") return /알리|ali/.test(mall);
      if (mallQuery === "lotteon") return /롯데온|lotte/.test(mall);
      if (mallQuery === "interpark") return /인터파크|interpark/.test(mall);
      return mall.includes(mallQuery);
    });
  }

  if (query.freeShippingOnly) deals = deals.filter((deal) => deal.isFreeShipping);
  if (query.hotOnly) deals = deals.filter((deal) => deal.isHot);
  if (query.endingSoonOnly) deals = deals.filter((deal) => deal.isEndingSoon);
  if (query.verifiedOnly) deals = deals.filter(isVerifiedPurchaseLink);

  deals = sortDeals(deals, sort);
  if (Number.isFinite(limit) && limit > 0) deals = deals.slice(0, limit);
  rememberDeals(deals);

  return { deals, sort, source: provider.source, updatedAt: provider.updatedAt };
}

export function findDealById(id: string) {
  return dealCache.get(id) ?? normalizeDeals(curatedMockDeals, "mock").find((deal) => deal.id === id) ?? null;
}

export async function findDealByIdLive(id: string) {
  const { deals } = await getDeals();
  return deals.find((deal) => deal.id === id) ?? findDealById(id);
}

export function getRelatedDeals(dealId: string, limit = 4) {
  const cachedDeals = Array.from(dealCache.values());
  const deals = cachedDeals.length ? cachedDeals : normalizeDeals(curatedMockDeals, "mock");
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) return [];

  return deals
    .filter((candidate) => candidate.id !== deal.id)
    .sort((a, b) => {
      const categoryScore = Number(b.category === deal.category) - Number(a.category === deal.category);
      if (categoryScore !== 0) return categoryScore;
      return b.popularityScore - a.popularityScore;
    })
    .slice(0, limit);
}
