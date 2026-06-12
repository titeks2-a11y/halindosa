import type { PriceBand } from "@/lib/homeDiscoveryConfig";
import { isCrossOriginApiRequest, resolveRuntimeApiUrl } from "@/lib/runtimeApi";
import type { DealQualitySummary } from "@/lib/deals/quality";
import type { Deal, DealBenefitType, DealSort } from "@/types/deal";
import type { FreeBenefitEvent, FreeBenefitEventType } from "@/types/freeBenefitEvent";
import type { FreeBenefitDeadlineCategoryCount, FreeBenefitEventSourceSummary } from "@/lib/freeBenefitEvents";
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

export interface FreebiesResponse {
  ok: boolean;
  freebies: NewsDeal[];
  deals: NewsDeal[];
  events?: FreeBenefitEvent[];
  count: number;
  eventCount?: number;
  totalCount: number;
  updatedAt: string;
  sourceUpdatedAt?: string;
  source: string;
  freshnessStatus?: "fresh" | "due" | "stale" | "seed";
  freshnessLabel?: string;
  freshnessAgeMinutes?: number | null;
  nextRefreshAt?: string;
  categoryCounts?: Array<{ id: FreeBenefitEventType; label: string; count: number }>;
  deadlineCategoryCounts?: FreeBenefitDeadlineCategoryCount[];
  summary?: {
    total: number;
    zeroCost: number;
    coupon: number;
    freeShipping: number;
    endingToday: number;
    sourceCount: number;
    averageQualityScore: number;
  };
  eventSummary?: FreeBenefitEventSourceSummary;
  requiredCategoryCoverage?: RequiredFreeBenefitCategoryCoverage;
  cachePolicy?: {
    mode: "no-store";
    generatedAt: string;
  };
  message: string;
}

export interface FreeBenefitEventsResponse {
  ok: boolean;
  events: FreeBenefitEvent[];
  count: number;
  totalCount: number;
  publishableTotalCount?: number;
  updatedAt: string;
  sourceUpdatedAt?: string;
  source: string;
  categories?: Array<{ id: FreeBenefitEventType; label: string; count: number }>;
  categoryCounts?: Array<{ id: FreeBenefitEventType; label: string; count: number }>;
  filteredCategoryCounts?: Array<{ id: FreeBenefitEventType; label: string; count: number }>;
  deadlineCategoryCounts?: FreeBenefitDeadlineCategoryCount[];
  filteredDeadlineCategoryCounts?: FreeBenefitDeadlineCategoryCount[];
  freshnessStatus?: "fresh" | "due" | "stale" | "seed";
  freshnessLabel?: string;
  freshnessAgeMinutes?: number | null;
  nextRefreshAt?: string;
  summary?: {
    total: number;
    noPurchase: number;
    purchaseRequired: number;
    loginRequired: number;
    everyone: number;
    firstCome: number;
    endingToday: number;
    endingSoon: number;
    endingThisWeek: number;
    officialSourceCount: number;
    byType: Record<string, number>;
  } & FreeBenefitEventSourceSummary;
  cachePolicy?: {
    mode: "no-store";
    generatedAt: string;
  };
  message: string;
}

export type FreeBenefitEventCategoryCount = NonNullable<FreeBenefitEventsResponse["categoryCounts"]>[number];

export interface RequiredFreeBenefitCategoryCoverage {
  ok: boolean;
  visibleActiveBenefits: number;
  noPurchaseVisibleBenefits: number;
  todayEndingBenefits: number;
  weekEndingBenefits: number;
  officialHostCount: number;
  categories: Array<{
    id: string;
    label: string;
    minimum: number;
    count: number;
    ok: boolean;
    href: string;
  }>;
  categoryCandidateGroups?: Array<{
    id: string;
    label: string;
    minimum: number;
    count: number;
    ok: boolean;
    href: string;
    candidates: Array<{
      id: string;
      title: string;
      sourceName: string;
      category: string;
      finalUrl: string;
      host: string;
      endAt: string;
      requiresPurchase: boolean;
      claimEaseScore: number;
      claimUrgencyLabel: string;
      qualityScore: number;
      priorityScore: number;
    }>;
  }>;
}

export type HomeFreshnessStatus = "fresh" | "due" | "stale" | "seed";
export type HomeFreshnessChannelKey = "deals" | "newsDeals" | "hotSignals";

export interface HomeFreshnessChannel {
  updatedAt: string;
  ageMinutes: number | null;
  status: HomeFreshnessStatus;
  label: string;
  count: number;
  source: string;
}

export interface HomeFreshness {
  generatedAt: string;
  status: HomeFreshnessStatus;
  label: string;
  ageMinutes: number | null;
  oldestChannel: HomeFreshnessChannelKey;
  nextRefreshAt: string;
  staleChannelCount: number;
  channels: Record<HomeFreshnessChannelKey, HomeFreshnessChannel>;
}

export interface HomeOfficialBenefitQualitySummary {
  total: number;
  publishable: number;
  active: number;
  verified: number;
  hidden: number;
  averageQualityScore: number;
}

export interface HomeExposureQualitySummary {
  publishableTotal: number;
  hiddenTotal: number;
  averageQualityScore: number;
  generatedAt: string;
}

