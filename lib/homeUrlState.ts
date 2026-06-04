import { benefitFilters, priceBands, type PriceBand } from "@/lib/homeDiscoveryConfig";
import type { DealBenefitType, DealSort } from "@/types/deal";

const validSorts: DealSort[] = ["latest", "discount", "price", "hot", "endingSoon"];

export interface HomeUrlState {
  category?: string;
  mall?: string;
  sort?: DealSort;
  query?: string;
  freeShippingOnly?: boolean;
  hotOnly?: boolean;
  endingSoonOnly?: boolean;
  verifiedOnly?: boolean;
  priceBand?: PriceBand;
  benefitFilter?: "all" | DealBenefitType;
}

export function readHomeUrlState(search: string | URLSearchParams): HomeUrlState {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const initialCategory = params.get("category");
  const initialMall = params.get("mall");
  const initialSort = params.get("sort") as DealSort | null;
  const initialQuery = params.get("q");
  const initialFreeShipping = params.get("freeShipping") ?? params.get("freeShippingOnly");
  const initialHotOnly = params.get("hotOnly");
  const initialEndingSoon = params.get("endingSoon") ?? params.get("endingSoonOnly");
  const initialVerifiedOnly = params.get("verified") ?? params.get("verifiedOnly");
  const initialPriceBand = params.get("priceBand") as PriceBand | null;
  const initialBenefitType = params.get("dealType") as DealBenefitType | null;

  return {
    category: initialCategory || undefined,
    mall: initialMall || undefined,
    sort: initialSort && validSorts.includes(initialSort) ? initialSort : undefined,
    query: initialQuery || undefined,
    freeShippingOnly: initialFreeShipping === "true",
    hotOnly: initialHotOnly === "true",
    endingSoonOnly: initialEndingSoon === "true",
    verifiedOnly: initialVerifiedOnly === "true",
    priceBand: initialPriceBand && priceBands.some((band) => band.id === initialPriceBand) ? initialPriceBand : undefined,
    benefitFilter: initialBenefitType && benefitFilters.some((filter) => filter.id === initialBenefitType) ? initialBenefitType : undefined
  };
}

export function buildHomeUrlSearchParams({
  category,
  query,
  sort,
  freeShippingOnly,
  hotOnly,
  endingSoonOnly,
  verifiedOnly,
  mallFilter,
  priceBand,
  benefitFilter
}: {
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
}) {
  const params = new URLSearchParams();

  if (category !== "all") params.set("category", category);
  if (query.trim()) params.set("q", query.trim());
  if (sort !== "latest") params.set("sort", sort);
  if (freeShippingOnly) params.set("freeShippingOnly", "true");
  if (hotOnly) params.set("hotOnly", "true");
  if (endingSoonOnly) params.set("endingSoonOnly", "true");
  if (verifiedOnly) params.set("verifiedOnly", "true");
  if (mallFilter !== "all") params.set("mall", mallFilter);
  if (priceBand !== "all") params.set("priceBand", priceBand);
  if (benefitFilter !== "all") params.set("dealType", benefitFilter);

  return params;
}
