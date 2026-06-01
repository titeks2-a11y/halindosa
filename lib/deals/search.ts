import type { Deal } from "@/types/deal";
import searchAliasesSource from "@/data/searchAliases.json";

const searchAliases: Array<{ keys: string[]; terms: string[] }> = searchAliasesSource;

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

function getTokenAlternatives(token: string) {
  const normalizedToken = normalizeSearchText(token);
  const compactToken = compactSearchText(normalizedToken);
  const alternatives = new Set([normalizedToken]);

  for (const alias of searchAliases) {
    const keyMatched = alias.keys.some((key) => {
      const normalizedKey = normalizeSearchText(key);
      const compactKey = compactSearchText(normalizedKey);
      return normalizedToken === normalizedKey || compactToken === compactKey;
    });

    if (keyMatched) {
      for (const term of alias.terms) {
        alternatives.add(normalizeSearchText(term));
      }
    }
  }

  return Array.from(alternatives).filter(Boolean);
}

function textIncludesSearchTerm(haystack: string, compactHaystack: string, term: string) {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return true;
  return haystack.includes(normalizedTerm) || compactHaystack.includes(compactSearchText(normalizedTerm));
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
  const tokenAlternatives = queryTokens.map(getTokenAlternatives);

  return (
    haystack.includes(normalizedQuery) ||
    compactHaystack.includes(compactQuery) ||
    tokenAlternatives.every((alternatives) => alternatives.some((term) => textIncludesSearchTerm(haystack, compactHaystack, term)))
  );
}