export interface HomeQualitySummary {
  productDeals: DealQualitySummary;
  officialBenefits: HomeOfficialBenefitQualitySummary;
  exposure: HomeExposureQualitySummary;
}

export interface HomeResponse {
  ok: boolean;
  deals: Deal[];
  newsDeals: NewsDeal[];
  freebies?: NewsDeal[];
  freeBenefitEvents?: FreeBenefitEvent[];
  hotSignals: HotSignal[];
  counts: {
    deals: number;
    newsDeals: number;
    freebies?: number;
    hotSignals: number;
  };
  updatedAt: string;
  dealUpdatedAt?: string;
  newsUpdatedAt?: string;
  freshness?: HomeFreshness;
  source:
    | {
        deals: string;
        news: string;
        hotSignals: string;
      }
    | string;
  newsMeta?: Pick<
    NewsDealsResponse,
    | "categoryCounts"
    | "benefitTypeCounts"
    | "sourceCounts"
    | "recommendedQueries"
    | "targetSections"
    | "intentGroups"
    | "sourceTrustScores"
    | "deadlineSummary"
    | "freshnessStatus"
    | "freshnessLabel"
    | "freshnessAgeMinutes"
    | "nextRefreshAt"
  >;
  freebiesMeta?: Pick<FreebiesResponse, "summary" | "eventSummary" | "requiredCategoryCoverage" | "freshnessStatus" | "freshnessLabel" | "freshnessAgeMinutes" | "nextRefreshAt" | "totalCount" | "eventCount" | "deadlineCategoryCounts"> & {
    categoryCounts?: FreeBenefitEventCategoryCount[];
  };
  freeBenefitEventMeta?: {
    totalCount: number;
    categoryCounts: FreeBenefitEventCategoryCount[];
    deadlineCategoryCounts?: FreeBenefitDeadlineCategoryCount[];
    summary: FreeBenefitEventSourceSummary;
    visibleTypes: FreeBenefitEventType[];
    policy: {
      countBasis: string;
      blocked: string[];
      cta: string;
    };
  };
  cachePolicy?: {
    mode: "no-store";
    generatedAt: string;
  };
  quality?: HomeQualitySummary;
  message: string;
}

export function buildHomeRequestUrl({
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
  limit = 12,
  newsLimit,
  freeBenefitLimit,
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
  limit?: number;
  newsLimit?: number;
  freeBenefitLimit?: number;
  timestamp?: number;
}) {
  const params = new URLSearchParams({
    category,
    sort,
    limit: String(limit),
    freeShippingOnly: String(freeShippingOnly),
    hotOnly: String(hotOnly),
    endingSoonOnly: String(endingSoonOnly),
    verifiedOnly: String(verifiedOnly),
    mall: mallFilter,
    priceBand,
    dealType: benefitFilter,
    ts: String(timestamp)
  });

  if (newsLimit) params.set("newsLimit", String(newsLimit));
  if (freeBenefitLimit) params.set("freeBenefitLimit", String(freeBenefitLimit));
  if (query.trim()) params.set("q", query.trim());

  return `/api/home?${params.toString()}`;
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

export function buildFreebiesRequestUrl({
  query,
  limit = 16,
  sort = "priority",
  timestamp = Date.now()
}: {
  query: string;
  limit?: number;
  sort?: "priority" | "endingSoon" | "latest" | "discount";
  timestamp?: number;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
    sort,
    ts: String(timestamp)
  });

  if (query.trim()) params.set("q", query.trim());

  return `/api/freebies?${params.toString()}`;
}

export function buildFreeBenefitEventsRequestUrl({
  query,
  limit = 24,
  type = "all",
  sort = "recommended",
  noPurchaseOnly = false,
  endingSoonOnly = false,
  deadline = "all",
  timestamp = Date.now()
}: {
  query: string;
  limit?: number;
  type?: string;
  sort?: "recommended" | "endingSoon" | "latest" | "noPurchase" | "quality";
  noPurchaseOnly?: boolean;
  endingSoonOnly?: boolean;
  deadline?: "all" | "today" | "week" | "soon";
  timestamp?: number;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
    type,
    sort,
    noPurchaseOnly: String(noPurchaseOnly),
    endingSoonOnly: String(endingSoonOnly),
    ts: String(timestamp)
  });

  if (deadline !== "all") params.set("deadline", deadline);
  if (query.trim()) params.set("q", query.trim());

  return `/api/benefits/events?${params.toString()}`;
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
  limit,
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
  limit?: number;
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

  if (limit) params.set("limit", String(limit));
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

export async function requestJson<T>(url: string): Promise<T> {
  const requestUrl = await resolveRuntimeApiUrl(url);
  const crossOrigin = isCrossOriginApiRequest(requestUrl);

  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch(requestUrl, {
      cache: "no-store",
      credentials: crossOrigin ? "omit" : "same-origin",
      headers: {
        Accept: "application/json",
        ...(crossOrigin ? {} : { "Cache-Control": "no-cache" })
      }
    }).then(async (response) => (await response.json()) as T);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", requestUrl, true);
    xhr.setRequestHeader("Accept", "application/json");
    if (!crossOrigin) xhr.setRequestHeader("Cache-Control", "no-cache");
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
