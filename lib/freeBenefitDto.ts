import type { FreeBenefitDeadlineStatus, FreeBenefitEvent, FreeBenefitEventStatus, FreeBenefitEventType, FreeBenefitValidationStatus } from "@/types/freeBenefitEvent";

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
  finalUrl: string;
  claimUrl: string;
  canonicalUrl: string;
  dedupeKey: string;
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
  verifiedAt: string;
  deadlineStatus: FreeBenefitDeadlineStatus;
  displayBadges: string[];
  claimCtaLabel: string;
  claimAccessLevel: string;
  claimAccessLabel: string;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
}

export const requiredStandardFreeBenefitFields = [
  "id",
  "brand",
  "title",
  "description",
  "benefitType",
  "rewardValue",
  "startDate",
  "endDate",
  "sourceUrl",
  "officialUrl",
  "finalUrl",
  "claimUrl",
  "canonicalUrl",
  "dedupeKey",
  "imageUrl",
  "status",
  "isOfficial",
  "isFree",
  "isVerified",
  "qualityScore",
  "freshnessScore",
  "officialScore",
  "urgencyScore",
  "rewardScore",
  "lastCheckedAt",
  "createdAt",
  "updatedAt",
  "tags",
  "sourceName",
  "sourceDomain",
  "validationStatus",
  "validationReason",
  "verifiedAt",
  "deadlineStatus",
  "displayBadges",
  "claimCtaLabel",
  "claimAccessLevel",
  "claimAccessLabel",
  "requiresLogin",
  "requiresPurchase",
  "isEveryoneReward",
  "isFirstComeFirstServed"
] satisfies Array<keyof StandardFreeBenefit>;

function normalizeUrlKey(value?: string) {
  try {
    const url = new URL(String(value ?? ""));
    url.hash = "";
    url.searchParams.sort();
    return url.href.replace(/\/$/, "");
  } catch {
    return String(value ?? "").trim();
  }
}

function getDeadlineStatus(endDate?: string): FreeBenefitDeadlineStatus {
  const endMs = Date.parse(String(endDate ?? ""));
  if (!Number.isFinite(endMs)) return "none";

  const now = Date.now();
  const hoursLeft = (endMs - now) / (1000 * 60 * 60);
  if (hoursLeft < 0) return "none";
  if (hoursLeft <= 24) return "today";
  if (hoursLeft <= 24 * 7) return "week";
  if (hoursLeft <= 24 * 14) return "soon";
  return "none";
}

function buildDedupeKey(event: FreeBenefitEvent, canonicalUrl: string) {
  const brand = (event.brand || event.brandName || event.sourceName || "").trim().toLowerCase();
  const title = event.title.trim().toLowerCase().replace(/\s+/g, " ");
  const reward = (event.rewardValue || event.rewardText || "").trim().toLowerCase().replace(/\s+/g, " ");
  const endDate = (event.endDate || event.endAt || "").slice(0, 10);
  const urlHost = (() => {
    try {
      return new URL(canonicalUrl).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return event.sourceDomain || "";
    }
  })();
  return [brand, title, event.benefitType, reward, endDate, urlHost].filter(Boolean).join("::");
}

function buildDisplayBadges(event: FreeBenefitEvent, deadlineStatus: FreeBenefitDeadlineStatus) {
  const badges = new Set<string>();
  if (event.isEveryoneReward) badges.add("전원증정");
  if (event.isFirstComeFirstServed) badges.add("선착순");
  if (event.claimAccessLevel === "instant") badges.add("즉시신청");
  if (event.requiresLogin) badges.add("로그인 필요");
  if (event.requiresPurchase) badges.add("구매 필요");
  if (deadlineStatus === "today") badges.add("오늘마감");
  if (deadlineStatus === "week") badges.add("이번주마감");
  if (deadlineStatus === "soon") badges.add("마감임박");
  badges.add(event.isOfficial ? "공식" : "검토필요");
  return Array.from(badges);
}

export function toStandardFreeBenefit(event: FreeBenefitEvent): StandardFreeBenefit {
  const claimUrl = event.finalUrl || event.officialUrl || event.eventUrl;
  const canonicalUrl = normalizeUrlKey(claimUrl);
  const deadlineStatus = getDeadlineStatus(event.endDate || event.endAt);

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
    finalUrl: event.finalUrl,
    claimUrl,
    canonicalUrl,
    dedupeKey: buildDedupeKey(event, canonicalUrl),
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
    verifiedAt: event.verifiedAt,
    deadlineStatus,
    displayBadges: buildDisplayBadges(event, deadlineStatus),
    claimCtaLabel: event.claimCtaLabel,
    claimAccessLevel: event.claimAccessLevel,
    claimAccessLabel: event.claimAccessLabel,
    requiresLogin: event.requiresLogin,
    requiresPurchase: event.requiresPurchase,
    isEveryoneReward: event.isEveryoneReward,
    isFirstComeFirstServed: event.isFirstComeFirstServed
  };
}

export function getMissingStandardFreeBenefitFields(benefit: StandardFreeBenefit) {
  return requiredStandardFreeBenefitFields.filter((field) => {
    const value = benefit[field];
    if (typeof value === "boolean") return false;
    if (typeof value === "number") return !Number.isFinite(value);
    if (Array.isArray(value)) return value.length === 0;
    return !String(value ?? "").trim();
  });
}

export function isCompleteStandardFreeBenefit(benefit: StandardFreeBenefit) {
  return getMissingStandardFreeBenefitFields(benefit).length === 0;
}

export function toStandardFreeBenefits(events: FreeBenefitEvent[]) {
  return events.map(toStandardFreeBenefit);
}
