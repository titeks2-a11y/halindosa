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
  title: string;
  brandName: string;
  benefitType: FreeBenefitEventType;
  legacyBenefitType: NewsBenefitType;
  eventUrl: string;
  officialUrl: string;
  finalUrl: string;
  sourceName: string;
  sourceType: FreeBenefitSourceType;
  sourceUrl: string;
  startAt: string;
  endAt: string;
  participationCondition: string;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
  rewardText: string;
  cautionText: string;
  collectedAt: string;
  updatedAt: string;
  verifiedAt: string;
  status: FreeBenefitEventStatus;
  validationStatus: FreeBenefitValidationStatus;
  validationReason: string;
  qualityScore: number;
  priorityScore: number;
  isHidden: boolean;
  hiddenReason: string;
  tags: string[];
}
