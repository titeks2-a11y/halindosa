import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import seedNewsDeals from "@/data/newsDeals.seed.json";
import { applyNewsDealOverrides } from "@/lib/deals/newsOverrides";
import type { NewsDeal } from "@/types/newsDeal";

interface NewsDealSnapshot {
  generatedAt?: string;
  source?: string;
  allDeals?: NewsDeal[];
  deals?: NewsDeal[];
  hiddenDeals?: NewsDeal[];
  providerStats?: unknown[];
}

function readSnapshot(): NewsDealSnapshot | null {
  const path = join(process.cwd(), "data", "refreshedNewsDeals.json");
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as NewsDealSnapshot;
  } catch {
    return null;
  }
}

function isVisibleNewsDeal(deal: NewsDeal) {
  const linkType = deal.linkType ?? "official_benefit";
  const availability = deal.availability ?? "active";
  const priorityScore = deal.priorityScore ?? deal.confidenceScore ?? 0;

  return (
    deal.validationStatus === "passed" &&
    !deal.isHidden &&
    Boolean(deal.finalUrl) &&
    availability === "active" &&
    linkType.startsWith("official") &&
    priorityScore >= 70
  );
}

export function getVisibleNewsDeals(options: { limit?: number; category?: string; benefitType?: string } = {}) {
  const snapshot = readSnapshot();
  const sourceDeals = snapshot?.deals?.length ? snapshot.deals : (seedNewsDeals as NewsDeal[]);
  const now = Date.now();
  const filtered = applyNewsDealOverrides(sourceDeals)
    .filter(isVisibleNewsDeal)
    .filter((deal) => {
      const endsAt = Date.parse(deal.endDate);
      return !Number.isFinite(endsAt) || endsAt >= now;
    })
    .filter((deal) => !options.category || options.category === "all" || deal.category === options.category)
    .filter((deal) => !options.benefitType || options.benefitType === "all" || deal.benefitType === options.benefitType)
    .sort((a, b) => (b.priorityScore ?? b.confidenceScore) - (a.priorityScore ?? a.confidenceScore) || Date.parse(a.endDate) - Date.parse(b.endDate));

  return {
    deals: typeof options.limit === "number" && options.limit > 0 ? filtered.slice(0, options.limit) : filtered,
    count: filtered.length,
    updatedAt: snapshot?.generatedAt ?? new Date().toISOString(),
    source: snapshot?.source ?? "seed"
  };
}

export function findVisibleNewsDealById(id: string) {
  const { deals } = getVisibleNewsDeals();

  return deals.find((deal) => deal.id === id) ?? null;
}
