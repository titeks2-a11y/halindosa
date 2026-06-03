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
  finalUrl?: string;
  productUrl?: string;
  verifiedProductUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  eventUrl?: string;
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

export interface FeedImportRowSummary {
  index: number;
  externalId: string;
  mall: string;
  title: string;
  status: "ready" | "needs_fix";
  primaryUrlField: string;
  issueCount: number;
  issues: FeedImportIssue[];
}

export interface FeedImportFixReportRow {
  row: FeedImportRowSummary;
  item: PartnerFeedItem;
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
const productDetailPatterns = [
  /coupang\.com\/vp\/products\/\d+/i,
  /coupang\.com\/products\/\d+/i,
  /item\.gmarket\.co\.kr\/Item\?/i,
  /11st\.co\.kr\/products\/\d+/i,
  /ssg\.com\/item\/itemView\.ssg/i,
  /auction\.co\.kr\/item\/detailview\.aspx/i,
  /oliveyoung\.co\.kr\/store\/goods\/getGoodsDetail\.do/i,
  /kurly\.com\/goods\/\d+/i,
  /musinsa\.com\/products\/\d+/i,
  /ohou\.se\/productions\/\d+/i,
  /aliexpress\.[^/]+\/item\/\d+\.html/i,
  /smartstore\.naver\.com\/[^/]+\/products\/\d+/i,
  /e-himart\.co\.kr\/app\/goods\/goodsDetail/i
];

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
      "coolenjoy.net",
      "blog.naver.com",
      "m.blog.naver.com",
      "blog.daum.net",
      "tistory.com",
      "news.naver.com",
      "media.naver.com",
      "news.daum.net"
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

function isSearchOrHomeOnlyUrl(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    const query = url.search.toLowerCase();
    const target = `${url.hostname}${url.pathname}`.toLowerCase();

    return (
      path === "" ||
      path === "/" ||
      path === "/main" ||
      path === "/index" ||
      /\/search|\/np\/search|\/search\/all|browse\.gmarket\.co\.kr\/search|search\.11st\.co\.kr/i.test(target) ||
      query.includes("query=") ||
      query.includes("keyword=") ||
      query.includes("kwd=") ||
      query.includes("sword=")
    );
  } catch {
    return true;
  }
}

function looksLikeProductDetailUrl(value: string) {
  return productDetailPatterns.some((pattern) => pattern.test(value));
}

function looksLikeOfficialBenefitDetailUrl(value: string, item: PartnerFeedItem) {
  const benefitTypes: DealBenefitType[] = ["freebie", "coupon", "freeShipping", "experience", "event", "point", "convenienceStore", "mart", "foodDelivery"];
  const claimText = [
    item.benefitSummary,
    item.sourceName,
    ...(Array.isArray(item.eligibilityChecklist) ? item.eligibilityChecklist : []),
    ...(Array.isArray(item.claimSteps) ? item.claimSteps : [])
  ].join(" ");

  return (
    Boolean(item.dealType && benefitTypes.includes(item.dealType)) &&
    /무료|쿠폰|혜택|포인트|멤버십|행사|이벤트|체험|샘플|응모|적립|할인|1\+1|2\+1|배달/.test(claimText) &&
    /\/event|\/events|\/benefit|\/benefits|\/coupon|\/promotion|\/campaign|\/membership|\/member\/benefit|\/culture-event\/event|\/customer-engagement\/event\/detail|\/whats_new\/campaign/i.test(value)
  );
}

function normalizeCategory(category?: string): DealCategory {
  return allowedCategories.has(category ?? "") ? (category as DealCategory) : "기타";
}

function getPrimaryPurchaseUrl(item: PartnerFeedItem) {
  return (
    item.affiliateUrl?.trim() ||
    item.verifiedProductUrl?.trim() ||
    item.finalPurchaseUrl?.trim() ||
    item.finalUrl?.trim() ||
    item.productUrl?.trim() ||
    item.purchaseUrl?.trim() ||
    item.originalUrl?.trim() ||
    item.eventUrl?.trim() ||
    item.link?.trim() ||
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
  } else if (field !== "sourceUrl" && field !== "searchUrl" && isSearchOrHomeOnlyUrl(value)) {
    issues.push({ index, field: String(field), message: "검색 결과나 쇼핑몰 메인이 아니라 실제 상품/혜택 상세 URL이 필요합니다." });
  }
}

