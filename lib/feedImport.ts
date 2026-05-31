import { categories } from "@/data/mockDeals";
import { normalizeDeal } from "@/lib/deals/normalizer";
import { Deal, DealCategory } from "@/types/deal";

export interface PartnerFeedItem {
  externalId?: string;
  mall?: string;
  title?: string;
  category?: string;
  originalPrice?: number;
  salePrice?: number;
  imageUrl?: string;
  link?: string;
  productUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  finalPurchaseUrl?: string;
  searchUrl?: string;
  originalUrl?: string;
  shipping?: string;
  expiresAt?: string;
  tags?: string[];
}

export interface FeedImportIssue {
  index: number;
  field: string;
  message: string;
}

const allowedCategories = new Set<string>(categories.filter((category) => category !== "전체"));

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPlaceholderOrCommunityUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const communityHosts = [
      "ppomppu.co.kr",
      "fmkorea.com",
      "quasarzone.com",
      "algumon.com",
      "clien.net",
      "ruliweb.com",
      "dcinside.com",
      "theqoo.net",
      "instiz.net",
      "coolenjoy.net"
    ];

    return (
      host === "example.com" ||
      host.endsWith(".example.com") ||
      communityHosts.some((communityHost) => host === communityHost || host.endsWith(`.${communityHost}`) || host.includes(communityHost))
    );
  } catch {
    return true;
  }
}

function normalizeCategory(category?: string): DealCategory {
  return allowedCategories.has(category ?? "") ? (category as DealCategory) : "기타";
}

function getPrimaryPurchaseUrl(item: PartnerFeedItem) {
  return (
    item.affiliateUrl?.trim() ||
    item.finalPurchaseUrl?.trim() ||
    item.productUrl?.trim() ||
    item.purchaseUrl?.trim() ||
    item.link?.trim() ||
    item.originalUrl?.trim() ||
    item.searchUrl?.trim() ||
    ""
  );
}

function validateUrlField(issues: FeedImportIssue[], item: PartnerFeedItem, index: number, field: keyof PartnerFeedItem) {
  const value = item[field];
  if (typeof value !== "string" || !value.trim()) return;

  if (!isValidUrl(value)) {
    issues.push({ index, field: String(field), message: "유효한 http/https URL이 필요합니다." });
  } else if (isPlaceholderOrCommunityUrl(value)) {
    issues.push({ index, field: String(field), message: "placeholder 또는 커뮤니티 게시글 링크는 운영 피드로 등록할 수 없습니다." });
  }
}

export function validatePartnerFeed(items: PartnerFeedItem[]) {
  const issues: FeedImportIssue[] = [];

  items.forEach((item, index) => {
    const primaryUrl = getPrimaryPurchaseUrl(item);

    if (!item.externalId?.trim()) issues.push({ index, field: "externalId", message: "외부 ID가 필요합니다." });
    if (!item.mall?.trim()) issues.push({ index, field: "mall", message: "쇼핑몰명이 필요합니다." });
    if (!item.title?.trim()) issues.push({ index, field: "title", message: "상품명이 필요합니다." });
    if (!primaryUrl) {
      issues.push({ index, field: "productUrl", message: "구매 상세 URL 또는 검색 fallback URL이 필요합니다." });
    }
    (["affiliateUrl", "finalPurchaseUrl", "productUrl", "purchaseUrl", "link", "originalUrl", "searchUrl"] as const).forEach((field) => {
      validateUrlField(issues, item, index, field);
    });
    if (!Number.isFinite(item.originalPrice) || Number(item.originalPrice) <= 0) {
      issues.push({ index, field: "originalPrice", message: "정상 원가가 필요합니다." });
    }
    if (!Number.isFinite(item.salePrice) || Number(item.salePrice) <= 0) {
      issues.push({ index, field: "salePrice", message: "정상 할인가가 필요합니다." });
    }
    if (Number(item.salePrice) > Number(item.originalPrice)) {
      issues.push({ index, field: "salePrice", message: "할인가가 원가보다 높을 수 없습니다." });
    }
    if (item.expiresAt && Number.isNaN(new Date(item.expiresAt).getTime())) {
      issues.push({ index, field: "expiresAt", message: "마감 시간이 ISO 날짜 형식이 아닙니다." });
    }
  });

  return issues;
}

