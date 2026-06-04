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

interface OfficialBenefitSourceSpec {
  enabled?: boolean;
  recommendedQueries?: string[];
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

function readOfficialBenefitSourceSpecs(): OfficialBenefitSourceSpec[] {
  const path = join(process.cwd(), "data", "officialBenefitFeedSources.json");
  if (!existsSync(path)) return [];

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as OfficialBenefitSourceSpec[]) : [];
  } catch {
    return [];
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

function countBy<T extends string>(deals: NewsDeal[], getKey: (deal: NewsDeal) => T) {
  return deals.reduce<Record<T, number>>((counts, deal) => {
    const key = getKey(deal);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

function buildConfiguredNewsQuerySeeds() {
  const fromConfig = readOfficialBenefitSourceSpecs()
    .filter((spec) => spec.enabled !== false)
    .flatMap((spec) => (Array.isArray(spec.recommendedQueries) ? spec.recommendedQueries : []));
  const baseline = ["오늘의 무료", "쿠폰", "마트 행사", "편의점 1+1", "배달 쿠폰", "카드 혜택", "정부 지원", "문화 혜택"];

  return Array.from(new Set([...fromConfig, ...baseline].map((query) => query.trim()).filter(Boolean)));
}

function inferRecommendedQueryCount(query: string, deals: NewsDeal[]) {
  const directMatches = deals.filter((deal) => matchesNewsDealQuery(deal, query)).length;
  if (directMatches > 0) return directMatches;

  const normalized = normalizeSearchText(query);
  const matches = (deal: NewsDeal) => {
    const text = normalizeSearchText([deal.title, deal.summary, deal.category, deal.benefitType, deal.sourceName, deal.tags.join(" ")].join(" "));
    if (/무료|0원|샘플|체험/.test(normalized)) return ["freebie", "public"].includes(deal.benefitType) || /무료|0원|샘플|체험/.test(text);
    if (/쿠폰/.test(normalized)) return ["coupon", "foodDelivery"].includes(deal.benefitType) || /쿠폰/.test(text);
    if (/카드|멤버십/.test(normalized)) return ["card", "membership"].includes(deal.benefitType) || deal.category === "카드/멤버십";
    if (/마트|편의점|1\+1|2\+1/.test(normalized)) return ["mart", "convenienceStore"].includes(deal.benefitType) || deal.category === "마트/편의점";
    if (/배달|외식/.test(normalized)) return deal.benefitType === "foodDelivery" || deal.category === "외식/배달";
    if (/정부|공공|지원/.test(normalized)) return deal.benefitType === "public" || deal.category === "정부/공공혜택";
    if (/문화|영화|전시/.test(normalized)) return deal.benefitType === "culture" || deal.category === "영화/문화";
    return false;
  };

  return deals.filter(matches).length;
}

function buildRecommendedNewsQueries(deals: NewsDeal[], configuredQueries = buildConfiguredNewsQuerySeeds()) {
  const benefitLabels: Record<string, string> = {
    discount: "할인",
    coupon: "쿠폰",
    freebie: "무료",
    freeShipping: "무료배송",
    event: "이벤트",
    membership: "멤버십",
    card: "카드할인",
    culture: "문화",
    travel: "여행",
    public: "공공혜택",
    point: "포인트",
    foodDelivery: "배달쿠폰",
    convenienceStore: "편의점행사",
    mart: "마트행사"
  };
  const weights = new Map<string, { count: number; score: number }>();

  const add = (value: string, score = 1) => {
    const query = value.trim();
    if (!query || query.length > 14) return;
    const current = weights.get(query) ?? { count: 0, score: 0 };
    weights.set(query, { count: current.count + 1, score: current.score + score });
  };

  for (const deal of deals) {
    add(deal.category, 2);
    add(benefitLabels[deal.benefitType] ?? deal.benefitType, 3);
    add(deal.merchant, 2);
    for (const tag of deal.tags) add(tag, 1);
  }

  configuredQueries.forEach((query, index) => {
    const current = weights.get(query) ?? { count: 0, score: 0 };
    const inferredCount = inferRecommendedQueryCount(query, deals);
    weights.set(query, {
      count: Math.max(current.count, inferredCount),
      score: current.score + Math.max(3, 18 - index * 0.5) + inferredCount * 2
    });
  });

  return Array.from(weights.entries())
    .map(([query, value]) => ({ query, count: value.count, score: value.score }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.query.localeCompare(b.query))
    .slice(0, 10)
    .map(({ query, count }) => ({ query, count }));
}

export function getVisibleNewsDeals(options: { limit?: number; category?: string; benefitType?: string; q?: string; sort?: string } = {}) {
  const snapshot = readSnapshot();
  const sourceDeals = snapshot?.deals?.length ? snapshot.deals : (seedNewsDeals as NewsDeal[]);
  const now = Date.now();
  const sort = normalizeNewsSort(options.sort);
  const sourceConfigQueries = buildConfiguredNewsQuerySeeds();
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
    categoryCounts: countBy(sorted, (deal) => deal.category),
    benefitTypeCounts: countBy(sorted, (deal) => deal.benefitType),
    sourceCounts: countBy(sorted, (deal) => deal.sourceName),
    recommendedQueries: buildRecommendedNewsQueries(sorted, sourceConfigQueries),
    sourceConfigQueries,
    ...freshness
  };
}

export function findVisibleNewsDealById(id: string) {
  const { deals } = getVisibleNewsDeals();

  return deals.find((deal) => deal.id === id) ?? null;
}
