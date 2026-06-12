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
