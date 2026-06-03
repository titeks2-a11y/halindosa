import { mockDeals } from "@/data/mockDeals";
import { DealInput } from "@/lib/deals/normalizer";
import { DealProvider } from "@/lib/deals/providers/types";

export const ManualProvider: DealProvider = {
  name: "manual",
  source: "manual_review",
  requiredEnv: [],
  isConfigured() {
    return true;
  },
  async fetchDeals() {
    return mockDeals as DealInput[];
  }
};
