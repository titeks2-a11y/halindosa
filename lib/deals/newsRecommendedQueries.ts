import type { NewsDeal, NewsIntentGroup, NewsTargetSection } from "@/types/newsDeal";

export type RecommendedNewsQuery = {
  query: string;
  count: number;
};

export const customerIntentNewsQueries = [
  "오늘의 무료",
  "무료 쿠폰",
  "마트 행사",
  "편의점 1+1",
  "배달 쿠폰",
  "카드 혜택",
  "정부 지원",
  "문화 혜택"
] as const;

export const customerIntentNewsQuerySet = new Set<string>(customerIntentNewsQueries);

export const defaultNewsTargetSectionLabels = [
  "오늘의 무료",
  "쿠폰",
  "마트 행사",
  "편의점 1+1",
  "배달 쿠폰",
  "카드 혜택",
  "정부 지원/문화 혜택",
  "마감임박"
] as const;

const defaultNewsIntentGroupSpecs = [
  { id: "free", label: "오늘 무료", query: "오늘의 무료", actionLabel: "무료 혜택 보기" },
  { id: "coupon", label: "쿠폰", query: "무료 쿠폰", actionLabel: "쿠폰 받기" },
  { id: "mart", label: "마트 행사", query: "마트 행사", actionLabel: "행사 보기" },
  { id: "convenience", label: "편의점", query: "편의점 1+1", actionLabel: "1+1 보기" },
  { id: "delivery", label: "배달", query: "배달 쿠폰", actionLabel: "배달 혜택 보기" },
  { id: "card", label: "카드 혜택", query: "카드 혜택", actionLabel: "카드 혜택 보기" },
  { id: "public-culture", label: "공공·문화", query: "정부 지원", actionLabel: "지원 혜택 보기" },
  { id: "ending-soon", label: "마감임박", query: "마감임박", actionLabel: "마감 전 확인" }
] as const;

function buildSearchableText(deal: NewsDeal) {
  return [deal.title, deal.summary, deal.category, deal.benefitType, deal.sourceName, (deal.tags ?? []).join(" ")]
    .join(" ")
    .replace(/\s+/g, "");
}

function queryMatchesDeal(query: string, deal: NewsDeal) {
  const normalizedQuery = query.replace(/\s+/g, "");
  const searchable = buildSearchableText(deal);

  if (/무료|0원|샘플|체험/.test(normalizedQuery)) return ["freebie", "public"].includes(deal.benefitType) || /무료|0원|샘플|체험/.test(searchable);
  if (/쿠폰/.test(normalizedQuery)) return ["coupon", "foodDelivery"].includes(deal.benefitType) || /쿠폰/.test(searchable);
  if (/마트|편의점|1\+1|2\+1/.test(normalizedQuery)) return ["mart", "convenienceStore"].includes(deal.benefitType) || deal.category === "마트/편의점";
  if (/배달|외식/.test(normalizedQuery)) return deal.benefitType === "foodDelivery" || deal.category === "외식/배달";
  if (/카드|멤버십/.test(normalizedQuery)) return ["card", "membership"].includes(deal.benefitType) || deal.category === "카드/멤버십";
  if (/정부|공공|지원/.test(normalizedQuery)) return deal.benefitType === "public" || deal.category === "정부/공공혜택";
  if (/문화|영화|전시/.test(normalizedQuery)) return deal.benefitType === "culture" || deal.category === "영화/문화";
  if (/여행|항공|숙박|티켓/.test(normalizedQuery)) return deal.benefitType === "travel" || deal.category === "여행/숙박";
  if (/포인트|적립/.test(normalizedQuery)) return deal.benefitType === "point" || /포인트|적립/.test(searchable);
  if (/특가|오늘/.test(normalizedQuery)) return ["discount", "event", "freeShipping"].includes(deal.benefitType) || /특가|할인|행사/.test(searchable);
  if (/마감/.test(normalizedQuery)) return Date.parse(deal.endDate) - Date.now() <= 7 * 24 * 60 * 60 * 1000;

  return searchable.includes(normalizedQuery);
}

export function normalizeNewsTargetSectionQuery(label: string) {
  const normalized = label.replace(/\s+/g, "");

  if (/무료배송|무배/.test(normalized)) return "무료배송";
  if (/오늘의무료|무료혜택|무료체험/.test(normalized)) return "오늘의 무료";
  if (/정부/.test(normalized)) return "정부 지원";
  if (/문화|영화/.test(normalized)) return "문화 혜택";
  if (/배달|외식/.test(normalized)) return "배달 쿠폰";
  if (/편의점/.test(normalized)) return "편의점 1+1";
  if (/마트/.test(normalized)) return "마트 행사";
  if (/카드|멤버십/.test(normalized)) return "카드 혜택";
  if (/쿠폰/.test(normalized)) return "무료 쿠폰";
  if (/포인트|적립/.test(normalized)) return "포인트 적립";
  if (/여행|항공|티켓|숙박/.test(normalized)) return "여행";
  if (/마감/.test(normalized)) return "마감임박";
  if (/오늘|특가/.test(normalized)) return "오늘특가";

  return label.trim();
}

export function buildInitialNewsTargetSections(deals: NewsDeal[] = [], labels: readonly string[] = defaultNewsTargetSectionLabels): NewsTargetSection[] {
  return Array.from(new Set(labels.map((label) => label.trim()).filter(Boolean)))
    .map((label) => {
      const query = normalizeNewsTargetSectionQuery(label);
      return {
        label,
        query,
        count: deals.filter((deal) => queryMatchesDeal(query, deal)).length
      };
    })
    .filter((item) => item.count > 0)
    .slice(0, 8);
}

export function buildInitialNewsRecommendedQueries(deals: NewsDeal[] = []): RecommendedNewsQuery[] {
  return customerIntentNewsQueries
    .map((query) => ({
      query,
      count: deals.filter((deal) => queryMatchesDeal(query, deal)).length
    }))
    .filter((item) => item.count > 0)
    .slice(0, 8);
}

function countBySourceName(deals: NewsDeal[]) {
  return deals.reduce<Record<string, number>>((counts, deal) => {
    const sourceName = deal.sourceName || deal.mallName || deal.merchant;
    if (!sourceName) return counts;
    counts[sourceName] = (counts[sourceName] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildNewsIntentGroups(deals: NewsDeal[] = []): NewsIntentGroup[] {
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  return defaultNewsIntentGroupSpecs
    .map((spec) => {
      const matchedDeals = deals.filter((deal) => queryMatchesDeal(spec.query, deal));
      const sourceCounts = countBySourceName(matchedDeals);
      const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([sourceName]) => sourceName);
      const benefitTypes = Array.from(new Set(matchedDeals.map((deal) => deal.benefitType))).slice(0, 4);
      const urgentCount = matchedDeals.filter((deal) => {
        const endTime = Date.parse(deal.endDate);
        return Number.isFinite(endTime) && endTime >= now && endTime - now <= threeDaysMs;
      }).length;

      return {
        ...spec,
        count: matchedDeals.length,
        urgentCount,
        topSources,
        benefitTypes
      };
    })
    .filter((group) => group.count > 0)
    .sort((a, b) => b.urgentCount - a.urgentCount || b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}
