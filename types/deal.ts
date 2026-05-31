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
export type DealLinkType = "direct_purchase" | "seller_search" | "affiliate" | "unavailable";
export type DealLinkStatus = "verified" | "needs_review" | "broken" | "sold_out";
export type DealPurchaseStatus = "available" | "needs_review" | "sold_out" | "broken";

export interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  mallName: string;
  category: DealCategory;
  thumbnail: string;
  link: string;
  url?: string;
  productUrl?: string;
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
  verifiedAt?: string;
  priceCheckedAt: string;
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
  isSoldOut: boolean;
  updatedAt: string;
  mall: string;
  imageUrl: string;
  shippingInfo: string;
  expiresAt: string;
}

export type DealDataMode = "mock" | "staging" | "production" | "hybrid";
