import { isPubliclyVisibleDeal } from "@/lib/deals/quality";
import type { Deal, DealBenefitType } from "@/types/deal";

export type NotificationCampaignType =
  | "deal_registered"
  | "free_event"
  | "price_drop"
  | "ending_soon"
  | "interest_category";

export type NotificationCampaignPriority = "critical" | "high" | "medium" | "low";

export interface NotificationCampaign {
  id: string;
  alertType: NotificationCampaignType;
  title: string;
  body: string;
  segmentLabel: string;
  targetCategories: string[];
  dealIds: string[];
  sampleDealTitles: string[];
  priority: NotificationCampaignPriority;
  scheduledAt: string;
  estimatedAudience: number;
  readiness: "ready" | "needs_fcm" | "needs_deals";
  blockedReasons: string[];
  actionLabel: string;
  deeplinkUrl: string;
  payload: Record<string, string | number | string[] | boolean>;
}

export interface NotificationCampaignSummary {
  totalCampaigns: number;
  readyCampaigns: number;
  blockedCampaigns: number;
  candidateDeals: number;
  visibleVerifiedDeals: number;
  estimatedAudience: number;
  criticalCampaigns: number;
  generatedAt: string;
  nextAction: string;
}

const campaignLabels: Record<NotificationCampaignType, string> = {
  deal_registered: "신규 특가",
  free_event: "무료·쿠폰 혜택",
  price_drop: "가격 인하",
  ending_soon: "마감 임박",
  interest_category: "관심 카테고리"
};

const freeBenefitTypes = new Set<DealBenefitType>(["freebie", "coupon", "experience", "event", "point", "foodDelivery"]);

function hoursUntil(date: string, now: number) {
  return (new Date(date).getTime() - now) / (60 * 60 * 1000);
}

function scoreCampaignDeal(deal: Deal, now: number) {
  const deadlineBoost = Math.max(0, 36 - hoursUntil(deal.expireAt, now));

  return (
    deal.priorityScore +
    deal.popularityScore +
    deal.clickCount * 2 +
    deal.likeCount * 4 +
    deal.discountRate +
    deadlineBoost +
    Number(deal.isHot) * 28 +
    Number(deal.isFreeShipping) * 14 +
    Number(freeBenefitTypes.has(deal.dealType)) * 18
  );
}

function campaignId(type: NotificationCampaignType, dealIds: string[]) {
  const seed = dealIds.slice(0, 4).join("-").replace(/[^a-zA-Z0-9-]/g, "");
  return `${type}-${seed || "daily"}`;
}

function uniqueDeals(deals: Deal[]) {
  const seen = new Set<string>();

  return deals.filter((deal) => {
    if (seen.has(deal.id)) return false;
    seen.add(deal.id);
    return true;
  });
}

function selectTopDeals(deals: Deal[], limit: number, now: number) {
  return uniqueDeals(deals)
    .filter(isPubliclyVisibleDeal)
    .filter((deal) => !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => scoreCampaignDeal(b, now) - scoreCampaignDeal(a, now))
    .slice(0, limit);
}

function estimateAudience(deals: Deal[], base: number) {
  const signal = deals.reduce((sum, deal) => sum + deal.clickCount + deal.likeCount * 2 + deal.popularityScore, 0);
  return Math.max(0, Math.round(base + signal * 0.7));
}

function buildCampaign(input: {
  type: NotificationCampaignType;
  deals: Deal[];
  title: string;
  body: string;
  segmentLabel: string;
  priority: NotificationCampaignPriority;
  scheduledAt: string;
  deeplinkUrl: string;
  actionLabel: string;
  baseAudience: number;
  fcmConfigured: boolean;
}): NotificationCampaign {
  const blockedReasons = [];

  if (!input.deals.length) blockedReasons.push("발송 후보 특가가 없습니다.");
  if (!input.fcmConfigured) blockedReasons.push("FCM 발송 환경변수가 아직 설정되지 않았습니다.");

  const readiness = input.deals.length ? (input.fcmConfigured ? "ready" : "needs_fcm") : "needs_deals";
  const dealIds = input.deals.map((deal) => deal.id);
  const targetCategories = Array.from(new Set(input.deals.map((deal) => deal.category)));

  return {
    id: campaignId(input.type, dealIds),
    alertType: input.type,
    title: input.title,
    body: input.body,
    segmentLabel: input.segmentLabel,
    targetCategories,
    dealIds,
    sampleDealTitles: input.deals.slice(0, 3).map((deal) => deal.title),
    priority: input.priority,
    scheduledAt: input.scheduledAt,
    estimatedAudience: estimateAudience(input.deals, input.baseAudience),
    readiness,
    blockedReasons,
    actionLabel: input.actionLabel,
    deeplinkUrl: input.deeplinkUrl,
    payload: {
      source: "halindosa",
      campaignType: input.type,
      campaignLabel: campaignLabels[input.type],
      deeplinkUrl: input.deeplinkUrl,
      dealIds,
      targetCategories,
      dryRunSafe: true
    }
  };
}

