import type { Deal } from "@/types/deal";

const searchAliases: Array<{ keys: string[]; terms: string[] }> = [
  {
    keys: ["생필품", "생활필수품", "생활필수", "생필"],
    terms: ["생활용품", "생활필수", "물티슈", "세제", "마스크", "생수", "장보기"]
  },
  {
    keys: ["무배", "배송무료", "무료배송"],
    terms: ["무료배송", "무배", "로켓배송", "로켓프레시", "네멤무료", "무료"]
  },
  {
    keys: ["0원", "공짜", "무료", "무료딜"],
    terms: ["무료", "무료혜택", "0원딜", "무료 샘플", "무료체험", "초대권", "쿠폰"]
  },
  {
    keys: ["가전제품", "가전", "전자제품", "디지털"],
    terms: ["가전", "전자기기", "디지털", "TV", "청소기", "충전", "아이패드", "드라이어"]
  },
  {
    keys: ["편의점", "편의점행사", "1+1", "2+1"],
    terms: ["편의점/마트", "편의점", "GS25", "CU", "세븐일레븐", "1+1", "2+1", "모바일쿠폰"]
  },
  {
    keys: ["앱테크", "포인트", "적립"],
    terms: ["포인트", "적립", "앱테크", "출석", "페이", "멤버십", "리워드"]
  },
  {
    keys: ["아이", "키즈", "아기", "육아템"],
    terms: ["육아", "키즈", "기저귀", "유아", "샘플팩", "체험"]
  }
];

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
      return normalizedToken === normalizedKey || compactToken === compactKey || compactToken.includes(compactKey);
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
