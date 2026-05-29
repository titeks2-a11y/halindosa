import { categories } from "@/data/mockDeals";
import { Deal, DealCategory } from "@/types/deal";

interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface NaverShoppingResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

const categoryKeywords: Record<DealCategory, string[]> = {
  "식품": ["식품 특가", "간편식 할인"],
  "전자기기": ["전자기기 특가", "이어폰 할인"],
  "생활용품": ["생활용품 특가", "세제 할인"],
  "의류": ["의류 특가", "운동화 할인"],
  "육아": ["육아용품 특가", "분유 할인"],
  "여행/티켓": ["여행 티켓 특가", "공연 티켓 할인"],
  "뷰티": ["뷰티 특가", "화장품 할인"],
  "가전": ["가전 특가", "청소기 할인"],
  "기타": ["쇼핑 특가", "오늘만 할인"]
};

const liveTags = ["실시간", "가격비교", "공식API"];

function cleanTitle(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

function toNumber(value: string | number | undefined, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function stableScore(value: string) {
  let score = 0;

  for (let index = 0; index < value.length; index += 1) {
    score += value.charCodeAt(index);
  }

  return score;
}

function inferCategory(item: NaverShoppingItem): DealCategory {
  const text = [item.title, item.category1, item.category2, item.category3, item.category4].join(" ");

  if (/식품|쌀|고기|과일|간편식|커피|음료|과자|라면/.test(text)) return "식품";
  if (/디지털|컴퓨터|모바일|이어폰|노트북|태블릿|카메라|게임/.test(text)) return "전자기기";
  if (/생활|주방|수납|침구|가구|세제|화장지|물티슈/.test(text)) return "생활용품";
  if (/패션|의류|신발|가방|스포츠|아우터|티셔츠/.test(text)) return "의류";
  if (/출산|육아|유아|분유|기저귀|장난감/.test(text)) return "육아";
  if (/여행|티켓|항공|숙박|공연|전시/.test(text)) return "여행/티켓";
  if (/화장품|뷰티|스킨|크림|선크림|향수|헤어/.test(text)) return "뷰티";
  if (/가전|TV|냉장고|청소기|공기청정기|세탁기|에어컨/.test(text)) return "가전";

  return "기타";
}

function estimateOriginalPrice(item: NaverShoppingItem, salePrice: number) {
  const highPrice = toNumber(item.hprice);

  if (highPrice > salePrice) {
    return highPrice;
  }

  const score = stableScore(item.productId || item.link || item.title);
  const estimatedRate = 10 + (score % 26);
  return Math.round((salePrice / (1 - estimatedRate / 100)) / 10) * 10;
}

function normalizeNaverItem(item: NaverShoppingItem, index: number): Deal {
  const salePrice = toNumber(item.lprice, 1000);
  const originalPrice = Math.max(estimateOriginalPrice(item, salePrice), salePrice);
  const discountAmount = Math.max(0, originalPrice - salePrice);
  const discountRate = originalPrice > salePrice ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const now = Date.now();
  const score = stableScore(item.productId || item.link || `${item.title}-${index}`);

  return {
    id: `naver-${item.productId || score}`,
    mall: item.mallName || "네이버쇼핑",
    title: cleanTitle(item.title),
    category: inferCategory(item),
    originalPrice,
    salePrice,
    discountRate,
    discountAmount,
    imageUrl: item.image,
    link: item.link,
    source: "naver_shopping",
    expiresAt: new Date(now + (6 + (score % 42)) * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now - (index + 1) * 12 * 60 * 1000).toISOString(),
    isHot: discountRate >= 25 || score % 5 === 0,
    isNew: index < 8,
    isEndingSoon: score % 7 === 0,
    tags: discountRate >= 30 ? [...liveTags, "핫딜"] : liveTags,
    popularityScore: Math.min(99, 62 + (score % 38))
  };
}

function getLiveKeywords(category?: string, q?: string) {
  if (q?.trim()) return [q.trim()];
  if (category && category !== "전체" && categories.includes(category as (typeof categories)[number])) {
    return categoryKeywords[category as DealCategory] ?? ["특가 할인"];
  }

  return (process.env.DEAL_LIVE_KEYWORDS ?? "특가 할인,오늘만 특가,쿠폰 할인")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function fetchNaverShopping(keyword: string, display = 12) {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return [];

  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret
    },
    next: { revalidate: 180 }
  });

  if (!response.ok) {
    throw new Error(`Naver shopping API failed: ${response.status}`);
  }

  const data = (await response.json()) as NaverShoppingResponse;
  return data.items.map(normalizeNaverItem);
}

async function fetchJsonFeed(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 180 }
  });

  if (!response.ok) {
    throw new Error(`Partner feed failed: ${response.status}`);
  }

  const data = (await response.json()) as Deal[] | { deals?: Deal[] };
  return Array.isArray(data) ? data : data.deals ?? [];
}

export async function fetchLiveDeals(options: { category?: string; q?: string } = {}) {
  const feedUrls = (process.env.DEAL_FEED_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const keywords = getLiveKeywords(options.category, options.q);
  const settled = await Promise.allSettled([
    ...keywords.map((keyword) => fetchNaverShopping(keyword)),
    ...feedUrls.map((url) => fetchJsonFeed(url))
  ]);

  const deals = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const unique = new Map<string, Deal>();

  for (const deal of deals) {
    if (deal.id && deal.title && deal.salePrice > 0) {
      unique.set(deal.id, deal);
    }
  }

  return Array.from(unique.values());
}