export function normalizePartnerFeed(items: PartnerFeedItem[], source = "partner_feed") {
  const now = new Date().toISOString();

  return items.map((item) => {
    const originalPrice = Number(item.originalPrice);
    const salePrice = Number(item.salePrice);
    const discountAmount = Math.max(0, originalPrice - salePrice);
    const discountRate = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 6) : [];
    const mall = item.mall!.trim();
    const title = item.title!.trim();
    const primaryUrl = getPrimaryPurchaseUrl(item);
    const searchUrl = item.searchUrl ?? item.link;
    const shipping = item.shipping ?? (tags.some((tag) => /무료배송|무배/.test(tag)) ? "무료배송" : "판매처 조건 확인");

    return normalizeDeal({
      id: `${source}-${item.externalId}`,
      mallName: mall,
      title,
      category: normalizeCategory(item.category),
      originalPrice,
      salePrice,
      discountRate,
      discountAmount,
      thumbnail: item.imageUrl ?? "",
      link: primaryUrl,
      url: item.link ?? primaryUrl,
      productUrl: item.productUrl,
      purchaseUrl: item.purchaseUrl,
      affiliateUrl: item.affiliateUrl,
      finalPurchaseUrl: item.finalPurchaseUrl,
      searchUrl,
      originalUrl: item.originalUrl ?? item.link ?? primaryUrl,
      source,
      shipping,
      description: `${mall} 파트너 피드에서 수신한 ${title} 특가입니다. 원가, 할인가, 배송 조건을 함께 확인하세요.`,
      notice: "파트너 피드 정보는 판매처 사정에 따라 변경될 수 있습니다. 구매 전 판매처의 최종 가격과 옵션 조건을 확인하세요.",
      expireAt: item.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isHot: discountRate >= 40,
      isNew: true,
      isEndingSoon: item.expiresAt ? new Date(item.expiresAt).getTime() - Date.now() < 6 * 60 * 60 * 1000 : false,
      createdAt: now,
      tags,
      popularityScore: Math.min(99, 50 + discountRate + tags.length * 2)
    }, source) satisfies Deal;
  });
}

export function dryRunPartnerFeedImport(items: PartnerFeedItem[], source = "partner_feed") {
  const issues = validatePartnerFeed(items);
  const validIndexes = new Set(
    items
      .map((_, index) => index)
      .filter((index) => !issues.some((issue) => issue.index === index))
  );
  const validItems = items.filter((_, index) => validIndexes.has(index));
  const normalizedDeals = normalizePartnerFeed(validItems, source);
  const verified = normalizedDeals.filter((deal) => deal.linkVerified).length;

  return {
    ok: issues.length === 0,
    source,
    received: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length,
    issues,
    linkSummary: {
      verified,
      needsReview: normalizedDeals.length - verified
    },
    previewDeals: normalizedDeals.slice(0, 10)
  };
}

export const samplePartnerFeed: PartnerFeedItem[] = [
  {
    externalId: "partner-001",
    mall: "파트너몰",
    title: "프리미엄 즉석밥 24개입",
    category: "식품",
    originalPrice: 39800,
    salePrice: 24900,
    productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    searchUrl: "https://search.shopping.naver.com/search/all?query=%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%EC%A6%89%EC%84%9D%EB%B0%A5%2024%EA%B0%9C%EC%9E%85",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    tags: ["무료배송", "쿠폰적용"]
  },
  {
    externalId: "partner-002",
    mall: "파트너몰",
    title: "무선 청소기 주말 특가",
    category: "가전",
    originalPrice: 259000,
    salePrice: 159000,
    productUrl: "https://www.coupang.com/vp/products/7999681537",
    searchUrl: "https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%84%A0%20%EC%B2%AD%EC%86%8C%EA%B8%B0%20%EC%A3%BC%EB%A7%90%20%ED%8A%B9%EA%B0%80",
    tags: ["카드할인", "한정수량"]
  }
];
