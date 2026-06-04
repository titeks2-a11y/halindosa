import type { NewsDeal } from "@/types/newsDeal";

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

  return searchable.includes(normalizedQuery);
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
