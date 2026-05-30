export {
  findDealById,
  findDealByIdLive,
  getDeals,
  getRelatedDeals,
  normalizeSort,
  sortDeals
} from "@/lib/deals/dealRepository";

export type { DealProviderResult, DealQuery } from "@/lib/deals/dealRepository";
