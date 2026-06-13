import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEventCategoryCounts,
  buildFreeBenefitEventDeadlineCategoryCounts,
  buildFreeBenefitEventRuntimeReadiness,
  selectPublishableFreeBenefitEvents
} from "@/lib/freeBenefitEvents";
import type { FreeBenefitEvent } from "@/types/freeBenefitEvent";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function parseLimit(value: string | null) {
  const limit = Number(value ?? 120);
  if (!Number.isFinite(limit)) return 120;
  return Math.min(Math.max(Math.floor(limit), 1), 200);
}

function toFeedItem(event: FreeBenefitEvent) {
  return {
    id: event.id,
    brand: event.brandName || event.brand,
    title: event.title,
    description: event.description,
    summary: event.description,
    category: "무료혜택",
    benefitType: event.benefitType,
    rewardValue: event.rewardValue || event.rewardText,
    rewardText: event.rewardText,
    participationCondition: event.participationCondition,
    startDate: event.startDate,
    endDate: event.endDate,
    startAt: event.startAt,
    endAt: event.endAt,
    sourceName: event.sourceName,
    sourceType: "official",
    sourceUrl: event.sourceUrl,
    officialUrl: event.officialUrl,
    finalUrl: event.finalUrl,
    imageUrl: event.imageUrl,
    status: event.status,
    validationStatus: event.validationStatus,
    availability: "active",
    publishable: true,
    isOfficial: true,
    isFree: event.isFree,
    isVerified: true,
    requiresLogin: event.requiresLogin,
    requiresPurchase: event.requiresPurchase,
    isEveryoneReward: event.isEveryoneReward,
    isFirstComeFirstServed: event.isFirstComeFirstServed,
    claimAccessLevel: event.claimAccessLevel,
    claimAccessLabel: event.claimAccessLabel,
    claimCtaLabel: event.claimCtaLabel,
    qualityScore: event.qualityScore,
    freshnessScore: event.freshnessScore,
    officialScore: event.officialScore,
    urgencyScore: event.urgencyScore,
    rewardScore: event.rewardScore,
    priorityScore: event.priorityScore,
    lastCheckedAt: event.lastCheckedAt,
    verifiedAt: event.verifiedAt,
    updatedAt: event.updatedAt,
    createdAt: event.createdAt,
    collectedAt: event.collectedAt,
    tags: event.tags
  };
}

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const generatedAt = new Date().toISOString();
  const referenceNow = Date.parse(generatedAt);
  const limitResult = rateLimit({
    key: getClientKey(request, "free-benefit-feed"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limitResult.allowed) {
    return noStoreJson(
      {
        ok: false,
        requestId,
        feedKind: "halindosa-free-benefits",
        items: [],
        count: 0,
        generatedAt,
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const includePublic = searchParams.get("includePublic") === "true";
    const news = getVisibleNewsDeals({
      limit: 0,
      sort: "priority",
      includePublicPolicy: includePublic
    });
    const allEvents = selectPublishableFreeBenefitEvents(news.deals, 200, referenceNow, {
      includePublic
    });
    const events = allEvents.slice(0, limit);
    const items = events.map(toFeedItem);

    return noStoreJson(
      {
        ok: true,
        requestId,
        feedKind: "halindosa-free-benefits",
        feedVersion: 1,
        generatedAt,
        updatedAt: generatedAt,
        source: "halindosa_first_party_verified_feed",
        sourceUpdatedAt: news.updatedAt,
        includePublic,
        count: items.length,
        totalCount: allEvents.length,
        items,
        policy: {
          noStore: true,
          publishableOnly: true,
          officialOnly: true,
          verifiedOnly: true,
          blocked: ["search_link", "homepage_link", "community_link", "expired", "sold_out", "unapproved_host"]
        },
        categoryCounts: buildFreeBenefitEventCategoryCounts(allEvents),
        deadlineCategoryCounts: buildFreeBenefitEventDeadlineCategoryCounts(allEvents, referenceNow),
        runtimeReadiness: buildFreeBenefitEventRuntimeReadiness(allEvents, referenceNow),
        envHint: {
          primary: "BENEFIT_REFRESH_FEED_URLS",
          secondary: ["OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
          approvedHostKey: "HALINDOSA_APPROVED_FEED_HOSTS",
          approvedHosts: ["halindosa.com", "www.halindosa.com"]
        },
        cachePolicy: {
          mode: "no-store",
          generatedAt
        }
      },
      { headers: rateLimitHeaders(limitResult, requestId) }
    );
  } catch {
    return noStoreJson(
      {
        ok: false,
        requestId,
        feedKind: "halindosa-free-benefits",
        items: [],
        count: 0,
        generatedAt,
        message: "검증된 무료혜택 feed를 불러오지 못했습니다."
      },
      { status: 500, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }
}
