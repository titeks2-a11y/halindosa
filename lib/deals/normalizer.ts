import { Deal, DealCategory } from "@/types/deal";
import { buildSellerSearchUrl } from "@/lib/affiliate";
import { buildBenefitSummary, inferDealBenefitType } from "@/lib/deals/benefits";
import { buildBenefitClaimGuide } from "@/lib/deals/claimGuide";
import { getDealImageType } from "@/lib/deals/imageResolver";
import { validatePurchaseLink } from "@/lib/deals/linkValidator";
import { getDealPriorityScore, getDealQualityScore, getDealValidationCode, resolveDealAvailability, resolveDealValidationStatus, shouldHideDeal } from "@/lib/deals/quality";
import { getGeneratedDealImageSrc } from "@/lib/imageSrc";
import {
  containsPolicyUnavailableText,
  isPolicyBlockedHost,
  isPolicyHomeOnlyUrl,
  isPolicyPlaceholderHost,
  isPolicySearchLikeUrl
} from "@/lib/deals/linkQualityPolicy";

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
  verifiedProductUrl?: string;
  searchUrl?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  eventUrl?: string;
  purchaseUrl?: string;
  finalUrl?: string;
  finalPurchaseUrl?: string;
  availability?: Deal["availability"];
  validationStatus?: Deal["validationStatus"];
  validationReason?: string;
  lastCheckedAt?: string;
  priorityScore?: number;
  qualityScore?: number;
  imageType?: Deal["imageType"];
  isHidden?: boolean;
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

function firstNonEmptyUrl(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value)) ?? "";
}

