import type { PriceBand } from "@/lib/homeDiscoveryConfig";
import type { Deal, DealBenefitType, DealSort } from "@/types/deal";
import type { HotSignal } from "@/types/hotSignal";
import type { NewsDeadlineSummary, NewsDeal, NewsDealSourceTrust, NewsIntentGroup, NewsTargetSection } from "@/types/newsDeal";

export interface DealsResponse {
  ok: boolean;
  deals: Deal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

export interface HotSignalsResponse {
  ok: boolean;
  signals: HotSignal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

export interface NewsDealsResponse {
  ok: boolean;
  deals: NewsDeal[];
  count: number;
  updatedAt: string;
  source: string;
  categoryCounts?: Record<string, number>;
  benefitTypeCounts?: Record<string, number>;
  sourceCounts?: Record<string, number>;
  recommendedQueries?: Array<{ query: string; count: number }>;
  targetSections?: NewsTargetSection[];
  intentGroups?: NewsIntentGroup[];
  sourceTrustScores?: NewsDealSourceTrust[];
  deadlineSummary?: NewsDeadlineSummary;
  freshnessStatus?: "fresh" | "due" | "stale" | "seed";
  freshnessLabel?: string;
  freshnessAgeMinutes?: number | null;
  nextRefreshAt?: string;
  message: string;
}

export function buildNewsDealsRequestUrl({
  query,
  limit = 8,
  sort = "priority",
  timestamp = Date.now()
}: {
  query: string;
  limit?: number;
  sort?: "priority" | "endingSoon";
  timestamp?: number;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
    sort,
    ts: String(timestamp)
  });

  if (query.trim()) params.set("q", query.trim());

  return `/api/news-deals?${params.toString()}`;
}

export function buildDealsRequestUrl({
  category,
  sort,
  freeShippingOnly,
  hotOnly,
  endingSoonOnly,
  verifiedOnly,
  mallFilter,
  priceBand,
  benefitFilter,
  query,
  timestamp = Date.now()
}: {
  category: string;
  sort: DealSort;
  freeShippingOnly: boolean;
  hotOnly: boolean;
  endingSoonOnly: boolean;
  verifiedOnly: boolean;
  mallFilter: string;
  priceBand: PriceBand;
  benefitFilter: "all" | DealBenefitType;
  query: string;
  timestamp?: number;
}) {
  const params = new URLSearchParams({
    category,
    sort,
    freeShippingOnly: String(freeShippingOnly),
    hotOnly: String(hotOnly),
    endingSoonOnly: String(endingSoonOnly),
    verifiedOnly: String(verifiedOnly),
    mall: mallFilter,
    priceBand,
    dealType: benefitFilter,
    ts: String(timestamp)
  });

  if (query.trim()) params.set("q", query.trim());

  return `/api/deals?${params.toString()}`;
}

export function buildHotSignalsRequestUrl({ category, query, limit = 9, timestamp = Date.now() }: { category: string; query: string; limit?: number; timestamp?: number }) {
  const params = new URLSearchParams({
    category,
    limit: String(limit),
    ts: String(timestamp)
  });

  if (query.trim()) params.set("q", query.trim());

  return `/api/hot-signals?${params.toString()}`;
}

export function buildLatestDealsRequestUrl() {
  return `/api/deals?sort=latest&ts=${Date.now()}`;
}

export function requestJson<T>(url: string): Promise<T> {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache"
      }
    }).then(async (response) => (await response.json()) as T);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Cache-Control", "no-cache");
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.send();
  });
}
