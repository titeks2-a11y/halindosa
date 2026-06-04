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

type NewsDealSort = "priority" | "endingSoon" | "latest" | "discount";
type NewsDealFreshnessStatus = "fresh" | "due" | "stale" | "seed";

const freshnessCadenceMinutes = 6 * 60;
const freshnessStaleAfterMinutes = 24 * 60;

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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function matchesNewsDealQuery(deal: NewsDeal, query?: string) {
  const terms = String(query ?? "")
    .trim()
    .split(/\s+/)
    .map(normalizeSearchText)
    .filter(Boolean);

  if (!terms.length) return true;

  const searchable = normalizeSearchText(
    [
      deal.title,
      deal.summary,
      deal.merchant,
      deal.mallName,
      deal.category,
      deal.benefitType,
      deal.sourceName,
      deal.officialHost,
      deal.tags.join(" ")
    ].join(" ")
  );

  return terms.every((term) => searchable.includes(term));
}

function normalizeNewsSort(sort?: string): NewsDealSort {
  return sort === "endingSoon" || sort === "latest" || sort === "discount" || sort === "priority" ? sort : "priority";
}

function sortNewsDeals(deals: NewsDeal[], sort: NewsDealSort) {
  const sorted = [...deals];

  switch (sort) {
    case "endingSoon":
      return sorted.sort((a, b) => Date.parse(a.endDate) - Date.parse(b.endDate) || (b.priorityScore ?? b.confidenceScore) - (a.priorityScore ?? a.confidenceScore));
    case "latest":
      return sorted.sort((a, b) => Date.parse(b.lastCheckedAt || b.startDate) - Date.parse(a.lastCheckedAt || a.startDate));
    case "discount":
      return sorted.sort((a, b) => (b.discountRate + Math.floor((b.couponAmount ?? 0) / 1000)) - (a.discountRate + Math.floor((a.couponAmount ?? 0) / 1000)));
    case "priority":
    default:
      return sorted.sort((a, b) => (b.priorityScore ?? b.confidenceScore) - (a.priorityScore ?? a.confidenceScore) || Date.parse(a.endDate) - Date.parse(b.endDate));
  }
}

function buildNewsFreshness(generatedAt?: string) {
  const timestamp = Date.parse(String(generatedAt ?? ""));

  if (!Number.isFinite(timestamp)) {
    return {
      freshnessStatus: "seed" as NewsDealFreshnessStatus,
      freshnessLabel: "seed 기준",
      freshnessAgeMinutes: null,
      freshnessCadenceMinutes,
      freshnessStaleAfterMinutes,
      nextRefreshAt: ""
    };
  }

  const freshnessAgeMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  const freshnessStatus: NewsDealFreshnessStatus =
    freshnessAgeMinutes <= freshnessCadenceMinutes ? "fresh" : freshnessAgeMinutes <= freshnessStaleAfterMinutes ? "due" : "stale";

  return {
    freshnessStatus,
    freshnessLabel: freshnessStatus === "fresh" ? "최근 확인" : freshnessStatus === "due" ? "재확인 권장" : "갱신 필요",
    freshnessAgeMinutes,
    freshnessCadenceMinutes,
    freshnessStaleAfterMinutes,
    nextRefreshAt: new Date(timestamp + freshnessCadenceMinutes * 60_000).toISOString()
  };
}

export function getVisibleNewsDeals(options: { limit?: number; category?: string; benefitType?: string; q?: string; sort?: string } = {}) {
  const snapshot = readSnapshot();
  const sourceDeals = snapshot?.deals?.length ? snapshot.deals : (seedNewsDeals as NewsDeal[]);
  const now = Date.now();
  const sort = normalizeNewsSort(options.sort);
  const updatedAt = snapshot?.generatedAt ?? "";
  const freshness = buildNewsFreshness(updatedAt);
  const filtered = applyNewsDealOverrides(sourceDeals)
    .filter(isVisibleNewsDeal)
    .filter((deal) => {
      const endsAt = Date.parse(deal.endDate);
      return !Number.isFinite(endsAt) || endsAt >= now;
    })
    .filter((deal) => !options.category || options.category === "all" || deal.category === options.category)
    .filter((deal) => !options.benefitType || options.benefitType === "all" || deal.benefitType === options.benefitType)
    .filter((deal) => matchesNewsDealQuery(deal, options.q));
  const sorted = sortNewsDeals(filtered, sort);

  return {
    deals: typeof options.limit === "number" && options.limit > 0 ? sorted.slice(0, options.limit) : sorted,
    count: sorted.length,
    updatedAt,
    source: snapshot?.source ?? "seed",
    sort,
    query: options.q?.trim() ?? "",
    ...freshness
  };
}

export function findVisibleNewsDealById(id: string) {
  const { deals } = getVisibleNewsDeals();

  return deals.find((deal) => deal.id === id) ?? null;
}
