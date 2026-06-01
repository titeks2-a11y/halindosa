import { categories } from "@/data/mockDeals";
import { normalizeDeal } from "@/lib/deals/normalizer";
import { Deal, DealBenefitType, DealCategory } from "@/types/deal";

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
  sourceName?: string;
  sourceUrl?: string;
  dealType?: DealBenefitType;
  benefitSummary?: string;
  shipping?: string;
  shippingFee?: string;
  expiresAt?: string;
  isFirstComeFirstServed?: boolean;
  requiresSignup?: boolean;
  couponCondition?: string;
  minimumOrderAmount?: number;
  isStackable?: boolean;
  eligibilityChecklist?: string[];
  claimSteps?: string[];
  claimWarning?: string;
  tags?: string[];
}

export interface FeedImportIssue {
  index: number;
  field: string;
  message: string;
}

const allowedCategories = new Set<string>(categories.filter((category) => category !== "전체"));
const allowedBenefitTypes = new Set<DealBenefitType>([
  "discount",
  "freebie",
  "coupon",
  "freeShipping",
  "experience",
  "event",
  "point",
  "convenienceStore",
  "mart",
  "foodDelivery"
]);

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
    if (item.dealType && !allowedBenefitTypes.has(item.dealType)) {
      issues.push({ index, field: "dealType", message: "지원하는 혜택 유형이 아닙니다." });
    }
    if (!primaryUrl) {
      issues.push({ index, field: "productUrl", message: "구매 상세 URL 또는 검색 fallback URL이 필요합니다." });
    }
    (["affiliateUrl", "finalPurchaseUrl", "productUrl", "purchaseUrl", "link", "originalUrl", "searchUrl", "sourceUrl"] as const).forEach((field) => {
      validateUrlField(issues, item, index, field);
    });
    if (!item.sourceName?.trim()) {
      issues.push({ index, field: "sourceName", message: "운영 출처명이 필요합니다." });
    }
    if (!item.sourceUrl?.trim()) {
      issues.push({ index, field: "sourceUrl", message: "운영 출처 URL이 필요합니다." });
    }
    if (item.dealType && ["coupon", "foodDelivery", "point"].includes(item.dealType) && !item.couponCondition?.trim()) {
      issues.push({ index, field: "couponCondition", message: "쿠폰/포인트/배달 혜택은 조건 설명이 필요합니다." });
    }
    if (item.dealType && ["freebie", "experience"].includes(item.dealType) && !item.benefitSummary?.trim()) {
      issues.push({ index, field: "benefitSummary", message: "무료/체험 혜택은 혜택 요약이 필요합니다." });
    }
    if (item.minimumOrderAmount !== undefined && (!Number.isFinite(item.minimumOrderAmount) || Number(item.minimumOrderAmount) < 0)) {
      issues.push({ index, field: "minimumOrderAmount", message: "최소 주문 금액은 0 이상의 숫자여야 합니다." });
    }
    if (item.eligibilityChecklist && item.eligibilityChecklist.length < 3) {
      issues.push({ index, field: "eligibilityChecklist", message: "수령 전 체크리스트는 3개 이상 권장됩니다." });
    }
    if (item.claimSteps && item.claimSteps.length < 2) {
      issues.push({ index, field: "claimSteps", message: "수령 단계는 2개 이상 권장됩니다." });
    }
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
      sourceName: item.sourceName ?? mall,
      sourceUrl: item.sourceUrl ?? item.productUrl ?? primaryUrl,
      source,
      shipping,
      shippingFee: item.shippingFee,
      dealType: item.dealType,
      benefitSummary: item.benefitSummary,
      isFirstComeFirstServed: item.isFirstComeFirstServed,
      requiresSignup: item.requiresSignup,
      couponCondition: item.couponCondition,
      minimumOrderAmount: item.minimumOrderAmount,
      isStackable: item.isStackable,
      eligibilityChecklist: item.eligibilityChecklist,
      claimSteps: item.claimSteps,
      claimWarning: item.claimWarning,
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
  const conditionReady = normalizedDeals.filter(
    (deal) =>
      Boolean(deal.sourceName && deal.sourceUrl) &&
      Boolean(deal.shippingFee || deal.shipping) &&
      typeof deal.requiresSignup === "boolean" &&
      typeof deal.isFirstComeFirstServed === "boolean" &&
      Array.isArray(deal.eligibilityChecklist) &&
      deal.eligibilityChecklist.length >= 3 &&
      Array.isArray(deal.claimSteps) &&
      deal.claimSteps.length >= 2 &&
      Boolean(deal.claimWarning)
  ).length;

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
    benefitSummary: {
      conditionReady,
      conditionNeedsReview: normalizedDeals.length - conditionReady,
      conditionReadyRate: normalizedDeals.length ? Math.round((conditionReady / normalizedDeals.length) * 100) : 0
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
    sourceName: "파트너몰 공식 피드",
    sourceUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    dealType: "freeShipping",
    benefitSummary: "즉석밥 24개입 무료배송 특가",
    productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    searchUrl: "https://search.shopping.naver.com/search/all?query=%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84%20%EC%A6%89%EC%84%9D%EB%B0%A5%2024%EA%B0%9C%EC%9E%85",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: false,
    eligibilityChecklist: ["판매처 상품 상세 확인", "옵션과 수량 확인", "무료배송 적용 여부 확인"],
    claimSteps: ["상품 상세로 이동", "쿠폰/배송 조건 확인", "최종 결제 전 가격 확인"],
    claimWarning: "행사 수량과 배송 조건은 판매처에서 변경될 수 있습니다.",
    tags: ["무료배송", "쿠폰적용"]
  },
  {
    externalId: "partner-002",
    mall: "파트너몰",
    title: "무선 청소기 주말 특가",
    category: "가전",
    originalPrice: 259000,
    salePrice: 159000,
    sourceName: "파트너몰 공식 피드",
    sourceUrl: "https://www.coupang.com/vp/products/7999681537",
    dealType: "discount",
    benefitSummary: "무선 청소기 주말 한정 할인",
    productUrl: "https://www.coupang.com/vp/products/7999681537",
    searchUrl: "https://search.shopping.naver.com/search/all?query=%EB%AC%B4%EC%84%A0%20%EC%B2%AD%EC%86%8C%EA%B8%B0%20%EC%A3%BC%EB%A7%90%20%ED%8A%B9%EA%B0%80",
    isFirstComeFirstServed: true,
    requiresSignup: false,
    eligibilityChecklist: ["판매처 상품 상세 확인", "카드 할인 적용 여부 확인", "배송 예정일 확인"],
    claimSteps: ["상품 상세로 이동", "카드/쿠폰 조건 확인", "최종 결제 전 가격 확인"],
    claimWarning: "한정수량 특가는 조기 종료될 수 있습니다.",
    tags: ["카드할인", "한정수량"]
  }
];
