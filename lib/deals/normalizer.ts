import { Deal, DealCategory } from "@/types/deal";
import { buildSellerSearchUrl } from "@/lib/affiliate";
import { buildBenefitSummary, inferDealBenefitType } from "@/lib/deals/benefits";
import { validatePurchaseLink } from "@/lib/deals/linkValidator";

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
  productUrl?: string;
  searchUrl?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  purchaseUrl?: string;
  finalUrl?: string;
  finalPurchaseUrl?: string;
  linkVerified?: boolean;
  purchaseLinkVerified?: boolean;
  checkedAt?: string;
  purchaseConfidence?: number;
  sourceUrl?: string;
  sourceName?: string;
  shipping?: string;
  shippingInfo?: string;
  createdAt?: string;
  expireAt?: string;
  expiresAt?: string;
  tags?: string[];
};

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
  const rawLink = input.productUrl ?? input.purchaseUrl ?? input.url ?? input.link;
  const priceCheckedAt = input.priceCheckedAt ?? input.verifiedAt ?? createdAt;
  const linkValidation = validatePurchaseLink({
    url: rawLink,
    fallbackUrl: buildSellerSearchUrl({ mall: mallName, mallName, title: input.title }),
    mallName,
    title: input.title,
    linkStatus: input.linkStatus,
    linkType: input.linkType,
    checkedAt: input.checkedAt ?? input.verifiedAt ?? priceCheckedAt
  });
  const link = input.finalPurchaseUrl ?? input.finalUrl ?? linkValidation.finalPurchaseUrl;
  const linkStatus = input.linkStatus ?? linkValidation.linkStatus;
  const linkType = input.linkType ?? linkValidation.linkType;
  const linkVerified = input.linkVerified ?? linkValidation.linkVerified;
  const purchaseConfidence = input.purchaseConfidence ?? linkValidation.purchaseConfidence;
  const dealType = input.dealType ?? inferDealBenefitType({ title: input.title, category: input.category, tags, shipping, salePrice: input.salePrice, originalPrice: input.originalPrice, discountRate });
  const isExpired = input.isExpired ?? new Date(expireAt).getTime() <= Date.now();
  const reliabilityScore = input.reliabilityScore ?? Math.min(100, Math.round(purchaseConfidence + (linkVerified ? 8 : 0) + ((input.popularityScore ?? 0) >= 85 ? 3 : 0)));

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? `${mallName}에서 확인된 ${input.title} 특가입니다.`,
    price: input.price ?? input.salePrice,
    originalPrice: input.originalPrice,
    salePrice: input.salePrice,
    discountRate,
    mallName,
    subCategory: input.subCategory ?? tags[0],
    category: input.category ?? "기타",
    thumbnail,
    link,
    url: input.url ?? link,
    productUrl: input.productUrl ?? (linkValidation.linkVerified ? linkValidation.finalPurchaseUrl : ""),
    verifiedProductUrl: input.verifiedProductUrl ?? (linkValidation.linkVerified ? linkValidation.finalPurchaseUrl : ""),
    searchUrl: input.searchUrl ?? (!linkValidation.linkVerified ? linkValidation.finalPurchaseUrl : ""),
    originalUrl: input.originalUrl ?? input.link,
    affiliateUrl: input.affiliateUrl,
    purchaseUrl: input.purchaseUrl ?? link,
    finalUrl: input.finalUrl ?? linkValidation.finalUrl,
    finalPurchaseUrl: input.finalPurchaseUrl ?? linkValidation.finalPurchaseUrl,
    linkType,
    linkStatus,
    linkLabel: input.linkLabel ?? (linkStatus === "verified" ? "구매 페이지 확인" : "판매처 검색으로 확인"),
    linkVerified,
    checkedAt: input.checkedAt ?? linkValidation.checkedAt,
    purchaseConfidence,
    purchaseStatus: linkStatus === "verified" ? "available" : linkStatus,
    purchaseLinkVerified: input.purchaseLinkVerified ?? linkValidation.purchaseLinkVerified,
    verifiedAt: linkStatus === "verified" ? (input.verifiedAt ?? priceCheckedAt) : undefined,
    lastVerifiedAt: input.lastVerifiedAt ?? (linkStatus === "verified" ? (input.verifiedAt ?? priceCheckedAt) : undefined),
    priceCheckedAt,
    dealType,
    benefitSummary: input.benefitSummary ?? buildBenefitSummary({ title: input.title, category: input.category, tags, shipping, salePrice: input.salePrice, originalPrice: input.originalPrice, discountRate }, dealType),
    reliabilityScore,
    isVerified: input.isVerified ?? linkVerified,
    isExpired,
    savingsAmount: input.savingsAmount ?? discountAmount,
    savingsRate: input.savingsRate ?? discountRate,
    shipping,
    createdAt,
    expireAt,
    tags,
    isHot: input.isHot ?? false,
    isFreeShipping,
    discountAmount,
    source,
    sourceUrl: input.sourceUrl,
    sourceName: input.sourceName,
    notice: input.notice ?? "가격, 재고, 쿠폰, 배송 조건은 판매처에서 최종 확인하세요.",
    isNew: input.isNew ?? false,
    isEndingSoon: input.isEndingSoon ?? new Date(expireAt).getTime() - Date.now() < 6 * 60 * 60 * 1000,
    popularityScore: input.popularityScore ?? 0,
    clickCount: input.clickCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 13)),
    likeCount: input.likeCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 3.2)),
    viewCount: input.viewCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 21)),
    reportCount: input.reportCount ?? (linkStatus === "verified" ? 0 : 1),
    isSoldOut: input.isSoldOut ?? linkStatus === "sold_out",
    updatedAt: input.updatedAt ?? priceCheckedAt,
    mall: mallName,
    imageUrl: thumbnail,
    shippingInfo: shipping,
    expiresAt: expireAt
  };
}

export function normalizeDeals(items: DealInput[], source?: string) {
  return items.map((item) => normalizeDeal(item, source));
}
