export type NewsBenefitType =
  | "discount"
  | "coupon"
  | "freebie"
  | "freeShipping"
  | "event"
  | "membership"
  | "card"
  | "culture"
  | "travel"
  | "public"
  | "point"
  | "foodDelivery"
  | "convenienceStore"
  | "mart";

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
export type NewsDealLinkType = "official_event" | "official_coupon" | "official_benefit" | "search" | "news_only" | "community" | "invalid";
export type NewsDealAvailability = "active" | "expired" | "unknown";
export type NewsDealImageType = "official" | "generated" | "fallback";
export type NewsDealValidationCode =
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

export interface NewsDeal {
  id: string;
  title: string;
  summary: string;
  merchant: string;
  mallName: string;
  category: NewsDealCategory;
  benefitType: NewsBenefitType;
  discountRate: number;
  price: number;
  originalPrice: number;
  couponAmount: number;
  startDate: string;
  endDate: string;
  expiresAt: string;
  updatedAt: string;
  verifiedAt: string;
  sourceName: string;
  sourceUrl: string;
  source: string;
  originalUrl: string;
  affiliateUrl: string;
  eventUrl: string;
  finalUrl: string;
  linkType: NewsDealLinkType;
  availability: NewsDealAvailability;
  imageUrl: string;
  imageType: NewsDealImageType;
  confidenceScore: number;
  qualityScore: number;
  priorityScore: number;
  validationStatus: NewsDealValidationStatus;
  validationCode?: NewsDealValidationCode;
  validationReason: string;
  isHidden: boolean;
  publishable?: boolean;
  hiddenReason: string;
  lastCheckedAt: string;
  provider: "news" | "event_news" | "official_event" | "public_coupon";
  tags: string[];
  officialHost?: string;
}

export interface NewsDealSourceTrust {
  sourceName: string;
  provider: string;
  officialHost: string;
  totalCount: number;
  visibleCount: number;
  hiddenCount: number;
  failedCount: number;
  searchLinkCount: number;
  expiredCount: number;
  averagePriorityScore: number;
  trustScore: number;
  status: "trusted" | "watch" | "needs_review";
  lastCheckedAt: string;
  categories: NewsDealCategory[];
  benefitTypes: NewsBenefitType[];
  recommendedAction: string;
}

export interface NewsTargetSection {
  label: string;
  query: string;
  count: number;
}

export interface NewsIntentGroup {
  id: string;
  label: string;
  query: string;
  count: number;
  urgentCount: number;
  topSources: string[];
  benefitTypes: NewsBenefitType[];
  actionLabel: string;
}

export interface NewsDeadlineBucket {
  id: "today" | "threeDays" | "sevenDays" | "later";
  label: string;
  count: number;
  maxHours: number | null;
}

export interface NewsDeadlineSummary {
  expiringTodayCount: number;
  expiringThreeDaysCount: number;
  expiringSevenDaysCount: number;
  laterCount: number;
  nearestEndDate: string;
  buckets: NewsDeadlineBucket[];
}