function validateImageUrl(issues: FeedImportIssue[], item: PartnerFeedItem, index: number) {
  const value = item.imageUrl?.trim() ?? "";

  if (!value) {
    issues.push({ index, field: "imageUrl", message: "실상품 이미지 URL이 필요합니다. 카테고리 fallback은 운영 노출 전 임시 보조 수단입니다." });
    return;
  }

  if (!isValidUrl(value)) {
    issues.push({ index, field: "imageUrl", message: "이미지 URL은 유효한 http/https URL이어야 합니다." });
  } else if (isPlaceholderOrCommunityUrl(value)) {
    issues.push({ index, field: "imageUrl", message: "placeholder 또는 커뮤니티 이미지 URL은 운영 피드 이미지로 사용할 수 없습니다." });
  }
}

export function validatePartnerFeed(items: PartnerFeedItem[]) {
  const issues: FeedImportIssue[] = [];
  const seenExternalIds = new Map<string, number>();
  const seenMallTitlePairs = new Map<string, number>();

  items.forEach((item, index) => {
    const primaryUrl = getPrimaryPurchaseUrl(item);
    const externalId = item.externalId?.trim() ?? "";
    const mall = item.mall?.trim() ?? "";
    const title = item.title?.trim() ?? "";
    const duplicateExternalIndex = externalId ? seenExternalIds.get(externalId) : undefined;
    const titleKey = `${mall}|${title}`.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
    const duplicateTitleIndex = mall && title ? seenMallTitlePairs.get(titleKey) : undefined;

    if (!externalId) issues.push({ index, field: "externalId", message: "외부 ID가 필요합니다." });
    if (duplicateExternalIndex !== undefined) {
      issues.push({ index, field: "externalId", message: `중복 외부 ID입니다. 먼저 나온 행: ${duplicateExternalIndex + 1}` });
    }
    if (externalId && duplicateExternalIndex === undefined) seenExternalIds.set(externalId, index);

    if (!mall) issues.push({ index, field: "mall", message: "쇼핑몰명이 필요합니다." });
    if (!title) issues.push({ index, field: "title", message: "상품명이 필요합니다." });
    if (duplicateTitleIndex !== undefined) {
      issues.push({ index, field: "title", message: `같은 판매처의 중복 상품명입니다. 먼저 나온 행: ${duplicateTitleIndex + 1}` });
    }
    if (mall && title && duplicateTitleIndex === undefined) seenMallTitlePairs.set(titleKey, index);

    if (item.dealType && !allowedBenefitTypes.has(item.dealType)) {
      issues.push({ index, field: "dealType", message: "지원하는 혜택 유형이 아닙니다." });
    }
    if (!primaryUrl) {
      issues.push({ index, field: "productUrl", message: "실제 상품/혜택 상세 URL이 필요합니다." });
    } else if (isValidUrl(primaryUrl) && isSearchOrHomeOnlyUrl(primaryUrl)) {
      issues.push({ index, field: "productUrl", message: "검색 결과 fallback은 운영 노출 전에 실제 상품/혜택 상세 URL로 보강해야 합니다." });
    } else if (isValidUrl(primaryUrl) && !looksLikeProductDetailUrl(primaryUrl) && !looksLikeOfficialBenefitDetailUrl(primaryUrl, item)) {
      issues.push({ index, field: "productUrl", message: "상품 상세 또는 공식 혜택 상세 URL 패턴이 확인되지 않아 운영 반영 전 수동 검수가 필요합니다." });
    }
    (["affiliateUrl", "verifiedProductUrl", "finalPurchaseUrl", "finalUrl", "productUrl", "purchaseUrl", "originalUrl", "eventUrl", "link", "searchUrl", "sourceUrl"] as const).forEach((field) => {
      validateUrlField(issues, item, index, field);
    });
    validateImageUrl(issues, item, index);
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

function buildRowSummary(items: PartnerFeedItem[], issues: FeedImportIssue[]): FeedImportRowSummary[] {
  return items.map((item, index) => {
    const rowIssues = issues.filter((issue) => issue.index === index);
    const primaryField = (["affiliateUrl", "verifiedProductUrl", "finalPurchaseUrl", "finalUrl", "productUrl", "purchaseUrl", "originalUrl", "eventUrl", "link", "searchUrl"] as const).find(
      (field) => typeof item[field] === "string" && item[field]?.trim()
    );

    return {
      index,
      externalId: item.externalId?.trim() ?? "",
      mall: item.mall?.trim() ?? "",
      title: item.title?.trim() ?? "",
      status: rowIssues.length ? "needs_fix" : "ready",
      primaryUrlField: primaryField ?? "",
      issueCount: rowIssues.length,
      issues: rowIssues
    };
  });
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
      verifiedProductUrl: item.verifiedProductUrl,
      purchaseUrl: item.purchaseUrl,
      affiliateUrl: item.affiliateUrl,
      finalUrl: item.finalUrl,
      finalPurchaseUrl: item.finalPurchaseUrl,
      eventUrl: item.eventUrl,
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
  const rows = buildRowSummary(items, issues);
  const needsFixItems = rows
    .filter((row) => row.status === "needs_fix")
    .map((row) => ({
      row,
      item: items[row.index]
    }));
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
  const imageReady = normalizedDeals.filter((deal) => Boolean(deal.thumbnail && /^https?:\/\//.test(deal.thumbnail))).length;

  return {
    ok: issues.length === 0,
    source,
    received: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length,
    readyRate: items.length ? Math.round((validItems.length / items.length) * 100) : 0,
    issues,
    rows,
    readyItems: validItems,
    needsFixItems,
    fixReport: {
      source,
      generatedAt: new Date().toISOString(),
      nextAction: needsFixItems.length
        ? "needs_fix 행의 productUrl/finalPurchaseUrl/affiliateUrl과 필수 조건을 보강한 뒤 다시 dry-run을 실행하세요."
        : "모든 행이 ready입니다. production feed doctor와 release doctor를 이어서 실행하세요.",
      rows: needsFixItems
    },
    linkSummary: {
      verified,
      needsReview: normalizedDeals.length - verified
    },
    benefitSummary: {
      conditionReady,
      conditionNeedsReview: normalizedDeals.length - conditionReady,
      conditionReadyRate: normalizedDeals.length ? Math.round((conditionReady / normalizedDeals.length) * 100) : 0
    },
    imageSummary: {
      imageReady,
      imageNeedsReview: normalizedDeals.length - imageReady,
      imageReadyRate: normalizedDeals.length ? Math.round((imageReady / normalizedDeals.length) * 100) : 0
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
    imageUrl: "https://gdimg.gmarket.co.kr/4076233103/still/600",
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
    imageUrl: "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2024/01/01/10/0/product.jpg",
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
  },
  {
    externalId: "partner-003",
    mall: "브랜드 공식몰",
    title: "커피 무료 쿠폰 선착순 이벤트",
    category: "쿠폰/이벤트",
    originalPrice: 4500,
    salePrice: 1,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567890.20260602120000.jpg",
    sourceName: "브랜드 공식 이벤트",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567890",
    dealType: "freebie",
    benefitSummary: "앱 가입 후 커피 무료 쿠폰 수령",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567890",
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: true,
    shippingFee: "배송 없음",
    eligibilityChecklist: ["신규 가입 대상 확인", "쿠폰 재고 확인", "사용 가능 매장 확인"],
    claimSteps: ["이벤트 상세로 이동", "가입 후 쿠폰 받기", "사용 전 유효기간 확인"],
    claimWarning: "선착순 쿠폰은 조기 소진될 수 있습니다.",
    tags: ["무료쿠폰", "선착순", "오늘만"]
  },
  {
    externalId: "partner-004",
    mall: "배달앱",
    title: "치킨 주문 5천원 할인 쿠폰",
    category: "쿠폰/이벤트",
    originalPrice: 20000,
    salePrice: 15000,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567891.20260602120000.jpg",
    sourceName: "배달앱 공식 쿠폰",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567891",
    dealType: "foodDelivery",
    benefitSummary: "치킨 카테고리 주문 시 5천원 쿠폰",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567891",
    expiresAt: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: false,
    requiresSignup: true,
    shippingFee: "배달비 별도",
    couponCondition: "치킨 카테고리 2만원 이상 주문",
    minimumOrderAmount: 20000,
    isStackable: false,
    eligibilityChecklist: ["대상 지역 확인", "최소 주문 금액 확인", "배달비 별도 여부 확인"],
    claimSteps: ["쿠폰 상세로 이동", "쿠폰 받기", "주문 전 적용 여부 확인"],
    claimWarning: "지역과 매장에 따라 쿠폰 적용이 제한될 수 있습니다.",
    tags: ["배달쿠폰", "오늘만", "회원혜택"]
  },
  {
    externalId: "partner-005",
    mall: "포인트 앱",
    title: "출석체크 1천 포인트 적립",
    category: "쿠폰/이벤트",
    originalPrice: 1000,
    salePrice: 1,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567892.20260602120000.jpg",
    sourceName: "포인트 앱 공식 이벤트",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567892",
    dealType: "point",
    benefitSummary: "출석체크 완료 시 포인트 적립",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567892",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: false,
    requiresSignup: true,
    shippingFee: "배송 없음",
    couponCondition: "앱 출석체크 참여",
    minimumOrderAmount: 0,
    isStackable: true,
    eligibilityChecklist: ["회원가입 필요 여부 확인", "일일 참여 가능 횟수 확인", "포인트 지급일 확인"],
    claimSteps: ["이벤트 상세로 이동", "출석체크 참여", "포인트 적립 내역 확인"],
    claimWarning: "포인트 지급 기준은 제공처 정책에 따라 달라질 수 있습니다.",
    tags: ["앱테크", "포인트", "출석체크"]
  },
  {
    externalId: "partner-006",
    mall: "편의점",
    title: "도시락 1+1 행사",
    category: "편의점/마트",
    originalPrice: 11000,
    salePrice: 5500,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567893.20260602120000.jpg",
    sourceName: "편의점 행사 피드",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567893",
    dealType: "convenienceStore",
    benefitSummary: "도시락 행사 상품 1+1",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567893",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: false,
    shippingFee: "매장 수령",
    eligibilityChecklist: ["행사 매장 확인", "대상 상품 확인", "재고 여부 확인"],
    claimSteps: ["행사 상세 확인", "가까운 매장 재고 확인", "결제 전 행사 적용 확인"],
    claimWarning: "매장별 재고와 행사 적용 여부가 다를 수 있습니다.",
    tags: ["1+1", "편의점", "마감임박"]
  },
  {
    externalId: "partner-007",
    mall: "마트",
    title: "대용량 생수 묶음 행사",
    category: "편의점/마트",
    originalPrice: 18000,
    salePrice: 9900,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567894.20260602120000.jpg",
    sourceName: "마트 공식 행사",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567894",
    dealType: "mart",
    benefitSummary: "생수 묶음 장보기 행사",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567894",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: false,
    requiresSignup: false,
    shippingFee: "배송비 조건 확인",
    eligibilityChecklist: ["배송 가능 지역 확인", "묶음 수량 확인", "장바구니 쿠폰 확인"],
    claimSteps: ["상품 상세로 이동", "배송비 조건 확인", "최종 결제 금액 확인"],
    claimWarning: "장보기 행사는 지역과 배송 슬롯에 따라 가격이 달라질 수 있습니다.",
    tags: ["마트행사", "장보기", "쿠폰적용"]
  },
  {
    externalId: "partner-008",
    mall: "체험단",
    title: "육아용품 무료 체험단 모집",
    category: "육아",
    originalPrice: 29900,
    salePrice: 1,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567895.20260602120000.jpg",
    sourceName: "브랜드 체험단 공식 모집",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567895",
    dealType: "experience",
    benefitSummary: "육아용품 무료 체험단 신청",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567895",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: true,
    shippingFee: "배송비 확인",
    eligibilityChecklist: ["모집 대상 확인", "리뷰 작성 조건 확인", "배송비 부담 여부 확인"],
    claimSteps: ["모집 상세로 이동", "체험단 신청", "선정 안내 확인"],
    claimWarning: "체험단은 선정형 혜택이며 신청해도 제공이 확정되지 않을 수 있습니다.",
    tags: ["체험단", "육아", "무료체험"]
  }
];