function sanitizePublicAuxiliaryUrl(value?: string) {
  if (!value?.trim()) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (isPolicyBlockedHost(host) || isPolicyPlaceholderHost(host)) return "";
    if (isPolicyHomeOnlyUrl(url) || isPolicySearchLikeUrl(url)) return "";

    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeDeal(input: DealInput, source = input.source ?? "mock"): Deal {
  const mallName = input.mallName ?? input.mall ?? "할인도사";
  const rawThumbnail = input.thumbnail ?? input.imageUrl ?? "";
  const shipping = input.shipping ?? input.shippingInfo ?? "판매처 조건 확인";
  const expireAt = input.expireAt ?? input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const tags = input.tags ?? [];
  const unavailableSignalText = [
    input.title,
    input.description,
    input.notice,
    input.benefitSummary,
    input.validationReason,
    ...tags
  ].join(" ");
  const hasUnavailableSignal = containsPolicyUnavailableText(unavailableSignalText);
  const discountAmount = input.discountAmount ?? Math.max(0, input.originalPrice - input.salePrice);
  const discountRate = input.discountRate ?? Math.round((discountAmount / Math.max(input.originalPrice, 1)) * 100);
  const isFreeShipping = input.isFreeShipping ?? /무료배송|무배|네멤무료|로켓프레시/.test([shipping, ...tags].join(" "));
  const rawLink = firstNonEmptyUrl(
    input.affiliateUrl,
    input.verifiedProductUrl,
    input.finalPurchaseUrl,
    input.finalUrl,
    input.productUrl,
    input.purchaseUrl,
    input.originalUrl,
    input.eventUrl,
    input.url,
    input.link,
    input.searchUrl
  );
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
  const link = firstNonEmptyUrl(input.affiliateUrl, input.finalPurchaseUrl, input.finalUrl, linkValidation.finalPurchaseUrl);
  const publicSearchUrl = sanitizePublicAuxiliaryUrl(input.searchUrl);
  const publicOriginalUrl = sanitizePublicAuxiliaryUrl(input.originalUrl ?? input.link);
  const publicSourceUrl = sanitizePublicAuxiliaryUrl(input.sourceUrl);
  const linkStatus = input.linkStatus ?? (hasUnavailableSignal ? "sold_out" : linkValidation.linkStatus);
  const linkType = input.linkType ?? linkValidation.linkType;
  const linkVerified = input.linkVerified ?? linkValidation.linkVerified;
  const purchaseConfidence = input.purchaseConfidence ?? linkValidation.purchaseConfidence;
  const category = input.category ?? "기타";
  const dealType = input.dealType ?? inferDealBenefitType({ title: input.title, category, tags, shipping, salePrice: input.salePrice, originalPrice: input.originalPrice, discountRate });
  const thumbnail = rawThumbnail || getGeneratedDealImageSrc(category, dealType);
  const isExpired = input.isExpired ?? new Date(expireAt).getTime() <= Date.now();
  const reliabilityScore = input.reliabilityScore ?? Math.min(100, Math.round(purchaseConfidence + (linkVerified ? 8 : 0) + ((input.popularityScore ?? 0) >= 85 ? 3 : 0)));
  const purchaseLinkVerified = input.purchaseLinkVerified ?? linkValidation.purchaseLinkVerified;
  const isSoldOut = input.isSoldOut ?? (hasUnavailableSignal || linkStatus === "sold_out");
  const finalUrl = input.finalUrl ?? linkValidation.finalUrl;
  const finalPurchaseUrl = input.finalPurchaseUrl ?? linkValidation.finalPurchaseUrl;
  const checkedAt = input.checkedAt ?? linkValidation.checkedAt;
  const qualityInput = {
    linkStatus,
    linkType,
    linkVerified,
    purchaseLinkVerified,
    finalUrl,
    finalPurchaseUrl,
    isExpired,
    isSoldOut,
    purchaseConfidence,
    reliabilityScore,
    thumbnail,
    imageUrl: thumbnail,
    salePrice: input.salePrice,
    price: input.price ?? input.salePrice,
    originalPrice: input.originalPrice,
    discountRate,
    checkedAt,
    priceCheckedAt
  };
  const availability = input.availability ?? (hasUnavailableSignal ? "sold_out" : resolveDealAvailability(qualityInput));
  const validationStatus = input.validationStatus ?? (hasUnavailableSignal ? "failed" : resolveDealValidationStatus({ ...qualityInput, availability }));
  const validationReason = input.validationReason ?? (hasUnavailableSignal ? "상품 정보에 품절/판매종료/이벤트 종료 신호가 있어 노출 제한 대상입니다." : linkValidation.reason);
  const lastCheckedAt = input.lastCheckedAt ?? checkedAt;
  const isHidden = input.isHidden ?? (hasUnavailableSignal || shouldHideDeal({ ...qualityInput, availability, validationStatus }));
  const validationCode = input.validationCode ?? getDealValidationCode({ ...qualityInput, availability, validationStatus, isHidden });
  const priorityScore = input.priorityScore ?? getDealPriorityScore({ ...qualityInput, availability, validationStatus, validationReason, lastCheckedAt, isHidden });
  const imageType = input.imageType ?? getDealImageType(thumbnail);
  const qualityScore = input.qualityScore ?? getDealQualityScore({
    ...qualityInput,
    availability,
    validationStatus,
    validationReason,
    lastCheckedAt,
    isHidden,
    priorityScore,
    imageType,
    source,
    sourceName: input.sourceName,
    sourceUrl: publicSourceUrl,
    verifiedAt: input.verifiedAt,
    updatedAt: input.updatedAt,
    reportCount: input.reportCount
  });
  const publishable = input.publishable ?? (!isHidden && validationCode === "valid" && qualityScore >= 55);
  const conditionText = [input.title, input.category, ...tags].join(" ");
  const isFirstComeFirstServed = input.isFirstComeFirstServed ?? /선착순|한정수량|오늘만|마감임박/.test(conditionText);
  const requiresSignup = input.requiresSignup ?? /첫 구매|신규 가입|체험단|포인트|앱테크|무료체험/.test(conditionText);
  const shippingFee = input.shippingFee ?? (shipping === "무료배송" ? "무료배송" : dealType === "freebie" || dealType === "experience" ? "배송비 확인" : "판매처 조건부");
  const couponCondition = input.couponCondition ?? (dealType === "coupon" || dealType === "foodDelivery" || dealType === "point" ? "판매처 쿠폰/결제 조건 확인" : undefined);
  const minimumOrderAmount = input.minimumOrderAmount ?? (dealType === "coupon" || dealType === "foodDelivery" ? Math.max(0, Math.round(input.salePrice / 1000) * 1000) : undefined);
  const claimGuide = buildBenefitClaimGuide({
    title: input.title,
    dealType,
    requiresSignup,
    isFirstComeFirstServed,
    isFreeShipping,
    isEndingSoon: input.isEndingSoon ?? new Date(expireAt).getTime() - Date.now() < 6 * 60 * 60 * 1000,
    shippingFee,
    couponCondition,
    minimumOrderAmount,
    isStackable: input.isStackable ?? /중복|카드할인|쿠폰적용/.test(conditionText)
  });

  return {
    id: input.id,
    title: input.title,
    description: input.description ?? `${mallName}에서 확인된 ${input.title} 특가입니다.`,
    brand: input.brand,
    price: input.price ?? input.salePrice,
    originalPrice: input.originalPrice,
    salePrice: input.salePrice,
    discountRate,
    mallName,
    subCategory: input.subCategory ?? tags[0],
    category,
    thumbnail,
    link,
    url: input.url ?? link,
    productUrl: input.productUrl ?? (linkValidation.linkVerified ? linkValidation.finalPurchaseUrl : ""),
    verifiedProductUrl: input.verifiedProductUrl ?? (linkValidation.linkVerified ? linkValidation.finalPurchaseUrl : ""),
    searchUrl: publicSearchUrl,
    originalUrl: publicOriginalUrl,
    affiliateUrl: input.affiliateUrl,
    eventUrl: input.eventUrl,
    purchaseUrl: input.purchaseUrl ?? link,
    finalUrl,
    finalPurchaseUrl,
    linkType,
    linkStatus,
    linkLabel: input.linkLabel ?? (linkStatus === "verified" ? "구매 페이지 확인" : "링크 확인 필요"),
    linkVerified,
    checkedAt,
    purchaseConfidence,
    purchaseStatus: linkStatus === "verified" ? "available" : linkStatus,
    purchaseLinkVerified,
    availability,
    validationStatus,
    validationReason,
    validationCode,
    lastCheckedAt,
    priorityScore,
    qualityScore,
    isHidden,
    publishable,
    verifiedAt: linkStatus === "verified" ? (input.verifiedAt ?? priceCheckedAt) : undefined,
    lastVerifiedAt: input.lastVerifiedAt ?? (linkStatus === "verified" ? (input.verifiedAt ?? priceCheckedAt) : undefined),
    priceCheckedAt,
    dealType,
    benefitSummary: input.benefitSummary ?? buildBenefitSummary({ title: input.title, category, tags, shipping, salePrice: input.salePrice, originalPrice: input.originalPrice, discountRate }, dealType),
    reliabilityScore,
    isVerified: input.isVerified ?? linkVerified,
    isExpired,
    savingsAmount: input.savingsAmount ?? discountAmount,
    savingsRate: input.savingsRate ?? discountRate,
    isFirstComeFirstServed,
    requiresSignup,
    shippingFee,
    couponCondition,
    minimumOrderAmount,
    isStackable: input.isStackable ?? /중복|카드할인|쿠폰적용/.test(conditionText),
    claimCta: input.claimCta ?? (dealType === "freebie" || dealType === "experience" || dealType === "point" ? "혜택 받기" : dealType === "coupon" || dealType === "foodDelivery" ? "쿠폰 받기" : "판매처 확인"),
    eligibilityChecklist: input.eligibilityChecklist ?? claimGuide.eligibilityChecklist,
    claimSteps: input.claimSteps ?? claimGuide.claimSteps,
    claimWarning: input.claimWarning ?? claimGuide.claimWarning,
    shipping,
    createdAt,
    expireAt,
    tags,
    isHot: input.isHot ?? false,
    isFreeShipping,
    discountAmount,
    source,
    sourceUrl: publicSourceUrl,
    sourceName: input.sourceName,
    notice: input.notice ?? "가격, 재고, 쿠폰, 배송 조건은 판매처에서 최종 확인하세요.",
    isNew: input.isNew ?? false,
    isEndingSoon: input.isEndingSoon ?? new Date(expireAt).getTime() - Date.now() < 6 * 60 * 60 * 1000,
    popularityScore: input.popularityScore ?? 0,
    clickCount: input.clickCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 13)),
    likeCount: input.likeCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 3.2)),
    viewCount: input.viewCount ?? Math.max(0, Math.round((input.popularityScore ?? 0) * 21)),
    reportCount: input.reportCount ?? (linkStatus === "verified" ? 0 : 1),
    isSoldOut,
    updatedAt: input.updatedAt ?? priceCheckedAt,
    mall: mallName,
    imageUrl: thumbnail,
    imageType,
    shippingInfo: shipping,
    expiresAt: expireAt
  };
}

export function normalizeDeals(items: DealInput[], source?: string) {
  return items.map((item) => normalizeDeal(item, source));
}
