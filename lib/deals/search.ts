import type { Deal } from "@/types/deal";

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-zㄱ-ㅎ가-힣ㅏ-ㅣ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

export function buildDealSearchText(deal: Deal) {
  return [
    deal.title,
    deal.description,
    deal.brand ?? "",
    deal.mallName,
    deal.mall,
    deal.category,
    deal.subCategory ?? "",
    deal.dealType,
    deal.benefitSummary,
    deal.sourceName ?? "",
    deal.shipping,
    deal.shippingFee,
    deal.couponCondition ?? "",
    ...deal.tags
  ].join(" ");
}

export function dealMatchesSearch(deal: Deal, query?: string | null) {
  const normalizedQuery = normalizeSearchText(query ?? "");
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(buildDealSearchText(deal));
  const compactHaystack = compactSearchText(haystack);
  const compactQuery = compactSearchText(normalizedQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return haystack.includes(normalizedQuery) || compactHaystack.includes(compactQuery) || queryTokens.every((token) => haystack.includes(token) || compactHaystack.includes(compactSearchText(token)));
}
