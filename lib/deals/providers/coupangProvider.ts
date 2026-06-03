import { DealProvider, hasRequiredEnv } from "@/lib/deals/providers/types";

const requiredEnv = ["COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY"];

export const CoupangProvider: DealProvider = {
  name: "coupang",
  source: "official_api",
  requiredEnv,
  isConfigured() {
    return hasRequiredEnv(requiredEnv);
  },
  async fetchDeals() {
    if (!this.isConfigured()) return [];

    // Future production hook: call an approved Coupang API/partner feed,
    // then return DealInput[] with productUrl/finalPurchaseUrl populated.
    return [];
  }
};
