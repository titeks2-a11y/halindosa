export type DealCategory =
  | "식품"
  | "전자기기"
  | "생활용품"
  | "의류"
  | "육아"
  | "여행/티켓"
  | "뷰티"
  | "가전"
  | "편의점/마트"
  | "쿠폰/이벤트"
  | "기타";

export type DealSort = "latest" | "discount" | "price" | "hot" | "endingSoon";
export type DealLinkType = "direct_purchase" | "seller_search" | "search" | "affiliate" | "unavailable";
export type DealLinkStatus = "verified" | "needs_review" | "broken" | "sold_out";
export type DealPurchaseStatus = "available" | "needs_review" | "sold_out" | "broken";
export type DealAvailability = "active" | "sold_out" | "ended" | "unknown";
export type DealValidationStatus = "passed" | "failed" | "needs_review";
export type DealValidationCode =
  | "valid"
  | "invalid"
  | "stale"
  | "sold_out"
  | "search_link"
  | "homepage_link"
  | "community_link"
  | "timeout"
  | "mismatch"
  | "missing_final_url"
  | "unsafe_url"
  | "hidden";
export type DealBenefitType =
  | "discount"
  | "freebie"
  | "coupon"
  | "freeShipping"
  | "experience"
  | "event"
  | "point"
  | "convenienceStore"
  | "mart"
  | "foodDelivery";

export interface Deal {
  id: string;
  title: string;
  description: string;
  brand?: string;
  price: number;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  subCategory?: string;
  mallName: string;
  category: DealCategory;
  thumbnail: string;
  link: string;
  url?: string;
  productUrl?: string;
  verifiedProductUrl?: string;
  searchUrl?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  purchaseUrl?: string;
  linkType: DealLinkType;
  linkStatus: DealLinkStatus;
  linkLabel: string;
  linkVerified: boolean;
  finalUrl: string;
  checkedAt: string;
  purchaseConfidence: number;
  purchaseStatus: DealPurchaseStatus;
  purchaseLinkVerified: boolean;
  finalPurchaseUrl: string;
  sourceUrl?: string;
  sourceName?: string;
  eventUrl?: string;
  availability: DealAvailability;
  validationStatus: DealValidationStatus;
  validationReason: string;
  validationCode: DealValidationCode;
  lastCheckedAt: string;
  priorityScore: number;
  isHidden: boolean;
  publishable: boolean;
  verifiedAt?: string;
  lastVerifiedAt?: string;
  priceCheckedAt: string;
  dealType: DealBenefitType;
  benefitSummary: string;
  reliabilityScore: number;
  isVerified: boolean;
  isExpired: boolean;
  savingsAmount: number;
  savingsRate: number;
  isFirstComeFirstServed: boolean;
  requiresSignup: boolean;
  shippingFee: string;
  couponCondition?: string;
  minimumOrderAmount?: number;
  isStackable?: boolean;
  claimCta: string;
  eligibilityChecklist: string[];
  claimSteps: string[];
  claimWarning: string;
  shipping: string;
  createdAt: string;
  expireAt: string;
  tags: string[];
  isHot: boolean;
  isFreeShipping: boolean;
  discountAmount: number;
  source: string;
  notice: string;
  isNew: boolean;
  isEndingSoon: boolean;
  popularityScore: number;
  clickCount: number;
  likeCount: number;
  viewCount: number;
  reportCount: number;
  isSoldOut: boolean;
  updatedAt: string;
  mall: string;
  imageUrl: string;
  shippingInfo: string;
  expiresAt: string;
}

export type DealDataMode = "mock" | "staging" | "production" | "hybrid";
