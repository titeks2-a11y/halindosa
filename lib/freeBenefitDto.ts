import type { FreeBenefitEvent, FreeBenefitEventStatus, FreeBenefitEventType, FreeBenefitValidationStatus } from "@/types/freeBenefitEvent";

export interface StandardFreeBenefit {
  id: string;
  brand: string;
  title: string;
  description: string;
  benefitType: FreeBenefitEventType;
  rewardValue: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
  officialUrl: string;
  imageUrl: string;
  status: FreeBenefitEventStatus;
  isOfficial: boolean;
  isFree: boolean;
  isVerified: boolean;
  qualityScore: number;
  freshnessScore: number;
  officialScore: number;
  urgencyScore: number;
  rewardScore: number;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  sourceName: string;
  sourceDomain: string;
  validationStatus: FreeBenefitValidationStatus;
  validationReason: string;
  claimCtaLabel: string;
  claimAccessLabel: string;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
}

export function toStandardFreeBenefit(event: FreeBenefitEvent): StandardFreeBenefit {
  return {
    id: event.id,
    brand: event.brand || event.brandName || event.sourceName,
    title: event.title,
    description: event.description,
    benefitType: event.benefitType,
    rewardValue: event.rewardValue || event.rewardText,
    startDate: event.startDate || event.startAt,
    endDate: event.endDate || event.endAt,
    sourceUrl: event.sourceUrl,
    officialUrl: event.officialUrl || event.finalUrl,
    imageUrl: event.imageUrl,
    status: event.status,
    isOfficial: event.isOfficial,
    isFree: event.isFree,
    isVerified: event.isVerified,
    qualityScore: event.qualityScore,
    freshnessScore: event.freshnessScore,
    officialScore: event.officialScore,
    urgencyScore: event.urgencyScore,
    rewardScore: event.rewardScore,
    lastCheckedAt: event.lastCheckedAt || event.verifiedAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    tags: event.tags,
    sourceName: event.sourceName,
    sourceDomain: event.sourceDomain,
    validationStatus: event.validationStatus,
    validationReason: event.validationReason,
    claimCtaLabel: event.claimCtaLabel,
    claimAccessLabel: event.claimAccessLabel,
    requiresLogin: event.requiresLogin,
    requiresPurchase: event.requiresPurchase,
    isEveryoneReward: event.isEveryoneReward,
    isFirstComeFirstServed: event.isFirstComeFirstServed
  };
}

export function toStandardFreeBenefits(events: FreeBenefitEvent[]) {
  return events.map(toStandardFreeBenefit);
}
