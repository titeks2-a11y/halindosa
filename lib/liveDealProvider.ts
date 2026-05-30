import { categories } from "@/data/mockDeals";
import { normalizeDeal } from "@/lib/deals/normalizer";
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
  "편의점/마트": ["마트 특가", "편의점 쿠폰"],
  "쿠폰/이벤트": ["무료 쿠폰", "0원딜 이벤트"],
  "기타": ["쇼핑 특가", "오늘만 할인"]
};

const liveTags = ["실시간", "가격비교", "공식API"];
const boardTags = ["실시간", "핫딜", "할인도사픽"];

interface BoardDealSeed {
  no: string;
  url: string;
  rawTitle: string;
  boardCategory: string;
  dateLabel: string;
  views: number;
  imageUrl: string;
}

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

function inferCategoryFromText(text: string): DealCategory {
  if (/식품|건강|과자|라면|김치|물|우유|고기|목살|새우깡|생수|음료|커피|밥|쌀/.test(text)) return "식품";
  if (/디지털|컴퓨터|모바일|이어폰|노트북|태블릿|카메라|게임|모니터|SSD|충전기/.test(text)) return "전자기기";
  if (/생활|주방|수납|침구|침대|패드|세제|화장지|물티슈|청소|샴푸/.test(text)) return "생활용품";
  if (/의류|잡화|패션|팬츠|티셔츠|신발|벨트|가방|아우터|조거/.test(text)) return "의류";
  if (/육아|유아|분유|기저귀|키즈|장난감/.test(text)) return "육아";
  if (/여행|티켓|항공|숙박|공연|전시|호텔/.test(text)) return "여행/티켓";
  if (/뷰티|화장품|크림|선크림|향수|헤어|드라이기|미용/.test(text)) return "뷰티";
  if (/가전|TV|냉장고|청소기|공기청정기|세탁기|에어컨|선풍기|드라이기/.test(text)) return "가전";

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

function parseMallAndTitle(rawTitle: string) {
  const mallMatch = rawTitle.match(/^\[([^\]]+)\]\s*(.+)$/);

  if (!mallMatch) {
    return { mall: "할인도사", title: rawTitle.trim() };
  }

  return {
    mall: mallMatch[1].trim(),
    title: mallMatch[2].trim()
  };
}

function parsePrice(rawTitle: string) {
  const pattern = /([0-9][0-9,\.]*)\s*(?:원|\/|$)/g;
  const prices: number[] = [];
  let match = pattern.exec(rawTitle);

  while (match) {
    const price = Number(match[1].replace(/[,.]/g, ""));
    if (Number.isFinite(price) && price >= 100) {
      prices.push(price);
    }
    match = pattern.exec(rawTitle);
  }

  return prices[0] ?? 0;
}

function normalizeBoardImage(value: string) {
  if (!value || /noimage/i.test(value)) return "";
  const absoluteUrl = value.startsWith("//")
    ? `https:${value}`
    : value.startsWith("/")
      ? `https://www.ppomppu.co.kr${value}`
      : value;

  return `/api/image?url=${encodeURIComponent(absoluteUrl)}`;
}

function normalizeBoardDeal(seed: BoardDealSeed, index: number): Deal {
  const { mall, title } = parseMallAndTitle(seed.rawTitle);
  const salePrice = parsePrice(seed.rawTitle);
  const score = stableScore(seed.no || seed.rawTitle);
  const estimatedRate = 12 + (score % 34);
  const originalPrice = salePrice > 0 ? Math.round((salePrice / (1 - estimatedRate / 100)) / 10) * 10 : 0;
  const discountAmount = Math.max(0, originalPrice - salePrice);
  const discountRate = originalPrice > salePrice ? Math.round((discountAmount / originalPrice) * 100) : estimatedRate;
  const createdAt = new Date(Date.now() - index * 5 * 60 * 1000).toISOString();
  const expiresInHours = 5 + (score % 36);
  const category = inferCategoryFromText(`${seed.boardCategory} ${seed.rawTitle}`);
  const shippingInfo = /무료배송|무배|네멤무료|배송/.test(seed.rawTitle) ? "무료배송 또는 배송 혜택 포함" : "판매처 조건 확인";

  return normalizeDeal({
    id: `live-board-${seed.no}`,
    mallName: mall,
    title,
    category,
    originalPrice,
    salePrice,
    discountRate,
    discountAmount,
    thumbnail: normalizeBoardImage(seed.imageUrl),
    link: seed.url,
    source: "halindosa_live",
    shipping: shippingInfo,
    description: `${mall}에서 확인된 실시간 특가입니다. 가격, 혜택, 배송 조건을 함께 비교해 볼 만한 정보입니다.`,
    notice: "실시간 특가 정보는 판매처 조건 변경이 빠를 수 있습니다. 구매 전 판매처 상세 페이지에서 최종 가격과 혜택을 확인하세요.",
    expireAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
    createdAt,
    isHot: seed.views >= 2000 || discountRate >= 25,
    isNew: index < 12,
    isEndingSoon: expiresInHours <= 8 || score % 6 === 0,
    tags: seed.views >= 5000 ? [...boardTags, "인기"] : boardTags,
    popularityScore: Math.min(99, 55 + Math.floor(seed.views / 350) + (score % 18))
  }, "halindosa_live");
}