export function buildNotificationCampaigns(deals: Deal[], options: { fcmConfigured?: boolean; now?: number } = {}) {
  const now = options.now ?? Date.now();
  const fcmConfigured = options.fcmConfigured ?? false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const scheduledBase = new Date(now);
  scheduledBase.setMinutes(Math.ceil(scheduledBase.getMinutes() / 10) * 10, 0, 0);

  const visibleDeals = deals.filter(isPubliclyVisibleDeal).filter((deal) => !deal.isExpired && !deal.isSoldOut);
  const newDeals = selectTopDeals(
    visibleDeals.filter((deal) => deal.isNew || new Date(deal.createdAt).getTime() >= today.getTime()),
    5,
    now
  );
  const freeDeals = selectTopDeals(
    visibleDeals.filter((deal) => freeBenefitTypes.has(deal.dealType) || deal.salePrice === 0 || deal.savingsAmount >= 10000),
    5,
    now
  );
  const priceDropDeals = selectTopDeals(
    visibleDeals.filter((deal) => deal.discountRate >= 35 || deal.savingsAmount >= 30000 || deal.savingsRate >= 35),
    5,
    now
  );
  const endingSoonDeals = selectTopDeals(
    visibleDeals.filter((deal) => deal.isEndingSoon || hoursUntil(deal.expireAt, now) <= 24),
    5,
    now
  );

  const categoryLeaders = Array.from(
    visibleDeals.reduce((map, deal) => {
      const current = map.get(deal.category);
      if (!current || scoreCampaignDeal(deal, now) > scoreCampaignDeal(current, now)) {
        map.set(deal.category, deal);
      }
      return map;
    }, new Map<Deal["category"], Deal>())
  )
    .map(([, deal]) => deal)
    .sort((a, b) => scoreCampaignDeal(b, now) - scoreCampaignDeal(a, now))
    .slice(0, 6);

  const schedule = (minutes: number) => new Date(scheduledBase.getTime() + minutes * 60_000).toISOString();

  return [
    buildCampaign({
      type: "deal_registered",
      deals: newDeals,
      title: "오늘 새로 확인된 특가",
      body: "새로 확인된 특가 중 구매 링크가 검증된 상품만 모았습니다.",
      segmentLabel: "전체 사용자",
      priority: "medium",
      scheduledAt: schedule(10),
      deeplinkUrl: "/?sort=latest&verifiedOnly=true",
      actionLabel: "신규 특가 발송 후보 확인",
      baseAudience: 180,
      fcmConfigured
    }),
    buildCampaign({
      type: "free_event",
      deals: freeDeals,
      title: "무료·쿠폰 혜택 먼저 확인",
      body: "비용 부담이 낮은 무료 혜택과 쿠폰 정보를 먼저 확인하세요.",
      segmentLabel: "무료/쿠폰 관심 사용자",
      priority: "high",
      scheduledAt: schedule(20),
      deeplinkUrl: "/free-benefits?activeOnly=true",
      actionLabel: "무료 혜택 발송 후보 확인",
      baseAudience: 240,
      fcmConfigured
    }),
    buildCampaign({
      type: "price_drop",
      deals: priceDropDeals,
      title: "가격이 크게 내려간 특가",
      body: "할인율과 절약액이 큰 상품만 골라 다시 확인했습니다.",
      segmentLabel: "가격 알림 저장 사용자",
      priority: "high",
      scheduledAt: schedule(30),
      deeplinkUrl: "/?sort=discount&verifiedOnly=true",
      actionLabel: "가격 인하 발송 후보 확인",
      baseAudience: 210,
      fcmConfigured
    }),
    buildCampaign({
      type: "ending_soon",
      deals: endingSoonDeals,
      title: "오늘 끝날 수 있는 혜택",
      body: "마감이 가까운 혜택은 판매처에서 최종 가격과 재고를 확인하세요.",
      segmentLabel: "마감 알림 선택 사용자",
      priority: "critical",
      scheduledAt: schedule(40),
      deeplinkUrl: "/?endingSoon=true&sort=endingSoon",
      actionLabel: "마감 임박 발송 후보 확인",
      baseAudience: 260,
      fcmConfigured
    }),
    buildCampaign({
      type: "interest_category",
      deals: categoryLeaders,
      title: "관심 카테고리 인기 특가",
      body: "카테고리별 반응이 좋은 검증 상품을 모았습니다.",
      segmentLabel: "관심 카테고리 저장 사용자",
      priority: "medium",
      scheduledAt: schedule(50),
      deeplinkUrl: "/categories",
      actionLabel: "관심 카테고리 발송 후보 확인",
      baseAudience: 190,
      fcmConfigured
    })
  ];
}

export function summarizeNotificationCampaigns(campaigns: NotificationCampaign[], visibleVerifiedDeals: number): NotificationCampaignSummary {
  const readyCampaigns = campaigns.filter((campaign) => campaign.readiness === "ready").length;
  const candidateDeals = new Set(campaigns.flatMap((campaign) => campaign.dealIds)).size;
  const estimatedAudience = campaigns.reduce((sum, campaign) => sum + campaign.estimatedAudience, 0);
  const blockedCampaigns = campaigns.filter((campaign) => campaign.readiness !== "ready").length;
  const criticalCampaigns = campaigns.filter((campaign) => campaign.priority === "critical").length;

  return {
    totalCampaigns: campaigns.length,
    readyCampaigns,
    blockedCampaigns,
    candidateDeals,
    visibleVerifiedDeals,
    estimatedAudience,
    criticalCampaigns,
    generatedAt: new Date().toISOString(),
    nextAction: readyCampaigns === campaigns.length
      ? "FCM 발송 전 사용자 동의 로그와 테스트 토큰으로 최종 dry-run을 실행하세요."
      : "FCM 서버 키를 설정하기 전까지 캠페인은 운영 후보 큐로만 사용하세요."
  };
}

export function toPushQueueRows(campaigns: NotificationCampaign[]) {
  return campaigns.flatMap((campaign) =>
    campaign.dealIds.map((dealId) => ({
      deal_id: dealId,
      campaign_id: campaign.id,
      alert_type: campaign.alertType,
      title: campaign.title,
      body: campaign.body,
      target_categories: campaign.targetCategories,
      status: campaign.readiness === "ready" ? "queued" : "draft",
      scheduled_at: campaign.scheduledAt,
      payload: campaign.payload
    }))
  );
}
