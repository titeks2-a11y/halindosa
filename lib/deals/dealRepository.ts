import { dealMatchesChannel, getProviderCategory } from "@/data/dealChannels";
import { mockDeals as curatedMockDeals } from "@/data/mockDeals";
import { normalizeDeals } from "@/lib/deals/normalizer";
import { fetchMockDeals } from "@/lib/deals/providers/mockProvider";
import { fetchProductionDeals } from "@/lib/deals/providers/productionProvider";
import { fetchProviderDealsSafely } from "@/lib/deals/providers/providerRegistry";
import { fetchRefreshedSnapshotDeals, getRefreshedSnapshotUpdatedAt } from "@/lib/deals/providers/refreshedSnapshotProvider";
import { fetchStagingDeals } from "@/lib/deals/providers/stagingProvider";
import { applyLinkValidationExposureOverride } from "@/lib/deals/linkValidationExposure";
import { isPubliclyVisibleDeal, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { dealMatchesSearch } from "@/lib/deals/search";
import { applyDealOperationOverrides, readDealOperationOverridesLive } from "@/lib/deals/operationOverrides";
import { Deal, DealDataMode, DealSort } from "@/types/deal";

export interface DealQuery {
  category?: string;
  q?: string;
  sort?: DealSort;
  limit?: number;
  priceBand?: string;
  minPrice?: number;
  maxPrice?: number;
  freeShippingOnly?: boolean;
  hotOnly?: boolean;
  endingSoonOnly?: boolean;
  verifiedOnly?: boolean;
  includeHidden?: boolean;
  mall?: string;
  dealType?: string;
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

function canonicalDealKey(deal: Deal) {
  const urlValue = deal.finalPurchaseUrl || deal.finalUrl || deal.productUrl || deal.purchaseUrl || deal.link || deal.id;

  try {
    const url = new URL(urlValue);
    const keepParams = new Set(["itemId", "vendorItemId", "goodsCode", "goodsNo", "goodscode", "productId", "prdNo", "prdno", "prdid", "dealNo", "dealno", "bbs_category"]);

    for (const key of Array.from(url.searchParams.keys())) {
      if (!keepParams.has(key)) url.searchParams.delete(key);
    }

    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    return `${deal.mallName}-${deal.title}-${deal.salePrice}`.toLowerCase();
  }
}

function mergeUniqueDeals(primary: Deal[], fallback: Deal[]) {
  const unique = new Map<string, Deal>();

  for (const deal of [...primary, ...fallback]) {
    const key = canonicalDealKey(deal);
    if (!unique.has(key)) unique.set(key, deal);
  }

  return Array.from(unique.values());
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

function getPriceBandRange(priceBand?: string) {
  switch (priceBand) {
    case "under10000":
      return { minPrice: 0, maxPrice: 9999 };
    case "10000-30000":
      return { minPrice: 10000, maxPrice: 30000 };
    case "30000-100000":
      return { minPrice: 30000, maxPrice: 100000 };
    case "over100000":
      return { minPrice: 100000, maxPrice: Number.POSITIVE_INFINITY };
    default:
      return null;
  }
}

async function fetchProviderDeals(query: Pick<DealQuery, "category" | "q"> = {}): Promise<DealProviderResult> {
  const mode = getDataMode();
  const mockDeals = await fetchMockDeals();
  const refreshedDeals = await fetchRefreshedSnapshotDeals();
  const refreshedUpdatedAt = getRefreshedSnapshotUpdatedAt();

  try {
    if (mode === "staging") {
      const stagingDeals = await fetchStagingDeals({ category: getProviderCategory(query.category) ?? query.category, q: query.q });
      if (stagingDeals.length) return { deals: mergeUniqueDeals([...stagingDeals, ...refreshedDeals], mockDeals), source: "staging", updatedAt: new Date().toISOString() };
    }

    if (mode === "production") {
      const productionDeals = normalizeDeals(await fetchProductionDeals(), "production");
      const providerResults = await fetchProviderDealsSafely();
      const providerDeals = normalizeDeals(
        providerResults.filter((result) => result.provider !== "manual").flatMap((result) => result.deals),
        "production"
      );
      if (productionDeals.length || providerDeals.length || refreshedDeals.length) {
        return { deals: mergeUniqueDeals([...productionDeals, ...providerDeals, ...refreshedDeals], mockDeals), source: "production", updatedAt: new Date().toISOString() };
      }
    }

    if (mode === "hybrid") {
      const [stagingDeals, productionDeals, providerResults] = await Promise.allSettled([
        fetchStagingDeals({ category: getProviderCategory(query.category) ?? query.category, q: query.q }),
        fetchProductionDeals(),
        fetchProviderDealsSafely()
      ]);
      const registryDeals =
        providerResults.status === "fulfilled"
          ? normalizeDeals(providerResults.value.filter((result) => result.provider !== "manual").flatMap((result) => result.deals), "production")
          : [];
      const externalDeals = [
        ...(stagingDeals.status === "fulfilled" ? stagingDeals.value : []),
        ...(productionDeals.status === "fulfilled" ? normalizeDeals(productionDeals.value, "production") : []),
        ...registryDeals
      ];
      if (externalDeals.length || refreshedDeals.length) {
        return { deals: mergeUniqueDeals([...externalDeals, ...refreshedDeals], mockDeals), source: "hybrid", updatedAt: new Date().toISOString() };
      }
    }
  } catch {
    // Keep V1 stable by falling back to curated mock deals when external providers fail.
  }

  return {
    deals: refreshedDeals.length ? mergeUniqueDeals(refreshedDeals, mockDeals) : mockDeals,
    source: refreshedDeals.length ? "hybrid" : "mock",
    updatedAt: refreshedUpdatedAt || new Date().toISOString()
  };
}

export async function getDeals(query: DealQuery = {}) {
  const provider = await fetchProviderDeals(query);
  const operationOverrides = await readDealOperationOverridesLive();
  const sort = normalizeSort(query.sort);
  const limit = query.limit ?? 0;
  let deals = provider.deals.map((deal) => applyLinkValidationExposureOverride(applyDealOperationOverrides(deal, operationOverrides)));

  if (!query.includeHidden) {
    deals = deals.filter(isPubliclyVisibleDeal);
  }

  if (query.category && query.category !== "전체" && query.category !== "all") {
    deals = deals.filter((deal) => dealMatchesChannel(deal, query.category));
  }

  if (query.q?.trim()) {
    deals = deals.filter((deal) => dealMatchesSearch(deal, query.q));
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
  if (query.dealType && query.dealType !== "all") deals = deals.filter((deal) => deal.dealType === query.dealType);

  const priceBandRange = getPriceBandRange(query.priceBand);
  const minPrice = Number.isFinite(query.minPrice) ? Number(query.minPrice) : priceBandRange?.minPrice;
  const maxPrice = Number.isFinite(query.maxPrice) ? Number(query.maxPrice) : priceBandRange?.maxPrice;
  if (typeof minPrice === "number") deals = deals.filter((deal) => deal.salePrice >= minPrice);
  if (typeof maxPrice === "number") deals = deals.filter((deal) => deal.salePrice <= maxPrice);

  deals = sortDeals(deals, sort);
  if (Number.isFinite(limit) && limit > 0) deals = deals.slice(0, limit);
  rememberDeals(deals);

  return { deals, sort, source: provider.source, updatedAt: provider.updatedAt };
}

export function findDealById(id: string) {
  const deal = dealCache.get(id) ?? normalizeDeals(curatedMockDeals, "mock").find((item) => item.id === id) ?? null;
  return deal ? applyLinkValidationExposureOverride(applyDealOperationOverrides(deal)) : null;
}

export async function findDealByIdLive(id: string) {
  const { deals } = await getDeals();
  const liveDeal = deals.find((deal) => deal.id === id);
  if (liveDeal) return liveDeal;

  const fallbackDeal = findDealById(id);
  return fallbackDeal && isPubliclyVisibleDeal(fallbackDeal) ? fallbackDeal : null;
}

export function getRelatedDeals(dealId: string, limit = 4) {
  const cachedDeals = Array.from(dealCache.values());
  const deals = (cachedDeals.length ? cachedDeals : normalizeDeals(curatedMockDeals, "mock"))
    .map((deal) => applyDealOperationOverrides(deal))
    .map((deal) => applyLinkValidationExposureOverride(deal))
    .filter(isPubliclyVisibleDeal);
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
