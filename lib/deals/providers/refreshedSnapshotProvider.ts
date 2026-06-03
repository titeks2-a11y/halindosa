import refreshedSnapshot from "@/data/refreshedDeals.json";
import { normalizeDeals, type DealInput } from "@/lib/deals/normalizer";
import { isPubliclyVisibleDeal } from "@/lib/deals/quality";

interface RefreshedSnapshot {
  generatedAt?: string;
  deals?: DealInput[];
}

const snapshot = refreshedSnapshot as RefreshedSnapshot;

export async function fetchRefreshedSnapshotDeals() {
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  return normalizeDeals(deals, "refreshed").filter(isPubliclyVisibleDeal);
}

export function getRefreshedSnapshotUpdatedAt() {
  return snapshot.generatedAt || "";
}
