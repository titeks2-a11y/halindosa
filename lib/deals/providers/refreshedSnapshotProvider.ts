import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockDeals } from "@/data/mockDeals";
import { normalizeDeals, type DealInput } from "@/lib/deals/normalizer";
import { isPubliclyVisibleDeal } from "@/lib/deals/quality";

interface RefreshedSnapshot {
  generatedAt?: string;
  deals?: DealInput[];
  visibleDealIds?: string[];
}

function readRefreshedSnapshot(): RefreshedSnapshot {
  const path = join(process.cwd(), "data", "refreshedDeals.json");
  if (!existsSync(path)) return {};

  try {
    return JSON.parse(readFileSync(path, "utf8")) as RefreshedSnapshot;
  } catch {
    return {};
  }
}

export async function fetchRefreshedSnapshotDeals() {
  const snapshot = readRefreshedSnapshot();
  const snapshotDeals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const visibleIds = Array.isArray(snapshot.visibleDealIds) ? new Set(snapshot.visibleDealIds) : null;
  const baseDeals = visibleIds ? mockDeals.filter((deal) => visibleIds.has(deal.id)) : [];
  const deals = snapshotDeals.length ? snapshotDeals : baseDeals;
  return normalizeDeals(deals, "refreshed").filter(isPubliclyVisibleDeal);
}

export function getRefreshedSnapshotUpdatedAt() {
  const snapshot = readRefreshedSnapshot();
  return snapshot.generatedAt || "";
}
