import type { NewsBenefitType } from "@/types/newsDeal";

export type FreeBenefitEventType =
  | "all"
  | "everyone"
  | "firstCome"
  | "coupon"
  | "sample"
  | "freeTrial"
  | "gifticon"
  | "pointCashback"
  | "checkIn"
  | "roulette"
  | "signup"
  | "publicFree"
  | "experiencePanel"
  | "freeShipping"
  | "brandEvent";

export type FreeBenefitEventStatus = "active" | "expired" | "blocked" | "unknown";
export type FreeBenefitValidationStatus = "passed" | "failed" | "blocked" | "needs_review";
export type FreeBenefitSourceType = "official" | "partner_feed" | "approved_public" | "manual" | "seed";
export type FreeBenefitClaimAccessLevel = "instant" | "login_required" | "purchase_required" | "condition_check";
export type FreeBenefitDeadlineStatus = "today" | "week" | "soon" | "none";

export interface FreeBenefitEvent {
  id: string;
  brand: string;
  title: string;
  description: string;
  brandName: string;
  benefitType: FreeBenefitEventType;
  legacyBenefitType: NewsBenefitType;
  rewardValue: string;
  eventUrl: string;
  officialUrl: string;
  finalUrl: string;
  imageUrl: string;
  sourceName: string;
  sourceType: FreeBenefitSourceType;
  sourceUrl: string;
  sourceDomain: string;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  participationCondition: string;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
  rewardText: string;
  cautionText: string;
  claimCtaLabel: string;
  claimAccessLevel: FreeBenefitClaimAccessLevel;
  claimAccessLabel: string;
  isInstantClaim: boolean;
  urgencyLabel: string;
  rankingReason: string;
  trustBadges: string[];
  collectedAt: string;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string;
  verifiedAt: string;
  status: FreeBenefitEventStatus;
  validationStatus: FreeBenefitValidationStatus;
  validationReason: string;
  qualityScore: number;
  freshnessScore: number;
  officialScore: number;
  urgencyScore: number;
  rewardScore: number;
  priorityScore: number;
  freeConditionScore: number;
  interestScore: number;
  isOfficial: boolean;
  isFree: boolean;
  isVerified: boolean;
  isHidden: boolean;
  hiddenReason: string;
  tags: string[];
}

export interface FirstPartyFreeBenefitFeedItem {
  id: string;
  brand: string;
  title: string;
  description: string;
  summary: string;
  category: "무료혜택";
  benefitType: FreeBenefitEventType;
  rewardValue: string;
  rewardText: string;
  participationCondition: string;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  sourceName: string;
  sourceType: "official";
  sourceUrl: string;
  officialUrl: string;
  finalUrl: string;
  claimUrl: string;
  canonicalUrl: string;
  canonicalHost: string;
  dedupeKey: string;
  imageUrl: string;
  status: "active";
  validationStatus: "passed";
  deadlineStatus: FreeBenefitDeadlineStatus;
  isExpiringToday: boolean;
  isExpiringThisWeek: boolean;
  linkTrust: "official_verified";
  displayBadges: string[];
  availability: "active";
  publishable: true;
  isOfficial: true;
  isFree: boolean;
  isVerified: true;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
  claimAccessLevel: FreeBenefitClaimAccessLevel;
  claimAccessLabel: string;
  claimCtaLabel: string;
  qualityScore: number;
  freshnessScore: number;
  officialScore: number;
  urgencyScore: number;
  rewardScore: number;
  priorityScore: number;
  lastCheckedAt: string;
  verifiedAt: string;
  updatedAt: string;
  createdAt: string;
  collectedAt: string;
  tags: string[];
}
