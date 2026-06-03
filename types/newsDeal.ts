export type NewsBenefitType =
  | "discount"
  | "coupon"
  | "freebie"
  | "membership"
  | "card"
  | "culture"
  | "travel"
  | "public";

export type NewsDealCategory =
  | "식품/생필품"
  | "마트/편의점"
  | "디지털/가전"
  | "패션/뷰티"
  | "외식/배달"
  | "여행/숙박"
  | "영화/문화"
  | "카드/멤버십"
  | "무료혜택"
  | "정부/공공혜택";

export type NewsDealValidationStatus = "passed" | "failed" | "needs_review";

export interface NewsDeal {
  id: string;
  title: string;
  summary: string;
  merchant: string;
  category: NewsDealCategory;
  benefitType: NewsBenefitType;
  discountRate: number;
  price: number;
  originalPrice: number;
  couponAmount: number;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceUrl: string;
  finalUrl: string;
  imageUrl: string;
  confidenceScore: number;
  validationStatus: NewsDealValidationStatus;
  isHidden: boolean;
  hiddenReason: string;
  lastCheckedAt: string;
  provider: "news" | "event_news" | "official_event" | "public_coupon";
  tags: string[];
}