function normalizeNaverItem(item: NaverShoppingItem, index: number): Deal {
  const salePrice = toNumber(item.lprice, 1000);
  const originalPrice = Math.max(estimateOriginalPrice(item, salePrice), salePrice);
  const discountAmount = Math.max(0, originalPrice - salePrice);
  const discountRate = originalPrice > salePrice ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const now = Date.now();
  const score = stableScore(item.productId || item.link || `${item.title}-${index}`);
  const cleanItemTitle = cleanTitle(item.title);

  return normalizeDeal({
    id: `naver-${item.productId || score}`,
    mallName: item.mallName || "네이버쇼핑",
    title: cleanItemTitle,
    category: inferCategory(item),
    originalPrice,
    salePrice,
    discountRate,
    discountAmount,
    thumbnail: item.image,
    link: item.link,
    source: "naver_shopping",
    shipping: "판매처 조건 확인",
    description: `${item.mallName || "네이버쇼핑"}에서 검색된 ${cleanItemTitle} 가격 비교 특가입니다. 할인율과 판매처 조건을 함께 확인하세요.`,
    notice: "네이버쇼핑 검색 결과는 판매처별 조건이 다를 수 있습니다. 결제 전 배송비, 쿠폰, 옵션가를 확인하세요.",
    expireAt: new Date(now + (6 + (score % 42)) * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now - (index + 1) * 12 * 60 * 1000).toISOString(),
    isHot: discountRate >= 25 || score % 5 === 0,
    isNew: index < 8,
    isEndingSoon: score % 7 === 0,
    tags: discountRate >= 30 ? [...liveTags, "핫딜"] : liveTags,
    popularityScore: Math.min(99, 62 + (score % 38))
  }, "naver_shopping");
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

async function fetchPublicBoardDeals() {
  if (process.env.DEAL_PUBLIC_BOARD_ENABLE === "false") return [];

  const response = await fetch("https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Halindosa/1.0; +https://halindosa.local)",
      Accept: "text/html,application/xhtml+xml"
    },
    next: { revalidate: 120 }
  });

  if (!response.ok) {
    throw new Error(`Live board failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("euc-kr").decode(buffer);
  const itemPattern =
    /<tr[^>]*class="baseList[^"]*"[\s\S]*?<td class="baseList-space baseList-numb"[^>]*>(\d+)<\/td>[\s\S]*?<img src="([^"]*)"[\s\S]*?<a class='baseList-title' href="([^"]+)"[\s\S]*?<span>([\s\S]*?)<\/span><\/a>[\s\S]*?<small class="baseList-small">\[([^\]]+)\]<\/small>[\s\S]*?title="([^"]+)"[\s\S]*?<td class='baseList-space baseList-views' colspan=2>([^<]+)<\/td>/g;
  const seeds: BoardDealSeed[] = [];

  let match = itemPattern.exec(html);

  while (match) {
    const [, no, imageUrl, url, rawTitle, boardCategory, dateLabel, views] = match;

    seeds.push({
      no,
      imageUrl,
      url: new URL(url.replaceAll("&amp;", "&"), "https://www.ppomppu.co.kr/zboard/").toString(),
      rawTitle: cleanTitle(rawTitle),
      boardCategory,
      dateLabel,
      views: Number(views.replace(/[^0-9]/g, "")) || 0
    });

    match = itemPattern.exec(html);
  }

  return seeds.slice(0, 24).map(normalizeBoardDeal).filter((deal) => deal.salePrice > 0);
}

export async function fetchLiveDeals(options: { category?: string; q?: string } = {}) {
  const feedUrls = (process.env.DEAL_FEED_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const keywords = getLiveKeywords(options.category, options.q);
  const settled = await Promise.allSettled([
    fetchPublicBoardDeals(),
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
