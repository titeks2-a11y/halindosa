import { Deal, DealCategory } from "@/types/deal";

export type DealInput = Partial<Deal> & {
  id: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discountRate?: number;
  mallName?: string;
  mall?: string;
  category?: DealCategory;
  thumbnail?: string;
  imageUrl?: string;
  link: string;
  url?: string;
  affiliateUrl?: string;
  purchaseUrl?: string;
  shipping?: string;
  shippingInfo?: string;
  createdAt?: string;
  expireAt?: string;
  expiresAt?: string;
  tags?: string[];
};

function isUnsafeOrCommunityLink(value?: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host.includes("ppomppu.co.kr") || host === "example.com" || host.endsWith(".example.com");
  } catch {
    return true;
  }
}

function buildSellerSearchUrl(mallName: string, title: string) {
  const mall = mallName.toLowerCase();
  const query = encodeURIComponent(title);

  if (/쿠팡|coupang/.test(mall)) return `https://www.coupang.com/np/search?q=${query}`;
  if (/g마켓|지마켓|gmarket/.test(mall)) return `https://browse.gmarket.co.kr/search?keyword=${query}`;
  if (/11번가|11st/.test(mall)) return `https://search.11st.co.kr/Search.tmall?kwd=${query}`;
  if (/옥션|auction/.test(mall)) return `https://browse.auction.co.kr/search?keyword=${query}`;
  if (/ssg|쓱|이마트/.test(mall)) return `https://www.ssg.com/search.ssg?target=all&query=${query}`;
  if (/올리브영|olive/.test(mall)) return `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${query}`;
  if (/무신사|musinsa/.test(mall)) return `https://www.musinsa.com/search/goods?keyword=${query}`;
  if (/알리|ali/.test(mall)) return `https://ko.aliexpress.com/w/wholesale-${query}.html`;
  if (/네이버|naver/.test(mall)) return `https://search.shopping.naver.com/search/all?query=${query}`;

  return `https://search.shopping.naver.com/search/all?query=${query}`;
}

export function normalizeDeal(input: DealInput, source = input.source ?? "mock"): Deal {
  const mallName = input.mallName ?? input.mall ?? "할인도사";
  const thumbnail = input.thumbnail ?? input.imageUrl ?? "";
  const shipping = input.shipping ?? input.shippingInfo ?? "판매처 조건 확인";
  const expireAt = input.expireAt ?? input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const tags = input.tags ?? [];
  const discountAmount = input.discountAmount ?? Math.max(0, input.originalPrice - input.salePrice);
  const discountRate = input.discountRate ?? Math.round((discountAmount / Math.max(input.originalPrice, 1)) * 100);
  const isFreeShipping = input.isFreeShipping ?? /무료배송|무배|네멤무료|로켓프레시/.test([shipping, ...tags].join(" "));
  const rawLink = input.purchaseUrl ?? input.url ?? input.link;
  const needsReview = isUnsafeOrCommunityLink(rawLink);
  const link = needsReview ? buildSellerSearchUrl(mallName, input.title) : rawLink;
  const priceCheckedAt = input.priceCheckedAt ?? input.verifiedAt ?? createdAt;
  const linkStatus = input.linkStatus ?? (needsReview ? "needs_review" : "verified");
  const linkType = input.linkType ?? (needsReview ? "seller_search" : "direct_purchase");

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? `${mallName}에서 확인된 ${input.title} 특가입니다.`,
    originalPrice: input.originalPrice,
    salePrice: input.salePrice,
    discountRate,
    mallName,
    category: input.category ?? "기타",
    thumbnail,
    link,
    url: input.url ?? link,
    affiliateUrl: input.affiliateUrl,
    purchaseUrl: input.purchaseUrl ?? link,
    linkType,
    linkStatus,
    linkLabel: input.linkLabel ?? (linkStatus === "verified" ? "구매 페이지 확인" : "판매처 검색으로 확인"),
    verifiedAt: linkStatus === "verified" ? (input.verifiedAt ?? priceCheckedAt) : undefined,
    priceCheckedAt,
    shipping,
    createdAt,
    expireAt,
    tags,
    isHot: input.isHot ?? false,
    isFreeShipping,
    discountAmount,
    source,
    notice: input.notice ?? "가격, 재고, 쿠폰, 배송 조건은 판매처에서 최종 확인하세요.",
    isNew: input.isNew ?? false,
    isEndingSoon: input.isEndingSoon ?? new Date(expireAt).getTime() - Date.now() < 6 * 60 * 60 * 1000,
    popularityScore: input.popularityScore ?? 0,
    mall: mallName,
    imageUrl: thumbnail,
    shippingInfo: shipping,
    expiresAt: expireAt
  };
}

export function normalizeDeals(items: DealInput[], source?: string) {
  return items.map((item) => normalizeDeal(item, source));
}
